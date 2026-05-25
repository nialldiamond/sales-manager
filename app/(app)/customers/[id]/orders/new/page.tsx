import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCustomer, listCustomerAddresses } from '@/lib/evox';
import OrderBuilder from '@/components/OrderBuilder';

export default async function NewOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('account_manager_profiles')
    .select('evox_account_manager_id, name')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/settings');

  const { id } = await params;
  const customerId = Number(id);
  if (isNaN(customerId)) notFound();

  const [customer, addressesRes] = await Promise.all([
    getCustomer(customerId).catch(() => null),
    listCustomerAddresses(customerId, { limit: 50 }).catch(() => ({ data: [] })),
  ]);

  if (!customer) notFound();

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
        <Link href={`/customers/${customerId}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          {customer.company}
        </Link>
        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-gray-700 font-medium">New Order</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <p className="text-sm text-gray-500 mt-1">
          Placing on behalf of <span className="font-medium text-gray-700">{customer.company}</span>
          {customer.account_number && <span className="text-gray-400"> · {customer.account_number}</span>}
        </p>
      </div>

      <OrderBuilder
        customer={{
          id: customer.id,
          company: customer.company,
          account_number: customer.account_number,
          admin_email: customer.admin_email,
          phone: customer.phone,
        }}
        addresses={addressesRes.data ?? []}
        accountManager={{
          id: profile.evox_account_manager_id,
          name: profile.name ?? `AM #${profile.evox_account_manager_id}`,
        }}
      />
    </div>
  );
}
