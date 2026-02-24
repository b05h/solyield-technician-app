/**
 * Data transformation utilities for charts (e.g. react-native-gifted-charts).
 * Map raw data to chart-friendly series and labels.
 */

import type {
  ChartData,
  ChartDataPoint,
  GiftedChartDataPoint,
  PerformanceData,
  PerformanceDataItem,
} from '../types/models';

/**
 * Transform an array of { label, value } into a format suitable for line/bar charts.
 */
export function toChartSeries(data: ChartDataPoint[]): { value: number; label?: string }[] {
  return data.map((d) => ({ value: d.value, label: d.label }));
}

/**
 * Flatten nested chart_data.json into a flat array of { value, label } for react-native-gifted-charts.
 * Uses energyGeneratedkWh as value and a short date string as label.
 */
export function flattenChartData(data: ChartData): GiftedChartDataPoint[] {
  const result: GiftedChartDataPoint[] = [];
  for (const series of data) {
    for (const day of series.days) {
      const label = formatChartLabel(day.date);
      result.push({ value: day.energyGeneratedkWh, label });
    }
  }
  return result;
}

function formatChartLabel(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const month = d.toLocaleString('default', { month: 'short' });
    const day = d.getDate();
    return `${month} ${day}`;
  } catch {
    return isoDate;
  }
}

/**
 * Convert performance_data.json (first item) to chart points: one point per metric.
 */
export function aggregatePerformanceByPeriod(
  data: PerformanceData,
  metricKey: keyof PerformanceDataItem
): ChartDataPoint[] {
  return data.map((d, i) => ({
    label: `Period ${i + 1}`,
    value: d[metricKey] ?? 0,
  }));
}
