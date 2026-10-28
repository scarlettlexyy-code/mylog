'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { formatRupiah } from '@/lib/calculations';

export default function AnggaranPage() {
  const [activeMonth, setActiveMonth] = useState('Oktober 2026');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Budget state (IDR)
  const [budgets, setBudgets] = useState({
    listrik: 15000000,
    air: 4500000,
    gas: 3500000,
    solar: 7000000,
    opex: 20000000,
  });

  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);

  // Actual spendings (matching Stitch mockup)
  const spendings = {
    listrik: 11200000,
    air: 3900000,
    gas: 2200000,
    solar: 5800000,
    opex: 11100000,
  };

  const totalSpent = Object.values(spendings).reduce((a, b) => a + b, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercent = ((totalSpent / totalBudget) * 100).toFixed(1);

  const categories = [
    {
      key: 'listrik',
      title: 'Listrik (PLN)',
      icon: 'bolt',
      budget: budgets.listrik,
      spent: spendings.listrik,
      percent: ((spendings.listrik / budgets.listrik) * 100).toFixed(1),
      status: 'Aman',
      statusClass: 'text-on-surface-variant bg-surface-container',
      barClass: 'bg-primary',
    },
    {
      key: 'air',
      title: 'Air Bersih (PDAM & Truk)',
      icon: 'water_drop',
      budget: budgets.air,
      spent: spendings.air,
      percent: ((spendings.air / budgets.air) * 100).toFixed(1),
      status: 'Waspada',
      statusClass: 'text-secondary-fixed-variant bg-secondary-container/20 font-bold',
      barClass: 'bg-secondary-container',
    },
    {
      key: 'gas',
      title: 'Gas LPG (Dapur & Boiler)',
      icon: 'mode_heat',
      budget: budgets.gas,
      spent: spendings.gas,
      percent: ((spendings.gas / budgets.gas) * 100).toFixed(1),
      status: 'Aman',
      statusClass: 'text-on-surface-variant bg-surface-container',
      barClass: 'bg-primary',
    },
    {
      key: 'solar',
      title: 'Fuel Solar Genset',
      icon: 'local_gas_station',
      budget: budgets.solar,
      spent: spendings.solar,
      percent: ((spendings.solar / budgets.solar) * 100).toFixed(1),
      status: 'Waspada',
      statusClass: 'text-secondary-fixed-variant bg-secondary-container/20 font-bold',
      barClass: 'bg-secondary-container',
    },
    {
      key: 'opex',
      title: 'Pengeluaran Operasional',
      icon: 'receipt_long',
      budget: budgets.opex,
      spent: spendings.opex,
      percent: ((spendings.opex / budgets.opex) * 100).toFixed(1),
      status: 'Aman',
      statusClass: 'text-on-surface-variant bg-surface-container',
      barClass: 'bg-primary',
    },
  ];

  const handleSaveToSheets = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: '2026-10',
          mode: 'sum_categories',
          electricityBudget: budgets.listrik,
          waterBudget: budgets.air,
          gasBudget: budgets.gas,
          fuelBudget: budgets.solar,
          opexBudget: budgets.opex,
          totalBudget,
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsSaving(false);
      }, 2000);
    } catch {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen pb-28">
      <Header title="Anggaran" currentDate="26 Okt 2026" />

      <main className="flex flex-col relative w-full pt-28 px-margin max-w-md mx-auto">
        <div className="flex flex-col w-full gap-gutter pb-space-lg pt-2">
          {/* Sub-header Bar: Periode & Quick CTA */}
          <div className="flex items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/40">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-on-surface">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Periode Aktif
                </span>
                <button
                  className="flex items-center gap-1 font-title-md text-title-md text-on-surface text-left truncate active:scale-95 transition-transform"
                  type="button"
                >
                  <span className="font-bold">{activeMonth}</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    expand_more
                  </span>
                </button>
              </div>
            </div>
            <button
              className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-title-sm text-title-sm flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 transition-transform"
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Atur Pagu Baru</span>
            </button>
          </div>

          {/* Note PRD Kebijakan Manual Bulanan */}
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface-variant border border-surface-container/60">
            <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
              verified_user
            </span>
            <span className="font-body-sm text-body-sm leading-tight">
              Sesuai <strong>PRD Bagian 12</strong>: Pagu anggaran ditetapkan mandiri tiap bulan secara eksplisit tanpa otomatisasi duplikasi riwayat.
            </span>
          </div>

          {/* Ringkasan Pagu Keseluruhan */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md relative overflow-hidden border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Total Pagu Operasional
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold mt-0.5">
                  {formatRupiah(totalBudget)}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-badge text-label-badge flex items-center gap-1 border border-surface-container-high/60">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
                <span>Realisasi {overallPercent}%</span>
              </div>
            </div>

            {/* Main Progress Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, parseFloat(overallPercent))}%` }}
                />
              </div>
              <div className="flex items-center justify-between font-label-caps text-label-caps text-on-surface-variant pt-0.5">
                <span>0%</span>
                <span className="text-secondary font-bold">Batas Aman 80%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Quick Stat Split */}
            <div className="grid grid-cols-2 gap-space-sm pt-1">
              <div className="flex flex-col p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  Sudah Terpakai
                </span>
                <span className="font-metric-sm text-metric-sm text-on-surface mt-0.5 font-bold">
                  {formatRupiah(totalSpent)}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Hingga hari ke-26
                </span>
              </div>
              <div className="flex flex-col p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  Sisa Alokasi
                </span>
                <span className="font-metric-sm text-metric-sm text-on-surface mt-0.5 font-bold">
                  {formatRupiah(totalRemaining)}
                </span>
                <span className="font-body-sm text-body-sm text-secondary font-semibold">
                  Tersedia aman
                </span>
              </div>
            </div>
          </div>

          {/* Rincian 5 Kategori Anggaran */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between px-1">
              <span className="font-title-md text-title-md text-on-surface font-bold">
                Alokasi per Kategori
              </span>
              <span className="font-label-badge text-label-badge text-on-surface-variant">
                5 Sektor
              </span>
            </div>

            <div className="flex flex-col gap-gutter">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-on-surface">
                        <span className="material-symbols-outlined text-[18px]">
                          {cat.icon}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-title-sm text-title-sm text-on-surface font-bold">
                          {cat.title}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Pagu: {formatRupiah(cat.budget)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full font-label-badge text-label-badge ${cat.statusClass}`}
                    >
                      {cat.percent}% • {cat.status}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.barClass}`}
                      style={{ width: `${Math.min(100, parseFloat(cat.percent))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>
                      Terpakai: <strong className="text-on-surface">{formatRupiah(cat.spent)}</strong>
                    </span>
                    <span>
                      Sisa:{' '}
                      <strong className="text-on-surface">
                        {formatRupiah(cat.budget - cat.spent)}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deteksi Lonjakan Biaya (PRD Bagian 12) */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-1">
              <span className="font-title-md text-title-md text-on-surface font-bold flex items-center gap-1.5">
                Deteksi Lonjakan Biaya
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  trending_up
                </span>
              </span>
              <span className="font-label-badge text-label-badge text-on-surface-variant">
                PRD Bag. 12
              </span>
            </div>

            {/* Active Spike Warning Banner */}
            <div className="bg-error-container/60 rounded-xl p-space-md flex flex-col gap-2.5 border border-error/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[20px]">
                    warning
                  </span>
                  <span className="font-title-sm text-title-sm text-on-error-container font-bold">
                    Peringatan Lonjakan Aktif
                  </span>
                </div>
                <span className="font-label-badge text-label-badge bg-surface-container-lowest text-error px-2 py-0.5 rounded">
                  Hari Ini
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-title-sm text-title-sm text-on-error-container font-semibold">
                  Lonjakan Listrik Terdeteksi
                </span>
                <p className="font-body-sm text-body-sm text-on-error-container leading-snug">
                  Kenaikan harian melampaui ambang ganda: <strong className="text-error">+24,5%</strong>{' '}
                  (ambang +20%) dan <strong className="text-error">+Rp 620.000</strong> (ambang +Rp 500.000) dibandingkan rata-rata 7 hari villa.
                </p>
              </div>

              <button
                className="self-end px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-badge text-label-badge shadow-sm active:scale-95 transition-transform"
                onClick={() => alert('Detail Investigasi: Lonjakan terjadi pada jam operasional AC chiller sentral villa utama.')}
                type="button"
              >
                Investigasi Beban
              </button>
            </div>

            {/* Kriteria Algoritma Validasi Box */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md flex flex-col gap-space-sm shadow-sm border border-surface-container-high/40">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 mt-0.5">
                  info
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-title-sm text-title-sm text-on-surface font-bold">
                    Kriteria Algoritma Validasi
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                    Peringatan anomali lonjakan <strong>HANYA</strong> diaktifkan jika parameter kenaikan persentase <em>DAN</em> nominal absolut sama-sama terlampaui terhadap baseline (rata-rata bergerak 7 hari / hari sebelumnya). Ini meminimalkan alarm palsu pada pemakaian kecil.
                  </p>
                </div>
              </div>

              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider pt-1">
                Aturan Pemicu Ambang (Thresholds)
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="font-title-sm text-title-sm font-bold text-on-surface">
                      Listrik
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      bolt
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Syarat Ganda:
                  </span>
                  <span className="font-label-badge text-label-badge text-on-surface font-semibold">
                    &gt; +20% &amp; &gt; Rp 500rb
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="font-title-sm text-title-sm font-bold text-on-surface">
                      Air PDAM
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-tertiary-container">
                      water_drop
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Syarat Ganda:
                  </span>
                  <span className="font-label-badge text-label-badge text-on-surface font-semibold">
                    &gt; +20% &amp; &gt; Rp 100rb
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="font-title-sm text-title-sm font-bold text-on-surface">
                      Gas LPG
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      mode_heat
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Syarat Ganda:
                  </span>
                  <span className="font-label-badge text-label-badge text-on-surface font-semibold">
                    &gt; +20% &amp; &gt; Rp 100rb
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-0.5 border border-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="font-title-sm text-title-sm font-bold text-on-surface">
                      Fuel Genset
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      local_gas_station
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Syarat Ganda:
                  </span>
                  <span className="font-label-badge text-label-badge text-on-surface font-semibold">
                    &gt; +20% &amp; &gt; Rp 250rb
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sinkronisasi Pagu & Aturan */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-title-sm text-title-sm text-on-surface font-bold">
                  Sinkronisasi Pagu &amp; Aturan
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Tersimpan ke Tab &apos;MonthlyBudgets&apos; Sheets
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-[18px]">table_chart</span>
              </div>
            </div>

            <button
              className={`w-full min-h-[48px] rounded-xl font-title-md text-title-md font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-transform ${
                saveSuccess
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-primary text-on-primary'
              }`}
              disabled={isSaving}
              onClick={handleSaveToSheets}
              type="button"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    refresh
                  </span>
                  Menyimpan ke Spreadsheet...
                </>
              ) : saveSuccess ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Konfigurasi Tersimpan!
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">sync</span>
                  Simpan Konfigurasi ke Spreadsheet
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Modal Atur Pagu Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-space-lg shadow-xl flex flex-col gap-space-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Atur Pagu Baru
              </span>
              <button
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Tentukan pagu operasional bulanan mandiri untuk masing-masing 5 kategori.
            </p>

            <div className="flex flex-col gap-space-sm">
              <div>
                <label className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Listrik PLN (Rp)
                </label>
                <input
                  className="w-full bg-surface-container-low px-3 py-2 rounded-lg font-metric-sm text-metric-sm text-on-surface focus:outline-none mt-1"
                  type="number"
                  value={budgets.listrik}
                  onChange={(e) =>
                    setBudgets({ ...budgets, listrik: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>

              <div>
                <label className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Air PDAM (Rp)
                </label>
                <input
                  className="w-full bg-surface-container-low px-3 py-2 rounded-lg font-metric-sm text-metric-sm text-on-surface focus:outline-none mt-1"
                  type="number"
                  value={budgets.air}
                  onChange={(e) =>
                    setBudgets({ ...budgets, air: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>

              <div>
                <label className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Gas Sentral (Rp)
                </label>
                <input
                  className="w-full bg-surface-container-low px-3 py-2 rounded-lg font-metric-sm text-metric-sm text-on-surface focus:outline-none mt-1"
                  type="number"
                  value={budgets.gas}
                  onChange={(e) =>
                    setBudgets({ ...budgets, gas: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>

              <div>
                <label className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Solar Genset (Rp)
                </label>
                <input
                  className="w-full bg-surface-container-low px-3 py-2 rounded-lg font-metric-sm text-metric-sm text-on-surface focus:outline-none mt-1"
                  type="number"
                  value={budgets.solar}
                  onChange={(e) =>
                    setBudgets({ ...budgets, solar: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>

              <div>
                <label className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Pengeluaran Operasional (Rp)
                </label>
                <input
                  className="w-full bg-surface-container-low px-3 py-2 rounded-lg font-metric-sm text-metric-sm text-on-surface focus:outline-none mt-1"
                  type="number"
                  value={budgets.opex}
                  onChange={(e) =>
                    setBudgets({ ...budgets, opex: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-container">
              <span className="font-title-sm text-title-sm font-bold text-on-surface">
                Total Pagu Baru:
              </span>
              <span className="font-headline-sm text-headline-sm font-extrabold text-primary">
                {formatRupiah(totalBudget)}
              </span>
            </div>

            <button
              className="w-full min-h-[44px] bg-primary text-on-primary rounded-xl font-title-sm text-title-sm font-bold"
              onClick={() => {
                setIsModalOpen(false);
                handleSaveToSheets();
              }}
              type="button"
            >
              Simpan Pagu
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
