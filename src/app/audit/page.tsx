'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { formatRupiah, formatDecimal } from '@/lib/calculations';

const filterTabs = ['All', 'Meter', 'Fuel', 'Expense', 'Budget', 'System'];

const actionColor: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border border-blue-200',
  SOFT_DELETE: 'bg-rose-50 text-rose-600 border border-rose-200',
  ARCHIVE: 'bg-amber-50 text-amber-600 border border-amber-200',
  RESTORE: 'bg-purple-50 text-purple-700 border border-purple-200',
  CYCLE_RESET: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
};

function getDataTypeIcon(dataType: string) {
  const dt = (dataType || '').toLowerCase();
  if (dt === 'electricity' || dt.includes('listrik')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
        <path d="M7 2v11h3v9l7-12h-4l4-8z" />
      </svg>
    );
  }
  if (dt === 'water' || dt.includes('air')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-sky-500">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    );
  }
  if (dt === 'gas') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-indigo-500">
        <path d="M17.5 10.5C17.5 6.36 12 2 12 2S6.5 6.36 6.5 10.5a5.5 5.5 0 0 0 11 0z" />
      </svg>
    );
  }
  if (dt === 'fuel' || dt.includes('solar')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-500">
        <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6.5V18H5V5h8v13H8z" />
      </svg>
    );
  }
  if (dt === 'opex' || dt === 'expense' || dt.includes('kasir')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-500">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
      </svg>
    );
  }
  if (dt === 'budget' || dt.includes('anggaran')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500">
        <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  );
}

function formatAuditValue(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str || str === 'Data Baru' || str === 'Pembaruan Data' || str === 'None') return str;

  // Try JSON parser if it looks like an object
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      const parts: string[] = [];
      if (parsed.listrik !== undefined && parsed.listrik !== null && parsed.listrik !== '') {
        parts.push(`Listrik: ${Number(parsed.listrik).toLocaleString('id-ID')} kWh`);
      }
      if (parsed.air !== undefined && parsed.air !== null && parsed.air !== '') {
        parts.push(`Air: ${Number(parsed.air).toLocaleString('id-ID')} m³`);
      }
      if (parsed.gas !== undefined && parsed.gas !== null && parsed.gas !== '') {
        parts.push(`Gas: ${Number(parsed.gas).toLocaleString('id-ID')} m³`);
      }
      if (parts.length > 0) return parts.join(' | ');
    } catch {}
  }

  return str;
}

function formatTime(ts: string) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' });
    }
  } catch {}
  const s = String(ts);
  return s.length >= 16 ? s.slice(11, 16) : s;
}

function formatDateDisplay(dStr: string) {
  if (!dStr) return '';
  try {
    const cleanStr = dStr.includes('T') ? dStr.split('T')[0] : dStr;
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
  } catch {}
  return dStr;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('mylog_audit_cache');
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(logs.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Update modal state
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [formDate, setFormDate] = useState('');
  const [formElec, setFormElec] = useState('');
  const [formWater, setFormWater] = useState('');
  const [formGas, setFormGas] = useState('');
  const [formFuel, setFormFuel] = useState('');
  const [formOpex, setFormOpex] = useState('');
  const [formReason, setFormReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchLogs = (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else if (logs.length === 0) {
      setLoading(true);
    }

    const url = forceRefresh ? '/api/audit?refresh=true' : '/api/audit';
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        const l = Array.isArray(j.logs) ? j.logs : [];
        setLogs(l);
        try {
          sessionStorage.setItem('mylog_audit_cache', JSON.stringify(l));
        } catch {}
        if (forceRefresh) {
          showToast('✓ Data Jejak Audit Berhasil Diperbarui dari Database!');
        }
      })
      .catch((err) => {
        console.error('Error fetching audit logs:', err);
        if (forceRefresh) {
          showToast('Gagal memperbarui data audit');
        }
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtered logs
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((log) => {
      // 1. Filter Tab
      const dt = String(log.dataType || '').toLowerCase();
      let matchTab = true;
      if (activeFilter === 'Meter') {
        matchTab = dt === 'meter' || dt === 'electricity' || dt === 'water' || dt === 'gas' || dt.includes('listrik') || dt.includes('air');
      } else if (activeFilter === 'Fuel') {
        matchTab = dt === 'fuel' || dt.includes('solar');
      } else if (activeFilter === 'Expense') {
        matchTab = dt === 'opex' || dt === 'expense' || dt.includes('kasir');
      } else if (activeFilter === 'Budget') {
        matchTab = dt === 'budget' || dt.includes('anggaran');
      } else if (activeFilter === 'System') {
        matchTab = !['meter', 'electricity', 'water', 'gas', 'fuel', 'opex', 'expense', 'budget'].some(k => dt.includes(k));
      }

      if (!matchTab) return false;

      // 2. Search Query
      if (!q) return true;
      const recId = String(log.recordId || '').toLowerCase();
      const targetDate = String(log.targetDate || '').toLowerCase();
      const action = String(log.action || '').toLowerCase();
      const reason = String(log.reason || '').toLowerCase();
      const newVal = String(log.newValue || '').toLowerCase();
      const prevVal = String(log.previousValue || '').toLowerCase();

      return (
        recId.includes(q) ||
        targetDate.includes(q) ||
        action.includes(q) ||
        reason.includes(q) ||
        newVal.includes(q) ||
        prevVal.includes(q)
      );
    });
  }, [logs, activeFilter, search]);

  // Today count in Makassar WITA (UTC+8)
  const todayWita = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }, []);

  const todayLogsCount = useMemo(() => {
    return logs.filter((l) => {
      const td = String(l.targetDate || '').split('T')[0];
      const ts = String(l.timestamp || '');
      return td === todayWita || ts.startsWith(todayWita);
    }).length;
  }, [logs, todayWita]);

  // Handle opening the update modal
  const handleOpenUpdateModal = (log: any) => {
    setEditingLog(log);
    const date = log.targetDate ? log.targetDate.split('T')[0] : todayWita;
    setFormDate(date);
    setFormReason(log.reason || 'Koreksi data operasional');

    // Parse existing values if available
    let e = '';
    let w = '';
    let g = '';
    let f = '';
    let o = '';

    if (log.newValue) {
      const nStr = String(log.newValue);
      if (nStr.startsWith('{') && nStr.endsWith('}')) {
        try {
          const parsed = JSON.parse(nStr);
          if (parsed.listrik) e = String(parsed.listrik);
          if (parsed.air) w = String(parsed.air);
          if (parsed.gas) g = String(parsed.gas);
        } catch {}
      } else if (log.dataType === 'fuel') {
        const match = nStr.match(/\d+(\.\d+)?/);
        if (match) f = match[0];
      } else if (log.dataType === 'opex') {
        const clean = nStr.replace(/\D/g, '');
        if (clean) o = clean;
      }
    }

    setFormElec(e);
    setFormWater(w);
    setFormGas(g);
    setFormFuel(f);
    setFormOpex(o);
    setUpdateModalOpen(true);
  };

  // Submit update
  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) return;
    setIsUpdating(true);

    try {
      const dt = editingLog?.dataType || 'meter';

      if (dt === 'meter') {
        await fetch('/api/readings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: formDate,
            electricityMeter: formElec !== '' ? parseFloat(formElec) : null,
            waterMeter: formWater !== '' ? parseFloat(formWater) : null,
            gasMeter: formGas !== '' ? parseFloat(formGas) : null,
            reason: formReason || 'Update data operasional dari Jejak Audit',
          }),
        });
      } else if (dt === 'fuel') {
        await fetch('/api/fuel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: formDate,
            solarLiters: parseFloat(formFuel) || 0,
            gensetStatus: 'Running Test Normal',
            reason: formReason || 'Update solar genset dari Jejak Audit',
          }),
        });
      } else if (dt === 'opex') {
        await fetch('/api/operating-expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: formDate,
            totalAmount: parseFloat(formOpex) || 0,
            reason: formReason || 'Update kasir operasional dari Jejak Audit',
          }),
        });
      }

      setUpdateModalOpen(false);
      showToast('✓ Data berhasil diupdate ke Google Sheets!');
      fetchLogs(true);
    } catch (err) {
      console.error('Error updating record:', err);
      showToast('Gagal menyimpan update data');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Waktu', 'Aksi', 'Tipe Data', 'Record ID', 'Tanggal Target', 'Nilai Sebelum', 'Nilai Sesudah', 'Alasan', 'User'];
    const rows = logs.map(l => [
      l.id || '',
      l.timestamp || '',
      l.action || '',
      l.dataType || '',
      l.recordId || '',
      l.targetDate || '',
      `"${formatAuditValue(l.previousValue).replace(/"/g, '""')}"`,
      `"${formatAuditValue(l.newValue).replace(/"/g, '""')}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      l.userEmail || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MYlog_Audit_Trail_${todayWita}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-28">
      <Header
        badge="Audit Compliance Trail"
        badgeColor="bg-indigo-100 text-indigo-700"
        title="Jejak Audit & Operasional"
        subtitle="Catatan riwayat seluruh input, perubahan, dan pembaruan data villa."
        rightElement={
          <button
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing || loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 py-1.5 transition-colors shadow-sm active:scale-95"
            title="Update dan sinkronkan data jejak audit dari Google Sheets"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span className="text-[11px] font-bold">
              {isRefreshing ? 'Mengupdate...' : 'Update Data'}
            </span>
          </button>
        }
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-md mx-auto px-4 pt-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <div className="text-xl font-black text-gray-900">{loading ? '—' : logs.length}</div>
            <div className="text-[10px] text-gray-400 font-semibold">Total Log</div>
            <div className="text-[10px] text-blue-600 font-bold mt-0.5">+{todayLogsCount} Hari Ini</div>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <div className="text-xl font-black text-emerald-600">Aktif</div>
            <div className="text-[10px] text-gray-400 font-semibold">Integritas</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Terverifikasi</div>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <div className="text-xl font-black text-blue-600">100%</div>
            <div className="text-[10px] text-gray-400 font-semibold">Kepatuhan</div>
            <div className="text-[10px] text-blue-600 font-bold mt-0.5">Agranusa</div>
          </div>
        </div>

        {/* Search & Action Bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tanggal, ID, aksi, atau alasan..."
              className="w-full h-11 bg-white border border-gray-200 rounded-2xl pl-10 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing || loading}
            className="h-11 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
            title="Klik untuk memperbarui data langsung dari Google Sheets"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{isRefreshing ? 'Mengupdate...' : 'Update'}</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === tab
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab}
              {tab === 'All' && !loading && (
                <span className="ml-1 text-[10px] opacity-80">({logs.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Audit Feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Audit Trail Feed</h3>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                {filtered.length} Aktivitas
              </span>
            </div>
            <button
              onClick={() => fetchLogs(true)}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <span>Refresh</span> ↻
            </button>
          </div>

          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center px-4">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-gray-300">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-700">Tidak ada riwayat ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? 'Tidak ada catatan yang cocok dengan pencarian Anda.' : 'Data jejak audit akan muncul secara otomatis saat data dicatat.'}
              </p>
              <button
                onClick={() => fetchLogs(true)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 active:scale-95 transition-all"
              >
                Klik untuk Update Data Sekarang
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((log, i) => {
                const prevClean = formatAuditValue(log.previousValue);
                const newClean = formatAuditValue(log.newValue);
                const displayDate = formatDateDisplay(log.targetDate);

                return (
                  <div key={log.id || `log-${i}`} className="p-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                        {getDataTypeIcon(log.dataType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-gray-900">
                                {log.recordId || log.dataType || 'Operasional'}
                              </span>
                              {displayDate && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-1.5 py-0.5 rounded">
                                  {displayDate}
                                </span>
                              )}
                            </div>
                            {log.reason && (
                              <p className="text-[11px] text-gray-500 mt-0.5 italic">
                                &quot;{log.reason}&quot;
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-[10px] text-gray-400 font-medium">
                              {formatTime(log.timestamp)}
                            </div>
                            <span className={`inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${actionColor[log.action] || 'bg-gray-100 text-gray-600'}`}>
                              {log.action}
                            </span>
                          </div>
                        </div>

                        {/* Values Detail */}
                        {(prevClean || newClean) && (
                          <div className="mt-2 space-y-1 bg-gray-50/80 rounded-xl p-2 border border-gray-100 text-[11px]">
                            {prevClean && prevClean !== 'Data Baru' && prevClean !== 'None' && (
                              <div className="flex items-start gap-1.5 text-gray-500">
                                <span className="font-bold text-[9px] uppercase tracking-wider text-rose-500 shrink-0 mt-0.5">Sebelum:</span>
                                <span className="font-medium text-gray-700 break-words">{prevClean}</span>
                              </div>
                            )}
                            {newClean && (
                              <div className="flex items-start gap-1.5 text-gray-700">
                                <span className="font-bold text-[9px] uppercase tracking-wider text-emerald-600 shrink-0 mt-0.5">Sesudah:</span>
                                <span className="font-semibold text-gray-900 break-words">{newClean}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons Row */}
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 pt-1.5 border-t border-gray-50">
                          <span>Oleh: <strong className="text-gray-600">{log.userEmail || 'Supervisor'}</strong></span>
                          
                          {/* Tombol Update Fungsional untuk setiap baris log */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenUpdateModal(log)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors active:scale-95"
                              title="Update atau koreksi catatan operasional ini"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                              </svg>
                              <span>Update</span>
                            </button>
                            <Link
                              href={`/input-meter`}
                              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg font-semibold text-[10px] transition-colors"
                            >
                              Form
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Export Row */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="text-xs font-black text-gray-900 mb-0.5">Ekspor Riwayat Audit</div>
          <div className="text-[10px] text-gray-400 mb-3">Unduh bukti kepatuhan operasional untuk pelaporan pemilik villa.</div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCsv}
              className="flex-1 h-10 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-600">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              Ekspor CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-200 active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
              </svg>
              Cetak / PDF
            </button>
          </div>
        </div>
      </main>

      {/* MODAL: UPDATE / KOREKSI CATATAN OPERASIONAL */}
      {updateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Update Catatan Operasional
                </span>
                <h3 className="text-base font-black text-gray-900">
                  {editingLog?.recordId || editingLog?.dataType || 'Catatan'}
                </h3>
              </div>
              <button
                onClick={() => setUpdateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Tanggal</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Form Input Sesuai DataType */}
              {(!editingLog?.dataType || editingLog?.dataType === 'meter' || editingLog?.dataType === 'electricity') && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Total Pemakaian Listrik (kWh)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formElec}
                      onChange={(e) => setFormElec(e.target.value)}
                      placeholder="Contoh: 3457.54"
                      className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Konsumsi Air Bersih (m³)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formWater}
                      onChange={(e) => setFormWater(e.target.value)}
                      placeholder="Contoh: 12.5"
                      className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Pemakaian Gas (m³)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formGas}
                      onChange={(e) => setFormGas(e.target.value)}
                      placeholder="Contoh: 8.2"
                      className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {editingLog?.dataType === 'fuel' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Konsumsi Solar Genset (Liter)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formFuel}
                    onChange={(e) => setFormFuel(e.target.value)}
                    placeholder="Contoh: 25"
                    className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              {editingLog?.dataType === 'opex' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Total Kasir Operasional (Rp)
                  </label>
                  <input
                    type="number"
                    value={formOpex}
                    onChange={(e) => setFormOpex(e.target.value)}
                    placeholder="Contoh: 1720000"
                    className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Alasan Koreksi / Update
                </label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Contoh: Koreksi salah catat digit meteran"
                  required
                  className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {isUpdating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Update</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateModalOpen(false)}
                  className="px-4 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
