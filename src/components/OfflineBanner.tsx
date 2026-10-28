'use client';

import React, { useEffect, useState } from 'react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-surface-container-low text-on-surface-variant border border-surface-container/60">
        <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
        <span className="font-label-badge text-label-badge">
          Koneksi Sheets Aktif • Siap Kirim Cloud
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-error-container text-on-error-container border border-error/20">
      <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
      <span className="font-label-badge text-label-badge font-semibold">
        Mode Offline: Server update dinonaktifkan (PRD 4.3 & 16)
      </span>
    </div>
  );
};
