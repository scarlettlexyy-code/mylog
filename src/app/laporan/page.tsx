'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

function getQuarters() {
  const qs = [];
  for (let y = 2026; y <= 2027; y++) {
    for (let q = 1; q <= 4; q++) {
      const startM = (q - 1) * 3 + 1;
      const endM = q * 3;
      qs.push({
        value: `${y}-Q${q}`,
        label: `Q${q} ${y}`,
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

const MetricCard = ({
  label, value, unit, change, changeType = 'neutral', icon,
}: {
  label: string; value: string; unit?: string; change?: string; changeType?: 'up' | 'down' | 'neutral'; icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
    <div className="flex items-center justify-between mb-2">
      <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      {change && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          changeType === 'up' ? 'bg-green-50 text-green-600' :
          changeType === 'down' ? 'bg-red-50 text-red-500' :
          'bg-gray-100 text-gray-500'
        }`}>
          {change}
        </span>
      )}
    </div>
    <div className="text-xl font-black text-gray-900">{value}</div>
    {unit && <div className="text-[10px] text-gray-400 font-semibold">{unit}</div>}
    <div className="text-xs text-gray-500 font-medium mt-1">{label}</div>
  </div>
);

const PerformanceRow = ({
  label, value, target, unit, color,
}: {
  label: string; value: string; target: string; unit?: string; color: string;
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
      <span className="text-xs font-semibold text-gray-700 truncate">{label}</span>
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-[10px] text-gray-400">Target: {target}{unit}</span>
      <span className="text-xs font-black text-gray-900">{value}{unit}</span>
    </div>
  </div>
);

export default function LaporanPage() {
  const [quarter, setQuarter] = useState(getCurrentQuarter());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const quarters = getQuarters();
  const qInfo = quarters.find((q) => q.value === quarter);

  useEffect(() => {
    if (!qInfo) return;
    setLoading(true);
    // Fetch dashboard data for the period
    fetch(`/api/dashboard?date=${qInfo.startMonth}-01`)
      .then((r) => r.json())
      .then((j) => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [quarter]);

  const summary = data?.currentPeriodSummary;
  const totalElec = summary?.totalElectricityConsumption ?? 0;
  const totalWater = summary?.totalWaterConsumption ?? 0;
  const totalGas = summary?.totalGasConsumption ?? 0;
  const totalFuel = summary?.totalFuel ?? 0;
  const totalOpex = summary?.totalOpex ?? 0;
  const totalCost = data?.currentPeriodCost?.total ?? 0;

  const fmtRp = (n: number) =>
    n >= 1_000_000 ? `Rp ${(n / 1_000_000).toFixed(2)}M` : `Rp ${Math.round(n / 1000)}K`;

  const dossiers = [
    {
      title: 'Monthly Energy Report',
      subtitle: `${qInfo?.label} · Electricity, Water, Gas`,
      size: 'Full P&L · PDF',
      color: 'bg-blue-50',
      icon: '⚡',
    },
    {
      title: 'Fuel & Genset Report',
      subtitle: `${qInfo?.label} · Solar Consumption Log`,
      size: '8 pages · PDF',
      color: 'bg-orange-50',
      icon: '⛽',
    },
    {
      title: 'Operational Expense Report',
      subtitle: `${qInfo?.label} · Daily Opex Summary`,
      size: '12 pages · PDF',
      color: 'bg-purple-50',
      icon: '💰',
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <Header
        badge="Executive Telemetry · Real-Time Synced"
        badgeColor="bg-blue-100 text-blue-700"
        title="Executive Performance Reports"
        subtitle="Monthly & quarterly management reporting for villa operations."
        rightElement={
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-full text-xs font-bold shadow-md shadow-blue-100 active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Export PDF
          </button>
        }
      />

      <main className="max-w-md mx-auto px-4 pt-5">
        {/* Quarter Selector */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-2 shadow-sm flex-1">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500 shrink-0">
              <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
            </svg>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="text-sm font-bold text-gray-900 bg-transparent focus:outline-none flex-1"
            >
              {quarters.map((q) => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-green-700">Finalized</span>
          </div>
        </div>

        {/* KPI Metrics */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard
              label="Total Electricity"
              value={totalElec.toFixed(1)}
              unit="kWh consumed"
              change={totalElec > 0 ? 'Recorded' : 'No data'}
              changeType={totalElec > 0 ? 'up' : 'neutral'}
              icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>}
            />
            <MetricCard
              label="Total Water"
              value={totalWater.toFixed(1)}
              unit="m³ consumed"
              icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>}
            />
            <MetricCard
              label="Total Solar Fuel"
              value={totalFuel.toFixed(0)}
              unit="Liters used"
              icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-500"><path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6.5V18H5V5h8v13H8z"/></svg>}
            />
            <MetricCard
              label="Operational Expense"
              value={fmtRp(totalOpex)}
              unit="Total spending IDR"
              icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-500"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>}
            />
          </div>
        )}

        {/* Performance Table */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-gray-900">Utility Performance</h3>
            <span className="text-[10px] text-gray-400 font-semibold">SLA Target — {qInfo?.label}</span>
          </div>
          <PerformanceRow label="Electricity Monitoring" value="✓" target="Daily" color="bg-yellow-400" />
          <PerformanceRow label="Water Monitoring" value="✓" target="Daily" color="bg-blue-400" />
          <PerformanceRow label="Gas Monitoring" value="✓" target="Daily" color="bg-teal-400" />
          <PerformanceRow label="Solar Fuel Log" value="✓" target="Daily" color="bg-orange-400" />
          <PerformanceRow label="Opex Recording" value="✓" target="Daily" color="bg-purple-400" />
        </div>

        {/* Consumption Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-gray-900">Cost Distribution</h3>
            <span className="text-[10px] text-gray-400">{qInfo?.label}</span>
          </div>
          {[
            { label: 'Electricity', value: totalElec, unit: 'kWh', color: 'bg-yellow-400', pct: totalElec > 0 ? 80 : 0 },
            { label: 'Water', value: totalWater, unit: 'm³', color: 'bg-blue-400', pct: totalWater > 0 ? 60 : 0 },
            { label: 'Gas', value: totalGas, unit: 'm³', color: 'bg-teal-400', pct: totalGas > 0 ? 40 : 0 },
            { label: 'Fuel', value: totalFuel, unit: 'L', color: 'bg-orange-400', pct: totalFuel > 0 ? 55 : 0 },
            { label: 'Opex', value: totalOpex / 1000, unit: 'K IDR', color: 'bg-purple-400', pct: totalOpex > 0 ? 70 : 0 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 mb-2.5 last:mb-0">
              <span className="text-xs font-semibold text-gray-600 w-20 shrink-0">{item.label}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-900 w-20 text-right shrink-0">
                {item.value.toFixed(1)} {item.unit}
              </span>
            </div>
          ))}
        </div>

        {/* Executive Dossiers */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-gray-900">Executive Dossiers</h3>
            <span className="text-[10px] text-gray-400">Archived reports</span>
          </div>
          {dossiers.map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${d.color} shrink-0`}>
                {d.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate">{d.title}</div>
                <div className="text-[10px] text-gray-400">{d.subtitle}</div>
                <div className="text-[10px] text-gray-300 mt-0.5">{d.size}</div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg"
                >
                  Preview
                </button>
                <button
                  onClick={() => window.print()}
                  className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total Cost Summary */}
        <div className="bg-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-200 mb-5">
          <div className="text-blue-200 text-xs font-semibold mb-1">Total Operational Cost — {qInfo?.label}</div>
          <div className="text-3xl font-black text-white">{fmtRp(totalCost || totalOpex)}</div>
          <div className="text-blue-200 text-[10px] mt-1 font-medium">All utilities + operational expenses combined</div>
          <button
            onClick={() => window.print()}
            className="mt-3 w-full h-10 bg-white text-blue-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
            </svg>
            Print Full Report
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
