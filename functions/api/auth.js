// POST /api/auth — admin login
// Returns a session token valid for 24 hours
export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers });
    }

    const { password } = await request.json();
    if (!password) {
      return new Response(JSON.stringify({ error: 'Password required' }), { status: 400, headers });
    }

    // Compare against stored password (env var)
    const adminPassword = env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return new Response(JSON.stringify({ error: 'Admin password not configured' }), { status: 500, headers });
    }

    if (password !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 401, headers });
    }

    // Create session table if needed
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY, created_at TEXT DEFAULT (datetime('now')))`
    ).run();

    // Clean expired sessions (older than 24h)
    await env.DB.prepare(
      `DELETE FROM admin_sessions WHERE datetime(created_at, '+24 hours') < datetime('now')`
    ).run();

    // Generate token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    await env.DB.prepare('INSERT INTO admin_sessions (token) VALUES (?)').bind(token).run();

    return new Response(JSON.stringify({ success: true, token }), { headers });
  } catch (error) {
    console.error('Auth error:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

// GET /api/auth — verify session token
export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ valid: false }), { status: 401, headers });
    }

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY, created_at TEXT DEFAULT (datetime('now')))`
    ).run();

    const session = await env.DB.prepare(
      `SELECT * FROM admin_sessions WHERE token = ? AND datetime(created_at, '+24 hours') > datetime('now')`
    ).bind(token).first();

    if (!session) {
      return new Response(JSON.stringify({ valid: false }), { status: 401, headers });
    }

    return new Response(JSON.stringify({ valid: true }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ valid: false, error: error.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
