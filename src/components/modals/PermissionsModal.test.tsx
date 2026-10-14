import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PermissionsModal } from './PermissionsModal';
import { UserRole } from '../../config/auth.config';

describe('PermissionsModal Component RBAC Inspection', () => {
  it('renders ADMIN role correctly with full administrative permissions', () => {
    render(
      <PermissionsModal
        isOpen={true}
        onClose={() => {}}
        userName="Admin Somchai"
        userRole="ADMIN"
      />
    );

    // Header & badge
    expect(screen.getByText('Admin Somchai')).toBeDefined();
    expect(screen.getByText('ADMIN')).toBeDefined();
    expect(screen.getByText(/สิทธิ์ผู้ดูแลระบบสูงสุด/)).toBeDefined();

    // Specific permissions for ADMIN
    expect(screen.getByText(/จัดการบัญชีผู้ใช้/)).toBeDefined();
    expect(screen.getByText(/จัดการแบบแปลน/)).toBeDefined();
    expect(screen.getByText(/ลบเคสออกจากฐานข้อมูล/)).toBeDefined();
    expect(screen.getByText(/ส่งออกรายงานข้อมูล/)).toBeDefined();

    // Should NOT say Guest User
    expect(screen.queryByText(/Guest User/i)).toBeNull();
  });

  it('renders QSMS role correctly with QC and RAG permissions', () => {
    render(
      <PermissionsModal
        isOpen={true}
        onClose={() => {}}
        userName="QC Inspector"
        userRole={UserRole.QSMS}
      />
    );

    expect(screen.getByText('QSMS')).toBeDefined();
    expect(screen.getByText(/สิทธิ์ฝ่ายควบคุมคุณภาพ/)).toBeDefined();
    expect(screen.getByText(/บันทึกการวิเคราะห์ปัญหา/)).toBeDefined();
    expect(screen.getByText(/ลบเคสออกจากฐานข้อมูล/)).toBeDefined();
    expect(screen.queryByText(/Guest User/i)).toBeNull();
  });

  it('renders WFG role correctly for finished goods case initiation', () => {
    render(
      <PermissionsModal
        isOpen={true}
        onClose={() => {}}
        userName="WFG Lead"
        userRole={UserRole.WFG}
      />
    );

    expect(screen.getByText('WFG')).toBeDefined();
    expect(screen.getByText(/สิทธิ์ฝ่ายคลังสินค้าสำเร็จรูป/)).toBeDefined();
    expect(screen.getByText(/เปิดเคสของเสียภายในโรงงาน/)).toBeDefined();
    expect(screen.queryByText(/Guest User/i)).toBeNull();
  });

  it('renders CS role correctly for customer return initiation', () => {
    render(
      <PermissionsModal
        isOpen={true}
        onClose={() => {}}
        userName="CS Officer"
        userRole={UserRole.CS}
      />
    );

    expect(screen.getByText('CS')).toBeDefined();
    expect(screen.getByText(/สิทธิ์ฝ่ายบริการลูกค้า/)).toBeDefined();
    expect(screen.getByText(/เปิดเคสเคลมรับคืนจากลูกค้า/)).toBeDefined();
    expect(screen.queryByText(/Guest User/i)).toBeNull();
  });

  it('renders WPK role correctly for container & material issuing', () => {
    render(
      <PermissionsModal
        isOpen={true}
        onClose={() => {}}
        userName="Packaging Team"
        userRole={UserRole.WPK}
      />
    );

    expect(screen.getByText('WPK')).toBeDefined();
    expect(screen.getByText(/สิทธิ์ฝ่ายคลังและบรรจุภัณฑ์/)).toBeDefined();
    expect(screen.getByText(/ยืนยันจ่ายวัสดุและภาชนะ/)).toBeDefined();
    expect(screen.queryByText(/Guest User/i)).toBeNull();
  });

  it('renders PDF role correctly for repair execution and defend', () => {
    render(
      <PermissionsModal
        isOpen={true}
        onClose={() => {}}
        userName="Technician Win"
        userRole={UserRole.PDF}
      />
    );

    expect(screen.getByText('PDF')).toBeDefined();
    expect(screen.getByText(/สิทธิ์ฝ่ายผลิตและช่างซ่อม/)).toBeDefined();
    expect(screen.getAllByText(/บันทึกยอดกล่องที่ซ่อมเสร็จ/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/แจ้งปัญหาติดขัดหน้างาน/)).toBeDefined();
    expect(screen.queryByText(/Guest User/i)).toBeNull();
  });

  it('renders OPERATOR alias role without error', () => {
    render(
      <PermissionsModal
        isOpen={true}
        onClose={() => {}}
        userName="Operator Jane"
        userRole={UserRole.OPERATOR}
      />
    );

    expect(screen.getByText('OPERATOR')).toBeDefined();
    expect(screen.getByText(/สิทธิ์ผู้ปฏิบัติงานฝ่ายผลิต/)).toBeDefined();
    expect(screen.queryByText(/Guest User/i)).toBeNull();
  });

  it('displays explicit unknown role explanation for unregistered roles instead of silently masquerading as Guest', () => {
    render(
      <PermissionsModal
        isOpen={true}
        onClose={() => {}}
        userName="Unknown Person"
        userRole="UNREGISTERED_ROLE"
      />
    );

    // Badge shows the provided role
    expect(screen.getByText('UNREGISTERED_ROLE')).toBeDefined();

    // Must be labeled as unknown role, NOT guest user
    expect(screen.getByText(/บทบาทไม่รู้จักในระบบ/)).toBeDefined();
    expect(screen.getByText(/UNREGISTERED_ROLE.*ไม่ได้รับการลงทะเบียน/)).toBeDefined();
    expect(screen.queryByText(/Guest User/i)).toBeNull();
  });

  it('displays Guest User only when userRole is empty or explicitly GUEST', () => {
    render(
      <PermissionsModal
        isOpen={true}
        onClose={() => {}}
        userName="Visitor"
        userRole=""
      />
    );

    expect(screen.getByText('GUEST')).toBeDefined();
    expect(screen.getByText(/ผู้ใช้งานทั่วไป \(Guest User\)/)).toBeDefined();
  });
});
