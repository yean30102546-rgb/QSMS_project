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

    expect(screen.getByText('01 / INTRODUCTION')).toBeInTheDocument();
    expect(screen.getByText('QSMS Platform Ecosystem')).toBeInTheDocument();
    expect(screen.getByText('Operations & Technical Intelligence Suite')).toBeInTheDocument();
  });

  it('advances slide on ArrowRight keyboard event and reaches timeline', () => {
    const onBackMock = vi.fn();
    render(<GuideApp onBackToPortal={onBackMock} />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('02 / OBJECTIVES')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('03 / PROBLEM STATEMENT')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('04 / DEVELOPMENT TIMELINE')).toBeInTheDocument();
    expect(screen.getByText('Methodology & 4-Month Timeline')).toBeInTheDocument();
  });

  it('filters slides by category correctly', () => {
    const onBackMock = vi.fn();
    render(<GuideApp onBackToPortal={onBackMock} />);

    // Click 'Architecture & ERD' category pill
    const archButton = screen.getByRole('button', { name: /Architecture & ERD/i });
    fireEvent.click(archButton);

    expect(screen.getByText('05 / SYSTEM ARCHITECTURE')).toBeInTheDocument();
    expect(screen.getByText('Hybrid Next.js & Serverless Boundary')).toBeInTheDocument();
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
