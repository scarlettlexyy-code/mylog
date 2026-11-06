'use client';

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = 'bg-blue-100 text-blue-700',
  rightElement,
}) => {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-1">
          <Link href="/" className="flex items-center gap-2">
            {/* Logo mark */}
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">M</span>
            </div>
            <div>
              <div className="font-black text-gray-900 text-sm leading-tight">MYlog</div>
              <div className="text-[10px] text-gray-500 leading-tight">Agranusa Signature Villa</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-semibold text-green-700">Live Sync</span>
            </div>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SP</span>
            </div>
          </div>
        </div>

        {/* Page title row */}
        {(title || badge) && (
          <div className="flex items-center justify-between mt-2">
            <div>
              {badge && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 ${badgeColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                  {badge}
                </span>
              )}
              {title && <h1 className="text-lg font-black text-gray-900 leading-tight">{title}</h1>}
              {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {rightElement}
          </div>
        )}
      </div>
    </header>
  );
};
