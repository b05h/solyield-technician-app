import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import type { Visit, Site } from '../types/models';

export const SOLYIELD_CALENDAR_TITLE = 'SolYield Schedule';

/**
 * Combines visit date (YYYY-MM-DD) and time (e.g. "09:00 AM") into a JS Date.
 */
export function visitDateToJSDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const parsed = parseTimeString(timeStr);
  return new Date(year, month - 1, day, parsed.hour, parsed.minute, 0, 0);
}

interface ParsedTime {
  hour: number;
  minute: number;
}

function parseTimeString(timeStr: string): ParsedTime {
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = (match[3] || '').toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return { hour, minute };
  }
  return { hour: 9, minute: 0 };
}

export function getEventTitleAndLocation(
  visit: Visit,
  site: Site | undefined
): { title: string; location: string } {
  const siteName = site?.name ?? 'Unknown site';
  const title = `${visit.title} – ${siteName}`;
  const location = site
    ? site.address && site.address.trim() !== ''
      ? site.address
      : `${site.name}, ${site.capacity}`
    : siteName;
  return { title, location };
}

export async function requestCalendarAndRemindersPermissions(): Promise<boolean> {
  const { status: calendarStatus } = await Calendar.requestCalendarPermissionsAsync();
  if (calendarStatus !== 'granted') return false;

  if (Platform.OS === 'ios') {
    const { status: remindersStatus } = await Calendar.requestRemindersPermissionsAsync();
    if (remindersStatus !== 'granted') return false;
  }
  return true;
}

/** ---------- ANDROID HELPERS: prefer Google, fallback to Local ---------- */

function isGoogleCalendarSource(cal: Calendar.Calendar): boolean {
  const sourceName = ((cal.source as any)?.name ?? '').toString().toLowerCase();
  const owner = (cal.ownerAccount ?? '').toLowerCase();
  return (
    sourceName.includes('google') ||
    owner.includes('@gmail.com') ||
    owner.includes('@googlemail.com')
  );
}

/**
 * Returns a writable Google calendarId if available, else null.
 */
async function getWritableGoogleCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  const googleWritable = calendars.filter((c) => isGoogleCalendarSource(c) && c.allowsModifications);
  if (googleWritable.length === 0) return null;

  const primary = googleWritable.find((c) => (c as any).isPrimary) ?? googleWritable[0];
  return primary.id;
}

async function getOrCreateLocalSolYieldCalendarId(): Promise<string> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // If you already created local SolYield calendar before, reuse it
  const existingLocal = calendars.find(
    (c) =>
      c.title === SOLYIELD_CALENDAR_TITLE &&
      (c.source as any)?.type === Calendar.SourceType.LOCAL &&
      c.allowsModifications
  );

  if (existingLocal) return existingLocal.id;

  // Create a local calendar (device-only)
  return Calendar.createCalendarAsync({
    title: SOLYIELD_CALENDAR_TITLE,
    name: SOLYIELD_CALENDAR_TITLE,
    color: '#F97316',
    entityType: Calendar.EntityTypes.EVENT,
    source: {
      isLocalAccount: true,
      name: 'SolYield Local',
      type: Calendar.SourceType.LOCAL,
    },
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
    ownerAccount: 'solyield_local_internal',
  });
}

/**
 * Deletes an existing SolYield event for the same visitId on the same day (to avoid duplicates).
 * Returns the deleted eventId if found (so callers can store/handle it if needed).
 */
async function deleteExistingSolYieldEventForVisit(
  calendarId: string,
  visitId: string,
  visitStart: Date
): Promise<string | null> {
  const dayStart = new Date(visitStart);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(visitStart);
  dayEnd.setHours(23, 59, 59, 999);

  const events = await Calendar.getEventsAsync([calendarId], dayStart, dayEnd);

  const existing = events.find((e) => (e.notes ?? '').includes(`solyield_visit_id:${visitId}`));
  if (existing?.id) {
    await Calendar.deleteEventAsync(existing.id);
    return existing.id;
  }
  return null;
}

/**
 * Removes SolYield events whose visitId no longer exists in the current visits list.
 * We scan a fixed range because Calendar APIs require a date window.
 */
async function removeStaleSolYieldEvents(
  calendarId: string,
  currentVisitIds: Set<string>,
  rangeStart: Date,
  rangeEnd: Date
): Promise<void> {
  const events = await Calendar.getEventsAsync([calendarId], rangeStart, rangeEnd);

  for (const e of events) {
    const notes = e.notes ?? '';
    const match = notes.match(/solyield_visit_id:([^\s]+)/);
    if (!match) continue;

    const visitId = match[1];
    if (!currentVisitIds.has(visitId) && e.id) {
      await Calendar.deleteEventAsync(e.id);
    }
  }
}

/** ---------- MAIN SYNC ---------- */

/**
 * Syncs all visits to the device calendar.
 * Returns a mapping of visitId -> created eventId (so UI can open the event => BONUS).
 */
export async function syncAllVisits(
  visits: Visit[],
  sites: Site[]
): Promise<Record<string, string>> {
  const ok = await requestCalendarAndRemindersPermissions();
  if (!ok) return {};

  const siteById = new Map(sites.map((s) => [s.id, s]));
  const eventIdByVisitId: Record<string, string> = {};

  // ANDROID: Prefer Google; fallback to Local
  if (Platform.OS === 'android') {
    const googleCalendarId = await getWritableGoogleCalendarId();

    const targetCalendarId = googleCalendarId
      ? googleCalendarId
      : await getOrCreateLocalSolYieldCalendarId();

    const prefixTitle = !!googleCalendarId;

    // Reconcile: remove events for deleted visits (2-year range in your code)
    const currentVisitIds = new Set(visits.map((v) => v.id));
    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setFullYear(rangeStart.getFullYear() - 2);
    const rangeEnd = new Date(now);
    rangeEnd.setFullYear(rangeEnd.getFullYear() + 2);

    await removeStaleSolYieldEvents(targetCalendarId, currentVisitIds, rangeStart, rangeEnd);

    for (const visit of visits) {
      const site = siteById.get(visit.siteId);
      const { title, location } = getEventTitleAndLocation(visit, site);
      const startDate = visitDateToJSDate(visit.date, visit.time);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      // prevent duplicates (delete old)
      await deleteExistingSolYieldEventForVisit(targetCalendarId, visit.id, startDate);

      // create new and capture eventId
      const eventId = await Calendar.createEventAsync(targetCalendarId, {
        title: prefixTitle ? `[SolYield] ${title}` : title,
        location,
        startDate,
        endDate,
        allDay: false,
        notes: `solyield_visit_id:${visit.id}`,
      });

      eventIdByVisitId[visit.id] = eventId;
    }

    return eventIdByVisitId;
  }

  // iOS: keep a dedicated SolYield calendar (safe and standard on iOS)
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // Delete existing SolYield calendar to avoid duplicates
  const existing = calendars.find((cal) => cal.title === SOLYIELD_CALENDAR_TITLE);
  if (existing) {
    await Calendar.deleteCalendarAsync(existing.id);
  }

  const defaultCal = await Calendar.getDefaultCalendarAsync();
  const newCalendarId = await Calendar.createCalendarAsync({
    title: SOLYIELD_CALENDAR_TITLE,
    color: '#F97316',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultCal.source.id,
  });

  for (const visit of visits) {
    const site = siteById.get(visit.siteId);
    const { title, location } = getEventTitleAndLocation(visit, site);
    const startDate = visitDateToJSDate(visit.date, visit.time);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const eventId = await Calendar.createEventAsync(newCalendarId, {
      title,
      location,
      startDate,
      endDate,
      allDay: false,
      notes: `solyield_visit_id:${visit.id}`,
    });

    eventIdByVisitId[visit.id] = eventId;
  }

  return eventIdByVisitId;
}