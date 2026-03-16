// POST /api/consultation — save a new consultation booking
export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    if (!env.DB) {
      return new Response(
        JSON.stringify({ error: 'Database not configured. Check D1 binding in Cloudflare dashboard.' }),
        { status: 500, headers }
      );
    }

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS consultations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, date TEXT NOT NULL, type TEXT NOT NULL, birth TEXT, message TEXT, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')))`
    ).run();
    // Migrate: add status column if table existed before this change
    try { await env.DB.prepare(`ALTER TABLE consultations ADD COLUMN status TEXT DEFAULT 'pending'`).run(); } catch {}

    const { name, email, date, type, birth, message } = await request.json();

    if (!name || !email || !date || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, date, type' }),
        { status: 400, headers }
      );
    }

    await env.DB.prepare(
      'INSERT INTO consultations (name, email, date, type, birth, message) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(name, email, date, type, birth || '', message || '').run();

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (error) {
    console.error('Consultation save error:', error.message, error.stack);
    return new Response(
      JSON.stringify({ error: 'Failed to save consultation', detail: error.message }),
      { status: 500, headers }
    );
  }
}

// GET /api/consultation — list all consultations (for admin page)
export async function onRequestGet(context) {
  const { env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    if (!env.DB) {
      return new Response(
        JSON.stringify({ error: 'Database not configured. Check D1 binding in Cloudflare dashboard.' }),
        { status: 500, headers }
      );
    }

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS consultations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, date TEXT NOT NULL, type TEXT NOT NULL, birth TEXT, message TEXT, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')))`
    ).run();

    const { results } = await env.DB.prepare(
      'SELECT * FROM consultations ORDER BY created_at DESC'
    ).all();

    return new Response(JSON.stringify({ consultations: results }), { headers });
  } catch (error) {
    console.error('Consultation fetch error:', error.message, error.stack);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch consultations', detail: error.message }),
      { status: 500, headers }
    );
  }
}

// PATCH /api/consultation — mark consultation as done/pending (admin)
export async function onRequestPatch(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return new Response(JSON.stringify({ error: 'id and status required' }), { status: 400, headers });
    }

    await env.DB.prepare('UPDATE consultations SET status = ? WHERE id = ?').bind(status, id).run();
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

// DELETE /api/consultation — delete a consultation (admin)
export async function onRequestDelete(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers });
    }

    await env.DB.prepare('DELETE FROM consultations WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
