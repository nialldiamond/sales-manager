import type {
  EvoxCustomer, EvoxOrder, EvoxUser, EvoxAccountManager, EvoxListResponse,
  EvoxProduct, EvoxAddress, CreateOrderPayload,
} from '@/types';

const BASE_URL = process.env.EVOX_API_BASE_URL ?? 'https://us.evoapi.io';
const TOKEN = process.env.EVOX_API_TOKEN;

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.evolutionx.v1+json',
    'Content-Type': 'application/json',
  };
}

type Params = Record<string, string | number | boolean | undefined | null>;

async function evoxFetch<T>(path: string, params?: Params): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      if (val != null) url.searchParams.set(key, String(val));
    }
  }
  const res = await fetch(url.toString(), {
    headers: headers(),
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`EvoX ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function listCustomers(params?: {
  account_manager?: number;
  limit?: number;
  from_id?: number;
  enabled?: boolean;
  company?: string;
}): Promise<EvoxListResponse<EvoxCustomer>> {
  return evoxFetch('/customers', params as Params);
}

export async function getCustomer(id: number): Promise<EvoxCustomer> {
  return evoxFetch(`/customers/${id}`);
}

export async function listOrders(params?: {
  customer?: number;
  limit?: number;
  from_id?: number;
  status?: number;
}): Promise<EvoxListResponse<EvoxOrder>> {
  return evoxFetch('/orders', params as Params);
}

export async function listCustomerUsers(
  customerId: number,
  params?: { limit?: number; from_id?: number }
): Promise<EvoxListResponse<EvoxUser>> {
  return evoxFetch(`/customers/${customerId}/users`, params as Params);
}

export async function searchProductBySku(
  sku: string
): Promise<EvoxListResponse<EvoxProduct>> {
  return evoxFetch('/products', { sku, limit: 5 });
}

export async function listCustomerAddresses(
  customerId: number,
  params?: { limit?: number }
): Promise<EvoxListResponse<EvoxAddress>> {
  return evoxFetch(`/customers/${customerId}/addresses`, { limit: params?.limit ?? 20 } as Params);
}

export async function createOrder(payload: CreateOrderPayload): Promise<EvoxOrder> {
  const url = new URL(`${BASE_URL}/orders`);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`EvoX ${res.status}: ${text}`);
  }
  return res.json() as Promise<EvoxOrder>;
}

export async function listAccountManagers(params?: {
  limit?: number;
  from_id?: number;
  ids?: string;
  name?: string;
  email?: string;
}): Promise<EvoxListResponse<EvoxAccountManager>> {
  return evoxFetch('/account-managers', params as Params);
}
