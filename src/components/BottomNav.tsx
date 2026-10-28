'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: 'dashboard',
      isActive: pathname === '/',
    },
    {
      href: '/input-meter',
      label: 'Input Meter',
      icon: 'edit_note',
      isActive: pathname === '/input-meter',
    },
    {
      href: '/anggaran',
      label: 'Anggaran',
      icon: 'account_balance_wallet',
      isActive: pathname === '/anggaran',
    },
    {
      href: '/audit',
      label: 'Audit',
      icon: 'history',
      isActive: pathname === '/audit',
    },
    {
      href: '/laporan',
      label: 'Laporan',
      icon: 'summarize',
      isActive: pathname === '/laporan',
    },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)] border-t border-surface-container-high/40">
      <div className="flex items-center justify-between h-16 px-1 max-w-md mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            aria-current={item.isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 transition-colors relative flex-1 ${
              item.isActive
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {item.icon}
            </span>
            <span className="font-label-badge text-label-badge text-[10px] tracking-tight">
              {item.label}
            </span>
            <span
              className={`absolute -bottom-1 w-1 h-1 rounded-full bg-secondary-container transition-opacity ${
                item.isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </Link>
        ))}
      </div>
    </nav>
  );
};
