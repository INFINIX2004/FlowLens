import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import React from 'react'

const styles = StyleSheet.create({
  page: { padding: 48, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748b' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  grid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  card: { border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, width: '22%' },
  cardLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  cardUnit: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottom: '1px solid #f1f5f9' },
  rowLabel: { fontSize: 10, color: '#475569' },
  rowValue: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#94a3b8' },
})

export async function generateMetricsPDF(data: {
  orgName: string
  date: string
  dora: { deployFrequency: number | null; leadTime: number | null; changeFailureRate: number | null; mttr: number | null }
  prStats: { totalPRs: number; avgCycleTime: number | null; avgReviewWait: number | null; topAuthors: { login: string; count: number }[] }
}) {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FlowLens Report</Text>
          <Text style={styles.subtitle}>{data.orgName} · Generated {data.date}</Text>
        </View>

        {/* DORA Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DORA Metrics</Text>
          <View style={styles.grid}>
            {[
              { label: 'Deploy Freq', value: data.dora.deployFrequency?.toFixed(1) ?? '—', unit: '/ week' },
              { label: 'Lead Time', value: data.dora.leadTime?.toFixed(1) ?? '—', unit: 'hrs' },
              { label: 'Failure Rate', value: data.dora.changeFailureRate?.toFixed(1) ?? '—', unit: '%' },
              { label: 'MTTR', value: data.dora.mttr?.toFixed(1) ?? '—', unit: 'hrs' },
            ].map(m => (
              <View key={m.label} style={styles.card}>
                <Text style={styles.cardLabel}>{m.label}</Text>
                <Text style={styles.cardValue}>{m.value}</Text>
                <Text style={styles.cardUnit}>{m.unit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* PR Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pull Request Summary</Text>
          {[
            { label: 'Total PRs', value: String(data.prStats.totalPRs) },
            { label: 'Avg Cycle Time', value: data.prStats.avgCycleTime ? `${data.prStats.avgCycleTime.toFixed(1)}h` : '—' },
            { label: 'Avg Review Wait', value: data.prStats.avgReviewWait ? `${data.prStats.avgReviewWait.toFixed(1)}h` : '—' },
          ].map(r => (
            <View key={r.label} style={styles.row}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* Top Authors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Contributors</Text>
          {data.prStats.topAuthors.map(a => (
            <View key={a.login} style={styles.row}>
              <Text style={styles.rowLabel}>{a.login}</Text>
              <Text style={styles.rowValue}>{a.count} PRs</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>FlowLens · flowlens-production.up.railway.app</Text>
          <Text style={styles.footerText}>{data.date}</Text>
        </View>
      </Page>
    </Document>
  )

  return await renderToBuffer(doc)
}