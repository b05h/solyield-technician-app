/**
 * Geofencing utilities for visit check-in.
 * Use expo-location for device position and distance/containment checks.
 */

export const DEFAULT_RADIUS_METERS = 500;

/**
 * Haversine distance in meters between two lat/lng points.
 */
export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns true if (userLat, userLon) is within radiusMeters of (siteLat, siteLon).
 */
export function isWithinGeofence(
  userLat: number,
  userLon: number,
  siteLat: number,
  siteLon: number,
  radiusMeters: number = DEFAULT_RADIUS_METERS
): boolean {
  return distanceMeters(userLat, userLon, siteLat, siteLon) <= radiusMeters;
}

export interface GeofenceWithAccuracyResult {
  isInside: boolean;
  rawDistance: number;
  effectiveDistance: number;
}

/**
 * Geofence check that accounts for GPS accuracy: effective distance = rawDistance - accuracy (clamped to 0).
 * User is considered inside when effectiveDistance <= threshold.
 */
export function isWithinGeofenceWithAccuracy(
  userLat: number,
  userLon: number,
  accuracy: number,
  siteLat: number,
  siteLon: number,
  threshold: number = 500
): GeofenceWithAccuracyResult {
  const rawDistance = distanceMeters(userLat, userLon, siteLat, siteLon);
  const effectiveDistance = Math.max(0, rawDistance - accuracy);
  const isInside = effectiveDistance <= threshold;
  return { isInside, rawDistance, effectiveDistance };
}
