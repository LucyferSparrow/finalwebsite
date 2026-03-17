// /api/courses — CRUD for courses stored in D1
// GET: list all courses (public)
// POST: create course (admin only)
// DELETE: delete course (admin only)
// PATCH: update course (admin only)

async function verifyAdmin(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return false;
  try {
    const session = await env.DB.prepare(
      `SELECT * FROM admin_sessions WHERE token = ? AND datetime(created_at, '+24 hours') > datetime('now')`
    ).bind(token).first();
    return !!session;
  } catch { return false; }
}

async function ensureTable(DB) {
  await DB.prepare(
    `CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, title TEXT NOT NULL, level TEXT NOT NULL, author TEXT, date TEXT, image TEXT, content TEXT, icon TEXT, created_at TEXT DEFAULT (datetime('now')))`
  ).run();
}

// GET /api/courses — public, returns all courses
export async function onRequestGet(context) {
  const { env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ courses: [] }), { headers });
    }
    await ensureTable(env.DB);

    const { results } = await env.DB.prepare(
      'SELECT * FROM courses ORDER BY created_at DESC'
    ).all();

    return new Response(JSON.stringify({ courses: results || [] }), { headers });
  } catch (error) {
    console.error('Courses GET error:', error.message);
    return new Response(JSON.stringify({ courses: [], error: error.message }), { headers });
  }
}

// POST /api/courses — admin only, create a new course
export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    if (!await verifyAdmin(request, env)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    await ensureTable(env.DB);

    const { title, level, author, image, content, icon } = await request.json();
    if (!title || !level) {
      return new Response(JSON.stringify({ error: 'Title and level are required' }), { status: 400, headers });
    }

    const id = 'course-' + Date.now();
    const date = new Date().toISOString().split('T')[0];
    const levelIcons = { beginner: '🌱', intermediate: '⚡', expert: '🔥' };

    await env.DB.prepare(
      'INSERT INTO courses (id, title, level, author, date, image, content, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, title, level, author || '', date, image || '', content || '', icon || levelIcons[level] || '✨').run();

    return new Response(JSON.stringify({ success: true, id }), { headers });
  } catch (error) {
    console.error('Courses POST error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

// DELETE /api/courses — admin only, delete a course by id (sent in body)
export async function onRequestDelete(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    if (!await verifyAdmin(request, env)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Course id required' }), { status: 400, headers });
    }

    await ensureTable(env.DB);
    await env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (error) {
    console.error('Courses DELETE error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

// PATCH /api/courses — admin only, update a course
export async function onRequestPatch(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    if (!await verifyAdmin(request, env)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const { id, title, level, author, image, content, icon } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Course id required' }), { status: 400, headers });
    }

    await ensureTable(env.DB);
    const levelIcons = { beginner: '🌱', intermediate: '⚡', expert: '🔥' };

    await env.DB.prepare(
      'UPDATE courses SET title = ?, level = ?, author = ?, image = ?, content = ?, icon = ? WHERE id = ?'
    ).bind(title || '', level || '', author || '', image || '', content || '', icon || levelIcons[level] || '✨', id).run();

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (error) {
    console.error('Courses PATCH error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
