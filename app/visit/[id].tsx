// app/visit/[id].tsx  (VisitDetailScreen)
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Calendar from 'expo-calendar';

import { useDispatch, useSelector } from 'react-redux';
import type { FormField, FormFieldValue, FormSchema } from '../../src/types/models';
import type { RootState } from '../../src/store';
import { setVisitResponses, updateFieldResponse } from '../../src/store/slices/visitsSlice';
import { selectEventIdForVisit } from '../../src/store/slices/visitsSlice';
import { isWithinGeofenceWithAccuracy } from '../../src/utils/geo';
import formSchemaJson from '../../src/data/form_schema.json';

const CHECK_IN_THRESHOLD_METERS = 500;

function getSchema(): FormSchema {
  const raw = formSchemaJson as any;
  return (Array.isArray(raw) ? raw[0] : raw) as FormSchema;
}

function isRequiredFilled(field: FormField, value: FormFieldValue): boolean {
  if (!field.required) return true;
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export default function VisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const visitId = id ?? '';
  const router = useRouter();
  const dispatch = useDispatch();

  const visits = useSelector((s: RootState) => s.visits.items);
  const sites = useSelector((s: RootState) => s.sites.items);
  const formData = useSelector((s: RootState) => s.visits.formData[visitId] ?? {});
  const eventId = useSelector((s: RootState) => selectEventIdForVisit(s, visitId));

  const schema = useMemo(() => getSchema(), []);

  const visit = useMemo(() => visits.find((v) => v.id === visitId), [visits, visitId]);
  const site = useMemo(
    () => (visit ? sites.find((s) => s.id === visit.siteId) : undefined),
    [visit, sites]
  );

  const [responses, setResponsesState] = useState<Record<string, FormFieldValue>>(() => ({ ...formData }));
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    setResponsesState(formData);
  }, [visitId]);

  const setResponse = useCallback(
    (fieldId: string, value: FormFieldValue) => {
      setResponsesState((prev) => ({ ...prev, [fieldId]: value }));
      dispatch(updateFieldResponse({ visitId, fieldId, value: value ?? null }));
      setInvalidFields((prev) => {
        const next = new Set(prev);
        next.delete(fieldId);
        return next;
      });
    },
    [dispatch, visitId]
  );

  const handleCheckIn = useCallback(async () => {
    if (!site) return;
    setCheckInLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location is required to check in.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const result = isWithinGeofenceWithAccuracy(
        pos.coords.latitude,
        pos.coords.longitude,
        pos.coords.accuracy ?? 0,
        site.location.lat,
        site.location.lng,
        CHECK_IN_THRESHOLD_METERS
      );

      if (result.isInside) {
        setIsCheckedIn(true);
      } else {
        Alert.alert('Too Far', `You are ${Math.round(result.rawDistance)}m away from the site.`);
      }
    } catch (e) {
      Alert.alert('Error', 'Check-in failed');
    } finally {
      setCheckInLoading(false);
    }
  }, [site]);

  const handleOpenInCalendar = useCallback(async () => {
    if (!eventId) {
      Alert.alert('Not synced yet', 'Please sync this visit to your calendar first.');
      return;
    }
    try {
      await Calendar.openEventInCalendarAsync({ id: eventId });
    } catch {
      Alert.alert('Unable to open', 'Please open your Calendar app to view the event.');
    }
  }, [eventId]);

  const handleReviewReport = useCallback(() => {
    const missing: string[] = [];
    schema.sections.forEach((sec) =>
      sec.fields.forEach((f) => {
        if (!isRequiredFilled(f, responses[f.id])) missing.push(f.id);
      })
    );

    if (missing.length > 0) {
      setInvalidFields(new Set(missing));
      Alert.alert('Missing Fields', 'Please complete all required fields highlighted in red.');
      return;
    }

    dispatch(setVisitResponses({ visitId, responses }));
    router.push({ pathname: '/visit/report', params: { id: visitId } });
  }, [schema, responses, dispatch, visitId, router]);

  if (!visit)
    return (
      <View style={styles.centered}>
        <Text>Visit not found.</Text>
      </View>
    );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{schema.title}</Text>
        <Text style={styles.subtitle}>
          {site?.name} • ID: {visitId}
        </Text>

        {/* ✅ Always show button; disabled until eventId exists */}
        <TouchableOpacity
          style={[styles.openCalendarButton, !eventId && { opacity: 0.5 }]}
          onPress={handleOpenInCalendar}
          disabled={!eventId}
        >
          <Text style={styles.openCalendarButtonText}>
            {eventId ? 'Open in Calendar' : 'Sync to enable Open'}
          </Text>
        </TouchableOpacity>

        {!isCheckedIn ? (
          <TouchableOpacity
            style={[styles.checkInButton, checkInLoading && { opacity: 0.7 }]}
            onPress={handleCheckIn}
            disabled={checkInLoading}
          >
            {checkInLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkInButtonText}>I'M AT THE SITE</Text>}
          </TouchableOpacity>
        ) : (
          <>
            {schema.sections.map((section) => (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.fields.map((field) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    value={responses[field.id]}
                    hasError={invalidFields.has(field.id)}
                    onUpdate={(val: FormFieldValue) => setResponse(field.id, val)}
                  />
                ))}
              </View>
            ))}
            <TouchableOpacity style={styles.reportButton} onPress={handleReviewReport}>
              <Text style={styles.reportButtonText}>Review Report</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Dynamic Field Renderer Component ---

interface FieldRendererProps {
  field: FormField;
  value: FormFieldValue;
  hasError: boolean;
  onUpdate: (val: FormFieldValue) => void;
}

function FieldRenderer({ field, value, hasError, onUpdate }: FieldRendererProps) {
  const isRequired = field.required;
  const errorStyle = hasError ? styles.inputError : null;

  const toggleCheckbox = (opt: string) => {
    const current = Array.isArray(value) ? [...value] : [];
    const next = current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt];
    onUpdate(next);
  };

  const handleFilePicker = async () => {
    if (field.type !== 'file') return;
    try {
      if (field.uploadType === 'Capture') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Error', 'Camera permission needed');
        const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
        if (!result.canceled) onUpdate(result.assets[0].uri);
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: field.uploadFileType === 'PDF' ? 'application/pdf' : '*/*',
        });
        if (!result.canceled) onUpdate(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  return (
    <View style={styles.fieldRow}>
      <Text style={styles.label}>
        {field.label} {isRequired && '*'}
      </Text>

      {(field.type === 'text' || field.type === 'number') && (
        <TextInput
          style={[styles.textInput, errorStyle]}
          placeholder={field.placeholder}
          keyboardType={field.type === 'number' ? 'numeric' : 'default'}
          value={value?.toString() ?? ''}
          onChangeText={(t) => onUpdate(field.type === 'number' ? parseFloat(t) || '' : t)}
        />
      )}

      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
        <View style={field.display === 'Row' ? styles.rowOptions : styles.colOptions}>
          {field.options?.map((opt) => {
            const isSelected = Array.isArray(value) ? value.includes(opt) : value === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.optBtn, isSelected && styles.optSelected]}
                onPress={() => (field.type === 'checkbox' ? toggleCheckbox(opt) : onUpdate(opt))}
              >
                <Text style={[styles.optText, isSelected && styles.optTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {field.type === 'file' && (
        <View>
          {!value ? (
            <TouchableOpacity style={[styles.fileBox, errorStyle]} onPress={handleFilePicker}>
              <Text style={styles.fileBoxText}>
                {field.uploadType === 'Capture' ? '📸 Take Photo' : '📄 Select Document'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.previewContainer}>
              {field.uploadType === 'Capture' ? (
                <Image source={{ uri: value as string }} style={styles.previewThumb} />
              ) : (
                <View style={styles.previewIcon}>
                  <Text style={{ fontWeight: 'bold' }}>PDF</Text>
                </View>
              )}
              <View style={styles.previewInfo}>
                <Text numberOfLines={1} style={styles.fileName}>
                  {(value as string).split('/').pop()}
                </Text>
                <TouchableOpacity onPress={() => onUpdate(null)}>
                  <Text style={styles.removeText}>Remove File</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 12 },

  openCalendarButton: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  openCalendarButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  checkInButton: {
    backgroundColor: '#f97316',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  checkInButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: '#334155' },
  fieldRow: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  colOptions: { gap: 10 },
  rowOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  optSelected: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  optText: { color: '#475569', fontWeight: '500' },
  optTextSelected: { color: '#fff', fontWeight: 'bold' },
  fileBox: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  fileBoxText: { color: '#64748b', fontWeight: '600' },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  previewThumb: { width: 50, height: 50, borderRadius: 6 },
  previewIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#cbd5e1',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: { marginLeft: 12, flex: 1 },
  fileName: { fontSize: 13, color: '#334155' },
  removeText: { color: '#ef4444', fontWeight: 'bold', marginTop: 4, fontSize: 12 },
  reportButton: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 50,
  },
  reportButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});