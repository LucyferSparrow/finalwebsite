// POST /api/consultation — save a new consultation booking
export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    await env.DB.exec(`CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      birth TEXT,
      message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

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
    console.error('Consultation save error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Failed to save consultation', message: error.message }),
      { status: 500, headers }
    );
  }
}

// GET /api/consultation — list all consultations (for admin page)
export async function onRequestGet(context) {
  const { env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    await env.DB.exec(`CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      birth TEXT,
      message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);

    const { results } = await env.DB.prepare(
      'SELECT * FROM consultations ORDER BY created_at DESC'
    ).all();

    return new Response(JSON.stringify({ consultations: results }), { headers });
  } catch (error) {
    console.error('Consultation fetch error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch consultations', message: error.message }),
      { status: 500, headers }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
