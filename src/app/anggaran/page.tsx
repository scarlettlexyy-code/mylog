'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

const months = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2026, i, 1);
  return {
    value: `2026-${String(i + 1).padStart(2, '0')}`,
    label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
});

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const CategoryBar = ({
  label, actual, budget, unit, color, icon,
}: {
  label: string; actual: number; budget: number; unit: string; color: string; icon: React.ReactNode;
}) => {
  const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
  const isOver = pct >= 85;
  const formatVal = (n: number) =>
    unit === 'IDR'
      ? `Rp ${n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : Math.round(n / 1000) + 'K'}`
      : `${n.toLocaleString()} ${unit}`;

  return (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color.replace('bg-', 'bg-').replace('-400', '-50').replace('-500', '-50')}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900">{label}</span>
            <span className={`text-xs font-black ${isOver ? 'text-red-500' : 'text-gray-600'}`}>
              {Math.round(pct)}%
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-gray-400">{formatVal(actual)} / {formatVal(budget)}</span>
          </div>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-11">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default function AnggaranPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [elecB, setElecB] = useState('');
  const [waterB, setWaterB] = useState('');
  const [gasB, setGasB] = useState('');
  const [fuelB, setFuelB] = useState('');
  const [opexB, setOpexB] = useState('');
  const [mode, setMode] = useState<'sum_categories' | 'manual_total'>('sum_categories');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/budgets?month=${month}`)
      .then((r) => r.json())
      .then((j) => {
        setBudget(j.budget || null);
        if (j.budget) {
          setElecB(String(j.budget.electricityBudget || ''));
          setWaterB(String(j.budget.waterBudget || ''));
          setGasB(String(j.budget.gasBudget || ''));
          setFuelB(String(j.budget.fuelBudget || ''));
          setOpexB(String(j.budget.opexBudget || ''));
          setMode(j.budget.mode || 'sum_categories');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month]);

  const totalBudget =
    (parseFloat(elecB) || 0) +
    (parseFloat(waterB) || 0) +
    (parseFloat(gasB) || 0) +
    (parseFloat(fuelB) || 0) +
    (parseFloat(opexB) || 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          mode,
          electricityBudget: parseFloat(elecB) || 0,
          waterBudget: parseFloat(waterB) || 0,
          gasBudget: parseFloat(gasB) || 0,
          fuelBudget: parseFloat(fuelB) || 0,
          opexBudget: parseFloat(opexB) || 0,
          totalBudget,
          userEmail: 'supervisor@agranusavilla.com',
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const monthLabel = months.find((m) => m.value === month)?.label || month;

  const categories = [
    {
      label: 'Electricity',
      actual: budget?.electricityBudget ?? 0,
      budget: parseFloat(elecB) || 0,
      unit: 'IDR',
      color: 'bg-yellow-400',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>,
    },
    {
      label: 'Water',
      actual: budget?.waterBudget ?? 0,
      budget: parseFloat(waterB) || 0,
      unit: 'IDR',
      color: 'bg-blue-400',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>,
    },
    {
      label: 'Gas',
      actual: budget?.gasBudget ?? 0,
      budget: parseFloat(gasB) || 0,
      unit: 'IDR',
      color: 'bg-teal-400',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-teal-500"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2-1.13 0-1.9.16-2.53.33C14.28 11.86 17 10 17 8z"/></svg>,
    },
    {
      label: 'Solar Fuel',
      actual: budget?.fuelBudget ?? 0,
      budget: parseFloat(fuelB) || 0,
      unit: 'IDR',
      color: 'bg-orange-400',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-500"><path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6.5V18H5V5h8v13H8z"/></svg>,
    },
    {
      label: 'Operational Expense',
      actual: budget?.opexBudget ?? 0,
      budget: parseFloat(opexB) || 0,
      unit: 'IDR',
      color: 'bg-purple-400',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-500"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>,
    },
  ];

  const formatRp = (n: number) =>
    n >= 1_000_000 ? `Rp ${(n / 1_000_000).toFixed(1)}M` : `Rp ${Math.round(n / 1000)}K`;

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <Header
        badge="Fiscal Control · Live Feed"
        badgeColor="bg-green-100 text-green-700"
        title="Operational Budget & Expenses"
        subtitle="Monthly allocation tracker for all utility & cost categories."
        rightElement={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-full text-xs font-bold shadow-md shadow-blue-100 disabled:opacity-60 active:scale-95 transition-transform"
          >
            {saving ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? '✅' : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            )}
            {saved ? 'Saved!' : '+ Save Budget'}
          </button>
        }
      />

      <main className="max-w-md mx-auto px-4 pt-5">
        {/* Month Selector */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-2 shadow-sm flex-1">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
              <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
            </svg>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-sm font-bold text-gray-900 bg-transparent focus:outline-none flex-1"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Monthly Budget</div>
            <div className="text-xl font-black text-gray-900">{formatRp(totalBudget)}</div>
            <div className="text-[10px] text-blue-500 font-semibold mt-1">Allocated for {monthLabel.split(' ')[0]}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Categories</div>
            <div className="text-xl font-black text-gray-900">5</div>
            <div className="text-[10px] text-green-500 font-semibold mt-1">Active cost centers</div>
          </div>
        </div>

        {/* Category Allocation Input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900">Category Allocation</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Set monthly budget per category (IDR)</p>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">5 Categories</span>
          </div>

          {[
            { label: 'Electricity', value: elecB, onChange: setElecB, color: 'focus:border-yellow-400 focus:ring-yellow-100' },
            { label: 'Water', value: waterB, onChange: setWaterB, color: 'focus:border-blue-400 focus:ring-blue-100' },
            { label: 'Gas', value: gasB, onChange: setGasB, color: 'focus:border-teal-400 focus:ring-teal-100' },
            { label: 'Solar Fuel', value: fuelB, onChange: setFuelB, color: 'focus:border-orange-400 focus:ring-orange-100' },
            { label: 'Operational Expense', value: opexB, onChange: setOpexB, color: 'focus:border-purple-400 focus:ring-purple-100' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-xs font-semibold text-gray-600 w-32 shrink-0">{item.label}</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => item.onChange(e.target.value)}
                  placeholder="0"
                  className={`w-full h-10 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 text-sm font-semibold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 transition-all ${item.color}`}
                />
              </div>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">Total Budget</span>
            <span className="text-sm font-black text-blue-600">{formatRp(totalBudget)}</span>
          </div>
        </div>

        {/* Category Progress Bars */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-gray-900">Allocation Progress</h3>
            <span className="text-[10px] text-gray-400">{monthLabel}</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            categories.map((cat) => (
              <CategoryBar key={cat.label} {...cat} />
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
