'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

const InputField = ({
  label, value, onChange, placeholder, unit, icon, type = 'number',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; unit: string; icon: React.ReactNode; type?: string;
}) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-gray-900">{label}</div>
        <div className="text-[10px] text-gray-400">{unit}</div>
      </div>
    </div>
    <div className="relative">
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">{unit}</span>
    </div>
  </div>
);

export default function InputMeterPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [electricity, setElectricity] = useState('');
  const [water, setWater] = useState('');
  const [gas, setGas] = useState('');
  const [solar, setSolar] = useState('');
  const [genset, setGenset] = useState('Running Test Normal');
  const [opex, setOpex] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!date) { setMessage('Please select a date.'); setStatus('error'); return; }
    setStatus('saving');
    setMessage('');

    try {
      const tasks = [];

      // Save meter readings (electricity, water, gas)
      if (electricity || water || gas) {
        tasks.push(
          fetch('/api/readings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date,
              electricityMeter: electricity ? parseFloat(electricity) : null,
              waterMeter: water ? parseFloat(water) : null,
              gasMeter: gas ? parseFloat(gas) : null,
              userEmail: 'supervisor@agranusavilla.com',
              reason: 'Daily meter reading — Operational Supervisor',
            }),
          })
        );
      }

      // Save fuel
      if (solar) {
        tasks.push(
          fetch('/api/fuel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date,
              solarLiters: parseFloat(solar),
              gensetStatus: genset,
              userEmail: 'supervisor@agranusavilla.com',
            }),
          })
        );
      }

      // Save opex
      if (opex) {
        tasks.push(
          fetch('/api/operating-expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date,
              totalAmount: parseInt(opex.replace(/\D/g, ''), 10),
              userEmail: 'supervisor@agranusavilla.com',
            }),
          })
        );
      }

      if (tasks.length === 0) {
        setStatus('error');
        setMessage('Please fill at least one field before submitting.');
        return;
      }

      const results = await Promise.all(tasks);
      const allOk = results.every((r) => r.ok);

      if (allOk) {
        setStatus('success');
        setMessage('Daily log submitted successfully to Google Sheets!');
        setElectricity(''); setWater(''); setGas(''); setSolar(''); setOpex('');
      } else {
        setStatus('error');
        setMessage('Some data failed to save. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection.');
    }
  };

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <Header
        badge="Daily Input Mode"
        badgeColor="bg-blue-100 text-blue-700"
        title="Daily Operational Input"
        subtitle="Record meter readings, fuel usage & operational expenses."
      />

      <main className="max-w-md mx-auto px-4 pt-5">
        {/* Date Selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Operational Date</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500 shrink-0">
                <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
              </svg>
              <span className="text-sm font-bold text-gray-900">{displayDate}</span>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today}
              className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
            />
          </div>
        </div>

        {/* Section: Utility Telemetry */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Utility Telemetry</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-[10px] font-semibold text-green-600">Sheets OK</span>
            </div>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <InputField
            label="Electricity Meter"
            value={electricity}
            onChange={setElectricity}
            placeholder="e.g. 14732.5"
            unit="kWh"
            icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>}
          />
          <InputField
            label="Water Meter"
            value={water}
            onChange={setWater}
            placeholder="e.g. 1428.4"
            unit="m³"
            icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>}
          />
          <InputField
            label="Gas Meter"
            value={gas}
            onChange={setGas}
            placeholder="e.g. 892.0"
            unit="m³"
            icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-teal-500"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2-1.13 0-1.9.16-2.53.33C14.28 11.86 17 10 17 8z"/></svg>}
          />
        </div>

        {/* Section: Fuel */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Solar Fuel Log</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-500">
                <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6.5V18H5V5h8v13H8z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">Solar / Genset Fuel</div>
              <div className="text-[10px] text-gray-400">Daily consumed volume</div>
            </div>
          </div>
          <input
            type="number"
            inputMode="decimal"
            value={solar}
            onChange={(e) => setSolar(e.target.value)}
            placeholder="e.g. 45.0"
            className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all mb-3"
          />
          <div className="text-xs font-semibold text-gray-600 mb-2">Genset Status</div>
          <div className="grid grid-cols-3 gap-2">
            {['Running Test Normal', 'Running - Load', 'Standby Off'].map((s) => (
              <button
                key={s}
                onClick={() => setGenset(s)}
                className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                  genset === s
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Section: Opex */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operational Expense</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-500">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">Total Operational Expense</div>
              <div className="text-[10px] text-gray-400">IDR — daily total only, no itemized receipts</div>
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</span>
            <input
              type="number"
              inputMode="numeric"
              value={opex}
              onChange={(e) => setOpex(e.target.value)}
              placeholder="0"
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 text-sm font-semibold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`rounded-2xl p-3 mb-4 text-sm font-semibold flex items-center gap-2 ${
            status === 'success'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-red-50 text-red-600 border border-red-100'
          }`}>
            {status === 'success' ? '✅' : '⚠️'} {message}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={() => { setElectricity(''); setWater(''); setGas(''); setSolar(''); setOpex(''); setStatus('idle'); setMessage(''); }}
            className="flex-1 h-12 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
          >
            Clear
          </button>
          <button
            onClick={handleSubmit}
            disabled={status === 'saving'}
            className="flex-[2] h-12 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {status === 'saving' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving to Sheets…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Submit Daily Log
              </>
            )}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
