/**
 * ExportTemplate Component
 * ---------------------------------------------------
 * Ultimate Thai-Friendly Version
 * ✅ localized for Thai Users
 * ✅ Enterprise Professional Design
 * ✅ No Signatures
 * ---------------------------------------------------
 */

import React from 'react';
import { ReworkCase } from '@/src/services/api';
import { formatThaiDate, formatThaiDateShort } from '@/src/utils/helpers';
import { toDisplayImageUrl } from '@/src/utils/imageUrls';

interface ExportTemplateProps {
  caseData: ReworkCase | null;
}

const DriveImage = ({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) => {
  return (
    <img
      src={toDisplayImageUrl(src)}
      alt={alt}
      className={className}
      style={style}
      crossOrigin="anonymous"
      data-original-src={src}
    />
  );
};

export const ExportTemplate = React.forwardRef<HTMLDivElement, ExportTemplateProps>(
  ({ caseData }, ref) => {
    if (!caseData) return null;

    const statusStyles: Record<string, { bg: string; text: string; label: string; border: string }> = {
      Pending: { bg: '#fffbeb', text: '#b45309', label: 'รอดำเนินการ', border: '#fde68a' },
      'In-Progress': { bg: '#eff6ff', text: '#1d4ed8', label: 'กำลังดำเนินการ', border: '#bfdbfe' },
      'Awaiting Valuation': { bg: '#faf5ff', text: '#7e22ce', label: 'รอประเมินราคา', border: '#e9d5ff' },
      Completed: { bg: '#ecfdf5', text: '#047857', label: 'เสร็จสิ้น', border: '#a7f3d0' },
    };

    const statusInfo = statusStyles[caseData.status] || statusStyles.Pending;

    return (
      <div
        ref={ref}
        data-export-template="true"
        style={{ display: 'none' }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Noto Sans Thai', sans-serif",
            backgroundColor: '#ffffff',
            padding: '50px',
            color: '#1d1d1f',
            fontSize: '14px',
            lineHeight: '1.6',
            width: '100%',
            maxWidth: '1000px',
            boxSizing: 'border-box',
            margin: '0 auto',
          }}
        >
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #f1f5f9', paddingBottom: '30px' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <img src="/img/logo.png" alt="SFC" style={{ height: '70px', objectFit: 'contain' }} crossOrigin="anonymous" />
              <div style={{ height: '50px', width: '2px', backgroundColor: '#e2e8f0' }} />
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#1d1d1f' }}>รายงานการแก้ไขงาน (Rework Report)</h1>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>ระบบบริหารจัดการคุณภาพ • Quality Management</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                backgroundColor: statusInfo.bg, 
                color: statusInfo.text, 
                border: `1px solid ${statusInfo.border}`,
                padding: '8px 20px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-block',
                marginBottom: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                {statusInfo.label}
              </div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#86868b' }}>รหัสอ้างอิง: {caseData.id}</p>
            </div>
          </div>

          {/* QUICK INFO BAR */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1px', 
            backgroundColor: '#e5e5ea', 
            borderRadius: '16px', 
            overflow: 'hidden',
            border: '1px solid #e5e5ea',
            marginBottom: '40px'
          }}>
            <div style={{ ...infoBoxStyle, backgroundColor: '#fafafc' }}>
              <p style={{ ...infoLabelStyle, color: '#86868b', fontWeight: 600 }}>แหล่งที่มา (Source)</p>
              <p style={{ ...infoValueStyle, color: '#1d1d1f', fontWeight: 700 }}>{caseData.source}</p>
            </div>
            <div style={{ ...infoBoxStyle, backgroundColor: '#fafafc' }}>
              <p style={{ ...infoLabelStyle, color: '#86868b', fontWeight: 600 }}>วันที่รายงาน</p>
              <p style={{ ...infoValueStyle, color: '#1d1d1f', fontWeight: 700 }}>{formatThaiDate(caseData.timestamp || caseData.date)}</p>
            </div>
            <div style={{ ...infoBoxStyle, backgroundColor: '#fafafc' }}>
              <p style={{ ...infoLabelStyle, color: '#86868b', fontWeight: 600 }}>จำนวนรายการรวม</p>
              <p style={{ ...infoValueStyle, color: '#1d1d1f', fontWeight: 700 }}>{caseData.items.length} รายการ</p>
            </div>
            <div style={{ ...infoBoxStyle, backgroundColor: '#fafafc' }}>
              <p style={{ ...infoLabelStyle, color: '#86868b', fontWeight: 600 }}>ระดับความสำคัญ</p>
              <p style={{ ...infoValueStyle, color: '#0071e3', fontWeight: 700 }}>ปกติ</p>
            </div>
          </div>

          {/* RESOLUTION SECTION */}
          {(caseData.resolutionMethod || caseData.reworkCost !== undefined) && (
            <div style={{ marginBottom: '45px' }}>
              <div style={{ ...sectionHeaderStyle, color: '#1d1d1f' }}>
                <div style={{ ...accentBarStyle, backgroundColor: '#0071e3' }} />
                <h2 style={{ ...sectionTitleStyle, fontWeight: 700 }}>การแก้ไขและผลกระทบทางการเงิน</h2>
              </div>
              <div style={{ 
                display: 'flex', 
                backgroundColor: '#ffffff', 
                borderRadius: '20px', 
                border: '1px solid #e5e5ea',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}>
                <div style={{ flex: 1, padding: '28px' }}>
                  <p style={{ ...metaLabelStyle, color: '#86868b', fontWeight: 600 }}>วิธีการแก้ไขปัญหา (Action Taken)</p>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#1d1d1f', margin: 0 }}>{caseData.resolutionMethod || 'อยู่ระหว่างรอการตัดสินใจแก้ไขปัญหา'}</p>
                </div>
                <div style={{ width: '260px', backgroundColor: '#fafafc', padding: '28px', borderLeft: '1px solid #e5e5ea', textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ ...metaLabelStyle, color: '#86868b', fontWeight: 600 }}>มูลค่าการแก้ไขงานรวม</p>
                  <p style={{ fontSize: '32px', fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
                    <span style={{ fontSize: '16px', marginRight: '6px', color: '#86868b' }}>฿</span>
                    {caseData.reworkCost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ITEM SUMMARY TABLE */}
          <div style={{ marginBottom: '45px' }}>
            <div style={{ ...sectionHeaderStyle, color: '#1d1d1f' }}>
              <div style={{ ...accentBarStyle, backgroundColor: '#0071e3' }} />
              <h2 style={{ ...sectionTitleStyle, fontWeight: 700 }}>สรุปรายการสินค้า (Item Summary)</h2>
            </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {caseData.items.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  border: '1px solid #e5e5ea',
                  backgroundColor: '#ffffff',
                  pageBreakInside: 'avoid'
                }}>
                  {/* Header Row */}
                  <div style={{ 
                    display: 'flex', 
                    padding: '16px 20px', 
                    borderBottom: '1px solid #f1f5f9', 
                    backgroundColor: '#fafafc',
                    alignItems: 'center'
                  }}>
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '6px', 
                      backgroundColor: '#e2e8f0', color: '#475569', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontWeight: 700, fontSize: '13px', marginRight: '15px', flexShrink: 0
                    }}>{idx + 1}</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: '#1d1d1f' }}>{item.itemName}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '6px', color: '#0071e3', fontSize: '11px', fontWeight: 700 }}>
                          {item.itemNumber}
                        </div>
                        <div style={{ fontSize: '11px', color: '#86868b' }}>
                          Code: {item.itemCode || '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div style={{ display: 'flex' }}>
                    {/* Left: Specs (65%) */}
                    <div style={{ flex: '0 0 65%', padding: '20px', borderRight: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                          <p style={{ ...infoLabelStyle, marginBottom: '2px' }}>Batch No.</p>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#334155' }}>{item.batchNo || '-'}</p>
                        </div>
                        <div>
                          <p style={{ ...infoLabelStyle, marginBottom: '2px' }}>วันที่ผลิตแกลลอน</p>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#334155' }}>{item.gallonDate ? formatThaiDateShort(item.gallonDate) : '-'}</p>
                        </div>
                        <div>
                          <p style={{ ...infoLabelStyle, marginBottom: '2px' }}>Box Number</p>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#334155' }}>{item.boxNumber || '-'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '20px' }}>
                          <div>
                            <p style={{ ...infoLabelStyle, marginBottom: '2px' }}>Mold</p>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#334155' }}>{item.mold || '-'}</p>
                          </div>
                          <div>
                            <p style={{ ...infoLabelStyle, marginBottom: '2px' }}>Line</p>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#334155' }}>{item.line || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Reason & Amount (35%) */}
                    <div style={{ flex: '0 0 35%', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ ...infoLabelStyle, marginBottom: '4px' }}>สาเหตุ (Reason)</p>
                        <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#ff3b30' }}>{item.reason}{item.reasonSubtype ? ` - ${item.reasonSubtype}` : ''}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#86868b', fontWeight: 600 }}>
                          ผู้รับผิดชอบ: {item.responsible} {item.responsibleSubtype ? `(${item.responsibleSubtype})` : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px' }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#86868b' }}>จำนวน</p>
                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1d1d1f' }}>{item.amount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ITEM DETAILS & DOCUMENTATION */}
          <div style={{ marginBottom: '40px', pageBreakBefore: 'always' }}>
            <div style={sectionHeaderStyle}>
              <div style={accentBarStyle} />
              <h2 style={sectionTitleStyle}>รายละเอียดหลักฐานและเอกสารแนบ</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {caseData.items.map((item, idx) => (
                <div key={idx} style={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '24px', 
                  border: '1px solid #e5e5ea', 
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                  pageBreakInside: 'avoid'
                }}>
                  {/* LIGHT HEADER BLOCK */}
                  <div style={{ 
                    backgroundColor: '#fafafc', 
                    padding: '20px 30px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: '1px solid #e5e5ea'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '12px', 
                        backgroundColor: '#0071e3', 
                        color: '#ffffff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '16px', 
                        fontWeight: 700 
                      }}>
                        {idx + 1}
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1d1d1f', letterSpacing: '-0.01em' }}>{item.itemName || item.itemNumber}</h3>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '6px 16px', borderRadius: '12px', color: '#1d1d1f', fontSize: '12px', fontWeight: 600, border: '1px solid #e5e5ea' }}>
                      จำนวน: {item.amount} หน่วย
                    </div>
                  </div>

                  <div style={{ padding: '30px' }}>
                    <div style={{ marginBottom: '30px', backgroundColor: '#fafafc', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #0071e3' }}>
                      <p style={{ ...metaLabelStyle, color: '#0071e3', marginBottom: '8px', fontWeight: 600 }}>ข้อมูลทางเทคนิค / สิ่งที่ตรวจพบ (Technical Description)</p>
                      <p style={{ fontSize: '14px', color: '#1d1d1f', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', fontWeight: 500, lineHeight: '1.7' }}>{item.details || 'ไม่มีการระบุข้อมูลเพิ่มเติมสำหรับรายการนี้'}</p>
                    </div>

                    <div>
                      <p style={{ ...metaLabelStyle, marginBottom: '15px', color: '#86868b', fontWeight: 600 }}>คลังภาพหลักฐาน (Visual Evidence Archive - {item.imageUrls?.length || 0} ไฟล์)</p>
                      {item.imageUrls && item.imageUrls.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                          {item.imageUrls.map((url, imgIdx) => (
                            <div key={imgIdx} style={{ 
                              aspectRatio: '1', 
                              borderRadius: '20px', 
                              overflow: 'hidden', 
                              border: '1px solid #e5e5ea',
                              backgroundColor: '#fafafc',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                            }}>
                              <DriveImage src={url} alt="Evidence" className="w-full h-full" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '30px', textAlign: 'center', border: '2px dashed #e5e5ea', borderRadius: '16px', color: '#86868b', fontSize: '13px', fontWeight: 600 }}>
                          ไม่มีภาพหลักฐานแนบมาสำหรับรายการนี้
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FINAL FOOTER */}
          <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <div>ระบบจัดการงาน Rework ดิจิทัล (QSMS) • เอกสารภายในหน่วยงาน</div>
            <div>วันที่ออกเอกสาร: {new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</div>
          </div>
        </div>
      </div>
    );
  }
);

ExportTemplate.displayName = 'ExportTemplate';

// STYLES
const metaLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 900,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px',
  margin: 0,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  marginBottom: '25px'
};

const accentBarStyle: React.CSSProperties = {
  width: '6px',
  height: '24px',
  backgroundColor: '#3b82f6',
  borderRadius: '4px'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: 0,
  color: '#0f172a'
};

const thStyle: React.CSSProperties = {
  padding: '16px 20px',
  fontSize: '11px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left'
};

const tdStyle: React.CSSProperties = {
  padding: '16px 20px',
  fontSize: '13px',
  color: '#334155',
  verticalAlign: 'top'
};

const infoBoxStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '16px',
  textAlign: 'center'
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: '8px',
  fontWeight: 800,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px',
  margin: 0
};

const infoValueStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 900,
  color: '#0f172a',
  margin: 0
};
