'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { formatDecimal, formatRupiah } from '@/lib/calculations';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard?date=2026-10-26')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading dashboard:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-surface min-h-screen pb-28">
      <Header title="Dashboard Eksekutif" currentDate="26 Okt 2026" />

      <main className="flex flex-col relative w-full pt-28 px-margin max-w-md mx-auto">
        <div className="flex flex-col w-full gap-gutter pb-space-lg pt-2">
          {/* Welcome & Status Bar */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                Monitoring Harian • 26 Okt 2026
              </span>
              <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface">
                Ringkasan Energi &amp; Biaya
              </span>
            </div>
            <Link
              href="/input-meter"
              prefetch={true}
              className="min-h-[38px] px-3 py-1.5 rounded-full bg-primary text-on-primary font-title-sm text-title-sm flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[17px]">edit</span>
              <span>+ Catat Meter</span>
            </Link>
          </div>

          {/* 1. Card: Total Taksiran Harian & Opex Split */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                Total Beban Hari Ini (Gabungan)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-badge text-label-badge font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
                5/5 Lengkap
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="font-metric-display text-[32px] text-primary font-black tracking-tight">
                Rp 2.623.550
              </span>
              <div className="flex items-center gap-1 text-error font-title-sm text-title-sm font-bold">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>+14,2%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Biaya 4 Energi
                </span>
                <span className="font-metric-sm text-metric-sm text-on-surface font-bold mt-0.5">
                  Rp 1.023.550
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Listrik, Air, Gas, Solar
                </span>
              </div>

              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Pengeluaran Opex
                </span>
                <span className="font-metric-sm text-metric-sm text-on-surface font-bold mt-0.5">
                  Rp 1.720.000
                </span>
                <span className="font-body-sm text-body-sm text-error font-medium">
                  +Rp 270.000 (+18,6%)
                </span>
              </div>
            </div>
          </div>

          {/* Active Spike Alert Callout (PRD Bagian 12) */}
          <div className="bg-error-container/70 rounded-xl p-space-md flex items-start gap-2.5 border border-error/30">
            <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">
              warning
            </span>
            <div className="flex flex-col flex-1 gap-0.5">
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm text-on-error-container font-bold">
                  Lonjakan Listrik Terdeteksi
                </span>
                <span className="font-label-badge text-label-badge bg-surface-container-lowest text-error px-1.5 py-0.5 rounded font-bold">
                  Ambang Ganda
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-error-container leading-snug">
                Kenaikan harian melampaui ambang batas: <strong>+24,5%</strong> (ambang +20%) dan{' '}
                <strong>+Rp 620.000</strong> (ambang +Rp 500.000).
              </p>
            </div>
          </div>

          {/* 5 Component Telemetry Cards (Strict Domain Separation) */}
          <div className="flex items-center justify-between px-1">
            <span className="font-title-md text-title-md font-bold text-on-surface">
              Status 5 Komponen Pemantauan
            </span>
            <span className="font-label-badge text-label-badge text-on-surface-variant">
              Hari Ini vs Kemarin
            </span>
          </div>

          <div className="flex flex-col gap-gutter">
            {/* 1. Listrik */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-2 border border-surface-container-high/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                  </div>
                  <div>
                    <span className="font-title-sm text-title-sm font-bold text-on-surface">
                      Listrik PLN
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">
                      14.892,0 kWh
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-title-md text-title-md font-extrabold text-on-surface">
                    Rp 266.800
                  </span>
                  <span className="font-label-badge text-label-badge text-secondary font-bold">
                    +184,0 kWh (+6,2%)
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Air */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-2 border border-surface-container-high/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">water_drop</span>
                  </div>
                  <div>
                    <span className="font-title-sm text-title-sm font-bold text-on-surface">
                      Air PDAM / Deep Well
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">
                      3.120,0 m³
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-title-md text-title-md font-extrabold text-on-surface">
                    Rp 108.750
                  </span>
                  <span className="font-label-badge text-label-badge text-secondary font-bold">
                    +14,5 m³ (+3,8%)
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Gas */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-2 border border-surface-container-high/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">mode_heat</span>
                  </div>
                  <div>
                    <span className="font-title-sm text-title-sm font-bold text-on-surface">
                      Gas Sentral Kitchen
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">
                      942,0 m³
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-title-md text-title-md font-extrabold text-on-surface">
                    Rp 123.000
                  </span>
                  <span className="font-label-badge text-label-badge text-secondary font-bold">
                    +8,2 m³ (+2,1%)
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Fuel Solar */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-2 border border-surface-container-high/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">local_gas_station</span>
                  </div>
                  <div>
                    <span className="font-title-sm text-title-sm font-bold text-on-surface">
                      Fuel Genset (Solar)
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">
                      Running Test 1.5 Jam
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-title-md text-title-md font-extrabold text-on-surface">
                    Rp 525.000
                  </span>
                  <span className="font-label-badge text-label-badge text-secondary font-bold">
                    35 Liter (Non-meter)
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Opex */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-2 border border-surface-container-high/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  </div>
                  <div>
                    <span className="font-title-sm text-title-sm font-bold text-on-surface">
                      Pengeluaran Operasional
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">
                      Total Kas Harian (PRD 9)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-title-md text-title-md font-extrabold text-on-surface">
                    Rp 1.720.000
                  </span>
                  <span className="font-label-badge text-label-badge text-error font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
                    +Rp 270rb (+18,6%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Month to Date Budget Card */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Realisasi Anggaran Bulan Oktober 2026
                </span>
                <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface mt-0.5">
                  Rp 34.200.000{' '}
                  <span className="text-body-sm font-normal text-on-surface-variant">
                    / Rp 50.000.000
                  </span>
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-container font-label-badge text-label-badge font-bold text-on-surface">
                68,4% • Aman
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '68.4%' }}></div>
            </div>

            <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
              <span>Hari ke-26 dari 31</span>
              <span>
                Sisa Plafon: <strong className="text-on-surface">Rp 15.800.000</strong>
              </span>
            </div>

            <Link
              href="/anggaran"
              prefetch={true}
              className="mt-1 py-2 text-center rounded-lg bg-surface-container-low text-on-surface font-title-sm text-title-sm font-semibold active:scale-95 transition-transform border border-surface-container"
            >
              Kelola Anggaran &amp; Ambang Batas &rarr;
            </Link>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
