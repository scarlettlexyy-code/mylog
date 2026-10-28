'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

export default function LaporanPage() {
  const [selectedFormat, setSelectedFormat] = useState<'eksekutif' | 'detail' | 'lengkap'>('lengkap');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7days' | 'thismonth' | 'lastmonth' | 'custom'>('thismonth');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MYlog Laporan Utilitas & Energi',
        text: 'Laporan resmi operasional energi dan biaya Agranusa Signature Villa periode Oktober 2026.',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan laporan PDF berhasil disalin ke clipboard.');
    }
  };

  return (
    <div className="bg-surface min-h-screen pb-28">
      <Header title="Laporan" currentDate="26 Okt 2026" />

      <main className="flex flex-col relative w-full pt-28 px-margin max-w-md mx-auto">
        <div className="flex flex-col w-full gap-space-lg pb-12 pt-2">
          {/* Header Title & Sync Badge */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Ekspor Resmi Villa
                </span>
              </div>
              <span className="font-label-badge text-label-badge text-on-tertiary-container bg-surface-container-high px-2 py-0.5 rounded-full font-semibold">
                v2.4 Live Sync
              </span>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight font-extrabold">
              Laporan &amp; Ekspor PDF
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Arsip performa utilitas dan pertanggungjawaban anggaran berkala.
            </p>
          </div>

          {/* Section: Pilih Format Laporan */}
          <section className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between pb-1">
              <label className="font-title-sm text-title-sm text-on-surface font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-secondary">
                  tune
                </span>
                Pilih Format Laporan
              </label>
              <span className="font-label-badge text-label-badge text-secondary font-semibold">
                {selectedFormat === 'eksekutif' && 'Ringkasan (2 Hal)'}
                {selectedFormat === 'detail' && 'Detail (6 Hal)'}
                {selectedFormat === 'lengkap' && 'Lengkap (12 Hal)'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* 1. Eksekutif */}
              <button
                className={`flex items-start gap-3 p-3 rounded-lg text-left transition-all border ${
                  selectedFormat === 'eksekutif'
                    ? 'bg-primary text-on-primary shadow-sm border-transparent'
                    : 'bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container'
                }`}
                onClick={() => setSelectedFormat('eksekutif')}
                type="button"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                    selectedFormat === 'eksekutif'
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container-lowest text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">query_stats</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-title-sm text-title-sm font-bold">
                      Ringkasan Eksekutif
                    </span>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center">
                      {selectedFormat === 'eksekutif' && (
                        <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                      )}
                    </span>
                  </div>
                  <span
                    className={`font-body-sm text-body-sm mt-0.5 ${
                      selectedFormat === 'eksekutif'
                        ? 'text-surface-container-highest'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    Total biaya, status plafon anggaran, tren utilitas, &amp; selisih delta bulanan.
                  </span>
                </div>
              </button>

              {/* 2. Detail */}
              <button
                className={`flex items-start gap-3 p-3 rounded-lg text-left transition-all border ${
                  selectedFormat === 'detail'
                    ? 'bg-primary text-on-primary shadow-sm border-transparent'
                    : 'bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container'
                }`}
                onClick={() => setSelectedFormat('detail')}
                type="button"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                    selectedFormat === 'detail'
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container-lowest text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-title-sm text-title-sm font-bold">
                      Detail Data Meter
                    </span>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center">
                      {selectedFormat === 'detail' && (
                        <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                      )}
                    </span>
                  </div>
                  <span
                    className={`font-body-sm text-body-sm mt-0.5 ${
                      selectedFormat === 'detail'
                        ? 'text-surface-container-highest'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    Log harian submeter kWh, flowmeter kubikasi air, solar genset, &amp; kasbon operasional.
                  </span>
                </div>
              </button>

              {/* 3. Lengkap */}
              <button
                className={`flex items-start gap-3 p-3 rounded-lg text-left transition-all border ${
                  selectedFormat === 'lengkap'
                    ? 'bg-primary text-on-primary shadow-sm border-transparent'
                    : 'bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container'
                }`}
                onClick={() => setSelectedFormat('lengkap')}
                type="button"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                    selectedFormat === 'lengkap'
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container-lowest text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-title-sm text-title-sm font-bold">
                      Laporan Lengkap
                    </span>
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center">
                      {selectedFormat === 'lengkap' && (
                        <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                      )}
                    </span>
                  </div>
                  <span
                    className={`font-body-sm text-body-sm mt-0.5 ${
                      selectedFormat === 'lengkap'
                        ? 'text-surface-container-highest'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    Kombinasi audit trail, ringkasan owner, lampiran foto meter, &amp; validasi akuntan.
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* Section: Filter Periode Ekspor */}
          <section className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <label className="font-title-sm text-title-sm text-on-surface font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-secondary">
                  date_range
                </span>
                Filter Periode Ekspor
              </label>
              <span className="font-label-badge text-label-badge text-on-surface-variant">
                26 Hari Aktif
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                className={`px-3 py-1.5 rounded-full font-label-badge text-label-badge transition-all ${
                  selectedPeriod === 'today'
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setSelectedPeriod('today')}
                type="button"
              >
                Hari Ini
              </button>
              <button
                className={`px-3 py-1.5 rounded-full font-label-badge text-label-badge transition-all ${
                  selectedPeriod === '7days'
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setSelectedPeriod('7days')}
                type="button"
              >
                7 Hari Terakhir
              </button>
              <button
                className={`px-3 py-1.5 rounded-full font-label-badge text-label-badge transition-all ${
                  selectedPeriod === 'thismonth'
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setSelectedPeriod('thismonth')}
                type="button"
              >
                Bulan Ini (Okt 2026)
              </button>
              <button
                className={`px-3 py-1.5 rounded-full font-label-badge text-label-badge transition-all ${
                  selectedPeriod === 'lastmonth'
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setSelectedPeriod('lastmonth')}
                type="button"
              >
                Bulan Lalu
              </button>
              <button
                className={`px-3 py-1.5 rounded-full font-label-badge text-label-badge transition-all flex items-center gap-1 ${
                  selectedPeriod === 'custom'
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setSelectedPeriod('custom')}
                type="button"
              >
                <span>Rentang Kustom</span>
                <span className="material-symbols-outlined text-[13px]">calendar_month</span>
              </button>
            </div>
          </section>

          {/* Sync callout */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-container-low text-on-surface border border-surface-container">
            <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
              cloud_sync
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-title-sm text-title-sm font-semibold">
                Tersinkronisasi Otomatis Google Sheets
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                Kompilasi PDF menggunakan angka aktual dari database spreadsheet induk. Segala koreksi meteran di lapangan langsung memutakhirkan berkas PDF ini.
              </p>
            </div>
          </div>

          {/* Pratinjau Dokumen PDF (Live Layout A4 Preview) */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-1">
              <span className="font-title-md text-title-md text-on-surface font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  picture_as_pdf
                </span>
                Pratinjau Dokumen PDF
              </span>
              <span className="font-label-badge text-label-badge text-secondary font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
                Live Layout (A4)
              </span>
            </div>

            {/* A4 Sheet Paper Mockup */}
            <div className="bg-white rounded-xl p-space-lg shadow-md border border-slate-200 text-slate-800 flex flex-col gap-space-md print:m-0 print:p-0 print:border-none print:shadow-none">
              {/* Report Header */}
              <div className="flex items-start justify-between border-b pb-3 border-slate-200">
                <div className="flex flex-col">
                  <span className="font-extrabold text-[18px] text-slate-900 tracking-tight">
                    MYlog
                  </span>
                  <span className="font-label-caps text-[9px] text-slate-500 uppercase tracking-widest">
                    OPERATIONAL ENERGY &amp; COST MONITORING
                  </span>
                  <span className="font-semibold text-[13px] text-slate-800 mt-0.5">
                    Agranusa Signature Villa
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-caps text-[9px] text-slate-500 uppercase">
                    KODE BERKAS
                  </span>
                  <span className="font-mono font-bold text-[13px] bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                    RPT-2026-X-026
                  </span>
                </div>
              </div>

              {/* Meta strip */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-b pb-2.5 border-slate-100">
                <div>
                  <span className="text-slate-400 block uppercase text-[9px]">
                    PERIODE LAPORAN
                  </span>
                  <span className="font-semibold text-slate-900">01 Okt 2026 – 26 Okt 2026</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block uppercase text-[9px]">
                    WAKTU KOMPILASI
                  </span>
                  <span className="font-semibold text-slate-900">26 Okt 2026, 17:45 WITA</span>
                </div>
              </div>

              {/* Status Pill in Document */}
              <div className="bg-blue-50 text-blue-900 px-2.5 py-1.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 border border-blue-200">
                <span className="material-symbols-outlined text-[15px] text-blue-700">
                  verified
                </span>
                Status: Data Final &amp; Terverifikasi Sheets Engine
              </div>

              {/* Ringkasan Plafon Anggaran */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-900">Ringkasan Plafon Anggaran</span>
                  <span className="text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                    Bulan Berjalan
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase">ALOKASI PLAFON</span>
                    <span className="font-bold text-[12px] text-slate-900">Rp 60.000.000</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase">REALISASI (60.4%)</span>
                    <span className="font-bold text-[12px] text-slate-900">Rp 34.200.000</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase">SISA ANGGARAN</span>
                    <span className="font-bold text-[12px] text-amber-700">Rp 15.800.000</span>
                  </div>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden mt-1">
                  <div className="h-full bg-slate-900 rounded-full" style={{ width: '60.4%' }}></div>
                </div>
              </div>

              {/* Tabel Ringkasan Biaya Utilitas */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-slate-900">
                  Tabel Ringkasan Biaya Utilitas
                </span>
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px] border-b border-slate-200">
                      <th className="py-1.5 px-2">KATEGORI</th>
                      <th className="py-1.5 px-2 text-right">PEMAKAIAN</th>
                      <th className="py-1.5 px-2 text-right">BIAYA (RP)</th>
                      <th className="py-1.5 px-2 text-right">% TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-1.5 px-2 flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Listrik (PLN)
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">14.280 kWh</td>
                      <td className="py-1.5 px-2 text-right font-mono font-semibold">20.650.000</td>
                      <td className="py-1.5 px-2 text-right font-mono">60.4%</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        Air Bersih (PDAM)
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">412 m³</td>
                      <td className="py-1.5 px-2 text-right font-mono font-semibold">6.230.000</td>
                      <td className="py-1.5 px-2 text-right font-mono">18.2%</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                        Genset (Solar)
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">240 Liter</td>
                      <td className="py-1.5 px-2 text-right font-mono font-semibold">4.320.000</td>
                      <td className="py-1.5 px-2 text-right font-mono">12.6%</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                        Gas &amp; Operasional
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">18 Tabung</td>
                      <td className="py-1.5 px-2 text-right font-mono font-semibold">3.000.000</td>
                      <td className="py-1.5 px-2 text-right font-mono">8.8%</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold border-t border-slate-300">
                      <td className="py-1.5 px-2">Total Realisasi</td>
                      <td className="py-1.5 px-2 text-right">-</td>
                      <td className="py-1.5 px-2 text-right font-mono">34.200.000</td>
                      <td className="py-1.5 px-2 text-right font-mono">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Digital Signatures Box */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center text-center">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">
                    DISUSUN OLEH
                  </span>
                  <span className="font-serif italic text-[14px] text-slate-800 mt-1">
                    Wayan Sudarma
                  </span>
                  <span className="font-bold text-[11px] text-slate-900">Wayan Sudarma</span>
                  <span className="text-[10px] text-slate-500">Supervisor Operasional Villa</span>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">
                    Digital Sign ID: AG-SUP-01
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center text-center">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">
                    DISETUJUI OLEH
                  </span>
                  <span className="font-serif italic text-[14px] text-slate-800 mt-1">
                    Made Agranusa
                  </span>
                  <span className="font-bold text-[11px] text-slate-900">Made Agranusa</span>
                  <span className="text-[10px] text-slate-500">Owner / Direktur Utama</span>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">
                    Digital Sign ID: AG-OWN-0010
                  </span>
                </div>
              </div>

              {/* Report Footer */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t border-slate-100">
                <span>MYlog Document System • Bali, Indonesia</span>
                <span>Halaman 1 dari 12 (PDF Terverifikasi)</span>
              </div>
            </div>
          </section>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              className="w-full min-h-[48px] rounded-xl font-title-md text-title-md font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-transform bg-primary text-on-primary"
              disabled={isGenerating}
              onClick={handleDownloadPdf}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isGenerating ? 'hourglass_top' : 'download'}
              </span>
              {isGenerating ? 'Menyiapkan Berkas PDF...' : 'Download Laporan PDF'}
            </button>

            <button
              className="w-full min-h-[44px] rounded-xl font-title-md text-title-md font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform bg-surface-container text-on-surface border border-surface-container-high"
              onClick={handleShare}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              Bagikan Tautan PDF
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
