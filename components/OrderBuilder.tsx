'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { EvoxAddress, EvoxProduct } from '@/types';

interface LineItem {
  key: string;
  sku: string;
  title: string;
  quantity: number;
  unit_price: number;
  searching: boolean;
  notFound: boolean;
  titleEditable: boolean;
  priceEditable: boolean;
}

interface Props {
  customer: {
    id: number;
    company: string;
    account_number: string | null;
    admin_email: string | null;
    phone: string | null;
  };
  addresses: EvoxAddress[];
  accountManager: { id: number; name: string };
}

function emptyLine(): LineItem {
  return {
    key: crypto.randomUUID(),
    sku: '',
    title: '',
    quantity: 1,
    unit_price: 0,
    searching: false,
    notFound: false,
    titleEditable: false,
    priceEditable: false,
  };
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function buildAmNote(amName: string, amId: number, userNote: string): string {
  const stamp = `---\nPlaced via Sales Manager Hub\nAccount Manager: ${amName} (ID: ${amId})\nDate: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  return userNote.trim() ? `${userNote.trim()}\n\n${stamp}` : stamp;
}

export default function OrderBuilder({ customer, addresses, accountManager }: Props) {
  const router = useRouter();
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [paymentMethod, setPaymentMethod] = useState<'po' | 'account'>('po');
  const [poReference, setPoReference] = useState('');
  const [note, setNote] = useState('');

  // Shipping address
  const [addressMode, setAddressMode] = useState<'saved' | 'manual'>(addresses.length > 0 ? 'saved' : 'manual');
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.length > 0 ? String(addresses[0].id) : ''
  );
  const [manualAddress, setManualAddress] = useState({
    line_1: '', city: '', state: '', zip: '', country: 'US', name: '', phone: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ---- line item helpers ----
  const updateLine = useCallback((key: string, patch: Partial<LineItem>) => {
    setLines(prev => prev.map(l => l.key === key ? { ...l, ...patch } : l));
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines(prev => prev.length > 1 ? prev.filter(l => l.key !== key) : prev);
  }, []);

  async function searchSku(key: string, sku: string) {
    if (!sku.trim()) return;
    updateLine(key, { searching: true, notFound: false });
    try {
      const res = await fetch(`/api/products/search?sku=${encodeURIComponent(sku.trim())}`);
      const data = await res.json() as { data?: EvoxProduct[]; error?: string };
      const product = data.data?.[0];
      if (product) {
        updateLine(key, {
          searching: false,
          title: product.title,
          unit_price: product.price ?? 0,
          titleEditable: true,
          priceEditable: true,
          notFound: false,
        });
      } else {
        updateLine(key, { searching: false, notFound: true, titleEditable: true, priceEditable: true });
      }
    } catch {
      updateLine(key, { searching: false, notFound: true, titleEditable: true, priceEditable: true });
    }
  }

  // ---- computed totals ----
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const total = subtotal;

  // ---- shipping address for payload ----
  function getShippingAddress() {
    if (addressMode === 'saved' && selectedAddressId) {
      const addr = addresses.find(a => String(a.id) === selectedAddressId);
      if (addr) {
        return {
          line_1: addr.line_1,
          line_2: addr.line_2 ?? undefined,
          city: addr.city ?? undefined,
          state: addr.state ?? undefined,
          zip: addr.zip ?? undefined,
          country: addr.country,
          name: addr.name ?? customer.company,
          company: addr.company ?? customer.company,
          phone: addr.phone ?? customer.phone ?? undefined,
        };
      }
    }
    return {
      line_1: manualAddress.line_1,
      city: manualAddress.city || undefined,
      state: manualAddress.state || undefined,
      zip: manualAddress.zip || undefined,
      country: manualAddress.country || 'US',
      name: manualAddress.name || customer.company,
      phone: manualAddress.phone || customer.phone || undefined,
    };
  }

  // ---- submit ----
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validLines = lines.filter(l => l.sku.trim() && l.title.trim() && l.unit_price > 0);
    if (validLines.length === 0) {
      setSubmitError('Add at least one line item with SKU, title, and price.');
      return;
    }
    if (paymentMethod === 'po' && !poReference.trim()) {
      setSubmitError('Enter a PO reference or switch to On Account.');
      return;
    }
    const shippingAddr = getShippingAddress();
    if (!shippingAddr.line_1) {
      setSubmitError('A shipping address line 1 is required.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const finalNote = buildAmNote(accountManager.name, accountManager.id, note);

    const payload = {
      customer: {
        id: customer.id,
        name: customer.company,
        company: customer.company,
        account_number: customer.account_number,
        email: customer.admin_email,
        phone: customer.phone,
      },
      shipping_address: shippingAddr,
      po_reference: paymentMethod === 'po' ? poReference.trim() : undefined,
      note: finalNote,
      items: validLines.map(l => ({
        sku: l.sku.trim(),
        title: l.title.trim(),
        quantity: l.quantity,
        item_price: l.unit_price,
        subtotal: +(l.quantity * l.unit_price).toFixed(2),
        tax: 0,
        total: +(l.quantity * l.unit_price).toFixed(2),
        notes: '',
      })),
      shipping: [{
        title: 'Standard',
        label: 'Standard',
        items_count: validLines.reduce((s, l) => s + l.quantity, 0),
        weight: 0,
        subtotal: 0,
        tax: 0,
      }],
      payment: [{
        title: paymentMethod === 'po' ? `PO: ${poReference.trim()}` : 'On Account',
        surcharge: 0,
        total: +total.toFixed(2),
        status_id: 10, // Awaiting Payment
      }],
      total: +total.toFixed(2),
      subtotal: +subtotal.toFixed(2),
      subtotal_with_discount: +subtotal.toFixed(2),
      tax: 0,
      shipping_amount: 0,
      discount: 0,
      coupon_discount: 0,
      shipping_tax: 0,
      status_id: 1, // Pending
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Failed to create order.');
        setSubmitting(false);
      } else {
        router.push(`/customers/${customer.id}?order_created=${data.id ?? ''}`);
        router.refresh();
      }
    } catch {
      setSubmitError('Network error — please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Line items */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Line Items</h2>
          <button
            type="button"
            onClick={() => setLines(prev => [...prev, emptyLine()])}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            + Add row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-2.5 pl-5 pr-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">SKU</th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Title</th>
                <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Qty</th>
                <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Unit Price</th>
                <th className="px-2 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide w-24 pr-5">Total</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map(line => (
                <tr key={line.key}>
                  {/* SKU */}
                  <td className="py-2.5 pl-5 pr-2">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="SKU"
                        value={line.sku}
                        onChange={e => updateLine(line.key, { sku: e.target.value, notFound: false })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); searchSku(line.key, line.sku); }
                        }}
                        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => searchSku(line.key, line.sku)}
                        disabled={line.searching || !line.sku.trim()}
                        title="Look up SKU"
                        className="flex-shrink-0 rounded-md border border-gray-200 px-2 py-1.5 text-gray-400 hover:text-blue-600 hover:border-blue-300 disabled:opacity-40 transition-colors"
                      >
                        {line.searching ? (
                          <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {line.notFound && (
                      <p className="text-xs text-amber-600 mt-0.5">Not found — enter details manually</p>
                    )}
                  </td>

                  {/* Title */}
                  <td className="px-2 py-2.5">
                    <input
                      type="text"
                      placeholder={line.sku ? 'Product title' : 'Search by SKU first'}
                      value={line.title}
                      onChange={e => updateLine(line.key, { title: e.target.value })}
                      readOnly={!line.titleEditable && !line.notFound}
                      className={`w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        line.titleEditable || line.notFound
                          ? 'border-gray-200 text-gray-900 placeholder-gray-400'
                          : 'border-transparent bg-transparent text-gray-400 cursor-default'
                      }`}
                    />
                  </td>

                  {/* Qty */}
                  <td className="px-2 py-2.5">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={line.quantity}
                      onChange={e => updateLine(line.key, { quantity: Math.max(1, Number(e.target.value)) })}
                      className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>

                  {/* Unit price */}
                  <td className="px-2 py-2.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={line.unit_price}
                        onChange={e => updateLine(line.key, { unit_price: Math.max(0, Number(e.target.value)) })}
                        readOnly={!line.priceEditable && !line.notFound}
                        className={`w-full rounded-md border pl-5 pr-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          line.priceEditable || line.notFound
                            ? 'border-gray-200 text-gray-900'
                            : 'border-transparent bg-transparent text-gray-400 cursor-default'
                        }`}
                      />
                    </div>
                  </td>

                  {/* Line total */}
                  <td className="px-2 py-2.5 pr-5 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                    {fmtCurrency(line.quantity * line.unit_price)}
                  </td>

                  {/* Remove */}
                  <td className="pr-2">
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      disabled={lines.length === 1}
                      className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50/50">
                <td colSpan={4} className="py-3 pl-5 text-sm font-semibold text-gray-700">
                  Order Total
                </td>
                <td className="py-3 pr-5 text-right text-base font-bold text-gray-900 whitespace-nowrap">
                  {fmtCurrency(total)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Shipping address */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Shipping Address</h2>

          {addresses.length > 0 && (
            <div className="flex gap-3 mb-4">
              {(['saved', 'manual'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAddressMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    addressMode === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m === 'saved' ? 'Saved addresses' : 'Custom'}
                </button>
              ))}
            </div>
          )}

          {addressMode === 'saved' && addresses.length > 0 ? (
            <select
              value={selectedAddressId}
              onChange={e => setSelectedAddressId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {addresses.map(a => (
                <option key={a.id} value={String(a.id)}>
                  {[a.title, a.line_1, a.city, a.state].filter(Boolean).join(' · ')}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Name / Attention', placeholder: customer.company },
                { key: 'line_1', label: 'Address Line 1', placeholder: '123 Main St', required: true },
                { key: 'city', label: 'City', placeholder: 'City' },
                { key: 'state', label: 'State', placeholder: 'CA' },
                { key: 'zip', label: 'ZIP / Postal Code', placeholder: '90210' },
                { key: 'country', label: 'Country Code', placeholder: 'US' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-500 mb-0.5">
                    {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={manualAddress[f.key as keyof typeof manualAddress]}
                    onChange={e => setManualAddress(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment & note */}
        <div className="space-y-4">

          {/* Payment method */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="flex gap-2 mb-4">
              {(['po', 'account'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    paymentMethod === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m === 'po' ? 'PO Reference' : 'On Account'}
                </button>
              ))}
            </div>
            {paymentMethod === 'po' ? (
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  PO Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-001"
                  value={poReference}
                  onChange={e => setPoReference(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Order will be charged to {customer.company}&apos;s credit account.
              </p>
            )}
          </div>

          {/* Note */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Order Note <span className="text-gray-400 font-normal">(optional)</span></h2>
            <textarea
              rows={3}
              placeholder="Any notes for this order…"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-400 font-mono whitespace-pre-line">
              {buildAmNote(accountManager.name, accountManager.id, note)}
            </div>
            <p className="text-xs text-gray-400 mt-1">The section above is automatically appended to every order you create.</p>
          </div>
        </div>
      </div>

      {/* Errors & submit */}
      {submitError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || lines.every(l => !l.sku.trim())}
          className="flex items-center gap-2 py-2.5 px-6 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating order…
            </>
          ) : (
            <>Place Order — {fmtCurrency(total)}</>
          )}
        </button>
      </div>
    </form>
  );
}
