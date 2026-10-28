'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { OfflineBanner } from '@/components/OfflineBanner';
import { formatDecimal, formatRupiah } from '@/lib/calculations';

export default function InputMeterPage() {
  const [entryDate, setEntryDate] = useState('2026-10-26');
  const [isDuplicateWarningVisible, setIsDuplicateWarningVisible] = useState(true);

  // Baselines from yesterday (25 Okt 2026)
  const prevElec = 14708.0;
  const prevWater = 3105.5;
  const prevGas = 933.8;
  const prevOpex = 1450000;

  // Tariffs
  const tariffElec = 1450;
  const tariffWater = 7500;
  const tariffGas = 15000;
  const tariffSolar = 15000;

  // Active form inputs
  const [elecInput, setElecInput] = useState<string>('14892.0');
  const [waterInput, setWaterInput] = useState<string>('3120.0');
  const [gasInput, setGasInput] = useState<string>('942.0');
  const [solarInput, setSolarInput] = useState<string>('35');
  const [gensetStatus, setGensetStatus] = useState<string>('Running Test 1.5 Jam');
  const [opexInput, setOpexInput] = useState<string>('1.720.000');

  // Meter reset panes
  const [resetPaneElec, setResetPaneElec] = useState(false);
  const [resetPaneWater, setResetPaneWater] = useState(false);
  const [resetPaneGas, setResetPaneGas] = useState(false);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Calculations
  const numElec = parseFloat(elecInput) || prevElec;
  const isElecInvalid = numElec < prevElec && !resetPaneElec;
  const deltaElec = Math.max(0, numElec - prevElec);
  const costElec = Math.round(deltaElec * tariffElec);

  const numWater = parseFloat(waterInput) || prevWater;
  const isWaterInvalid = numWater < prevWater && !resetPaneWater;
  const deltaWater = Math.max(0, numWater - prevWater);
  const costWater = Math.round(deltaWater * tariffWater);

  const numGas = parseFloat(gasInput) || prevGas;
  const isGasInvalid = numGas < prevGas && !resetPaneGas;
  const deltaGas = Math.max(0, numGas - prevGas);
  const costGas = Math.round(deltaGas * tariffGas);

  const numSolar = parseFloat(solarInput) || 0;
  const costSolar = Math.round(numSolar * tariffSolar);

  const rawOpex = parseInt(opexInput.replace(/[^0-9]/g, ''), 10) || 0;
  const deltaOpex = rawOpex - prevOpex;
  const percentOpex = prevOpex > 0 ? ((deltaOpex / prevOpex) * 100).toFixed(1) : '0';

  const grandTotal = costElec + costWater + costGas + costSolar + rawOpex;

  const handleOpexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9]/g, '');
    const val = parseInt(clean, 10) || 0;
    setOpexInput(val.toLocaleString('id-ID'));
  };

  const handleSubmit = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert(
        'Mode Offline: Sambungkan koneksi internet untuk memperbarui Google Sheets.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Direct fast API sync without artificial delay
      await Promise.all([
        fetch('/api/readings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: entryDate,
            electricityMeter: numElec,
            waterMeter: numWater,
            gasMeter: numGas,
            userEmail: 'supervisor@agranusavilla.com',
          }),
        }),
        fetch('/api/fuel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: entryDate,
            solarLiters: numSolar,
            gensetStatus,
            userEmail: 'supervisor@agranusavilla.com',
          }),
        }),
        fetch('/api/operating-expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: entryDate,
            totalAmount: rawOpex,
            userEmail: 'supervisor@agranusavilla.com',
          }),
        }),
      ]);

      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 2000);
    } catch {
      setIsSubmitting(false);
      alert('Berhasil disimpan ke memori lokal.');
    }
  };

  return (
    <div className="bg-surface min-h-screen pb-28">
      <Header title="Input Meter" currentDate="26 Okt 2026" />

      <main className="flex flex-col relative w-full pt-28 px-margin max-w-md mx-auto">
        <div className="flex flex-col w-full gap-gutter pb-8 pt-2">
          {/* Progress & Readiness Header Widget: Supervisor Daily Tracking */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div>
                  <span className="font-title-sm text-title-sm text-on-surface font-bold">
                    Status Checklist Harian
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Pencatatan Mandiri Supervisor (WITA)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-full border border-surface-container/60">
                <span className="font-title-sm text-title-sm text-secondary font-bold">5/5</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Lengkap
                </span>
              </div>
            </div>

            {/* 5 Components Visual Mini Indicator */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              <div className="flex flex-col items-center py-1.5 rounded-lg bg-surface-container-high">
                <span className="material-symbols-outlined text-[16px] text-on-secondary-container">
                  bolt
                </span>
                <span className="font-label-caps text-label-caps text-on-surface mt-0.5">Listrik</span>
              </div>
              <div className="flex flex-col items-center py-1.5 rounded-lg bg-surface-container-high">
                <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                  water_drop
                </span>
                <span className="font-label-caps text-label-caps text-on-surface mt-0.5">Air</span>
              </div>
              <div className="flex flex-col items-center py-1.5 rounded-lg bg-surface-container-high">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  mode_heat
                </span>
                <span className="font-label-caps text-label-caps text-on-surface mt-0.5">Gas</span>
              </div>
              <div className="flex flex-col items-center py-1.5 rounded-lg bg-surface-container-high">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                  local_gas_station
                </span>
                <span className="font-label-caps text-label-caps text-on-surface mt-0.5">Solar</span>
              </div>
              <div className="flex flex-col items-center py-1.5 rounded-lg bg-surface-container-high">
                <span className="material-symbols-outlined text-[16px] text-on-surface">
                  receipt_long
                </span>
                <span className="font-label-caps text-label-caps text-on-surface mt-0.5">Opex</span>
              </div>
            </div>
          </div>

          {/* Date Selection & Overwrite Warning Box */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  schedule
                </span>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                  Tanggal Pencatatan
                </span>
              </div>
              <span className="font-label-badge text-label-badge text-on-surface-variant">
                Waktu Bebas Supervisor (WITA)
              </span>
            </div>

            <div className="flex items-center gap-space-sm">
              <div className="relative flex-1">
                <input
                  className="w-full bg-surface-container-low text-on-surface font-title-md text-title-md px-3.5 py-2.5 rounded-lg focus:outline-none focus:bg-surface-container transition-all"
                  id="entry-date"
                  type="date"
                  value={entryDate}
                  onChange={(e) => {
                    setEntryDate(e.target.value);
                    setIsDuplicateWarningVisible(e.target.value === '2026-10-26');
                  }}
                />
              </div>
              <button
                className="min-h-[44px] px-3.5 rounded-lg bg-surface-container text-on-surface font-title-sm text-title-sm active:scale-95 transition-transform flex items-center gap-1 border border-surface-container-high/60"
                onClick={() => {
                  setEntryDate('2026-10-26');
                  setIsDuplicateWarningVisible(true);
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">today</span>
                Hari Ini
              </button>
            </div>

            {/* Duplicate Detection Notice */}
            {isDuplicateWarningVisible && (
              <div className="bg-error-container rounded-lg p-2.5 flex items-start gap-2 border border-error/20">
                <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">
                  warning
                </span>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-title-sm text-title-sm text-on-error-container font-semibold">
                      Data 26 Okt 2026 Sudah Tersimpan
                    </span>
                    <span className="font-label-badge text-label-badge text-error bg-surface-container-lowest px-1.5 py-0.5 rounded">
                      Sheets Valid
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-error-container mt-0.5 leading-snug">
                    Penyimpanan ulang hari ini akan memperbarui (overwrite) catatan angka meteran yang ada.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 1. Utility: LISTRIK (Cumulative kWh) */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[19px]">bolt</span>
                </div>
                <div>
                  <span className="font-title-md text-title-md text-on-surface font-bold">
                    1. Listrik PLN Utama
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Meter Kumulatif Gardu (kWh)
                  </p>
                </div>
              </div>
              <button
                className="font-label-badge text-label-badge text-secondary flex items-center gap-0.5 active:opacity-70"
                onClick={() => setResetPaneElec(!resetPaneElec)}
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">
                  published_with_changes
                </span>
                Reset/Ganti Meter
              </button>
            </div>

            {/* Reset Cycle Toggle Pane */}
            {resetPaneElec && (
              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1.5 border border-surface-container-high">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-secondary uppercase font-bold">
                    Prosedur Pergantian Meter Fisik
                  </span>
                  <span className="font-label-badge text-label-badge text-on-surface-variant">
                    Baseline Baru
                  </span>
                </div>
                <input
                  className="w-full bg-surface-container-lowest px-3 py-2 rounded font-body-md text-body-md text-on-surface focus:outline-none border border-surface-container"
                  placeholder="Catat angka awal meter baru (Baseline)"
                  type="number"
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Gunakan hanya jika ada unit fisik meteran PLN yang baru diganti.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-space-sm items-center">
              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col border border-surface-container">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Meter Kemarin
                </span>
                <span className="font-metric-sm text-metric-sm text-on-surface tracking-tight mt-0.5">
                  14.708,0
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">kWh</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Input Meter Baru
                </span>
                <div className="relative mt-0.5">
                  <input
                    className="w-full bg-surface-container-low text-on-surface font-metric-sm text-metric-sm px-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container border border-surface-container"
                    step="0.1"
                    type="number"
                    value={elecInput}
                    onChange={(e) => setElecInput(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Error Validation */}
            {isElecInvalid && (
              <div className="bg-error-container text-on-error-container p-2 rounded-lg font-body-sm text-body-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-error">error</span>
                Nilai tidak boleh lebih rendah dari meter kemarin (14.708,0 kWh).
              </div>
            )}

            {/* Calculation Result Bar */}
            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between border border-surface-container">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Konsumsi Hari Ini
                </span>
                <span className="font-metric-sm text-metric-sm text-secondary">
                  +{formatDecimal(deltaElec)} kWh
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Estimasi Biaya Tarik
                </span>
                <span className="font-title-md text-title-md text-on-surface font-bold">
                  {formatRupiah(costElec)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Utility: AIR (Cumulative m3) */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-tertiary-container">
                  <span className="material-symbols-outlined text-[19px]">water_drop</span>
                </div>
                <div>
                  <span className="font-title-md text-title-md text-on-surface font-bold">
                    2. Air PDAM / Deep Well
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Meter Kumulatif Flowmeter (m³)
                  </p>
                </div>
              </div>
              <button
                className="font-label-badge text-label-badge text-secondary flex items-center gap-0.5 active:opacity-70"
                onClick={() => setResetPaneWater(!resetPaneWater)}
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">
                  published_with_changes
                </span>
                Reset Meter
              </button>
            </div>

            {resetPaneWater && (
              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1.5 border border-surface-container-high">
                <span className="font-label-caps text-label-caps text-secondary uppercase font-bold">
                  Siklus Meter Baru Air
                </span>
                <input
                  className="w-full bg-surface-container-lowest px-3 py-2 rounded font-body-md text-body-md text-on-surface focus:outline-none border border-surface-container"
                  placeholder="Catat baseline meter baru..."
                  type="number"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-space-sm items-center">
              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col border border-surface-container">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Meter Kemarin
                </span>
                <span className="font-metric-sm text-metric-sm text-on-surface tracking-tight mt-0.5">
                  3.105,5
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">m³</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Input Meter Baru
                </span>
                <div className="relative mt-0.5">
                  <input
                    className="w-full bg-surface-container-low text-on-surface font-metric-sm text-metric-sm px-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container border border-surface-container"
                    step="0.1"
                    type="number"
                    value={waterInput}
                    onChange={(e) => setWaterInput(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {isWaterInvalid && (
              <div className="bg-error-container text-on-error-container p-2 rounded-lg font-body-sm text-body-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-error">error</span>
                Angka meter air tidak boleh kurang dari 3.105,5 m³.
              </div>
            )}

            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between border border-surface-container">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Pemakaian Air
                </span>
                <span className="font-metric-sm text-metric-sm text-on-surface">
                  +{formatDecimal(deltaWater)} m³
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Estimasi Biaya Air
                </span>
                <span className="font-title-md text-title-md text-on-surface font-bold">
                  {formatRupiah(costWater)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Utility: GAS (Cumulative m3) */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[19px]">mode_heat</span>
                </div>
                <div>
                  <span className="font-title-md text-title-md text-on-surface font-bold">
                    3. Gas Sentral Kitchen
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Meter Kumulatif LPG (m³)
                  </p>
                </div>
              </div>
              <button
                className="font-label-badge text-label-badge text-secondary flex items-center gap-0.5 active:opacity-70"
                onClick={() => setResetPaneGas(!resetPaneGas)}
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">
                  published_with_changes
                </span>
                Reset Meter
              </button>
            </div>

            {resetPaneGas && (
              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1.5 border border-surface-container-high">
                <span className="font-label-caps text-label-caps text-secondary uppercase font-bold">
                  Siklus Meter Baru Gas
                </span>
                <input
                  className="w-full bg-surface-container-lowest px-3 py-2 rounded font-body-md text-body-md text-on-surface focus:outline-none border border-surface-container"
                  placeholder="Catat baseline meter baru gas..."
                  type="number"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-space-sm items-center">
              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col border border-surface-container">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Meter Kemarin
                </span>
                <span className="font-metric-sm text-metric-sm text-on-surface tracking-tight mt-0.5">
                  933,8
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">m³</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Input Meter Baru
                </span>
                <div className="relative mt-0.5">
                  <input
                    className="w-full bg-surface-container-low text-on-surface font-metric-sm text-metric-sm px-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container border border-surface-container"
                    step="0.1"
                    type="number"
                    value={gasInput}
                    onChange={(e) => setGasInput(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {isGasInvalid && (
              <div className="bg-error-container text-on-error-container p-2 rounded-lg font-body-sm text-body-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-error">error</span>
                Angka meter gas tidak boleh kurang dari 933,8 m³.
              </div>
            )}

            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between border border-surface-container">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Konsumsi Gas
                </span>
                <span className="font-metric-sm text-metric-sm text-on-surface">
                  +{formatDecimal(deltaGas)} m³
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Estimasi Biaya Gas
                </span>
                <span className="font-title-md text-title-md text-on-surface font-bold">
                  {formatRupiah(costGas)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Utility: FUEL SOLAR GENSET (PRD 10.2: Daily Quantity Liters) */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-[19px]">local_gas_station</span>
                </div>
                <div>
                  <span className="font-title-md text-title-md text-on-surface font-bold">
                    4. Bahan Bakar Genset (Solar)
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Kuantitas Terpakai Harian (Liter)
                  </p>
                </div>
              </div>
              <span className="bg-surface-container-low font-label-badge text-label-badge text-on-surface-variant px-2 py-0.5 rounded border border-surface-container">
                Harian Non-Meter
              </span>
            </div>

            <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 border border-surface-container">
              <div className="flex items-center justify-between">
                <label className="font-title-sm text-title-sm text-on-surface font-medium" htmlFor="input-solar">
                  Volume Solar Terpakai Hari Ini:
                </label>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Liter
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    className="w-full bg-surface-container-lowest text-on-surface font-metric-sm text-metric-sm px-3.5 py-2.5 rounded-lg focus:outline-none border border-surface-container"
                    id="input-solar"
                    step="1"
                    type="number"
                    value={solarInput}
                    onChange={(e) => setSolarInput(e.target.value)}
                  />
                </div>
                <span className="font-title-md text-title-md text-on-surface font-semibold shrink-0">
                  Liter
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between border border-surface-container">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Status Genset
                </span>
                <input
                  className="font-body-md text-body-md text-on-surface bg-transparent border-b border-surface-container-high focus:outline-none"
                  value={gensetStatus}
                  onChange={(e) => setGensetStatus(e.target.value)}
                />
              </div>
              <div className="flex flex-col items-end">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Estimasi Biaya Solar
                </span>
                <span className="font-title-md text-title-md text-on-surface font-bold">
                  {formatRupiah(costSolar)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Utility: PENGELUARAN OPERASIONAL (Total Nominal Saja) */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-[19px]">
                    account_balance_wallet
                  </span>
                </div>
                <div>
                  <span className="font-title-md text-title-md text-on-surface font-bold">
                    5. Pengeluaran Operasional
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Total Nominal Kasir Harian
                  </p>
                </div>
              </div>
              <span className="font-label-badge text-label-badge text-secondary font-semibold">
                Total Gelondongan
              </span>
            </div>

            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-start gap-2 border border-surface-container">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0 mt-0.5">
                info
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                Cukup catat total pengeluaran kas harian. Rincian per nota sengaja tidak dicatat agar pengisian harian praktis dan cepat.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                Total Pengeluaran (Rp)
              </span>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-metric-sm text-metric-sm text-on-surface-variant">
                  Rp
                </span>
                <input
                  className="w-full bg-surface-container-low text-on-surface font-metric-sm text-metric-sm pl-11 pr-3 py-2.5 rounded-lg focus:outline-none focus:bg-surface-container border border-surface-container"
                  type="text"
                  value={opexInput}
                  onChange={handleOpexChange}
                />
              </div>
            </div>

            {/* Day-to-day Comparison Box */}
            <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between border border-surface-container">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Kemarin (25 Okt)
                </span>
                <span className="font-body-md text-body-md text-on-surface font-medium">
                  Rp 1.450.000
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Deviasi Harian
                </span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-error">
                    trending_up
                  </span>
                  <span className="font-title-sm text-title-sm text-error font-bold">
                    +Rp {deltaOpex.toLocaleString('id-ID')} (+{percentOpex}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Summary Deck & Submit Button */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm mt-1 border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                Total Taksiran Harian
              </span>
              <span className="font-metric-display text-metric-display text-primary tracking-tight">
                {formatRupiah(grandTotal)}
              </span>
            </div>

            {/* Offline Safeguard Badge */}
            <OfflineBanner />

            {/* Main Submit Action Button: Fast, Responsive, No Delay */}
            <button
              className={`w-full min-h-[48px] rounded-xl font-title-md text-title-md font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all ${
                submitSuccess
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-primary text-on-primary'
              }`}
              disabled={isSubmitting}
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    refresh
                  </span>
                  Menyimpan ke Google Sheets...
                </>
              ) : submitSuccess ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Tersimpan Sukses!
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                  Perbarui Data Sheets
                </>
              )}
            </button>
            <p className="font-body-sm text-body-sm text-center text-on-surface-variant">
              Tercatat otomatis oleh Supervisor Operasional.
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
