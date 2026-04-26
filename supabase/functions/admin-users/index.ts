import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle browser preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Admin client — bypasses RLS and can create/delete auth users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify the caller is a logged-in admin
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !caller) return json({ error: 'Not authenticated' }, 401)

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', caller.id).single()
    if (callerProfile?.role !== 'admin') return json({ error: 'Admin access required' }, 403)

    const { action, ...body } = await req.json()

    // ── CREATE new user ───────────────────────────────────────────────────────
    if (action === 'create') {
      const { email, password, full_name, role } = body

      if (!email || !password || !full_name) {
        return json({ error: 'email, password and full_name are required' }, 400)
      }

      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,   // skip email verification — user can log in immediately
      })
      if (error) return json({ error: error.message }, 400)

      await supabaseAdmin.from('profiles').upsert({
        id:        newUser.user.id,
        email,
        full_name,
        role:      role || 'student',
      })

      return json({ success: true, userId: newUser.user.id })
    }

    // ── UPDATE existing user's profile ────────────────────────────────────────
    if (action === 'update') {
      const { userId, full_name, role } = body
      if (!userId) return json({ error: 'userId is required' }, 400)

      await supabaseAdmin
        .from('profiles')
        .update({ full_name, role })
        .eq('id', userId)

      return json({ success: true })
    }

    // ── DELETE user (profile + auth account) ──────────────────────────────────
    if (action === 'delete') {
      const { userId } = body
      if (!userId) return json({ error: 'userId is required' }, 400)

      await supabaseAdmin.from('profiles').delete().eq('id', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)

      return json({ success: true })
    }

    return json({ error: `Unknown action: ${action}` }, 400)

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return json({ error: msg }, 500)
  }
})
