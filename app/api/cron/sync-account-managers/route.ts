import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { listAccountManagers } from '@/lib/evox';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results = { upserted: 0, errors: 0 };

  let cursor: number | undefined;

  do {
    const response = await listAccountManagers({ limit: 100, from_id: cursor });
    const managers = response.data;
    if (!managers.length) break;

    const rows = managers.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      seller_reference: m.seller_reference,
      enabled: m.enabled,
      evox_created_at: m.created_at ? new Date(m.created_at * 1000).toISOString() : null,
      synced_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('account_managers')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Upsert error:', error.message);
      results.errors += rows.length;
    } else {
      results.upserted += rows.length;
    }

    cursor = response.has_more ? response.last_id : undefined;
  } while (cursor);

  return NextResponse.json(results);
}
