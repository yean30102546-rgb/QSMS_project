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
import { ReworkCase } from '../../services/api';
import { formatThaiDate, formatThaiDateShort } from '../../utils/helpers';
import { toDisplayImageUrl } from '../../utils/imageUrls';

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
            color: '#1e293b',
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
                <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#0f172a' }}>รายงานการแก้ไขงาน (Rework Report)</h1>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>ระบบบริหารจัดการคุณภาพ • Quality Management</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                backgroundColor: statusInfo.bg, 
                color: statusInfo.text, 
                border: `1px solid ${statusInfo.border}`,
                padding: '8px 20px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 900,
                display: 'inline-block',
                marginBottom: '10px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}>
                {statusInfo.label}
              </div>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>รหัสอ้างอิง: {caseData.id}</p>
            </div>
          </div>

          {/* QUICK INFO BAR */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1px', 
            backgroundColor: '#e2e8f0', 
            borderRadius: '16px', 
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            marginBottom: '40px'
          }}>
            <div style={infoBoxStyle}>
              <p style={infoLabelStyle}>แหล่งที่มา (Source)</p>
              <p style={infoValueStyle}>{caseData.source}</p>
            </div>
            <div style={infoBoxStyle}>
              <p style={infoLabelStyle}>วันที่รายงาน</p>
              <p style={infoValueStyle}>{formatThaiDate(caseData.timestamp || caseData.date)}</p>
            </div>
            <div style={infoBoxStyle}>
              <p style={infoLabelStyle}>จำนวนรายการรวม</p>
              <p style={infoValueStyle}>{caseData.items.length} รายการ</p>
            </div>
            <div style={infoBoxStyle}>
              <p style={infoLabelStyle}>ระดับความสำคัญ</p>
              <p style={{ ...infoValueStyle, color: '#3b82f6' }}>ปกติ</p>
            </div>
          </div>

          {/* RESOLUTION SECTION */}
          {(caseData.resolutionMethod || caseData.reworkCost !== undefined) && (
            <div style={{ marginBottom: '45px' }}>
              <div style={sectionHeaderStyle}>
                <div style={accentBarStyle} />
                <h2 style={sectionTitleStyle}>การแก้ไขและผลกระทบทางการเงิน</h2>
              </div>
              <div style={{ 
                display: 'flex', 
                backgroundColor: '#ffffff', 
                borderRadius: '20px', 
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 12px -2px rgba(0,0,0,0.03)'
              }}>
                <div style={{ flex: 1, padding: '28px' }}>
                  <p style={metaLabelStyle}>วิธีการแก้ไขปัญหา (Action Taken)</p>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#334155', margin: 0 }}>{caseData.resolutionMethod || 'อยู่ระหว่างรอการตัดสินใจแก้ไขปัญหา'}</p>
                </div>
                <div style={{ width: '260px', backgroundColor: '#f8fafc', padding: '28px', borderLeft: '1px solid #e2e8f0', textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={metaLabelStyle}>มูลค่าการแก้ไขงานรวม</p>
                  <p style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    <span style={{ fontSize: '16px', marginRight: '6px', color: '#94a3b8' }}>฿</span>
                    {caseData.reworkCost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ITEM SUMMARY TABLE */}
          <div style={{ marginBottom: '45px' }}>
            <div style={sectionHeaderStyle}>
              <div style={accentBarStyle} />
              <h2 style={sectionTitleStyle}>สรุปรายการสินค้า (Item Summary)</h2>
            </div>
            <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid #0f172a' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                    <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>#</th>
                    <th style={thStyle}>ชิ้นส่วน / Code</th>
                    <th style={thStyle}>Batch / เลขกล่อง</th>
                    <th style={thStyle}>Mold / Line</th>
                    <th style={thStyle}>สินค้า</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>จำนวน</th>
                    <th style={thStyle}>สาเหตุ/ผู้รับผิดชอบ</th>
                  </tr>
                </thead>
                <tbody>
                  {caseData.items.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontWeight: 800 }}>{idx + 1}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 900, fontFamily: 'monospace', color: '#0ea5e9' }}>{item.itemNumber}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{item.itemCode || '-'}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800 }}>{item.batchNo || '-'}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{formatThaiDateShort(item.packagingDate || '')}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800 }}>M: {item.mold || '-'}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>L: {item.line || '-'}</div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{item.itemName}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 900, fontSize: '14px' }}>{item.amount}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '11px' }}>{item.reason}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{item.responsible} {item.responsibleSubtype ? `(${item.responsibleSubtype})` : ''}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  border: '1px solid #e2e8f0', 
                  overflow: 'hidden',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                  pageBreakInside: 'avoid'
                }}>
                  {/* SOLID HEADER BLOCK */}
                  <div style={{ 
                    backgroundColor: '#1e293b', 
                    padding: '20px 30px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '12px', 
                        backgroundColor: '#3b82f6', 
                        color: '#ffffff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '16px', 
                        fontWeight: 900 
                      }}>
                        {idx + 1}
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: '-0.01em' }}>{item.itemName || item.itemNumber}</h3>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '12px', color: '#ffffff', fontSize: '12px', fontWeight: 800, border: '1px solid rgba(255,255,255,0.2)' }}>
                      จำนวน: {item.amount} หน่วย
                    </div>
                  </div>

                  <div style={{ padding: '30px' }}>
                    <div style={{ marginBottom: '30px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #3b82f6' }}>
                      <p style={{ ...metaLabelStyle, color: '#3b82f6', marginBottom: '8px' }}>ข้อมูลทางเทคนิค / สิ่งที่ตรวจพบ (Technical Description)</p>
                      <p style={{ fontSize: '14px', color: '#1e293b', margin: 0, whiteSpace: 'pre-wrap', fontWeight: 500, lineHeight: '1.7' }}>{item.details || 'ไม่มีการระบุข้อมูลเพิ่มเติมสำหรับรายการนี้'}</p>
                    </div>

                    <div>
                      <p style={{ ...metaLabelStyle, marginBottom: '15px' }}>คลังภาพหลักฐาน (Visual Evidence Archive - {item.imageUrls?.length || 0} ไฟล์)</p>
                      {item.imageUrls && item.imageUrls.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                          {item.imageUrls.map((url, imgIdx) => (
                            <div key={imgIdx} style={{ 
                              aspectRatio: '1', 
                              borderRadius: '16px', 
                              overflow: 'hidden', 
                              border: '1px solid #f1f5f9',
                              backgroundColor: '#f8fafc',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                            }}>
                              <DriveImage src={url} alt="Evidence" className="w-full h-full" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '30px', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '16px', color: '#94a3b8', fontSize: '13px', fontWeight: 700 }}>
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
  padding: '24px',
  textAlign: 'center'
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: '9px',
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
