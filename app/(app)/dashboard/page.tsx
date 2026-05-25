import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { listCustomers } from '@/lib/evox';
import type { EvoxCustomer } from '@/types';
import CustomerSearch from '@/components/CustomerSearch';

async function getAllCustomers(accountManagerId: number): Promise<EvoxCustomer[]> {
  const customers: EvoxCustomer[] = [];
  let fromId: number | undefined;

  // Paginate up to 500 customers
  for (let i = 0; i < 5; i++) {
    const res = await listCustomers({
      account_manager: accountManagerId,
      limit: 100,
      from_id: fromId,
    });
    if (!res.data || res.data.length === 0) break;
    customers.push(...res.data);
    const next = res.meta?.cursor?.next;
    if (!next) break;
    fromId = next;
  }

  return customers;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('account_manager_profiles')
    .select('evox_account_manager_id, name')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/settings');

  let customers: EvoxCustomer[] = [];
  let fetchError = '';

  try {
    customers = await getAllCustomers(profile.evox_account_manager_id);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load customers';
  }

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.enabled).length;
  const inactiveCustomers = totalCustomers - activeCustomers;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          My Customers
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Account manager: <span className="font-medium text-gray-700">{profile.name ?? `ID ${profile.evox_account_manager_id}`}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Customers" value={totalCustomers} icon="users" color="blue" />
        <StatCard label="Active" value={activeCustomers} icon="check" color="green" />
        <StatCard label="Inactive" value={inactiveCustomers} icon="x" color="gray" />
      </div>

      {fetchError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm text-red-700">
            <strong>EvoX API error:</strong> {fetchError}
          </p>
        </div>
      )}

      {/* Customer list (client component handles search) */}
      <CustomerSearch customers={customers} />
    </div>
  );
}

function StatCard({
  label, value, icon, color,
}: {
  label: string;
  value: number;
  icon: 'users' | 'check' | 'x';
  color: 'blue' | 'green' | 'gray';
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    gray: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {icon === 'users' && (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        )}
        {icon === 'check' && (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {icon === 'x' && (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
