import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GuideApp } from './GuideApp';

vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_, prop) => ({ children, className, style, onClick, disabled, ...rest }: any) => {
      const Tag = typeof prop === 'string' ? prop : 'div';
      return React.createElement(Tag, { className, style, onClick, disabled, ...rest }, children);
    }
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('GuideApp Component', () => {
  it('renders initial introduction slide correctly', () => {
    const onBackMock = vi.fn();
    render(<GuideApp onBackToPortal={onBackMock} />);

    expect(screen.getByText('SECTION 01 / INDUSTRIAL CONTEXT & PROBLEM')).toBeInTheDocument();
    expect(screen.getByText('QSMS Rework Management Platform')).toBeInTheDocument();
    expect(screen.getByText('Closed-Loop MES & Multimodal AI Operations Architecture')).toBeInTheDocument();
  });

  it('advances slide on ArrowRight keyboard event', () => {
    const onBackMock = vi.fn();
    render(<GuideApp onBackToPortal={onBackMock} />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('01.2 / OPERATIONAL PAIN POINTS')).toBeInTheDocument();
    expect(screen.getByText('Legacy Operational Waste Chain')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('01.3 / PROJECT OBJECTIVES')).toBeInTheDocument();
    expect(screen.getByText('4 Measurable Engineering Targets')).toBeInTheDocument();
  });

  it('filters slides by 5-section category correctly', () => {
    const onBackMock = vi.fn();
    render(<GuideApp onBackToPortal={onBackMock} />);

    // Click '3. สถาปัตยกรรมเชิงลึก' category pill
    const archButton = screen.getByRole('button', { name: /3\. สถาปัตยกรรม/i });
    fireEvent.click(archButton);

    expect(screen.getByText('SECTION 03 / SYSTEM ARCHITECTURE')).toBeInTheDocument();
    expect(screen.getByText('4-Layer Enterprise System Topology')).toBeInTheDocument();
  });

  it('handles zoom in, zoom out, and reset zoom controls', () => {
    const onBackMock = vi.fn();
    render(<GuideApp onBackToPortal={onBackMock} />);

    // Initially at 100%
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Zoom in
    const zoomInBtn = screen.getByTitle('Zoom In (ขยายภาพ)');
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('115%')).toBeInTheDocument();
    expect(screen.getByText('คลิกลากเพื่อเลื่อน')).toBeInTheDocument();

    // Zoom out
    const zoomOutBtn = screen.getByTitle('Zoom Out (ย่อขนาด)');
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Zoom in then reset
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('115%')).toBeInTheDocument();

    const resetBtn = screen.getByTitle('Fit to Screen (ปรับขนาดพอดีจอ)');
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calls onBackToPortal when back button is clicked', () => {
    const onBackMock = vi.fn();
    render(<GuideApp onBackToPortal={onBackMock} />);

    const buttons = screen.getAllByRole('button');
    // The first button in navigation is the back-to-portal arrow button
    fireEvent.click(buttons[0]);

    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
