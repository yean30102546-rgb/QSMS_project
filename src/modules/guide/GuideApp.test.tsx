import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GuideApp } from './GuideApp';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, style }: any) => (
      <div className={className} style={style}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('GuideApp Component', () => {
  it('renders initial introduction slide correctly', () => {
    const onBackMock = vi.fn();
    render(<GuideApp onBackToPortal={onBackMock} />);

    expect(screen.getByText('01 / INTRODUCTION')).toBeInTheDocument();
    expect(screen.getByText('QSMS Rework')).toBeInTheDocument();
    expect(screen.getByText('Management System')).toBeInTheDocument();
  });

  it('advances slide on ArrowRight keyboard event', () => {
    const onBackMock = vi.fn();
    render(<GuideApp onBackToPortal={onBackMock} />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(screen.getByText('02 / OBJECTIVES')).toBeInTheDocument();
    expect(screen.getByText('Project Objectives')).toBeInTheDocument();
  });

  it('calls onBackToPortal when back button is clicked', () => {
    const onBackMock = vi.fn();
    render(<GuideApp onBackToPortal={onBackMock} />);

    const backBtn = screen.getByRole('button');
    fireEvent.click(backBtn);

    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
