/**
 * HUSU Telegram Bot + User Creation — Cloudflare Worker
 *
 * Endpoints:
 *   POST /            — Telegram webhook (channel posts → Firestore)
 *   POST /create-user — Create Firebase Auth account without session side-effects
 *
 * Environment variables:
 *   BOT_TOKEN        — Telegram bot token
 *   FIREBASE_API_KEY — Firebase Web API Key
 *   PROJECT_ID       — Firebase project ID
 *   NEWS_CHANNEL     — e.g. HUSU_News
 *   EVENTS_CHANNEL   — e.g. HUSU_Events
 *   WEBHOOK_SECRET   — Secret token for Telegram webhook verification
 *   WORKER_SECRET    — Secret token for /create-user endpoint
 */

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1'

// ── Parse a news post ──────────────────────────────────────────────
function parseNews(text) {
  const lines = text.trim().split('\n')
  const fields = {}
  let bodyLines = []
  let inBody = false
  for (const line of lines) {
    if (inBody) { bodyLines.push(line); continue }
    const m = line.match(/^([a-zA-Z][\w\s]*):\s*(.+)$/)
    if (m) { fields[m[1].trim().toLowerCase()] = m[2].trim() }
    else if (line.trim() === '') { inBody = true }
    else { bodyLines.push(line) }
  }
  const rawCat = fields['category'] || fields['type'] || ''
  const validNews = ['Announcement', 'Academic', 'Service', 'Discipline']
  const category = validNews.find(c => c.toLowerCase() === rawCat.toLowerCase()) || 'Announcement'
  return {
    title:     fields['title'] || fields['headline'] || 'Untitled',
    category,
    summary:   bodyLines.join('\n').trim() || fields['summary'] || fields['description'] || '',
    date:      new Date().toISOString().split('T')[0],
    affair:    fields['affair'] || fields['from'] || '',
    source:    'telegram',
    createdAt: new Date().toISOString(),
  }
}

// ── Parse an event post ────────────────────────────────────────────
function parseEvent(text) {
  const lines = text.trim().split('\n')
  const fields = {}
  let bodyLines = []
  let inBody = false
  for (const line of lines) {
    if (inBody) { bodyLines.push(line); continue }
    const m = line.match(/^([a-zA-Z][\w\s]*):\s*(.+)$/)
    if (m) { fields[m[1].trim().toLowerCase()] = m[2].trim() }
    else if (line.trim() === '') { inBody = true }
    else { bodyLines.push(line) }
  }
  const rawCat = fields['category'] || fields['type'] || ''
  const validEvents = ['Sports', 'Academic', 'Workshop', 'Culture']
  const category = validEvents.find(c => c.toLowerCase() === rawCat.toLowerCase()) || 'Academic'
  let date = fields['date'] || new Date().toISOString().split('T')[0]
  const dmyMatch = date.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmyMatch) date = `${dmyMatch[3]}-${dmyMatch[2].padStart(2,'0')}-${dmyMatch[1].padStart(2,'0')}`
  return {
    title:       fields['title'] || fields['event'] || 'Untitled Event',
    date,
    time:        fields['time'] || '',
    location:    fields['location'] || fields['venue'] || '',
    category,
    affair:      fields['affair'] || fields['from'] || '',
    description: bodyLines.join('\n').trim() || fields['description'] || '',
    source:      'telegram',
    createdAt:   new Date().toISOString(),
  }
}

// ── Convert JS object to Firestore REST fields format ──────────────
function toFirestoreFields(obj) {
  const fields = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue
    if (typeof v === 'string')  fields[k] = { stringValue: v }
    if (typeof v === 'number')  fields[k] = { integerValue: String(v) }
    if (typeof v === 'boolean') fields[k] = { booleanValue: v }
  }
  return fields
}

// ── Write a document to Firestore via REST API ─────────────────────
async function writeToFirestore(collection, data, apiKey, projectId) {
  const url = `${FIRESTORE_BASE}/projects/${projectId}/databases/(default)/documents/${collection}?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Firestore write failed: ${err}`)
  }
  return res.json()
}

// ── Sign in to Firebase and get an ID token ───────────────────────
async function signInFirebase(email, password, apiKey) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Sign-in failed')
  return { idToken: data.idToken, uid: data.localId }
}

// ── Write user profile to Firestore (PATCH by UID) with auth token ─
async function writeUserProfile(uid, profile, apiKey, projectId, idToken) {
  const url = `${FIRESTORE_BASE}/projects/${projectId}/databases/(default)/documents/users/${uid}?key=${apiKey}`
  const headers = { 'Content-Type': 'application/json' }
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields: toFirestoreFields(profile) }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Firestore user write failed: ${err}`)
  }
  return res.json()
}

// ── Upload photo from Telegram to Cloudinary ──────────────────────
async function uploadPhoto(fileId, botToken) {
  const fileRes  = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`)
  const fileData = await fileRes.json()
  if (!fileData.ok) return null
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`
  const fd = new FormData()
  fd.append('file', fileUrl)
  fd.append('upload_preset', 'i0ysxxhc')
  fd.append('folder', 'telegram')
  const upRes = await fetch('https://api.cloudinary.com/v1_1/dvc5ijanb/image/upload', { method: 'POST', body: fd })
  if (!upRes.ok) return null
  const upData = await upRes.json()
  return upData.secure_url || null
}

// ── Generate a random password ─────────────────────────────────────
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  let pass = 'HUSU@'
  for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

// ── Create Firebase Auth user via REST ────────────────────────────
async function createFirebaseUser(email, password, apiKey) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )
  const data = await res.json()
  if (!res.ok) {
    const code = data.error?.message || 'UNKNOWN_ERROR'
    throw new Error(code)
  }
  if (!data.localId) throw new Error('No localId returned from Firebase')
  return data.localId
}

// ── Handle /create-user endpoint ──────────────────────────────────
async function handleCreateUser(request, env) {
  const secret = request.headers.get('X-Worker-Secret')
  if (!env.WORKER_SECRET || secret !== env.WORKER_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  let body
  try { body = await request.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { email, name, role, affairId, affairName } = body
  if (!email || !name || !role) {
    return new Response(JSON.stringify({ error: 'email, name, role required' }), { status: 400 })
  }

  const validRoles = ['affair_head', 'assoc_head', 'news_org', 'events_org']
  if (!validRoles.includes(role)) {
    return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400 })
  }

  const password = generatePassword()
  let uid

  try {
    uid = await createFirebaseUser(email, password, env.FIREBASE_API_KEY)
  } catch (e) {
    if (e.message.includes('EMAIL_EXISTS')) {
      return new Response(JSON.stringify({
        error: 'EMAIL_EXISTS',
        message: 'This email already has a login account. Use the Users page in the dashboard to update their role and assign this affair.',
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // Sign in as the new user to get an ID token for authenticated Firestore write
  let idToken
  try {
    const signIn = await signInFirebase(email, password, env.FIREBASE_API_KEY)
    idToken = signIn.idToken
  } catch (e) {
    // Non-fatal: try writing without auth (will fail if rules require auth)
    idToken = null
  }

  try {
    await writeUserProfile(uid, {
      name,
      email,
      role,
      affairId:           affairId   || '',
      affairName:         affairName || '',
      status:             'active',
      mustChangePassword: 'true',
      createdAt:          new Date().toISOString(),
    }, env.FIREBASE_API_KEY, env.PROJECT_ID, idToken)

    return new Response(JSON.stringify({ success: true, uid, password }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

// ── Normalize channel identifier ──────────────────────────────────
function normalizeChannel(id) {
  return String(id).replace('@', '').toLowerCase()
}

// ── Main worker handler ────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Worker-Secret',
        },
      })
    }

    // Route: /create-user
    if (url.pathname === '/create-user' && request.method === 'POST') {
      return handleCreateUser(request, env)
    }

    // Route: / — Telegram webhook
    if (request.method !== 'POST') {
      return new Response('OK', { status: 200 })
    }

    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
    if (env.WEBHOOK_SECRET && secret !== env.WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }

    let update
    try { update = await request.json() } catch {
      return new Response('Bad Request', { status: 400 })
    }

    const msg = update.channel_post
    if (!msg) return new Response('OK', { status: 200 })

    const chatId        = msg.chat?.username || String(msg.chat?.id)
    const newsChannel   = normalizeChannel(env.NEWS_CHANNEL   || '')
    const eventsChannel = normalizeChannel(env.EVENTS_CHANNEL || '')
    const thisChan      = normalizeChannel(chatId)

    const isNews   = thisChan === newsChannel
    const isEvents = thisChan === eventsChannel
    if (!isNews && !isEvents) return new Response('OK', { status: 200 })

    const text = msg.text || msg.caption || ''
    if (!text.trim()) return new Response('OK', { status: 200 })

    let imageUrl = null
    if (msg.photo && msg.photo.length > 0) {
      const largest = msg.photo[msg.photo.length - 1]
      imageUrl = await uploadPhoto(largest.file_id, env.BOT_TOKEN).catch(() => null)
    }

    try {
      if (isNews) {
        const data = parseNews(text)
        if (imageUrl) data.image = imageUrl
        await writeToFirestore('news', data, env.FIREBASE_API_KEY, env.PROJECT_ID)
        console.log('✅ News written:', data.title)
      } else if (isEvents) {
        const data = parseEvent(text)
        if (imageUrl) data.image = imageUrl
        await writeToFirestore('events', data, env.FIREBASE_API_KEY, env.PROJECT_ID)
        console.log('✅ Event written:', data.title)
      }
    } catch (e) {
      console.error('❌ Firestore error:', e.message)
      return new Response('Internal Error', { status: 500 })
    }

    return new Response('OK', { status: 200 })
  }
}
