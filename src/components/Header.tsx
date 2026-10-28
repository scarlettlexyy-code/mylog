'use client';

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  currentDate?: string;
  onDateChange?: (newDate: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  currentDate = '26 Okt 2026',
}) => {
  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/40">
      <div className="h-28 px-margin flex flex-col justify-center gap-space-xs max-w-md mx-auto">
        {/* Top bar: Brand text identity & connection/supervisor badge */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex flex-col group">
            <div className="flex items-baseline">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-extrabold group-hover:opacity-90 transition-opacity">
                MYlog
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-container ml-0.5 mb-0.5 inline-block"></span>
            </div>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
              Agranusa Signature Villa
            </span>
          </Link>

          <div className="flex items-center gap-space-xs">
            {/* Status pill: Online • Sheets */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-badge text-label-badge border border-surface-container-high/50">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
              <span>Online • Sheets</span>
            </div>

            {/* Supervisor Badge (No Login Required) */}
            <div
              title="Supervisor Operasional"
              className="px-2 py-1 rounded-full bg-primary text-on-primary font-label-badge text-[10px] font-bold flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[14px]">
                verified
              </span>
              <span>Supervisor</span>
            </div>
          </div>
        </div>

        {/* Bottom bar: Page title & Date selector pill */}
        <div className="flex items-center justify-between gap-space-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-title-sm text-title-sm text-on-surface font-bold">
              {title}
            </span>
          </div>

          <button
            className="min-h-[36px] px-2.5 py-1 rounded-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-surface-container/60 flex items-center gap-1.5 text-on-surface active:scale-95 transition-transform"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px] text-secondary">
              calendar_today
            </span>
            <span className="font-label-badge text-label-badge font-semibold">
              {currentDate}
            </span>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
              arrow_drop_down
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
