/**
 * ExportTemplate Component
 * ---------------------------------------------------
 * Ghost/Hidden template สำหรับ Export รายงาน
 * ✅ ไม่แสดงผลบน UI ปกติ (display: none)
 * ✅ แผ่ขยายตาม Content ทั้งหมด (No Internal Scroll)
 * ✅ ออกแบบให้ดูเป็นทางการ (Professional Report)
 * ---------------------------------------------------
 */

import React from 'react';
import { ReworkCase } from '../services/api';
import { formatThaiDate } from '../utils/helpers';

interface ExportTemplateProps {
  caseData: ReworkCase | null;
}

/**
 * ===== Component หลัก =====
 * ใช้ forwardRef เพื่อให้ Hook ภายนอกเข้าถึง DOM ได้
 */
export const ExportTemplate = React.forwardRef<HTMLDivElement, ExportTemplateProps>(
  ({ caseData }, ref) => {
    if (!caseData) return null;

    // ===== สีสถานะ สำหรับแสดงใน Report =====
    const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
      Pending: { bg: '#fef3c7', text: '#92400e', label: '⏳ Pending' },
      'In-Progress': { bg: '#e0e7ff', text: '#3730a3', label: '🔧 In-Progress' },
      Completed: { bg: '#d1fae5', text: '#065f46', label: '✅ Completed' },
    };

    const statusInfo = statusStyles[caseData.status] || statusStyles.Pending;

    return (
      <div
        ref={ref}
        style={{ display: 'none' }} // ซ่อนจาก UI ปกติ (Hook จะเปิดตอน Export)
      >
        {/* ===== Container หลัก ===== */}
        <div
          style={{
            fontFamily: "'Inter', 'Noto Sans Thai', sans-serif",
            backgroundColor: '#ffffff',
            padding: '40px',
            color: '#1e293b',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
        >
          {/* ===== HEADER: โลโก้ + ชื่อบริษัท ===== */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src="/img/logo.png"
                alt="Company Logo"
                style={{ height: '48px', objectFit: 'contain' }}
                crossOrigin="anonymous"
              />
              <div>
                <h1
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    margin: 0,
                    color: '#0f172a',
                    letterSpacing: '-0.5px',
                  }}
                >
                  QSMS Rework Report
                </h1>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                  Quality System Management — Rework Case Documentation
                </p>
              </div>
            </div>
            {/* สถานะ Badge */}
            <div
              style={{
                backgroundColor: statusInfo.bg,
                color: statusInfo.text,
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                lineHeight: '1',
              }}
            >
              {statusInfo.label}
            </div>
          </div>

          {/* ===== CASE INFO (Minimal Layout) ===== */}
          <div
            style={{
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px dashed #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', gap: '32px' }}>
              <div style={{ flex: '1.5' }}>
                <p style={labelStyle}>CASE ID</p>
                <p style={{ ...valueStyle, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px' }}>
                  {caseData.id}
                </p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={labelStyle}>แหล่งที่มา</p>
                <p style={valueStyle}>{caseData.source}</p>
              </div>
              <div style={{ flex: 1.5 }}>
                <p style={labelStyle}>วันที่</p>
                <p style={valueStyle}>{formatThaiDate(caseData.date)}</p>
              </div>
              <div style={{ flex: 0.8 }}>
                <p style={labelStyle}>จำนวนรายการ</p>
                <p style={valueStyle}>{caseData.items.length} items</p>
              </div>
            </div>
          </div>

          {/* ===== ITEMS TABLE ===== */}
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 700,
              marginBottom: '12px',
              color: '#0f172a',
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '10px',
            }}
          >
            รายการ Item ทั้งหมด
          </h2>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '24px',
              fontSize: '12px',
              tableLayout: 'fixed' as const,
            }}
          >
            {/* กำหนดความกว้างคอลัมน์แบบแน่นอน ป้องกัน text ล้น */}
            <colgroup>
              <col style={{ width: '50px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '130px' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ ...thStyle, textAlign: 'center', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>#</th>
                <th style={{ ...thStyle, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Item Number</th>
                <th style={{ ...thStyle, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Item Name</th>
                <th style={{ ...thStyle, textAlign: 'center', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>จำนวน</th>
                <th style={{ ...thStyle, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>สาเหตุ</th>
                <th style={{ ...thStyle, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>ความรับผิดชอบ</th>
              </tr>
            </thead>
            <tbody>
              {caseData.items.map((item, index) => (
                <tr
                  key={item.id || index}
                  style={{
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, wordBreak: 'break-all' as const }}>{item.itemNumber}</td>
                  <td style={{ ...tdStyle, wordBreak: 'break-word' as const }}>{item.itemName || '-'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{item.amount}</td>
                  <td style={tdStyle}>
                    {item.reason}
                    {item.reasonSubtype && (
                      <span style={{ display: 'block', color: '#64748b', fontSize: '10px' }}>
                        ({item.reasonSubtype})
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {item.responsible}
                    {item.responsibleSubtype && (
                      <span style={{ display: 'block', color: '#64748b', fontSize: '10px' }}>
                        ({item.responsibleSubtype})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ===== DETAILS & IMAGES (แยกตาม Item) ===== */}
          {caseData.items.map((item, index) => {
            const hasDetails = item.details && item.details.trim().length > 0;
            const hasImages = item.imageUrls && item.imageUrls.length > 0;

            // ถ้าไม่มีทั้งรายละเอียดและรูปภาพ ข้ามไปเลย
            if (!hasDetails && !hasImages) return null;

            return (
              <div
                key={`detail-${item.id || index}`}
                style={{
                  borderLeft: '3px solid #cbd5e1',
                  paddingLeft: '16px',
                  marginBottom: '24px',
                  backgroundColor: 'transparent',
                  pageBreakInside: 'avoid' as const,
                }}
              >
                {/* หัวข้อ Item */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px dashed #e2e8f0',
                    flexWrap: 'wrap' as const,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      flexShrink: 0,
                      lineHeight: '1',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '13px', wordBreak: 'break-word' as const }}>
                    {item.itemName || item.itemNumber || `Item ${index + 1}`}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#e2e8f0',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      color: '#475569',
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1',
                    }}
                  >
                    {item.amount} ชิ้น
                  </span>
                </div>

                {/* รายละเอียด / อาการเสีย */}
                {hasDetails && (
                  <div style={{ marginBottom: hasImages ? '12px' : '0' }}>
                    <p style={sectionLabel}>รายละเอียด / อาการเสีย</p>
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        padding: '12px',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap',
                        color: '#475569',
                        wordBreak: 'break-word' as const,
                      }}
                    >
                      {item.details}
                    </div>
                  </div>
                )}

                {/* รูปภาพ */}
                {hasImages && (
                  <div>
                    <p style={sectionLabel}>
                      รูปภาพแนบ ({item.imageUrls!.length} รูป)
                    </p>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                      }}
                    >
                      {item.imageUrls!.map((url, imgIndex) => (
                        <div
                          key={imgIndex}
                          style={{
                            borderRadius: '4px',
                            overflow: 'hidden',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #f1f5f9',
                          }}
                        >
                          <img
                            src={url}
                            alt={`${item.itemName || 'Item'} - รูปที่ ${imgIndex + 1}`}
                            crossOrigin="anonymous"
                            style={{
                              width: '100%',
                              height: '160px',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* ===== FOOTER ===== */}
          <div
            style={{
              borderTop: '2px solid #e2e8f0',
              paddingTop: '16px',
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '10px',
              color: '#94a3b8',
            }}
          >
            <span>QSMS Rework Management System</span>
            <span>
              Generated: {new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

ExportTemplate.displayName = 'ExportTemplate';

// ===== Shared Inline Styles =====

/** Label เล็กๆ สีเทา (ใช้ใน Case Info + Section หัวข้อ) */
const labelStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '4px',
  margin: 0,
};

/** ค่าข้อมูล (ใช้ใน Case Info) */
const valueStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#0f172a',
  margin: 0,
  lineHeight: '1.6',
};

/** Label หัวข้อส่วนรายละเอียด/รูปภาพ */
const sectionLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  marginBottom: '6px',
  margin: '0 0 6px 0',
};

// ===== Table Styles (Inline สำหรับ html2canvas) =====
const thStyle: React.CSSProperties = {
  padding: '12px 10px',
  textAlign: 'left',
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  whiteSpace: 'nowrap',
  lineHeight: '1.6',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 10px',
  textAlign: 'left',
  verticalAlign: 'top',
  fontSize: '12px',
  lineHeight: '1.6',
};
