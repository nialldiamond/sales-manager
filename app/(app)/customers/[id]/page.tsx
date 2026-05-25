import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCustomer, listOrders, listCustomerUsers } from '@/lib/evox';
import CustomerTabs from '@/components/CustomerTabs';
import type { EvoxCustomer, EvoxOrder, EvoxUser } from '@/types';

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function fmtCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ order_created?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const { order_created } = await searchParams;
  const customerId = Number(id);
  if (isNaN(customerId)) notFound();

  let customer: EvoxCustomer | null = null;
  let orders: EvoxOrder[] = [];
  let users: EvoxUser[] = [];

  try {
    [customer, , ] = await Promise.all([
      getCustomer(customerId).catch(() => null),
      Promise.resolve(),
      Promise.resolve(),
    ]);
    if (!customer) notFound();

    const [ordersRes, usersRes] = await Promise.all([
      listOrders({ customer: customerId, limit: 50 }).catch(() => ({ data: [] })),
      listCustomerUsers(customerId, { limit: 50 }).catch(() => ({ data: [] })),
    ]);
    orders = ordersRes.data ?? [];
    users = usersRes.data ?? [];
  } catch {
    notFound();
  }

  // Compute order stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;
  const lastOrder = orders[0] ? fmtDate(orders[0].created_at) : 'Never';
  const currency = orders[0]?.currency ?? 'USD';

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
          My Customers
        </Link>
        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-gray-700 font-medium">{customer!.company}</span>
      </nav>

      {/* Order created banner */}
      {order_created !== undefined && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-800 font-medium">
            Order {order_created ? `#${order_created}` : ''} created successfully.
          </p>
        </div>
      )}

      {/* Customer header */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-blue-600">
                {customer!.company.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{customer!.company}</h1>
              {customer!.account_number && (
                <p className="text-sm text-gray-500">Account # {customer!.account_number}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              customer!.enabled
                ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                : 'bg-gray-100 text-gray-500 ring-1 ring-gray-500/20'
            }`}>
              {customer!.enabled ? 'Active' : 'Inactive'}
            </span>
            <Link
              href={`/customers/${customerId}/orders/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Order
            </Link>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Phone', value: customer!.phone },
            { label: 'Email', value: customer!.admin_email },
            { label: 'Customer ID', value: String(customer!.id) },
            { label: 'Created', value: fmtDate(customer!.created_at) },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</dt>
              <dd className="mt-0.5 text-sm text-gray-700 break-all">
                {value || <span className="text-gray-300">—</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Order stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: orders.length.toLocaleString() },
          { label: 'Total Revenue', value: fmtCurrency(totalRevenue, currency) },
          { label: 'Avg Order Value', value: fmtCurrency(avgOrder, currency) },
          { label: 'Last Order', value: lastOrder },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
            <p className="mt-1 text-lg font-bold text-gray-900 truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs: Orders + Users */}
      <CustomerTabs orders={orders} users={users} />
    </div>
  );
}
