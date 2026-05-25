'use client';

import { useState } from 'react';
import type { EvoxOrder, EvoxUser } from '@/types';

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function fmtCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

const ORDER_STATUS_COLORS: Record<number, string> = {
  1: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',   // Pending
  2: 'bg-blue-50 text-blue-700 ring-blue-600/20',          // Processing
  3: 'bg-blue-50 text-blue-700 ring-blue-600/20',          // On Hold
  4: 'bg-purple-50 text-purple-700 ring-purple-600/20',    // Backordered
  5: 'bg-green-50 text-green-700 ring-green-600/20',       // Complete
  6: 'bg-green-50 text-green-700 ring-green-600/20',       // Shipped
  7: 'bg-green-50 text-green-700 ring-green-600/20',       // Delivered
  8: 'bg-red-50 text-red-700 ring-red-600/20',             // Cancelled
  9: 'bg-red-50 text-red-700 ring-red-600/20',             // Refunded
};

export default function CustomerTabs({
  orders,
  users,
}: {
  orders: EvoxOrder[];
  users: EvoxUser[];
}) {
  const [tab, setTab] = useState<'orders' | 'users'>('orders');

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-100 px-4 pt-3">
        {(['orders', 'users'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize ${
              tab === t
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'orders' ? `Orders (${orders.length})` : `Users (${users.length})`}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab === 'orders' && (
        orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No orders found for this customer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Order ID</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">PO Reference</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide pr-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 pl-4 pr-3 text-sm font-medium text-gray-900">
                      #{o.id}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-gray-500 hidden sm:table-cell whitespace-nowrap">
                      {fmtDate(o.created_at)}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                      {o.po_reference || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                        ORDER_STATUS_COLORS[o.status_id] ?? 'bg-gray-100 text-gray-500 ring-gray-500/20'
                      }`}>
                        {o.status || `Status ${o.status_id}`}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-sm font-semibold text-gray-900 text-right pr-4 whitespace-nowrap">
                      {fmtCurrency(o.total, o.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/50 border-t border-gray-200">
                  <td colSpan={4} className="py-3 pl-4 pr-3 text-sm font-semibold text-gray-700 hidden md:table-cell">
                    Total ({orders.length} orders)
                  </td>
                  <td colSpan={4} className="py-3 pl-4 pr-3 text-sm font-semibold text-gray-700 md:hidden">
                    Total
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-gray-900 text-right pr-4">
                    {fmtCurrency(
                      orders.reduce((s, o) => s + (o.total ?? 0), 0),
                      orders[0]?.currency ?? 'USD'
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      )}

      {/* Users tab */}
      {tab === 'users' && (
        users.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No users found for this customer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Role</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-500">
                            {(u.name ?? u.email).slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {u.name || <span className="text-gray-400 font-normal">Unnamed</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-sm text-gray-500">
                      <a href={`mailto:${u.email}`} className="hover:text-blue-600 transition-colors break-all">
                        {u.email}
                      </a>
                    </td>
                    <td className="px-3 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                      {u.phone ?? u.cell ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-gray-500 hidden lg:table-cell">
                      {u.role_name ?? `Role ${u.role_id}`}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                        u.enabled
                          ? 'bg-green-50 text-green-700 ring-green-600/20'
                          : 'bg-gray-100 text-gray-500 ring-gray-500/20'
                      }`}>
                        {u.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
