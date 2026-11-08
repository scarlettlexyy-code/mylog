'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { formatRupiah, formatThousands, parseThousands } from '@/lib/calculations';

// Indonesian month labels
const months = [
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

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const CategoryBar = ({
  label, actual, budget, color, icon,
}: {
  label: string; actual: number; budget: number; color: string; icon: React.ReactNode;
}) => {
  const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
  const isOver = pct >= 85;

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900">{label}</span>
            <span className={`text-xs font-black ${isOver ? 'text-red-500' : 'text-gray-700'}`}>
              {Math.round(pct)}%
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[11px] font-semibold text-gray-500">
              Terpakai: {formatRupiah(actual)} / Pagu: {formatRupiah(budget)}
            </span>
          </div>
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden ml-11">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default function AnggaranPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [budget, setBudget] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state (displayed with thousand separator e.g. "15.000.000")
  const [elecB, setElecB] = useState('');
  const [waterB, setWaterB] = useState('');
  const [gasB, setGasB] = useState('');
  const [fuelB, setFuelB] = useState('');
  const [opexB, setOpexB] = useState('');
  const [mode, setMode] = useState<'sum_categories' | 'manual_total'>('sum_categories');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Mode: isEditing false means view/locked mode with "Edit Anggaran" button
  const [isEditing, setIsEditing] = useState(false);
  const [hasSavedBudget, setHasSavedBudget] = useState(false);

  // Fetch budget and dashboard actuals for the selected month
  useEffect(() => {
    let active = true;

    // 1. Check local storage first for zero delay & instant persistence
    let userHasCustomBudget = false;
    try {
      const savedUser = localStorage.getItem(`mylog_user_budget_${month}`) || localStorage.getItem(`mylog_budget_${month}`);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setBudget(parsed);
        setElecB(formatThousands(parsed.electricityBudget || ''));
        setWaterB(formatThousands(parsed.waterBudget || ''));
        setGasB(formatThousands(parsed.gasBudget || ''));
        setFuelB(formatThousands(parsed.fuelBudget || ''));
        setOpexB(formatThousands(parsed.opexBudget || ''));
        setMode(parsed.mode || 'sum_categories');
        setHasSavedBudget(true);
        setIsEditing(false);
        userHasCustomBudget = true;
      }
    } catch (e) {}

    // Only show spinner if we have no local cache at all
    if (!userHasCustomBudget) {
      setLoading(true);
    }

    Promise.all([
      fetch(`/api/budgets?month=${month}`).then((r) => r.json()).catch(() => null),
      fetch(`/api/dashboard?date=${month}-01`).then((r) => r.json()).catch(() => null),
    ]).then(([bData, dData]) => {
      if (!active) return;

      const serverBudget = bData?.budget;
      if (serverBudget && serverBudget.isConfigured) {
        let shouldUseServer = true;
        try {
          const localStr = localStorage.getItem(`mylog_user_budget_${month}`);
          if (localStr) {
            const localObj = JSON.parse(localStr);
            const localTime = new Date(localObj.updatedAt || 0).getTime();
            const serverTime = new Date(serverBudget.updatedAt || 0).getTime();
            if (localTime > serverTime) {
              // Local user edit is newer! Sync local to server in background, do NOT overwrite!
              shouldUseServer = false;
              fetch('/api/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localObj),
              }).catch(() => {});
            }
          }
        } catch (e) {}

        if (shouldUseServer) {
          setBudget(serverBudget);
          setElecB(formatThousands(serverBudget.electricityBudget || ''));
          setWaterB(formatThousands(serverBudget.waterBudget || ''));
          setGasB(formatThousands(serverBudget.gasBudget || ''));
          setFuelB(formatThousands(serverBudget.fuelBudget || ''));
          setOpexB(formatThousands(serverBudget.opexBudget || ''));
          setMode(serverBudget.mode || 'sum_categories');
          setHasSavedBudget(true);
          setIsEditing(false);
          try {
            localStorage.setItem(`mylog_user_budget_${month}`, JSON.stringify(serverBudget));
            localStorage.setItem(`mylog_budget_${month}`, JSON.stringify(serverBudget));
          } catch (e) {}
        }
      } else {
        // Server has no configured budget
        // If we have a local user budget, sync it to server!
        try {
          const localStr = localStorage.getItem(`mylog_user_budget_${month}`);
          if (localStr) {
            const localObj = JSON.parse(localStr);
            fetch('/api/budgets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localObj),
            }).catch(() => {});
          } else {
            setBudget(null);
            setElecB('');
            setWaterB('');
            setGasB('');
            setFuelB('');
            setOpexB('');
            setHasSavedBudget(false);
            setIsEditing(true);
          }
        } catch (e) {
          if (!userHasCustomBudget) {
            setHasSavedBudget(false);
            setIsEditing(true);
          }
        }
      }

      setDashboardData(dData);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [month]);

  // Total budget calculated live from parsed integer values
  const totalBudget =
    parseThousands(elecB) +
    parseThousands(waterB) +
    parseThousands(gasB) +
    parseThousands(fuelB) +
    parseThousands(opexB);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const payload = {
        month,
        mode,
        electricityBudget: parseThousands(elecB),
        waterBudget: parseThousands(waterB),
        gasBudget: parseThousands(gasB),
        fuelBudget: parseThousands(fuelB),
        opexBudget: parseThousands(opexB),
        totalBudget,
        isConfigured: true,
        updatedAt: new Date().toISOString(),
        userEmail: 'supervisor@agranusavilla.com',
      };

      // 1. Immediately store to localStorage for permanent client survival
      try {
        localStorage.setItem(`mylog_user_budget_${month}`, JSON.stringify(payload));
        localStorage.setItem(`mylog_budget_${month}`, JSON.stringify(payload));
      } catch (e) {}

      // 2. Send to API and Google Sheets
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success || res.ok) {
        setSaved(true);
        setHasSavedBudget(true);
        setIsEditing(false);
        setBudget(json.budget || payload);
        setSaveMessage('✅ Pagu anggaran bulan ini berhasil disimpan permanen ke Google Sheets!');
        setTimeout(() => {
          setSaved(false);
          setSaveMessage('');
        }, 5000);
      } else {
        setHasSavedBudget(true);
        setIsEditing(false);
        setSaveMessage('Pagu tersimpan di perangkat offline (Google Sheets merespon: ' + (json.error || 'tertunda') + ')');
      }
    } catch {
      setHasSavedBudget(true);
      setIsEditing(false);
      setSaveMessage('Pagu tersimpan aman di perangkat lokal.');
    } finally {
      setSaving(false);
    }
  };

  const monthLabel = months.find((m) => m.value === month)?.label || month;

  // Actual spent numbers from dashboard summary
  const summary = dashboardData?.currentPeriodSummary;
  const spentElec = summary?.totalElectricityCost ?? (budget?.categories?.electricity?.spent ?? 0);
  const spentWater = summary?.totalWaterCost ?? (budget?.categories?.water?.spent ?? 0);
  const spentGas = summary?.totalGasCost ?? (budget?.categories?.gas?.spent ?? 0);
  const spentFuel = summary?.totalFuelCost ?? (budget?.categories?.fuel?.spent ?? 0);
  const spentOpex = summary?.totalOpex ?? (budget?.categories?.opex?.spent ?? 0);
  const totalSpent = spentElec + spentWater + spentGas + spentFuel + spentOpex;

  const categories = [
    {
      label: 'Listrik (PLN)',
      actual: spentElec,
      budget: parseThousands(elecB),
      color: 'bg-yellow-500',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-600"><path d="M7 2v11h3v9l7-12h-4l4-8z" /></svg>,
    },
    {
      label: 'Air Bersih',
      actual: spentWater,
      budget: parseThousands(waterB),
      color: 'bg-blue-500',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-600"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" /></svg>,
    },
    {
      label: 'Gas',
      actual: spentGas,
      budget: parseThousands(gasB),
      color: 'bg-teal-500',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-teal-600"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2-1.13 0-1.9.16-2.53.33C14.28 11.86 17 10 17 8z" /></svg>,
    },
    {
      label: 'Bahan Bakar Solar',
      actual: spentFuel,
      budget: parseThousands(fuelB),
      color: 'bg-orange-500',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-600"><path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6.5V18H5V5h8v13H8z" /></svg>,
    },
    {
      label: 'Kasir Operasional',
      actual: spentOpex,
      budget: parseThousands(opexB),
      color: 'bg-purple-500',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-600"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" /></svg>,
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-28">
      <Header
        badge="Manajemen Anggaran Bulanan"
        badgeColor="bg-green-100 text-green-700"
        title="Pagu Anggaran & Pengeluaran"
        subtitle="Alokasi anggaran biaya operasional per kategori (Rupiah)."
        rightElement={
          hasSavedBudget && !isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 bg-white border border-gray-300 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-blue-50 active:scale-95 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
              Edit Anggaran
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {hasSavedBudget && (
                <button
                  type="button"
                  onClick={() => {
                    if (budget) {
                      setElecB(formatThousands(budget.electricityBudget || ''));
                      setWaterB(formatThousands(budget.waterBudget || ''));
                      setGasB(formatThousands(budget.gasBudget || ''));
                      setFuelB(formatThousands(budget.fuelBudget || ''));
                      setOpexB(formatThousands(budget.opexBudget || ''));
                    }
                    setIsEditing(false);
                  }}
                  className="px-2.5 py-1.5 rounded-full text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow-md shadow-blue-200 disabled:opacity-60 active:scale-95 transition-transform"
              >
                {saving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                )}
                {saving ? 'Menyimpan...' : hasSavedBudget ? 'Simpan Perubahan' : 'Simpan Anggaran'}
              </button>
            </div>
          )
        }
      />

      <main className="max-w-md mx-auto px-4 pt-5">
        {/* Month Selector */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2.5 shadow-sm flex-1">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-600 shrink-0">
              <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" />
            </svg>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-sm font-bold text-gray-900 bg-transparent focus:outline-none flex-1 cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {loading && <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
          </div>
        </div>

        {/* Message Banner */}
        {saveMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-green-50 border border-green-200 text-xs font-bold text-green-800 animate-fadeIn">
            {saveMessage}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Pagu Bulan Ini</div>
            <div className="text-xl font-black text-gray-900">{formatRupiah(totalBudget)}</div>
            <div className="text-[10px] text-blue-600 font-semibold mt-1">Alokasi {monthLabel}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Realisasi Pengeluaran</div>
            <div className="text-xl font-black text-blue-700">{formatRupiah(totalSpent)}</div>
            <div className="text-[10px] text-green-600 font-semibold mt-1">
              Sisa: {formatRupiah(Math.max(0, totalBudget - totalSpent))}
            </div>
          </div>
        </div>

        {/* Category Allocation Input Form with Automatic Thousands Dots */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900">Alokasi Pagu Per Kategori</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {isEditing ? 'Ketik angka rupiah (titik ribuan otomatis)' : 'Pagu anggaran aktif (klik "Edit Anggaran" untuk mengubah)'}
              </p>
            </div>
            {hasSavedBudget && !isEditing ? (
              <span className="text-[10px] font-extrabold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Pagu Terkunci
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                Mode Edit
              </span>
            )}
          </div>

          {[
            {
              label: 'Listrik (PLN)',
              value: elecB,
              onChange: (v: string) => setElecB(formatThousands(v)),
              color: 'focus:border-yellow-500 focus:ring-yellow-100',
            },
            {
              label: 'Air Bersih',
              value: waterB,
              onChange: (v: string) => setWaterB(formatThousands(v)),
              color: 'focus:border-blue-500 focus:ring-blue-100',
            },
            {
              label: 'Gas',
              value: gasB,
              onChange: (v: string) => setGasB(formatThousands(v)),
              color: 'focus:border-teal-500 focus:ring-teal-100',
            },
            {
              label: 'Solar Genset',
              value: fuelB,
              onChange: (v: string) => setFuelB(formatThousands(v)),
              color: 'focus:border-orange-500 focus:ring-orange-100',
            },
            {
              label: 'Kasir Operasional',
              value: opexB,
              onChange: (v: string) => setOpexB(formatThousands(v)),
              color: 'focus:border-purple-500 focus:ring-purple-100',
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 mb-3 last:mb-0">
              <span className="text-xs font-bold text-gray-700 w-32 shrink-0">{item.label}</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  readOnly={!isEditing}
                  value={item.value}
                  onChange={(e) => item.onChange(e.target.value)}
                  placeholder="0"
                  className={`w-full h-11 border rounded-xl pl-9 pr-3 text-sm font-bold transition-all ${
                    !isEditing
                      ? 'bg-gray-100/70 border-gray-200 text-gray-700 cursor-default select-all'
                      : `bg-white border-gray-200 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 ${item.color}`
                  }`}
                />
              </div>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800">Total Anggaran Gabungan</span>
            <span className="text-base font-black text-blue-700">{formatRupiah(totalBudget)}</span>
          </div>
        </div>

        {/* Category Progress Bars */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-gray-900">Perbandingan vs Realisasi</h3>
            <span className="text-[10px] text-gray-400 font-semibold">{monthLabel}</span>
          </div>
          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            categories.map((cat) => <CategoryBar key={cat.label} {...cat} />)
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
