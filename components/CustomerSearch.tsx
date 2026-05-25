'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { EvoxCustomer } from '@/types';

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function CustomerSearch({ customers }: { customers: EvoxCustomer[] }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return customers.filter(c => {
      const matchesQuery =
        !q ||
        c.company.toLowerCase().includes(q) ||
        (c.account_number ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q) ||
        (c.admin_email ?? '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && c.enabled) ||
        (statusFilter === 'inactive' && !c.enabled);

      return matchesQuery && matchesStatus;
    });
  }, [customers, query, statusFilter]);

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by company, account #, phone or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      {/* Count */}
      <div className="px-4 py-2 border-b border-gray-50 text-xs text-gray-400">
        {filtered.length} of {customers.length} customers
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          {customers.length === 0
            ? 'No customers assigned to your account manager ID.'
            : 'No customers match your search.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Account #</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Phone</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Email</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Created</th>
                <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 pl-4 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-600">
                          {c.company.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 text-sm transition-colors"
                        >
                          {c.company}
                        </Link>
                        {c.account_number && (
                          <div className="text-xs text-gray-400 md:hidden">{c.account_number}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                    {c.account_number ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-3.5 text-sm text-gray-500 hidden lg:table-cell">
                    {c.phone ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-3.5 text-sm text-gray-500 hidden lg:table-cell">
                    {c.admin_email ? (
                      <a href={`mailto:${c.admin_email}`} className="hover:text-blue-600 transition-colors">
                        {c.admin_email}
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.enabled
                        ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                        : 'bg-gray-100 text-gray-500 ring-1 ring-gray-500/20'
                    }`}>
                      {c.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-sm text-gray-400 hidden sm:table-cell whitespace-nowrap">
                    {fmtDate(c.created_at)}
                  </td>
                  <td className="py-3.5 pl-3 pr-4 text-right">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
