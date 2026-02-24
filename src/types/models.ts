/**
 * TypeScript interfaces for technician-app (SolYield Hackathon).
 * Extend as needed for visits, sites, technician, and check-in logic.
 */

/** Site shape matching src/data/sites.json */
export interface SiteLocation {
  lat: number;
  lng: number;
}

export interface Site {
  id: string;
  name: string;
  location: SiteLocation;
  capacity: string;
  /** Optional address for calendar event location (e.g. in sites.json). */
  address?: string;
}

/** Visit shape matching src/data/visits.json; technicianId used for assignment filtering */
export interface Visit {
  id: string;
  siteId: string;
  date: string;
  time: string;
  title: string;
  technicianId?: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface CheckIn {
  visitId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  success: boolean;
}

/** Flat point for react-native-gifted-charts (value + label) */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/** Gifted-charts compatible flat item */
export interface GiftedChartDataPoint {
  value: number;
  label: string;
}

/** Shape matching src/data/performance_data.json (array of one object) */
export interface PerformanceDataItem {
  underPerformingDays: number;
  overPerformingDays: number;
  daysNoData: number;
  normalDays: number;
  zeroEnergyDays: number;
}

export type PerformanceData = PerformanceDataItem[];

/** Shape matching src/data/chart_data.json */
export interface ChartDataDay {
  date: string;
  energyGeneratedkWh: number;
}

export interface ChartDataSeries {
  _id: number;
  days: ChartDataDay[];
}

export type ChartData = ChartDataSeries[];

// --- Form schema (dynamic form Level 1) ---

export type FormFieldType = 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'file';

export interface FormFieldBase {
  id: string;
  type: FormFieldType;
  label: string;
  required?: boolean;
  display?: 'Row' | 'List';
}

export interface FormFieldText extends FormFieldBase {
  type: 'text';
  placeholder?: string;
}

export interface FormFieldNumber extends FormFieldBase {
  type: 'number';
  placeholder?: string;
}

export interface FormFieldSelect extends FormFieldBase {
  type: 'select';
  options: string[];
  placeholder?: string;
}

export interface FormFieldRadio extends FormFieldBase {
  type: 'radio';
  options: string[];
  display?: 'List' | 'Row';
}

export interface FormFieldCheckbox extends FormFieldBase {
  type: 'checkbox';
  options: string[];
  display?: 'List' | 'Row';
}

export interface FormFieldFile extends FormFieldBase {
  type: 'file';
  uploadType?: 'Capture' | 'Upload';
  uploadFileType?: 'Image' | 'PDF';
  numberOfFiles?: number;
}

export type FormField =
  | FormFieldText
  | FormFieldNumber
  | FormFieldSelect
  | FormFieldRadio
  | FormFieldCheckbox
  | FormFieldFile;

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormSchema {
  id: string;
  title: string;
  sections: FormSection[];
}

/** Technician input per field: string, number, or string[] (for checkbox). */
export type FormFieldValue = string | number | string[] | null | undefined;

/** Responses keyed by visitId then fieldId. */
export interface FormResponse {
  [visitId: string]: {
    [fieldId: string]: FormFieldValue;
  };
}
