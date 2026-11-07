'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { formatRupiah, formatThousands, parseThousands } from '@/lib/calculations';

// Base rates per unit
const RATES = {
  electricity: 1450, // Rp / kWh
  water: 7500,       // Rp / m³
  gas: 15000,        // Rp / m³
  fuel: 15000,       // Rp / Liter
};

export default function InputMeterPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  // Form values
  const [electricity, setElectricity] = useState('');
  const [water, setWater] = useState('');
  const [gas, setGas] = useState('');
  const [solar, setSolar] = useState('');
  const [genset, setGenset] = useState('Running Test Normal');
  const [opexDisplay, setOpexDisplay] = useState(''); // formatted as 1.500.000

  // Previous readings for comparison
  const [prevReadings, setPrevReadings] = useState<{
    electricity: number | null;
    water: number | null;
    gas: number | null;
  }>({ electricity: null, water: null, gas: null });

  const [loadingDate, setLoadingDate] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Fetch previous readings and any existing data when date changes
  useEffect(() => {
    let active = true;
    setLoadingDate(true);

    Promise.all([
      fetch(`/api/readings?date=${date}`).then((r) => r.json()).catch(() => null),
      fetch('/api/fuel').then((r) => r.json()).catch(() => null),
      fetch('/api/operating-expenses').then((r) => r.json()).catch(() => null),
    ]).then(([readingData, fuelData, opexData]) => {
      if (!active) return;

      // 1. Previous readings
      if (readingData?.previous) {
        setPrevReadings({
          electricity: readingData.previous.electricityMeter,
          water: readingData.previous.waterMeter,
          gas: readingData.previous.gasMeter,
        });
      } else {
        setPrevReadings({ electricity: null, water: null, gas: null });
      }

      // 2. Existing readings for this date
      if (readingData?.existing) {
        setElectricity(readingData.existing.electricityMeter != null ? String(readingData.existing.electricityMeter) : '');
        setWater(readingData.existing.waterMeter != null ? String(readingData.existing.waterMeter) : '');
        setGas(readingData.existing.gasMeter != null ? String(readingData.existing.gasMeter) : '');
      } else {
        setElectricity('');
        setWater('');
        setGas('');
      }

      // 3. Existing fuel for this date
      if (fuelData?.fuels) {
        const foundFuel = fuelData.fuels.find((f: any) => f.date === date);
        if (foundFuel) {
          setSolar(foundFuel.solarLiters != null ? String(foundFuel.solarLiters) : '');
          setGenset(foundFuel.gensetStatus || 'Running Test Normal');
        } else {
          setSolar('');
        }
      }

      // 4. Existing opex for this date
      if (opexData?.opex) {
        const foundOpex = opexData.opex.find((o: any) => o.date === date);
        if (foundOpex && foundOpex.totalAmount != null) {
          setOpexDisplay(formatThousands(foundOpex.totalAmount));
        } else {
          setOpexDisplay('');
        }
      }

      setLoadingDate(false);
    });

    return () => {
      active = false;
    };
  }, [date]);

  // Handle Opex thousand separator formatting automatically
  const handleOpexChange = (val: string) => {
    const formatted = formatThousands(val);
    setOpexDisplay(formatted);
  };

  // Helper calculations for automatic Rupiah cost below input
  const calcUtility = (
    currentStr: string,
    prevVal: number | null,
    rate: number,
    unit: string
  ) => {
    if (!currentStr || isNaN(parseFloat(currentStr))) return null;
    const cur = parseFloat(currentStr);

    if (prevVal != null && cur >= prevVal) {
      const consumption = parseFloat((cur - prevVal).toFixed(2));
      const cost = Math.round(consumption * rate);
      return {
        prev: prevVal,
        consumption,
        cost,
        rate,
        unit,
        isDelta: true,
      };
    }

    // Direct consumption or first entry
    const cost = Math.round(cur * rate);
    return {
      prev: prevVal,
      consumption: cur,
      cost,
      rate,
      unit,
      isDelta: false,
    };
  };

  const elecCalc = calcUtility(electricity, prevReadings.electricity, RATES.electricity, 'kWh');
  const waterCalc = calcUtility(water, prevReadings.water, RATES.water, 'm³');
  const gasCalc = calcUtility(gas, prevReadings.gas, RATES.gas, 'm³');
  const solarLiters = parseFloat(solar) || 0;
  const solarCost = Math.round(solarLiters * RATES.fuel);
  const opexAmount = parseThousands(opexDisplay);

  const totalEstimatedCostToday =
    (elecCalc?.cost || 0) +
    (waterCalc?.cost || 0) +
    (gasCalc?.cost || 0) +
    solarCost +
    opexAmount;

  const handleSubmit = async () => {
    if (!date) {
      setMessage('Silakan pilih tanggal operasional.');
      setStatus('error');
      return;
    }
    setStatus('saving');
    setMessage('');

    try {
      const tasks = [];

      // Save meter readings (electricity, water, gas)
      if (electricity !== '' || water !== '' || gas !== '') {
        tasks.push(
          fetch('/api/readings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date,
              electricityMeter: electricity !== '' ? parseFloat(electricity) : null,
              waterMeter: water !== '' ? parseFloat(water) : null,
              gasMeter: gas !== '' ? parseFloat(gas) : null,
              userEmail: 'supervisor@agranusavilla.com',
              reason: 'Input harian mandiri supervisor',
            }),
          })
        );
      }

      // Save fuel
      if (solar !== '') {
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
      if (opexDisplay !== '') {
        tasks.push(
          fetch('/api/operating-expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date,
              totalAmount: opexAmount,
              userEmail: 'supervisor@agranusavilla.com',
            }),
          })
        );
      }

      if (tasks.length === 0) {
        setStatus('error');
        setMessage('Mohon isi minimal salah satu data (meteran, solar, atau opex).');
        return;
      }

      const results = await Promise.all(tasks);
      const allOk = results.every((r) => r.ok);

      if (allOk) {
        setStatus('success');
        setMessage('✅ Data berhasil disimpan ke Google Sheets!');
        setTimeout(() => setStatus('idle'), 4000);
      } else {
        setStatus('error');
        setMessage('Gagal menyimpan data ke Google Sheets. Silakan coba lagi.');
      }
    } catch {
      setStatus('error');
      setMessage('Gangguan koneksi internet. Cek sinyal lalu coba lagi.');
    }
  };

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-gray-50 min-h-screen pb-28">
      <Header
        badge="Input Harian Supervisor"
        badgeColor="bg-blue-100 text-blue-700"
        title="Pencatatan Harian Energi & Biaya"
        subtitle="Input angka meteran, bahan bakar solar & pengeluaran operasional."
      />

      <main className="max-w-md mx-auto px-4 pt-5">
        {/* Date Selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tanggal Operasional</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-600 shrink-0">
                <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" />
              </svg>
              <span className="text-sm font-bold text-gray-900">{displayDate}</span>
              {loadingDate && <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin ml-1" />}
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
            />
          </div>
        </div>

        {/* Section: Telemetry Meteran */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Meteran Energi Utama</span>
          <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[9px] font-bold text-green-700">Terkoneksi Sheets</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* 1. Electricity Input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-600">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Meter Listrik (PLN)</div>
                <div className="text-[10px] text-gray-400">Tarif: Rp 1.450 / kWh</div>
              </div>
            </div>
            {prevReadings.electricity != null && (
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                Kemarin: {prevReadings.electricity.toLocaleString('id-ID')} kWh
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={electricity}
              onChange={(e) => setElectricity(e.target.value)}
              placeholder={prevReadings.electricity != null ? `Contoh: ${(prevReadings.electricity + 50).toFixed(1)}` : 'Contoh: 3457.54'}
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-base font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">kWh</span>
          </div>

          {/* AUTOMATIC RUPIAH PREVIEW FIELD */}
          {elecCalc && (
            <div className="mt-2.5 p-3 rounded-xl bg-yellow-50/80 border border-yellow-200/80 flex items-center justify-between animate-fadeIn">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-yellow-900 uppercase tracking-wider">
                  {elecCalc.isDelta ? 'Konsumsi Bersih' : 'Jumlah Konsumsi'}
                </span>
                <span className="text-xs font-extrabold text-yellow-800">
                  {elecCalc.consumption.toLocaleString('id-ID')} kWh
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-yellow-900 uppercase tracking-wider">Taksiran Biaya</span>
                <div className="text-sm font-black text-yellow-700">
                  {formatRupiah(elecCalc.cost)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Water Input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-600">
                  <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Meter Air Bersih</div>
                <div className="text-[10px] text-gray-400">Tarif: Rp 7.500 / m³</div>
              </div>
            </div>
            {prevReadings.water != null && (
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                Kemarin: {prevReadings.water.toLocaleString('id-ID')} m³
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              placeholder={prevReadings.water != null ? `Contoh: ${(prevReadings.water + 12).toFixed(1)}` : 'Contoh: 1428.4'}
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-base font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">m³</span>
          </div>

          {/* AUTOMATIC RUPIAH PREVIEW FIELD */}
          {waterCalc && (
            <div className="mt-2.5 p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between animate-fadeIn">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                  {waterCalc.isDelta ? 'Konsumsi Bersih' : 'Jumlah Konsumsi'}
                </span>
                <span className="text-xs font-extrabold text-blue-800">
                  {waterCalc.consumption.toLocaleString('id-ID')} m³
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Taksiran Biaya</span>
                <div className="text-sm font-black text-blue-700">
                  {formatRupiah(waterCalc.cost)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Gas Input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-teal-600">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2-1.13 0-1.9.16-2.53.33C14.28 11.86 17 10 17 8z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Meter Gas</div>
                <div className="text-[10px] text-gray-400">Tarif: Rp 15.000 / m³</div>
              </div>
            </div>
            {prevReadings.gas != null && (
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                Kemarin: {prevReadings.gas.toLocaleString('id-ID')} m³
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={gas}
              onChange={(e) => setGas(e.target.value)}
              placeholder={prevReadings.gas != null ? `Contoh: ${(prevReadings.gas + 5).toFixed(1)}` : 'Contoh: 892.0'}
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-base font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">m³</span>
          </div>

          {/* AUTOMATIC RUPIAH PREVIEW FIELD */}
          {gasCalc && (
            <div className="mt-2.5 p-3 rounded-xl bg-teal-50/80 border border-teal-200/80 flex items-center justify-between animate-fadeIn">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">
                  {gasCalc.isDelta ? 'Konsumsi Bersih' : 'Jumlah Konsumsi'}
                </span>
                <span className="text-xs font-extrabold text-teal-800">
                  {gasCalc.consumption.toLocaleString('id-ID')} m³
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">Taksiran Biaya</span>
                <div className="text-sm font-black text-teal-700">
                  {formatRupiah(gasCalc.cost)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section: Solar Fuel */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bahan Bakar Genset</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-600">
                  <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6.5V18H5V5h8v13H8z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Pemakaian Solar Harian</div>
                <div className="text-[10px] text-gray-400">Tarif: Rp 15.000 / Liter</div>
              </div>
            </div>
          </div>

          <div className="relative mb-3">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={solar}
              onChange={(e) => setSolar(e.target.value)}
              placeholder="Contoh: 45.0"
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-base font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Liter</span>
          </div>

          {/* AUTOMATIC RUPIAH PREVIEW FIELD */}
          {solarLiters > 0 && (
            <div className="mb-3 p-3 rounded-xl bg-orange-50/80 border border-orange-200/80 flex items-center justify-between animate-fadeIn">
              <span className="text-xs font-bold text-orange-900">
                {solarLiters.toLocaleString('id-ID')} Liter Solar
              </span>
              <div className="text-right">
                <span className="text-[10px] font-bold text-orange-900 uppercase tracking-wider block">Taksiran Biaya</span>
                <span className="text-sm font-black text-orange-700">{formatRupiah(solarCost)}</span>
              </div>
            </div>
          )}

          <div className="text-xs font-bold text-gray-600 mb-2">Status Genset Hari Ini</div>
          <div className="grid grid-cols-3 gap-2">
            {['Running Test Normal', 'Running - Load', 'Standby Off'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setGenset(s)}
                className={`py-2 px-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                  genset === s
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Section: Operational Expenses (Opex) */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pengeluaran Operasional (Kasir)</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-600">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">Total Kasir Operasional Harian</div>
              <div className="text-[10px] text-gray-400">Titik ribuan otomatis (hanya total gabungan)</div>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={opexDisplay}
              onChange={(e) => handleOpexChange(e.target.value)}
              placeholder="Contoh: 1.720.000"
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 text-base font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
        </div>

        {/* SUMMARY CARD: TOTAL ESTIMATED COST TODAY */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-4 text-white shadow-lg shadow-blue-200/50 mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
              Total Taksiran Beban Hari Ini
            </span>
            <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
              Kalkulasi Real-Time
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {formatRupiah(totalEstimatedCostToday)}
          </div>
          <div className="text-[10px] text-blue-200 mt-1 flex flex-wrap gap-2 pt-2 border-t border-white/10">
            <span>Listrik: {formatRupiah(elecCalc?.cost || 0)}</span>
            <span>• Air: {formatRupiah(waterCalc?.cost || 0)}</span>
            <span>• Gas: {formatRupiah(gasCalc?.cost || 0)}</span>
            <span>• Solar: {formatRupiah(solarCost)}</span>
            <span>• Opex: {formatRupiah(opexAmount)}</span>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`rounded-2xl p-3.5 mb-4 text-xs font-bold flex items-center gap-2 ${
              status === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 pb-6">
          <button
            type="button"
            onClick={() => {
              setElectricity('');
              setWater('');
              setGas('');
              setSolar('');
              setOpexDisplay('');
              setStatus('idle');
              setMessage('');
            }}
            className="flex-1 h-12 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold text-sm active:scale-95 transition-transform hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === 'saving'}
            className="flex-[2] h-12 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-300 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {status === 'saving' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan ke Sheets…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Simpan Log Harian
              </>
            )}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
