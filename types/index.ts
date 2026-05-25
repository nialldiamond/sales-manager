export interface EvoxCustomer {
  id: number;
  company: string;
  account_number: string | null;
  phone: string | null;
  fax: string | null;
  admin_email: string | null;
  tax_number: string | null;
  company_number: string | null;
  parent_id: number | null;
  enabled: boolean;
  account_manager: { id: number; name: string; email: string | null } | null;
  seller_reference: string | null;
  credit_account_status: number;
  rewards_status: number;
  created_at: number;
  updated_at: number;
}

export interface EvoxOrder {
  id: number;
  customer: {
    id: number;
    name: string;
    company: string;
    email: string | null;
    account_number: string | null;
  };
  po_reference: string | null;
  note: string | null;
  total: number;
  subtotal: number;
  tax: number;
  shipping_amount: number;
  discount: number;
  currency: string;
  status_id: number;
  status: string;
  source: number;
  created_at: number;
  updated_at: number;
}

export interface EvoxUser {
  id: number;
  customer_id: number;
  name: string | null;
  email: string;
  phone: string | null;
  cell: string | null;
  username: string | null;
  role_id: number;
  role_name: string | null;
  enabled: boolean;
  seller_reference: string | null;
  created_at: number;
  updated_at: number;
}

export interface EvoxAccountManager {
  id: number;
  name: string;
  email: string;
  seller_reference: string | null;
  enabled: boolean;
  created_at: number;
}

export interface EvoxListResponse<T> {
  data: T[];
  meta?: {
    cursor?: {
      current: number;
      next: number | null;
      count: number;
    };
  };
}

export interface AccountManagerProfile {
  id: string;
  evox_account_manager_id: number;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvoxProduct {
  id: number;
  title: string;
  sku: string;
  price: number;
  cost_price: number;
  pack: number;
  pack_uom: string | null;
  pack_include: string | null;
  enabled: boolean;
  is_visible: number;
  catalog_id?: number;
  supplier_id?: number;
}

export interface EvoxAddress {
  id: number;
  title: string | null;
  code: string | null;
  name: string | null;
  company: string | null;
  phone: string | null;
  line_1: string;
  line_2: string | null;
  line_3: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  note: string | null;
  type_id: number;
  enabled: boolean;
}

export interface OrderLineItem {
  sku: string;
  title: string;
  quantity: number;
  item_price: number;
  total: number;
  subtotal: number;
  tax: number;
  notes: string;
}

export interface CreateOrderPayload {
  customer: {
    id: number;
    name: string;
    company: string;
    account_number: string | null;
    email: string | null;
    phone: string | null;
  };
  shipping_address: {
    line_1: string;
    line_2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country: string;
    name?: string;
    company?: string;
    phone?: string;
  };
  po_reference?: string;
  note?: string;
  items: OrderLineItem[];
  shipping: {
    title: string;
    label: string;
    items_count: number;
    weight: number;
    subtotal: number;
    tax: number;
  }[];
  payment: {
    title: string;
    surcharge: number;
    total: number;
    status_id: number;
  }[];
  total: number;
  subtotal: number;
  subtotal_with_discount: number;
  tax: number;
  shipping_amount: number;
  discount: number;
  coupon_discount: number;
  shipping_tax: number;
  status_id: number;
}
