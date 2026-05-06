/**
 * ExportTemplate Component
 * ---------------------------------------------------
 * Ghost/Hidden template สำหรับ Export รายงาน
 * ✅ ไม่แสดงผลบน UI ปกติ (display: none)
 * ✅ แผ่ขยายตาม Content ทั้งหมด (No Internal Scroll)
 * ✅ ออกแบบให้ดูเป็นทางการ (Professional Report) - Refined Minimal Layout
 * ---------------------------------------------------
 */

import React from 'react';
import { ReworkCase } from '../services/api';
import { formatThaiDate } from '../utils/helpers';
import { toDisplayImageUrl } from '../utils/imageUrls';

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
    const statusStyles: Record<string, { bg: string; text: string; label: string; border: string }> = {
      Pending: { bg: '#fffbeb', text: '#b45309', label: 'PENDING', border: '#fde68a' },
      'In-Progress': { bg: '#eff6ff', text: '#1d4ed8', label: 'IN-PROGRESS', border: '#bfdbfe' },
      Completed: { bg: '#ecfdf5', text: '#047857', label: 'COMPLETED', border: '#a7f3d0' },
    };

    const statusInfo = statusStyles[caseData.status] || statusStyles.Pending;

    return (
      <div
        ref={ref}
        data-export-template="true"
        style={{ display: 'none' }} // ซ่อนจาก UI ปกติ (Hook จะเปิดตอน Export)
      >
        {/* ===== Container หลัก ===== */}
        <div
          style={{
            fontFamily: "'Inter', 'Noto Sans Thai', sans-serif",
            backgroundColor: '#f8fafc',
            padding: '40px 20px',
            color: '#334155',
            fontSize: '14px',
            lineHeight: '1.5',
            width: '100%',
            maxWidth: '1000px',
            minWidth: 0,
            boxSizing: 'border-box',
            margin: '0 auto',
          }}
        >
          {/* Card Wrapper */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            padding: '40px',
            border: '1px solid #f1f5f9'
          }}>
            
            {/* ===== HEADER ===== */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '24px',
                marginBottom: '32px',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <img
                  src="/img/logo.png"
                  alt="Company Logo"
                  style={{ height: '48px', objectFit: 'contain' }}
                  crossOrigin="anonymous"
                />
                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
                  <h1
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      margin: 0,
                      color: '#0f172a',
                      letterSpacing: '-0.025em',
                    }}
                  >
                    Rework Case Report
                  </h1>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quality System Management
                  </p>
                </div>
              </div>
              {/* สถานะ Badge */}
              <div
                style={{
                  backgroundColor: statusInfo.bg,
                  color: statusInfo.text,
                  border: `1px solid ${statusInfo.border}`,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.05em'
                }}
              >
                {statusInfo.label}
              </div>
            </div>

            {/* ===== CASE INFO GRID ===== */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '40px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '24px'
              }}
            >
              <div>
                <p style={labelStyle}>Case ID</p>
                <p style={valueStyle}>{caseData.id}</p>
              </div>
              <div>
                <p style={labelStyle}>Source</p>
                <p style={valueStyle}>{caseData.source}</p>
              </div>
              <div>
                <p style={labelStyle}>Date</p>
                <p style={valueStyle}>{formatThaiDate(caseData.date)}</p>
              </div>
              <div>
                <p style={labelStyle}>Total Items</p>
                <p style={valueStyle}>{caseData.items.length}</p>
              </div>
            </div>

            {/* ===== ITEM SUMMARY TABLE ===== */}
            <h2 style={sectionHeaderStyle}>Item Summary</h2>
            <div style={{ overflow: 'hidden', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '40px' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  tableLayout: 'fixed' as const,
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ ...thStyle, width: '60px', textAlign: 'center' }}>#</th>
                    <th style={{ ...thStyle, width: '140px' }}>Item Number</th>
                    <th style={{ ...thStyle }}>Item Name</th>
                    <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Qty</th>
                    <th style={{ ...thStyle, width: '180px' }}>Reason</th>
                    <th style={{ ...thStyle, width: '180px' }}>Responsibility</th>
                  </tr>
                </thead>
                <tbody>
                  {caseData.items.map((item, index) => (
                    <tr
                      key={item.id || index}
                      style={{
                        backgroundColor: '#ffffff',
                        borderBottom: index === caseData.items.length - 1 ? 'none' : '1px solid #f1f5f9',
                      }}
                    >
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>{index + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#0f172a' }}>{item.itemNumber}</td>
                      <td style={{ ...tdStyle }}>{item.itemName || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{item.amount}</td>
                      <td style={tdStyle}>
                        <div style={{ color: '#0f172a', fontWeight: 500 }}>{item.reason}</div>
                        {item.reasonSubtype && (
                          <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{item.reasonSubtype}</div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ color: '#0f172a', fontWeight: 500 }}>{item.responsible}</div>
                        {item.responsibleSubtype && (
                          <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{item.responsibleSubtype}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ===== ITEM DETAILS & DOCUMENTATION ===== */}
            <h2 style={sectionHeaderStyle}>Item Details & Documentation</h2>
            {caseData.items.map((item, index) => {
              const hasDetails = item.details && item.details.trim().length > 0;
              const hasImages = item.imageUrls && item.imageUrls.length > 0;

              if (!hasDetails && !hasImages) return null;

              return (
                <div
                  key={`detail-${item.id || index}`}
                  style={{
                    border: '1px solid #f1f5f9',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    overflow: 'hidden',
                    pageBreakInside: 'avoid' as const,
                  }}
                >
                  <div style={{ 
                    backgroundColor: '#f8fafc', 
                    padding: '12px 20px', 
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '24px', 
                        height: '24px', 
                        backgroundColor: '#e2e8f0', 
                        color: '#475569', 
                        borderRadius: '6px', 
                        fontSize: '11px', 
                        fontWeight: 700 
                      }}>{index + 1}</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.itemName || item.itemNumber}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Qty: {item.amount}</span>
                  </div>

                  <div style={{ padding: '20px' }}>
                    {hasDetails && (
                      <div style={{ marginBottom: hasImages ? '24px' : '0' }}>
                        <p style={detailLabelStyle}>Description / Defect Details</p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: '1.6' }}>{item.details}</p>
                      </div>
                    )}

                    {hasImages && (
                      <div>
                        <p style={detailLabelStyle}>Attached Images ({item.imageUrls!.length})</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                          {item.imageUrls!.map((url, imgIndex) => (
                            <div
                              key={imgIndex}
                              style={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid #f1f5f9',
                                aspectRatio: '4/3',
                                backgroundColor: '#f8fafc'
                              }}
                            >
                              <img
                                src={toDisplayImageUrl(url)}
                                alt={`Item Documentation ${imgIndex + 1}`}
                                data-original-src={url}
                                crossOrigin="anonymous"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ===== FOOTER ===== */}
            <div
              style={{
                borderTop: '1px solid #f1f5f9',
                paddingTop: '24px',
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                color: '#94a3b8',
                fontWeight: 500
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>QSMS</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span>QUALITY SYSTEM MANAGEMENT</span>
              </div>
              <div>
                GENERATED {new Date().toLocaleString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ExportTemplate.displayName = 'ExportTemplate';

// ===== Shared Inline Styles =====

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#0f172a',
  marginBottom: '16px',
  display: 'block'
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '8px',
  margin: 0,
};

const valueStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#0f172a',
  margin: 0,
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '8px',
  margin: '0 0 8px 0',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  verticalAlign: 'top',
  fontSize: '13px',
  lineHeight: '1.5',
  color: '#334155',
};
