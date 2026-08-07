import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { ForgotPassword } from './ForgotPassword';
import * as authService from '@/src/services/auth';

// Mock Framer Motion
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ForgotPassword Component (Streamlined 2-Step Employee ID Flow)', () => {
  const mockOnSuccess = vi.fn();
  const mockOnBackToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Step 1 (Verify Identity) initially', () => {
    render(<ForgotPassword onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />);

    expect(screen.getByRole('heading', { name: 'ยืนยันตัวตน' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username (ชื่อผู้ใช้งาน)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('รหัสพนักงาน (เช่น EMP1002)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ยืนยันตัวตน/i })).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', () => {
    render(<ForgotPassword onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />);

    const backButton = screen.getByText('กลับสู่หน้าเข้าสู่ระบบ');
    fireEvent.click(backButton);

    expect(mockOnBackToLogin).toHaveBeenCalledTimes(1);
  });

  it('handles rate limiting error and shows cooldown timer', async () => {
    vi.spyOn(authService, 'requestPasswordReset').mockResolvedValue({
      success: false,
      error: 'คุณทำรายการรีเซ็ทรหัสผ่านบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่อีกครั้ง',
    });

    render(<ForgotPassword onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />);

    fireEvent.change(screen.getByPlaceholderText('Username (ชื่อผู้ใช้งาน)'), { target: { value: 'qsms_operator' } });
    fireEvent.change(screen.getByPlaceholderText('รหัสพนักงาน (เช่น EMP1002)'), { target: { value: 'EMP1002' } });
    fireEvent.click(screen.getByRole('button', { name: /ยืนยันตัวตน/i }));

    await waitFor(() => {
      expect(screen.getByText(/คุณทำรายการรีเซ็ทรหัสผ่านบ่อยเกินไป/i)).toBeInTheDocument();
      expect(screen.getByText(/กรุณารออีก 60 วินาที/i)).toBeInTheDocument();
    });
  });

  it('transitions directly to Step 2 (Set New Password) upon successful identity verification', async () => {
    vi.spyOn(authService, 'requestPasswordReset').mockResolvedValue({
      success: true,
      token: 'TOKEN_123456',
    });

    render(<ForgotPassword onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />);

    fireEvent.change(screen.getByPlaceholderText('Username (ชื่อผู้ใช้งาน)'), { target: { value: 'qsms_operator' } });
    fireEvent.change(screen.getByPlaceholderText('รหัสพนักงาน (เช่น EMP1002)'), { target: { value: 'EMP1002' } });

    const submitBtn = screen.getByRole('button', { name: /ยืนยันตัวตน/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.requestPasswordReset).toHaveBeenCalledWith('qsms_operator', 'EMP1002');
      expect(screen.getByRole('heading', { name: 'ตั้งรหัสผ่านใหม่' })).toBeInTheDocument();
    });
  });

  it('handles same-password error when trying to reuse current password', async () => {
    vi.spyOn(authService, 'requestPasswordReset').mockResolvedValue({ success: true, token: 'TOKEN_123456' });
    vi.spyOn(authService, 'resetPasswordWithToken').mockResolvedValue({
      success: false,
      error: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิมที่คุณใช้งานอยู่',
    });

    render(<ForgotPassword onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />);

    // Step 1: Verify Identity
    fireEvent.change(screen.getByPlaceholderText('Username (ชื่อผู้ใช้งาน)'), { target: { value: 'qsms_operator' } });
    fireEvent.change(screen.getByPlaceholderText('รหัสพนักงาน (เช่น EMP1002)'), { target: { value: 'EMP1002' } });
    fireEvent.click(screen.getByRole('button', { name: /ยืนยันตัวตน/i }));

    // Step 2: Set New Password
    await waitFor(() => expect(screen.getByRole('heading', { name: 'ตั้งรหัสผ่านใหม่' })).toBeInTheDocument());

    const passInput = screen.getByPlaceholderText(/รหัสผ่านใหม่ \(อย่างน้อย 8 ตัวอักษร\)/i);
    const confirmInput = screen.getByPlaceholderText('ยืนยันรหัสผ่านใหม่');

    fireEvent.change(passInput, { target: { value: 'OldPassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'OldPassword123!' } });

    const updateBtn = screen.getByRole('button', { name: /อัปเดตรหัสผ่านใหม่/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(screen.getByText('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิมที่คุณใช้งานอยู่')).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('completes password update in Step 2 and calls onSuccess', async () => {
    vi.spyOn(authService, 'requestPasswordReset').mockResolvedValue({ success: true, token: 'TOKEN_123456' });
    vi.spyOn(authService, 'resetPasswordWithToken').mockResolvedValue({ success: true });

    render(<ForgotPassword onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />);

    // Step 1: Verify Identity
    fireEvent.change(screen.getByPlaceholderText('Username (ชื่อผู้ใช้งาน)'), { target: { value: 'qsms_operator' } });
    fireEvent.change(screen.getByPlaceholderText('รหัสพนักงาน (เช่น EMP1002)'), { target: { value: 'EMP1002' } });
    fireEvent.click(screen.getByRole('button', { name: /ยืนยันตัวตน/i }));

    // Step 2: Set New Password
    await waitFor(() => expect(screen.getByRole('heading', { name: 'ตั้งรหัสผ่านใหม่' })).toBeInTheDocument());

    const passInput = screen.getByPlaceholderText(/รหัสผ่านใหม่ \(อย่างน้อย 8 ตัวอักษร\)/i);
    const confirmInput = screen.getByPlaceholderText('ยืนยันรหัสผ่านใหม่');

    fireEvent.change(passInput, { target: { value: 'SecureP@ss2026' } });
    fireEvent.change(confirmInput, { target: { value: 'SecureP@ss2026' } });

    const updateBtn = screen.getByRole('button', { name: /อัปเดตรหัสผ่านใหม่/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(authService.resetPasswordWithToken).toHaveBeenCalledWith('qsms_operator', 'TOKEN_123456', 'SecureP@ss2026');
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
