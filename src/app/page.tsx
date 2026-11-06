'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getMonth() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getToday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

const KpiCard = ({
  label, value, unit, change, color, icon,
}: {
  label: string; value: string; unit: string; change?: string; color: string; icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      {change && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
        }`}>
          {change}
        </span>
      )}
    </div>
    <div>
      <div className="text-2xl font-black text-gray-900 leading-tight">{value}</div>
      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{unit}</div>
    </div>
    <div className="text-xs text-gray-500 font-medium">{label}</div>
  </div>
);

const CategoryBar = ({
  label, actual, budget, color,
}: {
  label: string; actual: number; budget: number; color: string;
}) => {
  const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
  const over = pct >= 85;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className={`text-xs font-bold ${over ? 'text-red-500' : 'text-gray-500'}`}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const ActivityItem = ({
  icon, title, subtitle, time, tag, tagColor,
}: {
  icon: React.ReactNode; title: string; subtitle: string; time: string; tag?: string; tagColor?: string;
}) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
      <div className="text-xs text-gray-400">{subtitle}</div>
    </div>
    <div className="flex flex-col items-end gap-1 shrink-0">
      <span className="text-[10px] text-gray-400">{time}</span>
      {tag && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
      )}
    </div>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/dashboard?date=${today}`)
      .then((r) => r.json())
      .then((j) => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Extract values from API data
  const summary = data?.currentPeriodSummary;
  const totalElec = summary?.totalElectricityConsumption ?? 0;
  const totalWater = summary?.totalWaterConsumption ?? 0;
  const totalGas = summary?.totalGasConsumption ?? 0;
  const totalFuel = summary?.totalFuel ?? 0;
  const totalOpex = summary?.totalOpex ?? 0;

  const budget = data?.budget;
  const elecBudget = budget?.electricityBudget ?? 1;
  const waterBudget = budget?.waterBudget ?? 1;
  const gasBudget = budget?.gasBudget ?? 1;
  const fuelBudget = budget?.fuelBudget ?? 1;
  const opexBudget = budget?.opexBudget ?? 1;

  const recentReadings: any[] = data?.recentReadings ?? [];

  const formatNum = (n: number, dec = 0) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(dec);

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <Header />

      <main className="max-w-md mx-auto px-4 pt-4">
        {/* Greeting */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">{getToday()}</p>
              <h2 className="text-xl font-black text-gray-900 mt-0.5">
                {getGreeting()}, Supervisor 👋
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Keep Agranusa Signature Villa running seamlessly today.
              </p>
            </div>
            <Link
              href="/input-meter"
              prefetch={true}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-md shadow-blue-200 active:scale-95 transition-transform shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
              </svg>
              Quick Log
            </Link>
          </div>

          {/* Date pill */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-blue-500">
                <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
              </svg>
              <span className="text-xs font-semibold text-gray-700">{getMonth()}</span>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <KpiCard
              label="Electricity This Month"
              value={formatNum(totalElec, 1)}
              unit="kWh"
              change={totalElec > 0 ? '+' + formatNum(totalElec, 0) : undefined}
              color="bg-yellow-50"
              icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>}
            />
            <KpiCard
              label="Water This Month"
              value={formatNum(totalWater, 1)}
              unit="m³"
              color="bg-blue-50"
              icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>}
            />
            <KpiCard
              label="Operational Expense"
              value={totalOpex >= 1_000_000 ? `${(totalOpex / 1_000_000).toFixed(1)}M` : `${Math.round(totalOpex / 1000)}K`}
              unit="IDR"
              color="bg-purple-50"
              icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-500"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>}
            />
            <KpiCard
              label="Solar Fuel This Month"
              value={formatNum(totalFuel, 0)}
              unit="Liters"
              color="bg-orange-50"
              icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-500"><path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6.5V18H5V5h8v13H8z"/></svg>}
            />
          </div>
        )}

        {/* Budget Utilization */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900">Budget Utilization</h3>
              <p className="text-[10px] text-gray-400">Monthly allocation vs actual spend</p>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
              {budget ? '5 Categories' : 'Not Set'}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <CategoryBar label="Electricity (kWh)" actual={totalElec} budget={elecBudget / 1450} color="bg-yellow-400" />
            <CategoryBar label="Water (m³)" actual={totalWater} budget={waterBudget / 7500} color="bg-blue-400" />
            <CategoryBar label="Gas (m³)" actual={totalGas} budget={gasBudget / 15000} color="bg-teal-400" />
            <CategoryBar label="Solar Fuel (Liters)" actual={totalFuel} budget={fuelBudget / 10000} color="bg-orange-400" />
            <CategoryBar label="Operational Expense" actual={totalOpex} budget={opexBudget} color="bg-purple-400" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-gray-900">Recent Log Entries</h3>
            <Link href="/audit" className="text-xs font-semibold text-blue-600">
              View All
            </Link>
          </div>

          {recentReadings.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-300">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                </svg>
              </div>
              <p className="text-xs text-gray-400 font-medium">No entries yet</p>
              <p className="text-[10px] text-gray-300 mt-1">Start logging daily meter readings</p>
              <Link href="/input-meter" className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                Log Now →
              </Link>
            </div>
          ) : (
            recentReadings.slice(0, 5).map((r: any, i: number) => (
              <ActivityItem
                key={i}
                icon={
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
                    <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                }
                title={`Meter Reading — ${r.date}`}
                subtitle={`Elec: ${r.electricityMeter ?? '—'} kWh · Water: ${r.waterMeter ?? '—'} m³`}
                time={r.recordedAt ? new Date(r.recordedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                tag="Logged"
                tagColor="bg-green-50 text-green-600"
              />
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
