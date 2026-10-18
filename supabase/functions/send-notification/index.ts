import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('EMAIL_FROM');
  const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL');
  if (!resendKey || !fromEmail) return json({ error: 'Email provider is not configured.' }, 503);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Authentication required.' }, 401);
  const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return json({ error: 'Invalid session.' }, 401);

  let payload: { event_type?: string; order_id?: string | null };
  try { payload = await req.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const eventType = payload.event_type;
  const allowedEvents = ['login', 'order_created', 'order_status_changed'];
  if (!eventType || !allowedEvents.includes(eventType)) return json({ error: 'Unsupported event.' }, 400);

  const resend = new Resend(resendKey);
  const displayName = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Pengguna');
  const messages: Array<{ to: string; subject: string; html: string }> = [];

  if (eventType === 'login') {
    messages.push({ to: user.email!, subject: 'Login baru ke Freaze Market', html: `<p>Halo ${escapeHtml(displayName)},</p><p>Akun Freaze Market kamu baru saja digunakan untuk login pada ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB.</p><p>Jika ini bukan kamu, segera amankan akun email dan ubah kata sandi.</p>` });
    if (adminEmail) messages.push({ to: adminEmail, subject: 'Aktivitas login Freaze Market', html: `<p>Login tercatat untuk akun ${escapeHtml(user.email || '')}.</p><p>Waktu: ${new Date().toISOString()}</p>` });
  } else {
    if (!payload.order_id) return json({ error: 'order_id is required.' }, 400);
    const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', payload.order_id).single();
    if (orderError || !order) return json({ error: 'Order not found or access denied.' }, 404);
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const isAdmin = profile?.role === 'admin';
    if (order.user_id !== user.id && !isAdmin) return json({ error: 'Forbidden.' }, 403);
    const status = String(order.status).toUpperCase();
    const invoice = escapeHtml(order.invoice_number);
    if (eventType === 'order_created') {
      messages.push({ to: user.email!, subject: `Invoice ${invoice} dibuat - Freaze Market`, html: `<p>Pesanan kamu telah dibuat.</p><p>Invoice: <strong>${invoice}</strong></p><p>Produk: ${escapeHtml(order.game_name)} - ${escapeHtml(order.package_name)}</p><p>Total: Rp ${Number(order.total_price).toLocaleString('id-ID')}</p><p>Status: PENDING — menunggu verifikasi admin.</p>` });
      if (adminEmail) messages.push({ to: adminEmail, subject: `Pesanan baru ${invoice}`, html: `<p>Pesanan baru memerlukan verifikasi admin.</p><p>Invoice: ${invoice}</p><p>Pemesan: ${escapeHtml(order.buyer_username)} (${escapeHtml(user.email || '')})</p><p>Total: Rp ${Number(order.total_price).toLocaleString('id-ID')}</p>` });
    } else {
      if (!isAdmin) return json({ error: 'Only an admin may notify status changes.' }, 403);
      // buyer_email is captured when the order is created and is visible only through the order's RLS policy.
      const targetEmail = order.buyer_email;
      if (targetEmail) messages.push({ to: targetEmail, subject: `Status invoice ${invoice}: ${status}`, html: `<p>Status pesanan kamu diperbarui.</p><p>Invoice: <strong>${invoice}</strong></p><p>Status baru: <strong>${status}</strong></p>` });
      if (adminEmail) messages.push({ to: adminEmail, subject: `Status pesanan diperbarui: ${invoice}`, html: `<p>Invoice ${invoice} diubah menjadi ${status}.</p>` });
    }
  }

  const results = await Promise.all(messages.map(m => resend.emails.send({ from: fromEmail, to: m.to, subject: m.subject, html: m.html })));
  const failed = results.some(r => r.error);
  if (failed) return json({ error: 'One or more emails could not be sent.', results: results.map(r => ({ error: r.error?.message })) }, 502);
  return json({ sent: results.length });
});

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
