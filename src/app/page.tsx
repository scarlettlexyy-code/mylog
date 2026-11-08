'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { formatDecimal, formatRupiah } from '@/lib/calculations';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Selamat Pagi';
  if (h < 17) return 'Selamat Siang';
  return 'Selamat Malam';
}

function getTodayFormatted() {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const KpiCard = ({
  label,
  value,
  unit,
  costRupiah,
  change,
  color,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  costRupiah?: number;
  change?: string;
  color: string;
  icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {change && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              change.startsWith('+')
                ? 'bg-red-50 text-red-600'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {change}
          </span>
        )}
      </div>
      <div className="text-xl font-black text-gray-900 leading-tight">
        {value} <span className="text-xs font-semibold text-gray-400">{unit}</span>
      </div>
      <div className="text-xs text-gray-500 font-bold mt-0.5">{label}</div>
    </div>
    {costRupiah != null && (
      <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Biaya</span>
        <span className="text-xs font-black text-gray-900">{formatRupiah(costRupiah)}</span>
      </div>
    )}
  </div>
);

const CategoryBar = ({
  label,
  actual,
  budget,
  color,
}: {
  label: string;
  actual: number;
  budget: number;
  color: string;
}) => {
  const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
  const over = pct >= 85;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700">{label}</span>
        <span className={`text-xs font-black ${over ? 'text-red-500' : 'text-gray-600'}`}>
          {formatRupiah(actual)} / {formatRupiah(budget)} ({Math.round(pct)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('mylog_dashboard_cache');
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('mylog_dashboard_cache');
    }
    return true;
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/dashboard?date=${today}`)
      .then((r) => r.json())
      .then((j) => {
        setData(j);
        setLoading(false);
        try {
          sessionStorage.setItem('mylog_dashboard_cache', JSON.stringify(j));
        } catch (e) {}
      })
      .catch((err) => {
        console.error('Error loading dashboard:', err);
        setLoading(false);
      });
  }, []);

  const summary = data?.currentPeriodSummary;
  const todayData = data?.today;
  const budget = data?.budget;

  const totalElec = summary?.totalElectricityConsumption ?? 0;
  const totalWater = summary?.totalWaterConsumption ?? 0;
  const totalGas = summary?.totalGasConsumption ?? 0;
  const totalFuel = summary?.totalFuel ?? 0;
  const totalOpex = summary?.totalOpex ?? 0;

  const costElec = summary?.totalElectricityCost ?? 0;
  const costWater = summary?.totalWaterCost ?? 0;
  const costGas = summary?.totalGasCost ?? 0;
  const costFuel = summary?.totalFuelCost ?? 0;

  const elecBudget = budget?.categories?.electricity?.budget ?? 15000000;
  const waterBudget = budget?.categories?.water?.budget ?? 4500000;
  const gasBudget = budget?.categories?.gas?.budget ?? 3500000;
  const fuelBudget = budget?.categories?.fuel?.budget ?? 7000000;
  const opexBudget = budget?.categories?.opex?.budget ?? 20000000;

  const recentReadings: any[] = data?.recentReadings ?? [];

  return (
    <div className="bg-gray-50 min-h-screen pb-28">
      <Header />

      <main className="max-w-md mx-auto px-4 pt-4">
        {/* Greeting & Date */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 font-semibold">{getTodayFormatted()}</p>
              <h2 className="text-xl font-black text-gray-900 mt-0.5">
                {getGreeting()}, Supervisor 👋
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Monitoring energi &amp; beban operasional Agranusa Signature Villa.
              </p>
            </div>
            <Link
              href="/input-meter"
              prefetch={true}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-full text-xs font-bold shadow-md shadow-blue-200 active:scale-95 transition-transform shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
              </svg>
              + Catat Log
            </Link>
          </div>
        </div>

        {/* DAILY ENERGY & EXPENSE HERO CARD */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-2xl p-4 text-white shadow-lg shadow-blue-200/50 mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
              Total Beban Hari Ini (Daily Cost)
            </span>
            {todayData?.grandTotalDelta?.percentFormatted && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                todayData.grandTotalDelta.isPositive ? 'bg-red-400/20 text-red-200' : 'bg-green-400/20 text-green-200'
              }`}>
                {todayData.grandTotalDelta.percentFormatted} vs kemarin
              </span>
            )}
          </div>
          <div className="text-3xl font-black text-white">
            {formatRupiah(todayData?.grandTotal || 0)}
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-blue-200 block uppercase font-bold">Biaya Energi (Listrik/Air/Gas/Solar)</span>
              <span className="font-extrabold text-white text-sm">
                {formatRupiah(todayData?.energySubtotal || 0)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-blue-200 block uppercase font-bold">Kasir Operasional (Opex)</span>
              <span className="font-extrabold text-white text-sm">
                {formatRupiah(todayData?.opex?.totalAmount || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI Grid (Month-To-Date Totals in Rupiah & Units) */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">
            Akumulasi Pemakaian Bulan Ini
          </h3>
          <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md">
            Mata Uang: IDR (Rp)
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <KpiCard
              label="Listrik (PLN)"
              value={formatDecimal(totalElec, 1)}
              unit="kWh"
              costRupiah={costElec}
              color="bg-yellow-50"
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-600">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
              }
            />
            <KpiCard
              label="Air Bersih"
              value={formatDecimal(totalWater, 1)}
              unit="m³"
              costRupiah={costWater}
              color="bg-blue-50"
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600">
                  <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
                </svg>
              }
            />
            <KpiCard
              label="Gas Villa"
              value={formatDecimal(totalGas, 1)}
              unit="m³"
              costRupiah={costGas}
              color="bg-teal-50"
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-teal-600">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2-1.13 0-1.9.16-2.53.33C14.28 11.86 17 10 17 8z" />
                </svg>
              }
            />
            <KpiCard
              label="Bahan Bakar Solar"
              value={formatDecimal(totalFuel, 0)}
              unit="Liter"
              costRupiah={costFuel}
              color="bg-orange-50"
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-600">
                  <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6.5V18H5V5h8v13H8z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Budget Utilization Progress */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900">Realisasi vs Pagu Anggaran</h3>
              <p className="text-[10px] text-gray-400">Total Pengeluaran Bulan Berjalan (Rupiah)</p>
            </div>
            <Link
              href="/anggaran"
              className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
            >
              Atur Pagu →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <CategoryBar label="Listrik PLN" actual={costElec} budget={elecBudget} color="bg-yellow-500" />
            <CategoryBar label="Air Bersih" actual={costWater} budget={waterBudget} color="bg-blue-500" />
            <CategoryBar label="Gas" actual={costGas} budget={gasBudget} color="bg-teal-500" />
            <CategoryBar label="Solar Genset" actual={costFuel} budget={fuelBudget} color="bg-orange-500" />
            <CategoryBar label="Kasir Operasional" actual={totalOpex} budget={opexBudget} color="bg-purple-500" />
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900">Catatan Meter Terbaru</h3>
              <p className="text-[10px] text-gray-400">Riwayat sinkronisasi Google Sheets</p>
            </div>
            <Link href="/audit" className="text-xs font-bold text-blue-600 hover:underline">
              Lihat Semua
            </Link>
          </div>

          {recentReadings.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-2 text-gray-300">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                </svg>
              </div>
              <p className="text-xs text-gray-400 font-bold">Belum ada catatan meter</p>
              <Link
                href="/input-meter"
                className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full"
              >
                + Mulai Input Hari Ini
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentReadings.slice(0, 5).map((r: any, i: number) => (
                <div key={r.id || i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                      {r.date?.slice(8, 10)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">{r.date}</div>
                      <div className="text-[10px] text-gray-400">
                        Listrik: {r.electricityMeter ?? '—'} kWh • Air: {r.waterMeter ?? '—'} m³ • Gas: {r.gasMeter ?? '—'} m³
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-md">
                    Tersimpan
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
