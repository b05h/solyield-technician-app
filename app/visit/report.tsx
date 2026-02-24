import React, { useMemo, useRef } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import { BarChart, PieChart } from 'react-native-gifted-charts';

import { RootState } from '../../src/store';
import formSchemaJson from '../../src/data/form_schema.json';
import chartDataJson from '../../src/data/chart_data.json';
import performanceDataJson from '../../src/data/performance_data.json';
import type { FormSchema, ChartData, PerformanceData, PerformanceDataItem } from '../../src/types/models';
import { flattenChartData } from '../../src/utils/charts';

export default function ReportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const schema = useMemo(() => {
    const raw = formSchemaJson as any;
    return (Array.isArray(raw) ? raw[0] : raw) as FormSchema;
  }, []);

  const chartData = chartDataJson as ChartData;
  const performanceData = performanceDataJson as PerformanceData;

  const barData = useMemo(
    () => flattenChartData(chartData),
    [chartData]
  );

  const performanceSlices = useMemo(() => {
    if (!performanceData.length) return [];
    const d: PerformanceDataItem = performanceData[0];
    return [
      { value: d.underPerformingDays, color: '#f97316', text: 'Under-performing' },
      { value: d.overPerformingDays, color: '#22c55e', text: 'Over-performing' },
      { value: d.normalDays, color: '#3b82f6', text: 'Normal' },
      { value: d.daysNoData, color: '#94a3b8', text: 'No Data' },
      { value: d.zeroEnergyDays, color: '#ef4444', text: 'Zero Energy' },
    ];
  }, [performanceData]);

  const barChartRef = useRef<View | null>(null);
  const pieChartRef = useRef<View | null>(null);

  const TECH_NAME = 'Arjun';
  const SITE_NAME = 'Thar Desert Solar Park';

  // Get all visit form data from Redux and select the specific visit by id
  const formData = useSelector((state: RootState) => state.visits.formData);
  const visitId = id ?? '';
  const responses = visitId ? formData[visitId] ?? null : null;

  const hasData = visitId !== '' && responses && Object.keys(responses).length > 0;

  const captureChartAsBase64 = async (
    ref: React.RefObject<View | null>
  ): Promise<string | null> => {
    if (!ref.current) return null;
    try {
      // 1. Snapshot settings optimized for PDF rendering
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 1, // Max quality
        result: 'tmpfile'
      });
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error("Snapshot error:", error);
      return null;
    }
  };

  const generatePDF = async () => {
    if (!hasData || !responses) {
      Alert.alert('No data', 'No responses found for this visit.');
      return;
    }

    const [barBase64, pieBase64] = await Promise.all([
      captureChartAsBase64(barChartRef),
      captureChartAsBase64(pieChartRef),
    ]);

    const sectionsHtml = schema.sections.map(section => {
      const rows = section.fields.map(field => {
        const raw = responses[field.id];
        let display: string;
        if (Array.isArray(raw)) {
          display = raw.length ? raw.join(', ') : 'N/A';
        } else if (raw === null || raw === undefined || raw === '') {
          display = 'N/A';
        } else {
          display = String(raw);
        }
        return `
          <tr class="data-row">
            <td class="data-label">${field.label}</td>
            <td class="data-value">${display}</td>
          </tr>
        `;
      }).join('');
      return `
        <section class="section">
          <h2 class="section-title">${section.title}</h2>
          <table class="data-table">
            <tbody>
              ${rows}
            </tbody>
          </table>
        </section>
      `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>SolYield Visit Report</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        background-color: #f8fafc;
        color: #0f172a;
        padding: 32px;
      }
      .header { margin-bottom: 24px; }
      .title { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
      .subtitle { font-size: 14px; color: #64748b; margin-bottom: 4px; }
      .meta { font-size: 12px; color: #94a3b8; }
      .charts { display: flex; flex-direction: column; gap: 16px; margin: 24px 0; }
      .chart-block { background-color: #ffffff; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; text-align: center; }
      .chart-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #334155; }
      .chart-image { width: 100%; max-width: 500px; max-height: 260px; object-fit: contain; border-radius: 8px; }
      .chart-placeholder { font-size: 12px; color:rgb(154, 171, 197); }
      .section { margin-bottom: 24px; }
      .section-title { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
      .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .data-row:nth-child(even) { background-color: #f9fafb; }
      .data-label { width: 40%; padding: 6px 8px; font-weight: 500; color: #475569; border: 1px solid #e5e7eb; }
      .data-value { padding: 6px 8px; color: #0f172a; border: 1px solid #e5e7eb; }
    </style>
  </head>
  <body>
    <header class="header">
      <h1 class="title">${schema.title}</h1>
      <p class="subtitle">Technician: ${TECH_NAME}</p>
      <p class="subtitle">Site: ${SITE_NAME}</p>
      <p class="meta">Visit ID: ${visitId}</p>
    </header>

    <section class="charts">
      <div class="chart-block">
        <h2 class="chart-title">Daily Generation</h2>
        ${
          barBase64
            ? `<img class="chart-image" src="${barBase64}" />`
            : '<p class="chart-placeholder">Daily generation chart unavailable.</p>'
        }
      </div>
      <div class="chart-block">
        <h2 class="chart-title">Performance Breakdown</h2>
        ${
          pieBase64
            ? `<img class="chart-image" src="${pieBase64}" />`
            : '<p class="chart-placeholder">Performance chart unavailable.</p>'
        }
      </div>
    </section>

    ${sectionsHtml}
  </body>
</html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'ios' || await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("PDF Generated", `Saved to: ${uri}`);
      }
    } catch (error) {
      Alert.alert("Error", "Could not generate PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Report Preview</Text>
        <Text style={styles.subtitle}>
          {visitId ? `Summary for Visit: ${visitId}` : 'No visit selected'}
        </Text>

        {!hasData && (
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              No responses were found for this visit. Please complete the form and submit before
              generating a report.
            </Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Fields Filled</Text>
            <Text style={styles.statValue}>
              {responses ? Object.keys(responses).length : 0}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Status</Text>
            <Text
              style={[
                styles.statValue,
                { color: hasData ? '#059669' : '#f59e0b' },
              ]}
            >
              {hasData ? 'Ready' : 'Incomplete'}
            </Text>
          </View>
        </View>

        {/* --- BAR CHART --- */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Generation (kWh)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View ref={barChartRef} collapsable={false} style={styles.chartSnapshotContainer}>
              <BarChart
                data={barData}
                barWidth={20}
                spacing={16}
                hideRules
                yAxisThickness={0}
                xAxisThickness={1}
                isAnimated={false}
                xAxisLabelTextStyle={{ fontSize: 10, color: '#64748b', rotation: -45 }}
                yAxisTextStyle={{ fontSize: 10, color: '#64748b' }}
              />
            </View>
          </ScrollView>
        </View>

        {/* --- PIE CHART --- */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Performance Breakdown</Text>
          <View ref={pieChartRef} collapsable={false} style={styles.pieSnapshotContainer}>
            <PieChart
              data={performanceSlices}
              donut
              radius={70}
              innerRadius={45}
              showText={false} // Text hidden from chart itself
              isAnimated={false}
            />
            {/* Custom Legend */}
            <View style={styles.legendContainer}>
              {performanceSlices.map((slice, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColorBox, { backgroundColor: slice.color }]} />
                  <Text style={styles.legendText}>
                    {slice.text} ({slice.value})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (!visitId || !hasData) && styles.disabledBtn,
          ]}
          onPress={generatePDF}
          disabled={!visitId || !hasData}
        >
          <Text style={styles.btnText}>Download PDF Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  previewBox: {
    backgroundColor: '#eff6ff',
    padding: 20,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginBottom: 32,
  },
  previewText: {
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 22,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  chartSnapshotContainer: {
    backgroundColor: '#ffffff',
    padding: 10,
  },
  // Update to flex-row to put chart and legend side by side
  pieSnapshotContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  // New Legend Styles
  legendContainer: {
    marginLeft: 20,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColorBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  disabledBtn: {
    backgroundColor: '#94a3b8',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    padding: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#64748b',
    fontWeight: '600',
  },
});