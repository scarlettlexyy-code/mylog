'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { formatDecimal, formatRupiah } from '@/lib/calculations';

const monthsList = [
  { value: '2026-01', label: 'Januari 2026' },
  { value: '2026-02', label: 'Februari 2026' },
  { value: '2026-03', label: 'Maret 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-05', label: 'Mei 2026' },
  { value: '2026-06', label: 'Juni 2026' },
  { value: '2026-07', label: 'Juli 2026' },
  { value: '2026-08', label: 'Agustus 2026' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-10', label: 'Oktober 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'Desember 2026' },
  { value: '2027-01', label: 'Januari 2027' },
  { value: '2027-02', label: 'Februari 2027' },
  { value: '2027-03', label: 'Maret 2027' },
];

function getQuarters() {
  const qs = [];
  for (let y = 2026; y <= 2027; y++) {
    for (let q = 1; q <= 4; q++) {
      const startM = (q - 1) * 3 + 1;
      const endM = q * 3;
      qs.push({
        value: `${y}-Q${q}`,
        label: `Kuartal Q${q} ${y}`,
        startMonth: `${y}-${String(startM).padStart(2, '0')}`,
        endMonth: `${y}-${String(endM).padStart(2, '0')}`,
      });
    }
  }
  return qs;
}

function getCurrentQuarter() {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

function getCurrentMonthWita() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date()).substring(0, 7);
  } catch {
    return new Date().toISOString().substring(0, 7);
  }
}

function getPreviousMonth(monthStr: string) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MetricCard = ({
  label,
  value,
  unit,
  costRupiah,
  diffPercent,
  diffNominal,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  costRupiah?: number;
  diffPercent?: number | null;
  diffNominal?: number | null;
  icon: React.ReactNode;
}) => {
  const hasDiff = diffPercent != null && !isNaN(diffPercent);
  const isUp = hasDiff && diffPercent! > 0;
  const isDown = hasDiff && diffPercent! < 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            {icon}
          </div>
          {hasDiff && (
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isUp
                  ? 'bg-rose-50 text-rose-600'
                  : isDown
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isUp ? `▲ +${diffPercent!.toFixed(1)}%` : isDown ? `▼ ${diffPercent!.toFixed(1)}%` : '0%'}
            </span>
          )}
        </div>
        <div className="text-xl font-black text-gray-900 leading-tight">{value}</div>
        {unit && <div className="text-[10px] text-gray-400 font-semibold">{unit}</div>}
        <div className="text-xs text-gray-600 font-bold mt-1">{label}</div>
      </div>

      {costRupiah != null && (
        <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Biaya</span>
          <span className="font-black text-gray-900">{formatRupiah(costRupiah)}</span>
        </div>
      )}
    </div>
  );
};

export default function LaporanPage() {
  const quarters = useMemo(() => getQuarters(), []);
  const [reportType, setReportType] = useState<'monthly' | 'quarterly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthWita());
  const [selectedQuarter, setSelectedQuarter] = useState<string>(getCurrentQuarter());

  const [currentData, setCurrentData] = useState<any>(null);
  const [prevData, setPrevData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Month-to-month dates
  const prevMonth = useMemo(() => getPreviousMonth(selectedMonth), [selectedMonth]);
  const monthInfo = useMemo(() => monthsList.find((m) => m.value === selectedMonth), [selectedMonth]);
  const prevMonthInfo = useMemo(() => monthsList.find((m) => m.value === prevMonth), [prevMonth]);

  // Quarter info
  const qInfo = useMemo(() => quarters.find((q) => q.value === selectedQuarter), [quarters, selectedQuarter]);

  // Fetch report data
  useEffect(() => {
    setLoading(true);

    if (reportType === 'monthly') {
      // Fetch selected month (target last day e.g. 28) and previous month
      Promise.all([
        fetch(`/api/dashboard?date=${selectedMonth}-28`).then((r) => r.json()).catch(() => null),
        fetch(`/api/dashboard?date=${prevMonth}-28`).then((r) => r.json()).catch(() => null),
      ]).then(([cur, prev]) => {
        setCurrentData(cur);
        setPrevData(prev);
        setLoading(false);
      });
    } else {
      // Quarterly
      const qStart = qInfo?.startMonth || '2026-10';
      fetch(`/api/dashboard?date=${qStart}-28`)
        .then((r) => r.json())
        .then((j) => {
          setCurrentData(j);
          setPrevData(null);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [reportType, selectedMonth, prevMonth, qInfo]);

  // Current Summary
  const curSummary = currentData?.currentPeriodSummary;
  const prevSummary = prevData?.currentPeriodSummary;

  const totalElec = curSummary?.totalElectricityConsumption ?? 0;
  const costElec = curSummary?.totalElectricityCost ?? 0;

  const totalWater = curSummary?.totalWaterConsumption ?? 0;
  const costWater = curSummary?.totalWaterCost ?? 0;

  const totalGas = curSummary?.totalGasConsumption ?? 0;
  const costGas = curSummary?.totalGasCost ?? 0;

  const totalFuel = curSummary?.totalFuel ?? 0;
  const costFuel = curSummary?.totalFuelCost ?? 0;

  const totalOpex = curSummary?.totalOpex ?? 0;
  const totalCost = (costElec + costWater + costGas + costFuel + totalOpex) || (curSummary?.grandTotalCost ?? 0);

  // Prev Summary comparisons
  const prevTotalCost = prevSummary
    ? ((prevSummary.totalElectricityCost ?? 0) +
       (prevSummary.totalWaterCost ?? 0) +
       (prevSummary.totalGasCost ?? 0) +
       (prevSummary.totalFuelCost ?? 0) +
       (prevSummary.totalOpex ?? 0)) || (prevSummary.grandTotalCost ?? 0)
    : 0;

  const costDiff = totalCost - prevTotalCost;
  const costPctDiff = prevTotalCost > 0 ? ((totalCost - prevTotalCost) / prevTotalCost) * 100 : null;

  // Utilities differences
  const elecPctDiff = (prevSummary?.totalElectricityConsumption ?? 0) > 0
    ? ((totalElec - prevSummary!.totalElectricityConsumption) / prevSummary!.totalElectricityConsumption) * 100
    : null;

  const waterPctDiff = (prevSummary?.totalWaterConsumption ?? 0) > 0
    ? ((totalWater - prevSummary!.totalWaterConsumption) / prevSummary!.totalWaterConsumption) * 100
    : null;

  const fuelPctDiff = (prevSummary?.totalFuel ?? 0) > 0
    ? ((totalFuel - prevSummary!.totalFuel) / prevSummary!.totalFuel) * 100
    : null;

  const opexPctDiff = (prevSummary?.totalOpex ?? 0) > 0
    ? ((totalOpex - prevSummary!.totalOpex) / prevSummary!.totalOpex) * 100
    : null;

  const activePeriodLabel = reportType === 'monthly' ? (monthInfo?.label || selectedMonth) : (qInfo?.label || selectedQuarter);

  return (
    <div className="bg-gray-50 min-h-screen pb-28">
      <Header
        badge="Executive Reports · Synced"
        badgeColor="bg-blue-100 text-blue-700"
        title="Laporan Eksekutif Operasional"
        subtitle="Analisis beban utilitas & operasional bulanan serta kuartal villa."
        rightElement={
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-full text-xs font-bold shadow-md shadow-blue-100 active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Cetak PDF
          </button>
        }
      />

      <main className="max-w-md mx-auto px-4 pt-5">
        {/* Toggle Mode: Month to Month vs Kuartal */}
        <div className="bg-gray-200/80 p-1 rounded-2xl flex gap-1 mb-4">
          <button
            type="button"
            onClick={() => setReportType('monthly')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              reportType === 'monthly'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 Bulanan (Month to Month)
          </button>
          <button
            type="button"
            onClick={() => setReportType('quarterly')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              reportType === 'quarterly'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Pilihan Kuartal (Q1 - Q4)
          </button>
        </div>

        {/* Period Dropdown Selector */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3.5 py-2.5 shadow-sm flex-1">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-600 shrink-0">
              <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" />
            </svg>
            {reportType === 'monthly' ? (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold text-gray-900 bg-transparent focus:outline-none flex-1"
              >
                {monthsList.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} {m.value === getCurrentMonthWita() ? '(Bulan Ini)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="text-xs font-bold text-gray-900 bg-transparent focus:outline-none flex-1"
              >
                {quarters.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-2xl px-3 py-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-green-700">Tersinkron</span>
          </div>
        </div>

        {/* MONTH TO MONTH COMPARISON HERO CARD (Visible in Monthly Mode) */}
        {reportType === 'monthly' && (
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-2xl p-4 text-white shadow-lg mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                Perbandingan Month-to-Month
              </span>
              {costPctDiff != null && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    costPctDiff > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {costPctDiff > 0 ? `▲ +${costPctDiff.toFixed(1)}%` : `▼ ${costPctDiff.toFixed(1)}%`} vs Bulan Lalu
                </span>
              )}
            </div>

            <div className="text-2xl font-black text-white mt-1">
              {formatRupiah(totalCost)}
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[9px] text-gray-300 block uppercase font-bold">
                  Bulan {monthInfo?.label || selectedMonth}
                </span>
                <span className="font-extrabold text-white text-sm">
                  {formatRupiah(totalCost)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-300 block uppercase font-bold">
                  Bulan Lalu ({prevMonthInfo?.label || prevMonth})
                </span>
                <span className="font-extrabold text-blue-200 text-sm">
                  {prevTotalCost > 0 ? formatRupiah(prevTotalCost) : 'Rp 0 (Belum ada log)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* KPI Metrics */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard
              label="Total Listrik (PLN)"
              value={formatDecimal(totalElec, 1)}
              unit="kWh"
              costRupiah={costElec}
              diffPercent={reportType === 'monthly' ? elecPctDiff : null}
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
              }
            />
            <MetricCard
              label="Total Air Bersih"
              value={formatDecimal(totalWater, 1)}
              unit="m³"
              costRupiah={costWater}
              diffPercent={reportType === 'monthly' ? waterPctDiff : null}
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
                  <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
                </svg>
              }
            />
            <MetricCard
              label="Bahan Bakar Solar"
              value={formatDecimal(totalFuel, 0)}
              unit="Liter"
              costRupiah={costFuel}
              diffPercent={reportType === 'monthly' ? fuelPctDiff : null}
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-500">
                  <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6.5V18H5V5h8v13H8z" />
                </svg>
              }
            />
            <MetricCard
              label="Kasir Operasional (Opex)"
              value={formatRupiah(totalOpex)}
              diffPercent={reportType === 'monthly' ? opexPctDiff : null}
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-500">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Cost Distribution Breakdown */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-gray-900">Distribusi Biaya Operasional</h3>
            <span className="text-[10px] font-bold text-gray-400">{activePeriodLabel}</span>
          </div>

          {[
            { label: 'Listrik PLN', value: costElec, total: totalCost, color: 'bg-yellow-400' },
            { label: 'Air Bersih', value: costWater, total: totalCost, color: 'bg-blue-400' },
            { label: 'Gas Villa', value: costGas, total: totalCost, color: 'bg-teal-400' },
            { label: 'Solar Genset', value: costFuel, total: totalCost, color: 'bg-orange-400' },
            { label: 'Kasir Opex', value: totalOpex, total: totalCost, color: 'bg-purple-400' },
          ].map((item) => {
            const pct = item.total > 0 ? (item.value / item.total) * 100 : 0;
            return (
              <div key={item.label} className="py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                  <span className="text-xs font-black text-gray-900">
                    {formatRupiah(item.value)} <span className="text-[10px] text-gray-400 font-normal">({pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Cost Summary Card */}
        <div className="bg-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-200 mb-5">
          <div className="text-blue-100 text-xs font-semibold mb-1">
            Total Pengeluaran Operasional — {activePeriodLabel}
          </div>
          <div className="text-3xl font-black text-white">{formatRupiah(totalCost)}</div>
          <div className="text-blue-200 text-[10px] mt-1 font-medium">
            Gabungan seluruh energi utilitas + beban kasir operasional villa
          </div>
          <button
            onClick={() => window.print()}
            className="mt-3 w-full h-10 bg-white text-blue-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
            </svg>
            Cetak / Download Laporan Resmi
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
