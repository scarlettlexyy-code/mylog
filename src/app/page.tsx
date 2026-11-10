'use client';

import React, { useEffect, useState, useMemo } from 'react';
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

function getTodayWita() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function getCurrentMonthWita() {
  return getTodayWita().substring(0, 7);
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
  const isOver = pct >= 90;
  const isNear = pct >= 75 && pct < 90;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700">{label}</span>
        <span className={`text-xs font-black ${isOver ? 'text-rose-600 font-bold' : isNear ? 'text-amber-600' : 'text-gray-700'}`}>
          {formatRupiah(actual)} / {formatRupiah(budget)} ({Math.round(pct)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const currentMonth = getCurrentMonthWita();

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

  // Local storage authoritative budget (synced from Form Anggaran)
  const [localBudget, setLocalBudget] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`mylog_user_budget_${currentMonth}`) || localStorage.getItem(`mylog_budget_${currentMonth}`);
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Selected date expense popup modal state
  const [selectedExpenseDate, setSelectedExpenseDate] = useState<any>(null);
  const [pickerDate, setPickerDate] = useState(getTodayWita());
  const [pickerLoading, setPickerLoading] = useState(false);

  useEffect(() => {
    const today = getTodayWita();
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

    // Check local storage for user budget
    try {
      const saved = localStorage.getItem(`mylog_user_budget_${currentMonth}`) || localStorage.getItem(`mylog_budget_${currentMonth}`);
      if (saved) {
        setLocalBudget(JSON.parse(saved));
      }
    } catch (e) {}
  }, [currentMonth]);

  const summary = data?.currentPeriodSummary;
  const todayData = data?.today;
  const serverBudget = data?.budget;

  // Actual MTD consumptions
  const totalElec = summary?.totalElectricityConsumption ?? 0;
  const totalWater = summary?.totalWaterConsumption ?? 0;
  const totalGas = summary?.totalGasConsumption ?? 0;
  const totalFuel = summary?.totalFuel ?? 0;
  const totalOpex = summary?.totalOpex ?? 0;

  // Actual MTD costs (Total Expenses MTD)
  const costElec = summary?.totalElectricityCost ?? 0;
  const costWater = summary?.totalWaterCost ?? 0;
  const costGas = summary?.totalGasCost ?? 0;
  const costFuel = summary?.totalFuelCost ?? 0;
  const totalExpenses = (costElec + costWater + costGas + costFuel + totalOpex) || (summary?.grandTotalCost ?? 0);

  // Budgets - Prioritize Local User Budget from Form Anggaran, then Server Budget, default to 0 (no hardcoded fake values)
  const elecBudget = localBudget?.electricityBudget != null 
    ? Number(localBudget.electricityBudget) 
    : (serverBudget?.categories?.electricity?.budget ?? 0);

  const waterBudget = localBudget?.waterBudget != null 
    ? Number(localBudget.waterBudget) 
    : (serverBudget?.categories?.water?.budget ?? 0);

  const gasBudget = localBudget?.gasBudget != null 
    ? Number(localBudget.gasBudget) 
    : (serverBudget?.categories?.gas?.budget ?? 0);

  const fuelBudget = localBudget?.fuelBudget != null 
    ? Number(localBudget.fuelBudget) 
    : (serverBudget?.categories?.fuel?.budget ?? 0);

  const opexBudget = localBudget?.opexBudget != null 
    ? Number(localBudget.opexBudget) 
    : (serverBudget?.categories?.opex?.budget ?? 0);

  const totalBudget = localBudget?.totalBudget != null
    ? Number(localBudget.totalBudget)
    : (serverBudget?.totalBudget ?? (elecBudget + waterBudget + gasBudget + fuelBudget + opexBudget));

  // Sisa Anggaran (Remaining Net Budget) & Percentage
  const remainingBudget = totalBudget - totalExpenses;
  const spentPct = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  // Warning Signal Logic
  const isBudgetConfigured = totalBudget > 0;
  const isOverBudget = isBudgetConfigured && spentPct >= 90;
  const isNearBudget = isBudgetConfigured && spentPct >= 75 && spentPct < 90;

  // Recent daily expenses list (enhanced)
  const recentDaily: any[] = data?.recentDailyExpenses ?? [];

  // Handler to fetch any specific date picked by user
  const handleInspectDate = (targetDateStr: string) => {
    // 1. Look in existing recentDaily list first
    const found = recentDaily.find((item) => item.date === targetDateStr);
    if (found) {
      setSelectedExpenseDate(found);
      return;
    }

    // 2. Otherwise fetch from API
    setPickerLoading(true);
    fetch(`/api/dashboard?date=${targetDateStr}`)
      .then((r) => r.json())
      .then((j) => {
        const t = j?.today;
        if (t) {
          setSelectedExpenseDate({
            date: targetDateStr,
            electricityConsumption: t.electricity?.consumption ?? 0,
            electricityCost: t.electricity?.cost ?? 0,
            waterConsumption: t.water?.consumption ?? 0,
            waterCost: t.water?.cost ?? 0,
            gasConsumption: t.gas?.consumption ?? 0,
            gasCost: t.gas?.cost ?? 0,
            fuelLiters: t.fuel?.liters ?? 0,
            fuelCost: t.fuel?.cost ?? 0,
            opexAmount: t.opex?.totalAmount ?? 0,
            energySubtotal: t.energySubtotal ?? 0,
            grandTotal: t.grandTotal ?? 0,
            gensetStatus: t.fuel?.gensetStatus,
          });
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setPickerLoading(false));
  };

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

        {/* HERO CARD: SISA SALDO PAGU ANGGARAN & TOTAL EXPENSES */}
        <div
          className={`rounded-2xl p-4 text-white shadow-xl transition-all duration-500 mb-4 ${
            !isBudgetConfigured
              ? 'bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-950 shadow-blue-950/20'
              : isOverBudget
              ? 'bg-gradient-to-br from-slate-900 via-rose-950 to-red-950 border border-rose-500/40 shadow-rose-950/30'
              : isNearBudget
              ? 'bg-gradient-to-br from-slate-900 via-amber-950 to-orange-950 border border-amber-500/40 shadow-amber-950/30'
              : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 border border-blue-500/30 shadow-indigo-950/30'
          }`}
        >
          {/* Header Row: Title & Warning Signal */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Sisa Saldo Anggaran Bulan Ini
            </span>

            {/* Sinyal Peringatan Status Anggaran */}
            {isBudgetConfigured ? (
              isOverBudget ? (
                <div className="flex items-center gap-1.5 bg-rose-500/30 border border-rose-400/50 px-2.5 py-1 rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span className="text-[10px] font-black text-rose-200 uppercase tracking-wide">
                    Kritis! ({spentPct.toFixed(1)}%)
                  </span>
                </div>
              ) : isNearBudget ? (
                <div className="flex items-center gap-1.5 bg-amber-500/30 border border-amber-400/50 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-[10px] font-black text-amber-200 uppercase tracking-wide">
                    Mendekati Pagu ({spentPct.toFixed(1)}%)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] font-black text-emerald-200 uppercase tracking-wide">
                    Aman ({spentPct.toFixed(1)}%)
                  </span>
                </div>
              )
            ) : (
              <Link
                href="/anggaran"
                className="text-[10px] font-bold bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 border border-blue-400/30 px-2.5 py-1 rounded-full transition-colors"
              >
                + Set Pagu Anggaran
              </Link>
            )}
          </div>

          {/* Nilai Utama Sisa Anggaran */}
          <div className="flex items-baseline gap-2">
            <div className={`text-3xl font-black tracking-tight ${remainingBudget < 0 ? 'text-rose-300' : 'text-white'}`}>
              {formatRupiah(remainingBudget)}
            </div>
            <span className="text-xs font-semibold text-gray-300">
              {remainingBudget >= 0 ? 'tersisa' : 'defisit'}
            </span>
          </div>

          <div className="text-[11px] text-gray-300 mt-1">
            Total Pagu: <strong className="text-white">{formatRupiah(totalBudget)}</strong> · Terpakai:{' '}
            <strong className="text-white">{formatRupiah(totalExpenses)}</strong> ({Math.round(spentPct)}%)
          </div>

          {/* Progress Bar Persentase Terpakai */}
          <div className="mt-3">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isOverBudget ? 'bg-rose-500' : isNearBudget ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(spentPct, 100)}%` }}
              />
            </div>
          </div>

          {/* 3-Column Breakdown Footer */}
          <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-left">
            <div>
              <span className="text-[9px] text-gray-300 block uppercase font-bold tracking-wider">
                Total Expenses (MTD)
              </span>
              <span className="font-extrabold text-white text-xs mt-0.5 block">
                {formatRupiah(totalExpenses)}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-gray-300 block uppercase font-bold tracking-wider">
                Pagu Anggaran
              </span>
              <span className="font-extrabold text-white text-xs mt-0.5 block">
                {formatRupiah(totalBudget)}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-gray-300 block uppercase font-bold tracking-wider">
                Beban Hari Ini
              </span>
              <span className="font-extrabold text-blue-200 text-xs mt-0.5 block">
                {formatRupiah(todayData?.grandTotal || 0)}
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

        {/* Budget Utilization Progress (Synchronized with Form Anggaran) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900">Realisasi vs Pagu Anggaran</h3>
              <p className="text-[10px] text-gray-400">Total Pengeluaran Bulan Berjalan (Tersinkron)</p>
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
            <CategoryBar label="Gas Villa" actual={costGas} budget={gasBudget} color="bg-teal-500" />
            <CategoryBar label="Solar Genset" actual={costFuel} budget={fuelBudget} color="bg-orange-500" />
            <CategoryBar label="Kasir Operasional" actual={totalOpex} budget={opexBudget} color="bg-purple-500" />
          </div>
        </div>

        {/* SECTION: DAILY EXPENSES (Interactive & Clickable) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900">Daily Expenses</h3>
              <p className="text-[10px] text-gray-400">Klik tanggal untuk cek rincian pengeluaran harian</p>
            </div>
            <Link href="/audit" className="text-xs font-bold text-blue-600 hover:underline">
              Jejak Audit
            </Link>
          </div>

          {/* Date Picker bar to inspect any date */}
          <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
            <span className="text-[11px] font-bold text-gray-600 shrink-0">Cek Tanggal:</span>
            <input
              type="date"
              value={pickerDate}
              onChange={(e) => {
                setPickerDate(e.target.value);
                if (e.target.value) handleInspectDate(e.target.value);
              }}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500"
            />
            {pickerLoading && (
              <span className="text-[10px] font-bold text-blue-600 animate-pulse">Loading...</span>
            )}
          </div>

          {/* List of recent daily expenses */}
          {recentDaily.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-2 text-gray-300">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                </svg>
              </div>
              <p className="text-xs text-gray-400 font-bold">Belum ada catatan pengeluaran harian</p>
              <Link
                href="/input-meter"
                className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full"
              >
                + Mulai Input Hari Ini
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentDaily.slice(0, 7).map((d: any, i: number) => {
                const isSelected = selectedExpenseDate?.date === d.date;

                return (
                  <button
                    key={d.date || i}
                    onClick={() => setSelectedExpenseDate(d)}
                    type="button"
                    className={`w-full py-2.5 px-2 rounded-xl text-left flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-blue-50/80 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                        {d.date?.slice(8, 10)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{d.date}</span>
                          {d.date === getTodayWita() && (
                            <span className="text-[9px] bg-green-100 text-green-700 font-extrabold px-1.5 py-0.2 rounded">
                              Hari Ini
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Listrik: {formatDecimal(d.electricityConsumption, 1)} kWh · Air: {formatDecimal(d.waterConsumption, 1)} m³
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-gray-900">{formatRupiah(d.grandTotal || 0)}</div>
                      <span className="text-[10px] text-blue-600 font-semibold hover:underline">
                        Lihat Rincian →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL / POPUP: DETAIL DAILY EXPENSES PADA TANGGAL TERTENTU */}
        {selectedExpenseDate && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Rincian Daily Expenses
                  </span>
                  <h3 className="text-base font-black text-gray-900">{selectedExpenseDate.date}</h3>
                </div>
                <button
                  onClick={() => setSelectedExpenseDate(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Rincian Komponen Biaya */}
              <div className="space-y-2.5 mb-4 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-600 font-medium">⚡ Listrik PLN ({formatDecimal(selectedExpenseDate.electricityConsumption, 1)} kWh):</span>
                  <span className="font-black text-gray-900">{formatRupiah(selectedExpenseDate.electricityCost || 0)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-600 font-medium">💧 Air Bersih ({formatDecimal(selectedExpenseDate.waterConsumption, 1)} m³):</span>
                  <span className="font-black text-gray-900">{formatRupiah(selectedExpenseDate.waterCost || 0)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-600 font-medium">🔥 Gas Villa ({formatDecimal(selectedExpenseDate.gasConsumption, 1)} m³):</span>
                  <span className="font-black text-gray-900">{formatRupiah(selectedExpenseDate.gasCost || 0)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-600 font-medium">⛽ Solar Genset ({formatDecimal(selectedExpenseDate.fuelLiters, 0)} L):</span>
                  <span className="font-black text-gray-900">{formatRupiah(selectedExpenseDate.fuelCost || 0)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-600 font-medium">💵 Kasir Operasional (Opex):</span>
                  <span className="font-black text-gray-900">{formatRupiah(selectedExpenseDate.opexAmount || 0)}</span>
                </div>
              </div>

              {/* Grand Total Box */}
              <div className="bg-blue-50/80 rounded-2xl p-3 border border-blue-100 flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-blue-900 uppercase">Total Daily Expenses:</span>
                <span className="text-lg font-black text-blue-700">
                  {formatRupiah(selectedExpenseDate.grandTotal || 0)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/input-meter`}
                  className="flex-1 h-10 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center shadow-md shadow-blue-200 active:scale-95 transition-transform"
                >
                  Edit / Catat di Tanggal Ini
                </Link>
                <button
                  onClick={() => setSelectedExpenseDate(null)}
                  className="px-4 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
