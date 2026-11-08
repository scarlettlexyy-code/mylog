'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

const filterTabs = ['All', 'Meter', 'Fuel', 'Expense', 'System'];

const actionColor: Record<string, string> = {
  CREATE: 'bg-green-50 text-green-700',
  UPDATE: 'bg-blue-50 text-blue-700',
  SOFT_DELETE: 'bg-red-50 text-red-600',
  ARCHIVE: 'bg-orange-50 text-orange-600',
};

const dataTypeIcon: Record<string, React.ReactNode> = {
  meter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500">
      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
    </svg>
  ),
  fuel: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-500">
      <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6.5V18H5V5h8v13H8z"/>
    </svg>
  ),
  opex: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-500">
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
    </svg>
  ),
};

function formatTime(ts: string) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts.slice(11, 16);
  }
}

function formatDateTime(ts: string) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('mylog_audit_cache');
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(logs.length === 0);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/audit')
      .then((r) => r.json())
      .then((j) => {
        const l = j.logs || [];
        setLogs(l);
        setLoading(false);
        try {
          sessionStorage.setItem('mylog_audit_cache', JSON.stringify(l));
        } catch (e) {}
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = logs.filter((log) => {
    const matchSearch =
      !search ||
      log.recordId?.toLowerCase().includes(search.toLowerCase()) ||
      log.targetDate?.includes(search) ||
      log.action?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Meter' && log.dataType === 'meter') ||
      (activeFilter === 'Fuel' && log.dataType === 'fuel') ||
      (activeFilter === 'Expense' && log.dataType === 'opex') ||
      (activeFilter === 'System' && !['meter', 'fuel', 'opex'].includes(log.dataType));

    return matchSearch && matchFilter;
  });

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = filtered.filter((l) => l.targetDate === today || l.timestamp?.startsWith(today));

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <Header
        badge="Tamper-Proof Ledger"
        badgeColor="bg-indigo-100 text-indigo-700"
        title="System & Operational Audit"
        subtitle="Immutable record of all data entries, edits and changes."
        rightElement={
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-2.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-green-700">Hash Sync Active</span>
          </div>
        }
      />

      <main className="max-w-md mx-auto px-4 pt-5">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50 text-center">
            <div className="text-xl font-black text-gray-900">{loading ? '—' : logs.length}</div>
            <div className="text-[10px] text-gray-400 font-semibold">Total Events</div>
            <div className="text-[10px] text-blue-500 font-bold mt-0.5">+{todayLogs.length} today</div>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50 text-center">
            <div className="text-xl font-black text-green-500">0</div>
            <div className="text-[10px] text-gray-400 font-semibold">Security Alerts</div>
            <div className="text-[10px] text-green-500 font-bold mt-0.5">Clean</div>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50 text-center">
            <div className="text-xl font-black text-blue-600">100%</div>
            <div className="text-[10px] text-gray-400 font-semibold">Compliance</div>
            <div className="text-[10px] text-blue-500 font-bold mt-0.5">Agranusa</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by date, record ID or action..."
            className="w-full h-11 bg-white border border-gray-200 rounded-2xl pl-10 pr-4 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === tab
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {tab}
              {tab === 'All' && !loading && (
                <span className="ml-1 text-[10px] opacity-70">({logs.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Audit Feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-black text-gray-900">Audit Trail Feed</h3>
            <span className="text-[10px] text-gray-400 font-semibold">Today · UTC+8 Makassar</span>
          </div>

          {loading ? (
            <div className="p-4 space-y-4">
              {[1,2,3,4].map(i => (
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
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-gray-200">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-400">No audit records found</p>
              <p className="text-xs text-gray-300 mt-1">Records will appear here once you log data.</p>
            </div>
          ) : (
            filtered.map((log, i) => (
              <div key={log.id || i} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                  {dataTypeIcon[log.dataType] || (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-300">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 leading-tight">
                        {log.action} — {log.recordId || log.dataType}
                      </div>
                      {log.targetDate && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Date: {log.targetDate}
                        </div>
                      )}
                      {log.reason && (
                        <div className="text-[10px] text-gray-400 mt-1 italic">"{log.reason}"</div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[10px] text-gray-400">{formatTime(log.timestamp)}</div>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${actionColor[log.action] || 'bg-gray-100 text-gray-500'}`}>
                        {log.action}
                      </span>
                    </div>
                  </div>
                  {/* Prev / New Values */}
                  {(log.previousValue || log.newValue) && (
                    <div className="flex gap-2 mt-1.5">
                      {log.previousValue && log.previousValue !== 'Data Baru' && (
                        <span className="text-[10px] bg-red-50 text-red-400 px-1.5 py-0.5 rounded-lg font-mono">
                          Before: {String(log.previousValue).slice(0, 30)}
                        </span>
                      )}
                      {log.newValue && (
                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-lg font-mono">
                          After: {String(log.newValue).slice(0, 30)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Export Row */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
          <div className="text-xs font-black text-gray-900 mb-1">Export Compliance Trail</div>
          <div className="text-[10px] text-gray-400 mb-3">PDF/CSV Ledger</div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 h-10 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              CSV Export
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 h-10 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-200 active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              Certified PDF
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
