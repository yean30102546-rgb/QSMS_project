import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { ReworkCase } from '../../services/api';
import { formatThaiDate, formatThaiDateShort, addThaiWordBreaks } from '../../utils/helpers';
import { toDisplayImageUrl } from '../../utils/imageUrls';

// Register Thai Font
Font.register({
  family: 'Sarabun',
  fonts: [
    { src: '/fonts/Sarabun-Regular.ttf' },
    { src: '/fonts/Sarabun-Bold.ttf', fontWeight: 700 },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Sarabun',
    backgroundColor: '#ffffff',
    padding: 40,
    color: '#0f172a',
    fontSize: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#f8fafc',
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    height: 50,
    width: 50,
    objectFit: 'contain',
  },
  divider: {
    height: 40,
    width: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 700,
    color: '#0f172a',
  },
  subtitleText: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 700,
  },
  caseIdText: {
    fontSize: 10,
    fontWeight: 700,
    color: '#475569',
  },
  quickInfoBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 30,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12, paddingHorizontal: 4,
    alignItems: 'center',
    marginRight: 1,
  },
  infoBoxLast: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0f172a',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accentBar: {
    width: 4,
    height: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  resolutionBox: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 30,
  },
  resolutionLeft: {
    flex: 2,
    padding: 16,
  },
  resolutionRight: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  itemCard: {
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fafafc',
    alignItems: 'center',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  itemBody: {
    flexDirection: 'row',
  },
  itemLeft: {
    flex: 2,
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  itemRight: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  itemIndexBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemIndexText: {
    fontSize: 11,
    fontWeight: 700,
    color: '#475569',
  },
  itemName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 6,
  },
  itemNumberBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemNumberText: {
    fontSize: 10,
    fontWeight: 700,
    color: '#3b82f6',
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specItem: {
    width: '50%',
    marginBottom: 12,
  },
  specLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 11,
    fontWeight: 700,
    color: '#334155',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: 700,
    color: '#ef4444',
  },
  respText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  amountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 10,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#64748b',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
  },
  evidenceCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 20,
  },
  evidenceHeader: {
    backgroundColor: '#f8fafc',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  evidenceIndexBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  evidenceIndexText: {
    fontSize: 10,
    fontWeight: 700,
    color: '#ffffff',
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
  },
  evidenceBody: {
    padding: 16,
  },
  techBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#cbd5e1',
    marginBottom: 20,
  },
  techText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.5,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageBox: {
    width: 100,
    height: 100,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  noImage: {
    padding: 16,
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    color: '#94a3b8',
    fontSize: 11,
  },
  footer: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: 700,
    textTransform: 'uppercase',
  }
});

interface ExportPDFTemplateProps {
  caseData: ReworkCase | null;
}

export const ExportPDFTemplate = ({ caseData }: ExportPDFTemplateProps) => {
  if (!caseData) return null;

  const statusStyles: Record<string, { bg: string; text: string; label: string; border: string }> = {
    Pending: { bg: '#fffbeb', text: '#b45309', label: 'รอดำเนินการ ', border: '#fde68a' },
    'In-Progress': { bg: '#eff6ff', text: '#1d4ed8', label: 'กำลังดำเนินการ ', border: '#bfdbfe' },
    'Awaiting Valuation': { bg: '#faf5ff', text: '#7e22ce', label: 'รอประเมินราคา ', border: '#e9d5ff' },
    Completed: { bg: '#ecfdf5', text: '#047857', label: 'เสร็จสิ้น ', border: '#a7f3d0' },
  };

  const statusInfo = statusStyles[caseData.status] || statusStyles.Pending;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            {/* React-pdf requires absolute or relative paths for local images, or standard URLs */}
            <Image src="/img/logo.png" style={styles.logo} />
            <View style={styles.divider} />
            <View>
              <Text style={styles.titleText}>รายงานการแก้ไขงาน</Text>
              <Text style={styles.subtitleText}>QSMS • Quality Management</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border }]}>
              <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
            </View>
            <Text style={styles.caseIdText}>CASE ID: {caseData.id}</Text>
          </View>
        </View>

        {/* QUICK INFO BAR */}
        <View style={styles.quickInfoBar}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>แหล่งที่มา (Source) </Text>
            <Text style={styles.infoValue}>{caseData.source}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>วันที่รายงาน </Text>
            <Text style={styles.infoValue}>{formatThaiDate(caseData.timestamp || caseData.date)}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>จำนวนรายการรวม </Text>
            <Text style={styles.infoValue}>{caseData.items.length} รายการ</Text>
          </View>
          <View style={styles.infoBoxLast}>
            <Text style={styles.infoLabel}>ระดับความสำคัญ </Text>
            <Text style={[styles.infoValue, { color: '#3b82f6' }]}>ปกติ</Text>
          </View>
        </View>

        {/* RESOLUTION SECTION */}
        {(caseData.resolutionMethod || caseData.reworkCost !== undefined) && (
          <View style={{ marginBottom: 30 }}>
            <View style={styles.sectionHeader}>
              <View style={styles.accentBar} />
              <Text style={styles.sectionTitle}>การแก้ไขและผลกระทบทางการเงิน</Text>
            </View>
            <View style={styles.resolutionBox}>
              <View style={styles.resolutionLeft}>
                <Text style={styles.infoLabel}>วิธีการแก้ไขปัญหา (Action Taken) </Text>
                <Text style={[styles.infoValue, { fontSize: 13, fontWeight: 400 }]}>{caseData.resolutionMethod ? addThaiWordBreaks(caseData.resolutionMethod) : 'อยู่ระหว่างรอการตัดสินใจแก้ไขปัญหา'}</Text>
              </View>
              <View style={styles.resolutionRight}>
                <Text style={styles.infoLabel}>มูลค่าการแก้ไขงานรวม </Text>
                <Text style={[styles.titleText, { fontSize: 24 }]}>
                  <Text style={{ fontSize: 14, color: '#94a3b8' }}>฿ </Text>
                  {caseData.reworkCost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ITEM SUMMARY - HORIZONTAL CARDS */}
        <View style={{ marginBottom: 30 }}>
          <View style={styles.sectionHeader}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>รายการสินค้า (Items) </Text>
          </View>
          
          <View>
            {caseData.items.map((item, idx) => (
              <View key={idx} style={styles.itemCard} wrap={false}>
                {/* Header Row */}
                <View style={styles.itemHeader}>
                  <View style={styles.itemIndexBox}>
                    <Text style={styles.itemIndexText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{addThaiWordBreaks(item.itemName)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={styles.itemNumberBadge}>
                        <Text style={styles.itemNumberText}>{item.itemNumber}</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: '#64748b', marginLeft: 8 }}>
                        Code: {item.itemCode || '-'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Details Row */}
                <View style={styles.itemBody}>
                  {/* Left: Specs */}
                  <View style={styles.itemLeft}>
                    <View style={styles.specGrid}>
                      <View style={styles.specItem}>
                        <Text style={styles.specLabel}>Batch No.</Text>
                        <Text style={styles.specValue}>{item.batchNo || '-'}</Text>
                      </View>
                      <View style={styles.specItem}>
                        <Text style={styles.specLabel}>วันที่ผลิตแกลลอน</Text>
                        <Text style={styles.specValue}>{item.gallonDate ? formatThaiDateShort(item.gallonDate) : '-'}</Text>
                      </View>
                      <View style={styles.specItem}>
                        <Text style={styles.specLabel}>Box Number</Text>
                        <Text style={styles.specValue}>{item.boxNumber || '-'}</Text>
                      </View>
                      <View style={[styles.specItem, { flexDirection: 'row' }]}>
                        <View style={{ marginRight: 20 }}>
                          <Text style={styles.specLabel}>Mold</Text>
                          <Text style={styles.specValue}>{item.mold || '-'}</Text>
                        </View>
                        <View>
                          <Text style={styles.specLabel}>Line</Text>
                          <Text style={styles.specValue}>{item.line || '-'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Right: Reason & Amount */}
                  <View style={styles.itemRight}>
                    <View>
                      <Text style={styles.specLabel}>สาเหตุ (Reason) </Text>
                      <Text style={styles.reasonText}>{addThaiWordBreaks(item.reason)}{item.reasonSubtype ? ` - ${addThaiWordBreaks(item.reasonSubtype)}` : ''}</Text>
                      <Text style={styles.respText}>
                        ผู้รับผิดชอบ: {item.responsible} {item.responsibleSubtype ? `(${item.responsibleSubtype})` : ''}
                      </Text>
                    </View>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>จำนวน</Text>
                      <Text style={styles.amountValue}>{item.amount}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ITEM DETAILS & DOCUMENTATION */}
        <View break>
          <View style={styles.sectionHeader}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>รายละเอียดหลักฐานและเอกสารแนบ</Text>
          </View>

          <View>
            {caseData.items.map((item, idx) => (
              <View key={idx} style={styles.evidenceCard} wrap={false}>
                <View style={styles.evidenceHeader}>
                  <View style={styles.evidenceIndexBox}>
                    <Text style={styles.evidenceIndexText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.evidenceTitle}>{item.itemName || item.itemNumber}</Text>
                </View>

                <View style={styles.evidenceBody}>
                  <View style={{ marginBottom: 20 }}>
                    <Text style={[styles.specLabel, { marginBottom: 6 }]}>ข้อมูลทางเทคนิค (Technical Description)</Text>
                    <View style={styles.techBox}>
                      <Text style={styles.techText}>{item.details ? addThaiWordBreaks(item.details) : '-'}</Text>
                    </View>
                  </View>

                  <View>
                    <Text style={[styles.specLabel, { marginBottom: 10 }]}>ภาพหลักฐาน (Evidence - {item.imageUrls?.length || 0} ไฟล์)</Text>
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <View style={styles.imageGrid}>
                        {item.imageUrls.map((url, imgIdx) => (
                          <View key={imgIdx} style={styles.imageBox}>
                            <Image src={toDisplayImageUrl(url)} style={styles.image} />
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noImage}>ไม่มีภาพหลักฐาน</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>QSMS Report System</Text>
          <Text style={styles.footerText}>Generated: {new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
        </View>
      </Page>
    </Document>
  );
};
