import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listOrders } from '@/lib/evox';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sp = request.nextUrl.searchParams;
  const from_id = sp.get('from_id');
  const limit = sp.get('limit');

  try {
    const data = await listOrders({
      customer: Number(id),
      from_id: from_id ? Number(from_id) : undefined,
      limit: limit ? Number(limit) : 50,
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
