'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

export default function AuditPage() {
  const [selectedRange, setSelectedRange] = useState<'month' | '7d' | 'custom'>('month');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'complete' | 'partial'>('all');
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>('25');

  // Correction Modal State
  const [correctionModalDate, setCorrectionModalDate] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);

  const handleArchive = async (date: string) => {
    if (confirm(`Apakah Anda yakin ingin mengarsipkan (soft delete) data tanggal ${date}? Data tidak dihapus permanen dan jejak audit akan dicatat.`)) {
      await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType: 'readings',
          recordId: `read-${date}`,
          reason: 'Pengarsipan catatan lampau oleh Supervisor',
        }),
      });
      alert(`Data tanggal ${date} berhasil diarsipkan (soft delete).`);
    }
  };

  const handleSaveCorrection = async () => {
    if (!correctionReason.trim()) {
      alert('Alasan koreksi wajib diisi untuk catatan riwayat.');
      return;
    }
    setIsSavingCorrection(true);
    try {
      await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: correctionModalDate,
          reason: correctionReason,
          userEmail: 'supervisor@agranusavilla.com',
        }),
      });
      setIsSavingCorrection(false);
      setCorrectionModalDate(null);
      setCorrectionReason('');
      alert('Koreksi data lampau berhasil dicatat dalam audit trail.');
    } catch {
      setIsSavingCorrection(false);
      setCorrectionModalDate(null);
      setCorrectionReason('');
    }
  };

  return (
    <div className="bg-surface min-h-screen pb-28">
      <Header title="Histori Audit" currentDate="26 Okt 2026" />

      <main className="flex flex-col relative w-full pt-28 px-margin max-w-md mx-auto">
        <div className="flex flex-col w-full gap-space-md pb-12 pt-2">
          {/* Villa Identity Banner & Live Sync Status */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-on-surface font-bold">
                    Audit Trail &amp; Integritas Data
                  </span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                    Pencatatan Mandiri Supervisor • Read-Write Lock
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-badge text-label-badge border border-surface-container">
                Sheets ID: AG-2026
              </span>
            </div>
          </div>

          {/* Filter Kontrol: Rentang Tanggal & Kelengkapan */}
          <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <span className="font-title-sm text-title-sm text-on-surface font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">tune</span>
                Filter Riwayat
              </span>
              <button
                className="font-label-badge text-label-badge text-on-surface-variant active:text-primary transition-colors"
                onClick={() => {
                  setSelectedRange('month');
                  setSelectedStatus('all');
                }}
                type="button"
              >
                Reset Filter
              </button>
            </div>

            {/* Segment Rentang Tanggal */}
            <div className="flex items-center p-1 rounded-lg bg-surface-container-low gap-1" role="tablist">
              <button
                className={`flex-1 py-1.5 px-2 rounded-lg font-title-sm text-title-sm text-center transition-all ${
                  selectedRange === 'month'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                    : 'text-on-surface-variant'
                }`}
                onClick={() => setSelectedRange('month')}
                type="button"
              >
                Bulan Ini
              </button>
              <button
                className={`flex-1 py-1.5 px-2 rounded-lg font-title-sm text-title-sm text-center transition-all ${
                  selectedRange === '7d'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                    : 'text-on-surface-variant'
                }`}
                onClick={() => setSelectedRange('7d')}
                type="button"
              >
                7 Hari Terakhir
              </button>
              <button
                className={`flex-1 py-1.5 px-2 rounded-lg font-title-sm text-title-sm text-center transition-all ${
                  selectedRange === 'custom'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                    : 'text-on-surface-variant'
                }`}
                onClick={() => setSelectedRange('custom')}
                type="button"
              >
                Kustom
              </button>
            </div>

            {/* Segment Status Integritas */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                className={`shrink-0 px-3 py-1.5 rounded-full font-label-badge text-label-badge shadow-sm transition-transform active:scale-95 ${
                  selectedStatus === 'all'
                    ? 'bg-primary-container text-on-primary font-bold'
                    : 'bg-surface-container text-on-surface'
                }`}
                onClick={() => setSelectedStatus('all')}
                type="button"
              >
                Semua (31 Hari)
              </button>
              <button
                className={`shrink-0 px-3 py-1.5 rounded-full font-label-badge text-label-badge transition-transform active:scale-95 ${
                  selectedStatus === 'complete'
                    ? 'bg-primary-container text-on-primary font-bold'
                    : 'bg-surface-container text-on-surface'
                }`}
                onClick={() => setSelectedStatus('complete')}
                type="button"
              >
                100% Lengkap (26)
              </button>
              <button
                className={`shrink-0 px-3 py-1.5 rounded-full font-label-badge text-label-badge transition-transform active:scale-95 ${
                  selectedStatus === 'partial'
                    ? 'bg-primary-container text-on-primary font-bold'
                    : 'bg-surface-container text-on-surface'
                }`}
                onClick={() => setSelectedStatus('partial')}
                type="button"
              >
                Parsial / Perlu Aksi (5)
              </button>
            </div>
          </div>

          {/* Kartu Ringkasan Status Integritas Data */}
          <div className="w-full bg-primary-container text-on-primary rounded-xl p-space-md shadow-md flex flex-col gap-space-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                <span className="font-title-sm text-title-sm text-surface font-bold">
                  Status Siklus Okto 2026
                </span>
              </div>
              <span className="font-label-badge text-label-badge px-2 py-0.5 rounded-full bg-surface-container-high/20 text-surface font-semibold">
                98.4% Sehat
              </span>
            </div>

            {/* 4 Metrik Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-surface-container-highest/10 rounded-lg p-2.5 flex flex-col border border-white/10">
                <span className="font-label-caps text-label-caps text-surface-variant uppercase tracking-wider">
                  Hari Kalender
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-metric-display text-metric-display text-surface">31</span>
                  <span className="font-body-sm text-body-sm text-surface-variant">Hari</span>
                </div>
                <span className="font-label-badge text-label-badge text-surface-variant mt-1">
                  Siklus berjalan penuh
                </span>
              </div>

              <div className="bg-surface-container-highest/10 rounded-lg p-2.5 flex flex-col border border-white/10">
                <span className="font-label-caps text-label-caps text-surface-variant uppercase tracking-wider">
                  Tercatat Lengkap
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-metric-display text-metric-display text-secondary-container">
                    26
                  </span>
                  <span className="font-body-sm text-body-sm text-surface-variant">/ 31</span>
                </div>
                <span className="font-label-badge text-label-badge text-surface-variant mt-1">
                  5 Telemetri valid
                </span>
              </div>

              <div className="bg-surface-container-highest/10 rounded-lg p-2.5 flex flex-col border border-white/10">
                <span className="font-label-caps text-label-caps text-surface-variant uppercase tracking-wider">
                  Data Hilang
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-metric-display text-metric-display text-surface">0</span>
                  <span className="font-body-sm text-body-sm text-surface-variant">Hari</span>
                </div>
                <span className="font-label-badge text-label-badge text-surface-variant mt-1">
                  Zero omission alert
                </span>
              </div>

              <div className="bg-surface-container-highest/10 rounded-lg p-2.5 flex flex-col border border-white/10">
                <span className="font-label-caps text-label-caps text-surface-variant uppercase tracking-wider">
                  Telah Dikoreksi
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-metric-display text-metric-display text-surface">3</span>
                  <span className="font-body-sm text-body-sm text-surface-variant">Catatan</span>
                </div>
                <span className="font-label-badge text-label-badge text-surface-variant mt-1">
                  Jejak audit tersimpan
                </span>
              </div>
            </div>
          </div>

          {/* Kronologis Entri Harian */}
          <div className="flex items-center justify-between px-1">
            <span className="font-title-md text-title-md text-on-surface font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">history_toggle_drop_down</span>
              Kronologis Entri Harian
            </span>
            <span className="font-label-badge text-label-badge text-on-surface-variant">
              Terbaru di atas
            </span>
          </div>

          {/* 1. Date 26 Okt 2026 */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md font-bold text-on-surface">
                  26 Okt 2026
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/20 text-on-secondary-fixed-variant font-label-badge text-label-badge font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
                  Tersinkron
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-badge text-label-badge text-on-surface font-bold">
                5/5 Komponen
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Pencatatan Mandiri Supervisor • 18:42 WITA
            </p>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Total Beban Hari Ini
                </span>
                <span className="font-metric-sm text-metric-sm text-on-surface font-extrabold">
                  Rp 4.335.200
                </span>
              </div>
              <span className="inline-flex items-center gap-1 font-label-badge text-label-badge text-secondary font-semibold">
                <span className="material-symbols-outlined text-[15px]">cloud_done</span>
                Google Sheet Valid
              </span>
            </div>

            {/* 5 mini pills */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              <div className="flex flex-col items-center py-1 rounded bg-surface-container-low">
                <span className="font-label-caps text-[9px] text-on-surface-variant">LISTRIK</span>
                <span className="font-label-badge text-label-badge font-bold text-on-surface">142 kWh</span>
              </div>
              <div className="flex flex-col items-center py-1 rounded bg-surface-container-low">
                <span className="font-label-caps text-[9px] text-on-surface-variant">AIR</span>
                <span className="font-label-badge text-label-badge font-bold text-on-surface">3.12 m³</span>
              </div>
              <div className="flex flex-col items-center py-1 rounded bg-surface-container-low">
                <span className="font-label-caps text-[9px] text-on-surface-variant">GAS</span>
                <span className="font-label-badge text-label-badge font-bold text-on-surface">1.5 Tbg</span>
              </div>
              <div className="flex flex-col items-center py-1 rounded bg-surface-container-low">
                <span className="font-label-caps text-[9px] text-on-surface-variant">GENSET</span>
                <span className="font-label-badge text-label-badge font-bold text-on-surface">0 Ltr</span>
              </div>
              <div className="flex flex-col items-center py-1 rounded bg-surface-container-low">
                <span className="font-label-caps text-[9px] text-on-surface-variant">OPEX</span>
                <span className="font-label-badge text-label-badge font-bold text-on-surface">Lengkap</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                className="py-2 px-3 rounded-lg bg-surface-container-low text-on-surface font-title-sm text-title-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-surface-container"
                onClick={() => setCorrectionModalDate('2026-10-26')}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                Koreksi Data Lampau
              </button>
              <button
                className="py-2 px-3 rounded-lg bg-surface-container-low text-on-surface-variant font-title-sm text-title-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-surface-container"
                onClick={() => handleArchive('2026-10-26')}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">archive</span>
                Arsipkan
              </button>
            </div>
          </div>

          {/* 2. Date 25 Okt 2026 (Revised v2) */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md font-bold text-on-surface">
                  25 Okt 2026
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-badge text-label-badge font-semibold">
                  <span className="material-symbols-outlined text-[13px] text-secondary">history</span>
                  Telah Dikoreksi v2
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-badge text-label-badge text-on-surface font-bold">
                5/5 Lengkap
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Revisi Disimpan oleh Supervisor (25/10 21:04)
            </p>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Total Beban Pasca-Koreksi
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-sm text-metric-sm text-on-surface font-extrabold">
                    Rp 4.521.200
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant line-through">
                    Rp 4.496.200
                  </span>
                </div>
              </div>
              <button
                className="font-label-badge text-label-badge text-secondary font-semibold flex items-center gap-0.5"
                onClick={() => setExpandedAuditId(expandedAuditId === '25' ? null : '25')}
                type="button"
              >
                Detail Audit
                <span className="material-symbols-outlined text-[14px]">
                  {expandedAuditId === '25' ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>

            {/* Audit details breakdown */}
            {expandedAuditId === '25' && (
              <div className="p-2.5 rounded-lg bg-surface-container-high/30 flex flex-col gap-1 text-body-sm text-on-surface border border-surface-container">
                <div className="flex items-center justify-between font-semibold">
                  <span>Audit ID: AUD-2026-1025-01</span>
                  <span>21:04:12 WITA</span>
                </div>
                <p className="text-on-surface-variant">
                  <strong>Sebelumnya:</strong> Listrik 14.700 kWh (Rp 2.115.000)
                </p>
                <p className="text-on-surface">
                  <strong>Revisi:</strong> Listrik 14.708 kWh (Rp 2.140.000)
                </p>
                <p className="text-secondary font-medium">
                  <strong>Alasan:</strong> Koreksi salah catat digit akhir meteran gardu PLN.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                className="py-2 px-3 rounded-lg bg-surface-container-low text-on-surface font-title-sm text-title-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-surface-container"
                onClick={() => setCorrectionModalDate('2026-10-25')}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">history</span>
                Koreksi Ulang (v3)
              </button>
              <button
                className="py-2 px-3 rounded-lg bg-surface-container-low text-on-surface-variant font-title-sm text-title-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-surface-container"
                onClick={() => handleArchive('2026-10-25')}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">archive</span>
                Arsipkan
              </button>
            </div>
          </div>

          {/* 3. Date 24 Okt 2026 (Final Locked) */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md font-bold text-on-surface">
                  24 Okt 2026
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-badge text-label-badge font-semibold">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                  Final Locked
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-badge text-label-badge text-on-surface font-bold">
                5/5 Komponen
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Pencatatan Mandiri Supervisor • 18:30 WITA
            </p>

            <div className="flex items-center justify-between">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                Biaya Komulatif Harian
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                Rp 4.180.500
              </span>
            </div>

            {/* Detailed list items */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-secondary">bolt</span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm font-semibold">Listrik Utama</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Akhir: 45.890 kWh
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-title-sm text-title-sm font-bold">148 kWh</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Rp 2.140.000
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-tertiary-container">
                    water_drop
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm font-semibold">
                      Air PDAM &amp; Sumur
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Akhir: 3.110 m³
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-title-sm text-title-sm font-bold">3.8 m³</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Rp 475.000
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-secondary">
                    mode_heat
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm font-semibold">
                      Gas Dapur &amp; Water Heater
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Bobot: 50 kg silinder
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-title-sm text-title-sm font-bold">1.0 Tabung</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Rp 650.000
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-on-surface-variant">
                    local_gas_station
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm font-semibold">
                      Solar Genset Standby
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Tangki: 320 Liter
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-title-sm text-title-sm font-bold">0 Liter (Idle)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Rp 0</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-on-surface">
                    build
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-sm font-semibold">
                      Opex Sanitasi &amp; Kolam
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Klorinasi &amp; Garam Filter
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-title-sm text-title-sm font-bold">2 Item Terpakai</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Rp 915.500
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                className="py-2 px-3 rounded-lg bg-surface-container-low text-on-surface font-title-sm text-title-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-surface-container"
                onClick={() => setCorrectionModalDate('2026-10-24')}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                Koreksi Data Lampau
              </button>
              <button
                className="py-2 px-3 rounded-lg bg-surface-container-low text-on-surface-variant font-title-sm text-title-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-surface-container"
                onClick={() => handleArchive('2026-10-24')}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">archive</span>
                Arsipkan
              </button>
            </div>
          </div>

          {/* Kebijakan Soft Delete & Immutable Audit Disclaimer */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex items-start gap-2.5 text-on-surface-variant border border-surface-container">
            <span className="material-symbols-outlined text-[20px] text-secondary shrink-0 mt-0.5">
              security
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                Kebijakan Soft Delete &amp; Immutable Audit
              </span>
              <p className="font-body-sm text-body-sm leading-snug">
                Seluruh arsip data lampau berstatus <strong>Soft Delete</strong>. Data yang diarsipkan dinonaktifkan dari agregasi biaya bulanan, tidak pernah dihapus permanen dari Google Sheets Master, dan dapat dipulihkan sewaktu-waktu oleh Supervisor.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Koreksi Data Lampau */}
      {correctionModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-space-lg shadow-xl flex flex-col gap-space-md border border-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Koreksi Data {correctionModalDate}
              </span>
              <button
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface"
                onClick={() => setCorrectionModalDate(null)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Setiap koreksi wajib menyertakan alasan yang jelas untuk kebutuhan jejak riwayat internal vila.
            </p>

            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Alasan Koreksi
              </label>
              <textarea
                className="w-full bg-surface-container-low px-3 py-2 rounded-lg font-body-md text-body-md text-on-surface focus:outline-none min-h-[90px] border border-surface-container"
                placeholder="Contoh: Kalibrasi ulang angka meteran air pasca perbaikan pipa..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface font-title-sm text-title-sm font-bold"
                onClick={() => setCorrectionModalDate(null)}
                type="button"
              >
                Batal
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-title-sm text-title-sm font-bold"
                disabled={isSavingCorrection}
                onClick={handleSaveCorrection}
                type="button"
              >
                {isSavingCorrection ? 'Menyimpan...' : 'Simpan Koreksi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
