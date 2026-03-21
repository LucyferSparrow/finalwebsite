async function verifyAdmin(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return false;
  const session = await env.DB.prepare(
    `SELECT * FROM admin_sessions WHERE token = ? AND datetime(created_at, '+24 hours') > datetime('now')`
  ).bind(token).first();
  return !!session;
}

const DEFAULT_DEVI_NAMES = [
  'Mahakali',
  'Tara',
  'Tripura Sundari',
  'Bhuvaneshwari',
  'Bhairavi',
  'Chinnamasta',
  'Dhumavati',
  'Bagalamukhi',
  'Matangi',
  'Kamala',
  'Brahmani',
  'Maheshvari',
  'Kaumari',
  'Vaishnavi',
  'Varahi',
  'Indrani',
  'Chamunda',
  'Narasimhi',
  'Shailaputri',
  'Brahmacharini',
  'Chandraghanta',
  'Kushmanda',
  'Skandamata',
  'Katyayani',
  'Kalaratri',
  'Mahagauri',
  'Siddhidatri',
  'Durga',
  'Lakshmi',
  'Saraswati',
  'Parvati',
  'Mahamaya',
  'Mahalakshmi',
];

async function ensureTableAndSeed(DB) {
  await DB.prepare(
    `CREATE TABLE IF NOT EXISTS devis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  ).run();
  try { await DB.prepare(`ALTER TABLE devis ADD COLUMN url TEXT`).run(); } catch {}

  const countRow = await DB.prepare('SELECT COUNT(*) as count FROM devis').first();
  const count = Number(countRow?.count || 0);
  if (count > 0) return;

  for (const name of DEFAULT_DEVI_NAMES) {
    await DB.prepare('INSERT OR IGNORE INTO devis (name) VALUES (?)').bind(name).run();
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    if (!env.DB) return new Response(JSON.stringify({ devis: [] }), { headers });
    await ensureTableAndSeed(env.DB);

    const url = new URL(request.url);
    const wantRandom = url.searchParams.get('random') === '1';
    if (wantRandom) {
      const row = await env.DB.prepare('SELECT id, name, url FROM devis ORDER BY RANDOM() LIMIT 1').first();
      return new Response(JSON.stringify({ devi: row || null }), { headers });
    }

    const { results } = await env.DB.prepare(
      'SELECT id, name, url, created_at FROM devis ORDER BY name COLLATE NOCASE ASC'
    ).all();
    return new Response(JSON.stringify({ devis: results || [] }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    if (!await verifyAdmin(request, env)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }
    await ensureTableAndSeed(env.DB);
    const { name, url } = await request.json();
    const cleanName = (name || '').trim();
    const cleanUrl = (url || '').trim();
    if (!cleanName) {
      return new Response(JSON.stringify({ error: 'Name required' }), { status: 400, headers });
    }
    await env.DB.prepare('INSERT OR IGNORE INTO devis (name, url) VALUES (?, ?)').bind(cleanName, cleanUrl).run();
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    if (!await verifyAdmin(request, env)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }
    await ensureTableAndSeed(env.DB);
    const { id, name, url } = await request.json();
    const cleanName = (name || '').trim();
    const cleanUrl = (url || '').trim();
    if (!id || !cleanName) {
      return new Response(JSON.stringify({ error: 'id and name required' }), { status: 400, headers });
    }
    await env.DB.prepare('UPDATE devis SET name = ?, url = ? WHERE id = ?').bind(cleanName, cleanUrl, id).run();
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    if (!await verifyAdmin(request, env)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }
    await ensureTableAndSeed(env.DB);
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers });
    }
    await env.DB.prepare('DELETE FROM devis WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
