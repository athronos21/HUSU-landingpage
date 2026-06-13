/**
 * HUSU Telegram Bot — Cloudflare Worker
 *
 * TWO functions in one worker:
 *   1. Conversational bot (private messages) — affair heads post news/events
 *      via step-by-step forms. Posts are forwarded to the correct channel.
 *   2. Channel webhook — channel posts → Firestore (backup/direct posting)
 *   3. POST /create-user — create Firebase Auth accounts
 *   4. GET  /health     — liveness check
 *
 * Requires Cloudflare KV namespace bound as BOT_STATE.
 *
 * Environment variables (set as Secrets in Cloudflare dashboard):
 *   BOT_TOKEN        — Telegram bot token
 *   FIREBASE_API_KEY — Firebase Web API Key
 *   PROJECT_ID       — Firebase project ID
 *   NEWS_CHANNELS    — Comma-separated news channel usernames (without @)
 *   EVENTS_CHANNELS  — Comma-separated events channel usernames (without @)
 *   NEWS_CHANNEL_ID  — Numeric channel ID for the news channel (e.g. -1001234567890)
 *   EVENTS_CHANNEL_ID— Numeric channel ID for the events channel
 *   WEBHOOK_SECRET   — Telegram webhook secret token
 *   WORKER_SECRET    — Secret for /create-user endpoint
 */

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1'
const TG_BASE        = 'https://api.telegram.org/bot'

// ─────────────────────────────────────────────────────────────────────────────
// TELEGRAM HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function tgCall(method, body, token) {
  const res = await fetch(`${TG_BASE}${token}/${method}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  return res.json()
}

async function sendMessage(chatId, text, extra = {}, token) {
  return tgCall('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra }, token)
}

async function sendPhoto(chatId, photo, caption, extra = {}, token) {
  return tgCall('sendPhoto', { chat_id: chatId, photo, caption, parse_mode: 'HTML', ...extra }, token)
}

async function forwardToChannel(channelId, fromChatId, messageId, token) {
  return tgCall('forwardMessage', {
    chat_id:     channelId,
    from_chat_id: fromChatId,
    message_id:  messageId,
  }, token)
}

async function postTextToChannel(channelId, text, token) {
  return tgCall('sendMessage', { chat_id: channelId, text, parse_mode: 'HTML' }, token)
}

async function postPhotoToChannel(channelId, photo, caption, token) {
  return tgCall('sendPhoto', { chat_id: channelId, photo, caption, parse_mode: 'HTML' }, token)
}

function keyboard(buttons) {
  // buttons: array of arrays of strings
  return {
    reply_markup: {
      keyboard: buttons.map(row => row.map(text => ({ text }))),
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  }
}

function inlineKeyboard(rows) {
  // rows: array of arrays of {text, data}
  return {
    reply_markup: {
      inline_keyboard: rows.map(row => row.map(b => ({ text: b.text, callback_data: b.data }))),
    },
  }
}

function removeKeyboard() {
  return { reply_markup: { remove_keyboard: true } }
}

// ─────────────────────────────────────────────────────────────────────────────
// KV STATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function getState(kv, uid) {
  const raw = await kv.get(`state:${uid}`)
  return raw ? JSON.parse(raw) : {}
}

async function setState(kv, uid, state) {
  await kv.put(`state:${uid}`, JSON.stringify(state), { expirationTtl: 3600 }) // 1h TTL
}

async function clearState(kv, uid) {
  await kv.delete(`state:${uid}`)
}

async function getProfile(kv, uid) {
  const raw = await kv.get(`profile:${uid}`)
  return raw ? JSON.parse(raw) : null
}

async function saveProfile(kv, uid, profile) {
  await kv.put(`profile:${uid}`, JSON.stringify(profile)) // no TTL — permanent
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE REST HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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

function fromFirestoreFields(fields) {
  const obj = {}
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue  !== undefined) obj[k] = v.stringValue
    if (v.integerValue !== undefined) obj[k] = Number(v.integerValue)
    if (v.booleanValue !== undefined) obj[k] = v.booleanValue
    if (v.arrayValue)  obj[k] = (v.arrayValue.values || []).map(i => i.stringValue || i.integerValue || '')
  }
  return obj
}

async function firestoreQuery(collectionPath, filters, apiKey, projectId) {
  // Simple REST list query with optional field filter
  let url = `${FIRESTORE_BASE}/projects/${projectId}/databases/(default)/documents/${collectionPath}?key=${apiKey}&pageSize=100`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  if (!data.documents) return []
  return data.documents.map(doc => ({
    id: doc.name.split('/').pop(),
    ...fromFirestoreFields(doc.fields || {}),
  }))
}

async function writeToFirestore(collection, data, apiKey, projectId) {
  const url = `${FIRESTORE_BASE}/projects/${projectId}/databases/(default)/documents/${collection}?key=${apiKey}`
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields: toFirestoreFields(data) }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Firestore write failed: ${err}`)
  }
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — verify a Telegram user is a registered affair head
// Matches by telegram username stored in their Firestore user profile
// ─────────────────────────────────────────────────────────────────────────────

async function verifyUser(telegramUsername, apiKey, projectId) {
  if (!telegramUsername) return null
  const users = await firestoreQuery('users', {}, apiKey, projectId)
  const clean = telegramUsername.replace('@', '').toLowerCase()
  return users.find(u =>
    (u.telegram || '').replace('@', '').toLowerCase() === clean &&
    (u.role === 'affair_head' || u.role === 'assoc_head' || u.role === 'admin') &&
    u.status === 'active'
  ) || null
}

// ─────────────────────────────────────────────────────────────────────────────
// AFFAIRS — fetch affair list from Firestore
// ─────────────────────────────────────────────────────────────────────────────

async function getAffairs(apiKey, projectId) {
  const affairs = await firestoreQuery('affairs', {}, apiKey, projectId)
  return affairs.filter(a => a.status !== 'inactive').map(a => a.name).filter(Boolean)
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO UPLOAD — Telegram file → Cloudinary
// ─────────────────────────────────────────────────────────────────────────────

async function uploadPhoto(fileId, botToken) {
  const fileRes  = await fetch(`${TG_BASE}${botToken}/getFile?file_id=${fileId}`)
  const fileData = await fileRes.json()
  if (!fileData.ok) return null
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`
  const imgRes  = await fetch(fileUrl)
  if (!imgRes.ok) return null
  const imgBlob = await imgRes.blob()
  const fd = new FormData()
  fd.append('file', imgBlob, 'photo.jpg')
  fd.append('upload_preset', 'i0ysxxhc')
  fd.append('folder', 'telegram')
  const upRes  = await fetch('https://api.cloudinary.com/v1_1/dvc5ijanb/image/upload', { method: 'POST', body: fd })
  if (!upRes.ok) return null
  const upData = await upRes.json()
  return upData.secure_url || null
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function newsPreview(d) {
  const affairLine = d.affair ? `🏛️ ${d.affair} Affair  •  ` : ''
  return `📰 <b>NEWS PREVIEW</b>\n\n` +
    `<b>${d.title}</b>\n` +
    `${affairLine}📂 ${d.category}\n\n` +
    `${d.description}\n\n` +
    `📅 ${d.date}${d.image ? '\n📷 Photo attached' : ''}`
}

function eventPreview(d) {
  const affairLine = d.affair ? `🏛️ ${d.affair} Affair  •  ` : ''
  return `📅 <b>EVENT PREVIEW</b>\n\n` +
    `<b>${d.title}</b>\n` +
    `${affairLine}📂 ${d.category}\n\n` +
    `${d.description}\n\n` +
    `📅 ${d.date}` +
    `${d.time     ? `  •  ⏰ ${d.time}`     : ''}` +
    `${d.location ? `\n📍 ${d.location}` : ''}` +
    `${d.image    ? '\n📷 Photo attached'   : ''}`
}

function newsChannelPost(d) {
  const affairLine = d.affair ? `\n🏛️ <i>${d.affair} Affair</i>  •  ` : '\n'
  return `📰 <b>${d.title}</b>\n\n` +
    `${d.description}` +
    `${affairLine}📂 ${d.category}  •  📅 ${d.date}`
}

function eventChannelPost(d) {
  const affairLine = d.affair ? `\n🏛️ <i>${d.affair} Affair</i>  •  ` : '\n'
  return `📅 <b>${d.title}</b>\n\n` +
    `${d.description}\n\n` +
    `📅 ${d.date}` +
    `${d.time     ? `  •  ⏰ ${d.time}`     : ''}` +
    `${d.location ? `\n📍 ${d.location}` : ''}` +
    `${affairLine}📂 ${d.category}`
}

const NEWS_CATEGORIES  = ['Announcement', 'Academic', 'Service', 'Discipline']
const EVENT_CATEGORIES = ['Sports', 'Academic', 'Workshop', 'Culture']

// ─────────────────────────────────────────────────────────────────────────────
// MAIN BOT HANDLER
// ─────────────────────────────────────────────────────────────────────────────

async function handleBotMessage(msg, env) {
  const chatId   = msg.chat.id
  const fromUser = msg.from
  const uid      = String(fromUser.id)
  const username = fromUser.username || ''
  const text     = (msg.text || '').trim()
  const photo    = msg.photo
  const kv       = env.BOT_STATE

  // ── Load current state ──
  const state = await getState(kv, uid)

  // ── /cancel at any point ──
  if (text === '/cancel' || text === '❌ Cancel') {
    await clearState(kv, uid)
    await sendMessage(chatId, '❌ Cancelled. Back to main menu.', keyboard([['📰 Post News', '📅 Post Event'], ['👤 My Profile']]), env.BOT_TOKEN)
    return
  }

  // ── /start ──
  if (text === '/start') {
    const profile = await getProfile(kv, uid)
    if (profile) {
      await sendMessage(chatId,
        `👋 Welcome back, <b>${profile.name}</b>!\n🏛️ ${profile.affair} Affair\n\nWhat would you like to post?`,
        keyboard([['📰 Post News', '📅 Post Event'], ['👤 My Profile']]),
        env.BOT_TOKEN
      )
    } else {
      // Check if they're a registered head in Firestore
      const fsUser = await verifyUser(username, env.FIREBASE_API_KEY, env.PROJECT_ID)
      if (fsUser) {
        // Pre-fill from Firestore profile, just need their Telegram confirmation
        const newProfile = {
          name:     fsUser.name,
          affair:   fsUser.affairName || '',  // empty string for admin/no affair
          role:     fsUser.role,
          telegramId: uid,
          username,
        }
        await saveProfile(kv, uid, newProfile)
        const affairText = fsUser.affairName ? `\n🏛️ ${fsUser.affairName} Affair` : ''
        await sendMessage(chatId,
          `✅ <b>Identity verified!</b>\n\nWelcome, <b>${fsUser.name}</b>!${affairText}\n\nYou can now post news and events.`,
          keyboard([['📰 Post News', '📅 Post Event'], ['👤 My Profile']]),
          env.BOT_TOKEN
        )
      } else {
        // Not found in Firestore — ask them to register their Telegram username in the dashboard first
        await sendMessage(chatId,
          `👋 Welcome to <b>HUSU Bot</b>!\n\n` +
          `⚠️ Your Telegram username <b>@${username}</b> is not linked to any affair head account.\n\n` +
          `Please ask the administrator to add your Telegram username to your profile in the HUSU dashboard, then type /start again.`,
          removeKeyboard(),
          env.BOT_TOKEN
        )
      }
    }
    return
  }

  // ── Require profile for all other actions ──
  const profile = await getProfile(kv, uid)
  if (!profile) {
    await sendMessage(chatId, 'Please type /start to begin.', {}, env.BOT_TOKEN)
    return
  }

  // ── My Profile ──
  if (text === '👤 My Profile') {
    await clearState(kv, uid)
    await sendMessage(chatId,
      `👤 <b>Your Profile</b>\n\n` +
      `Name: <b>${profile.name}</b>\n` +
      `${profile.affair ? `Affair: <b>${profile.affair}</b>\n` : ''}` +
      `Role: <b>${profile.role}</b>\n` +
      `Telegram: @${profile.username}\n\n` +
      `<i>To update your profile, contact the administrator.</i>`,
      keyboard([['📰 Post News', '📅 Post Event'], ['👤 My Profile']]),
      env.BOT_TOKEN
    )
    return
  }

  // ─────────────────────────────────────────────────
  // NEWS FLOW
  // ─────────────────────────────────────────────────

  if (text === '📰 Post News') {
    await setState(kv, uid, { flow: 'news', step: 'title', data: { affair: profile.affair } })
    await sendMessage(chatId,
      `📰 <b>Post News</b>\n\nStep 1/4 — Enter the <b>title</b> of your news:\n\n<i>Type ❌ Cancel to stop.</i>`,
      keyboard([['❌ Cancel']]),
      env.BOT_TOKEN
    )
    return
  }

  if (state.flow === 'news') {
    const d = state.data || {}

    if (state.step === 'title') {
      d.title = text
      await setState(kv, uid, { flow: 'news', step: 'category', data: d })
      await sendMessage(chatId,
        `Step 2/4 — Choose a <b>category</b>:`,
        keyboard([NEWS_CATEGORIES.slice(0, 2), NEWS_CATEGORIES.slice(2), ['❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'category') {
      if (!NEWS_CATEGORIES.includes(text)) {
        await sendMessage(chatId, '⚠️ Please choose a category from the buttons.', {}, env.BOT_TOKEN)
        return
      }
      d.category = text
      await setState(kv, uid, { flow: 'news', step: 'description', data: d })
      await sendMessage(chatId,
        `Step 3/4 — Write the <b>description</b> / full news text:`,
        keyboard([['❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'description') {
      d.description = text
      await setState(kv, uid, { flow: 'news', step: 'photo', data: d })
      await sendMessage(chatId,
        `Step 4/4 — Attach a <b>photo</b> (optional).\n\nSend a photo now, or tap <b>Skip</b> to publish without one.`,
        keyboard([['⏭ Skip Photo', '❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'photo') {
      // Photo received
      if (photo && photo.length > 0) {
        const fileId  = photo[photo.length - 1].file_id
        const imgUrl  = await uploadPhoto(fileId, env.BOT_TOKEN).catch(() => null)
        d.image = imgUrl || ''
        d.photoFileId = fileId  // keep for forwarding
      }
      // Skip or photo received — show preview
      d.date = new Date().toISOString().split('T')[0]
      await setState(kv, uid, { flow: 'news', step: 'confirm', data: d })
      const preview = newsPreview(d)
      await sendMessage(chatId,
        `${preview}\n\n✅ Ready to publish? This will be posted to the News channel.`,
        keyboard([['✅ Publish', '✏️ Start Over', '❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'photo' && text === '⏭ Skip Photo') {
      d.date = new Date().toISOString().split('T')[0]
      await setState(kv, uid, { flow: 'news', step: 'confirm', data: d })
      const preview = newsPreview(d)
      await sendMessage(chatId,
        `${preview}\n\n✅ Ready to publish? This will be posted to the News channel.`,
        keyboard([['✅ Publish', '✏️ Start Over', '❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'confirm') {
      if (text === '✏️ Start Over') {
        await clearState(kv, uid)
        await sendMessage(chatId, 'OK, let\'s start over.', keyboard([['📰 Post News', '📅 Post Event'], ['👤 My Profile']]), env.BOT_TOKEN)
        return
      }
      if (text === '✅ Publish') {
        await clearState(kv, uid)
        const channelId = env.NEWS_CHANNEL_ID
        const postText  = newsChannelPost(d)

        try {
          // Post to channel
          if (d.image) {
            await postPhotoToChannel(channelId, d.photoFileId || d.image, postText, env.BOT_TOKEN)
          } else {
            await postTextToChannel(channelId, postText, env.BOT_TOKEN)
          }

          // Save to Firestore
          await writeToFirestore('news', {
            title:       d.title,
            category:    d.category,
            summary:     d.description,
            date:        d.date,
            affair:      d.affair,
            image:       d.image || '',
            source:      'telegram',
            postedBy:    profile.name,
            createdAt:   new Date().toISOString(),
          }, env.FIREBASE_API_KEY, env.PROJECT_ID)

          await sendMessage(chatId,
            `✅ <b>Published!</b>\n\nYour news has been posted to the channel and will appear on the website shortly.`,
            keyboard([['📰 Post News', '📅 Post Event'], ['👤 My Profile']]),
            env.BOT_TOKEN
          )
        } catch (e) {
          await sendMessage(chatId, `❌ Failed to publish: ${e.message}`, keyboard([['📰 Post News', '📅 Post Event']]), env.BOT_TOKEN)
        }
        return
      }
    }
  }

  // ─────────────────────────────────────────────────
  // EVENT FLOW
  // ─────────────────────────────────────────────────

  if (text === '📅 Post Event') {
    await setState(kv, uid, { flow: 'event', step: 'title', data: { affair: profile.affair } })
    await sendMessage(chatId,
      `📅 <b>Post Event</b>\n\nStep 1/7 — Enter the <b>title</b> of your event:\n\n<i>Type ❌ Cancel to stop.</i>`,
      keyboard([['❌ Cancel']]),
      env.BOT_TOKEN
    )
    return
  }

  if (state.flow === 'event') {
    const d = state.data || {}

    if (state.step === 'title') {
      d.title = text
      await setState(kv, uid, { flow: 'event', step: 'date', data: d })
      await sendMessage(chatId,
        `Step 2/7 — Enter the <b>date</b>:\nFormat: <code>YYYY-MM-DD</code>  (e.g. 2026-07-15)`,
        keyboard([['❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'date') {
      // Validate date format
      const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(text)
      if (!dateOk) {
        await sendMessage(chatId, '⚠️ Invalid date. Use format <code>YYYY-MM-DD</code> (e.g. 2026-07-15)', {}, env.BOT_TOKEN)
        return
      }
      // Normalize DD/MM/YYYY → YYYY-MM-DD
      const m = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
      d.date = m ? `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` : text
      await setState(kv, uid, { flow: 'event', step: 'time', data: d })
      await sendMessage(chatId,
        `Step 3/7 — Enter the <b>time</b> (optional):\ne.g. <code>9:00 AM – 1:00 PM</code>\n\nOr tap <b>Skip</b>.`,
        keyboard([['⏭ Skip', '❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'time') {
      d.time = text === '⏭ Skip' ? '' : text
      await setState(kv, uid, { flow: 'event', step: 'location', data: d })
      await sendMessage(chatId,
        `Step 4/7 — Enter the <b>location / venue</b> (optional):\ne.g. <code>HU Main Hall</code>\n\nOr tap <b>Skip</b>.`,
        keyboard([['⏭ Skip', '❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'location') {
      d.location = text === '⏭ Skip' ? '' : text
      await setState(kv, uid, { flow: 'event', step: 'category', data: d })
      await sendMessage(chatId,
        `Step 5/7 — Choose a <b>category</b>:`,
        keyboard([EVENT_CATEGORIES.slice(0, 2), EVENT_CATEGORIES.slice(2), ['❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'category') {
      if (!EVENT_CATEGORIES.includes(text)) {
        await sendMessage(chatId, '⚠️ Please choose a category from the buttons.', {}, env.BOT_TOKEN)
        return
      }
      d.category = text
      await setState(kv, uid, { flow: 'event', step: 'description', data: d })
      await sendMessage(chatId,
        `Step 6/7 — Write the <b>description</b> of the event:`,
        keyboard([['❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'description') {
      d.description = text
      await setState(kv, uid, { flow: 'event', step: 'photo', data: d })
      await sendMessage(chatId,
        `Step 7/7 — Attach a <b>photo</b> (optional).\n\nSend a photo now, or tap <b>Skip</b>.`,
        keyboard([['⏭ Skip Photo', '❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'photo') {
      if (photo && photo.length > 0) {
        const fileId = photo[photo.length - 1].file_id
        const imgUrl = await uploadPhoto(fileId, env.BOT_TOKEN).catch(() => null)
        d.image = imgUrl || ''
        d.photoFileId = fileId
      }
      await setState(kv, uid, { flow: 'event', step: 'confirm', data: d })
      const preview = eventPreview(d)
      await sendMessage(chatId,
        `${preview}\n\n✅ Ready to publish? This will be posted to the Events channel.`,
        keyboard([['✅ Publish', '✏️ Start Over', '❌ Cancel']]),
        env.BOT_TOKEN
      )
      return
    }

    if (state.step === 'confirm') {
      if (text === '✏️ Start Over') {
        await clearState(kv, uid)
        await sendMessage(chatId, 'OK, let\'s start over.', keyboard([['📰 Post News', '📅 Post Event'], ['👤 My Profile']]), env.BOT_TOKEN)
        return
      }
      if (text === '✅ Publish') {
        await clearState(kv, uid)
        const channelId = env.EVENTS_CHANNEL_ID
        const postText  = eventChannelPost(d)

        try {
          if (d.image) {
            await postPhotoToChannel(channelId, d.photoFileId || d.image, postText, env.BOT_TOKEN)
          } else {
            await postTextToChannel(channelId, postText, env.BOT_TOKEN)
          }

          await writeToFirestore('events', {
            title:       d.title,
            category:    d.category,
            description: d.description,
            date:        d.date,
            time:        d.time     || '',
            location:    d.location || '',
            affair:      d.affair,
            image:       d.image    || '',
            source:      'telegram',
            postedBy:    profile.name,
            createdAt:   new Date().toISOString(),
          }, env.FIREBASE_API_KEY, env.PROJECT_ID)

          await sendMessage(chatId,
            `✅ <b>Published!</b>\n\nYour event has been posted to the channel and will appear on the website shortly.`,
            keyboard([['📰 Post News', '📅 Post Event'], ['👤 My Profile']]),
            env.BOT_TOKEN
          )
        } catch (e) {
          await sendMessage(chatId, `❌ Failed to publish: ${e.message}`, keyboard([['📰 Post News', '📅 Post Event']]), env.BOT_TOKEN)
        }
        return
      }
    }
  }

  // ── Unknown input — show menu ──
  await sendMessage(chatId,
    `Use the buttons below to post news or events.`,
    keyboard([['📰 Post News', '📅 Post Event'], ['👤 My Profile']]),
    env.BOT_TOKEN
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL POST HANDLER (direct channel posts → Firestore, as before)
// ─────────────────────────────────────────────────────────────────────────────

function normalizeChannel(id) {
  return String(id).replace('@', '').toLowerCase()
}

function parseChannels(envVal) {
  if (!envVal) return []
  return envVal.split(',').map(c => normalizeChannel(c.trim())).filter(Boolean)
}

function parseNewsText(text) {
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
  const rawCat    = fields['category'] || fields['type'] || ''
  const validNews = ['Announcement', 'Academic', 'Service', 'Discipline']
  const category  = validNews.find(c => c.toLowerCase() === rawCat.toLowerCase()) || 'Announcement'
  return {
    title:     fields['title'] || fields['headline'] || 'Untitled',
    category,
    summary:   bodyLines.join('\n').trim() || fields['summary'] || '',
    date:      new Date().toISOString().split('T')[0],
    affair:    fields['affair'] || fields['from'] || '',
    source:    'telegram',
    createdAt: new Date().toISOString(),
  }
}

function parseEventText(text) {
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
  const category  = validEvents.find(c => c.toLowerCase() === rawCat.toLowerCase()) || 'Academic'
  let date = fields['date'] || new Date().toISOString().split('T')[0]
  const m = date.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) date = `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
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

async function uploadPhotoFromFileId(fileId, botToken) {
  const fileRes  = await fetch(`${TG_BASE}${botToken}/getFile?file_id=${fileId}`)
  const fileData = await fileRes.json()
  if (!fileData.ok) return null
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`
  const imgRes  = await fetch(fileUrl)
  if (!imgRes.ok) return null
  const imgBlob = await imgRes.blob()
  const fd = new FormData()
  fd.append('file', imgBlob, 'photo.jpg')
  fd.append('upload_preset', 'i0ysxxhc')
  fd.append('folder', 'telegram')
  const upRes  = await fetch('https://api.cloudinary.com/v1_1/dvc5ijanb/image/upload', { method: 'POST', body: fd })
  if (!upRes.ok) return null
  const upData = await upRes.json()
  return upData.secure_url || null
}

// ─────────────────────────────────────────────────────────────────────────────
// /create-user ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────

async function signInFirebase(email, password, apiKey) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Sign-in failed')
  return { idToken: data.idToken, uid: data.localId }
}

async function writeUserProfile(uid, profile, apiKey, projectId, idToken) {
  const url = `${FIRESTORE_BASE}/projects/${projectId}/databases/(default)/documents/users/${uid}?key=${apiKey}`
  const headers = { 'Content-Type': 'application/json' }
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ fields: toFirestoreFields(profile) }) })
  if (!res.ok) { const err = await res.text(); throw new Error(`Firestore user write failed: ${err}`) }
  return res.json()
}

async function createFirebaseUser(email, password, apiKey) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'UNKNOWN_ERROR')
  if (!data.localId) throw new Error('No localId returned from Firebase')
  return data.localId
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  let pass = 'HUSU@'
  for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

async function handleCreateUser(request, env) {
  const secret = request.headers.get('X-Worker-Secret')
  if (!env.WORKER_SECRET || secret !== env.WORKER_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
  let body
  try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }
  const { email, name, role, affairId, affairName } = body
  if (!email || !name || !role) return new Response(JSON.stringify({ error: 'email, name, role required' }), { status: 400 })
  const validRoles = ['affair_head', 'assoc_head', 'news_org', 'events_org']
  if (!validRoles.includes(role)) return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400 })
  const password = generatePassword()
  let uid
  try {
    uid = await createFirebaseUser(email, password, env.FIREBASE_API_KEY)
  } catch (e) {
    if (e.message.includes('EMAIL_EXISTS')) {
      return new Response(JSON.stringify({ error: 'EMAIL_EXISTS', message: 'Email already has an account.' }), { status: 409, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
  let idToken
  try { const s = await signInFirebase(email, password, env.FIREBASE_API_KEY); idToken = s.idToken } catch { idToken = null }
  try {
    await writeUserProfile(uid, { name, email, role, affairId: affairId||'', affairName: affairName||'', status: 'active', mustChangePassword: 'true', createdAt: new Date().toISOString() }, env.FIREBASE_API_KEY, env.PROJECT_ID, idToken)
    return new Response(JSON.stringify({ success: true, uid, password }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Worker-Secret' } })
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, worker: 'husu-telegram-bot' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    if (url.pathname === '/create-user' && request.method === 'POST') {
      return handleCreateUser(request, env)
    }

    if (request.method !== 'POST') return new Response('OK', { status: 200 })

    // Verify Telegram webhook secret
    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
    if (env.WEBHOOK_SECRET && secret !== env.WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }

    let update
    try { update = await request.json() } catch { return new Response('Bad Request', { status: 400 }) }

    // ── Private message to the bot (conversational flow) ──
    if (update.message && update.message.chat.type === 'private') {
      await handleBotMessage(update.message, env)
      return new Response('OK', { status: 200 })
    }

    // ── Channel post (direct posting to channel → Firestore) ──
    const msg = update.channel_post
    if (!msg) return new Response('OK', { status: 200 })

    const chatId   = msg.chat?.username || String(msg.chat?.id)
    const thisChan = normalizeChannel(chatId)
    const newsChannels   = parseChannels(env.NEWS_CHANNELS   || env.NEWS_CHANNEL   || '')
    const eventsChannels = parseChannels(env.EVENTS_CHANNELS || env.EVENTS_CHANNEL || '')
    const isNews   = newsChannels.includes(thisChan)
    const isEvents = eventsChannels.includes(thisChan)
    if (!isNews && !isEvents) return new Response('OK', { status: 200 })

    const text = msg.text || msg.caption || ''
    if (!text.trim()) return new Response('OK', { status: 200 })

    let imageUrl = null
    if (msg.photo && msg.photo.length > 0) {
      imageUrl = await uploadPhotoFromFileId(msg.photo[msg.photo.length - 1].file_id, env.BOT_TOKEN).catch(() => null)
    }

    try {
      if (isNews) {
        const data = parseNewsText(text)
        if (imageUrl) data.image = imageUrl
        await writeToFirestore('news', data, env.FIREBASE_API_KEY, env.PROJECT_ID)
      } else {
        const data = parseEventText(text)
        if (imageUrl) data.image = imageUrl
        await writeToFirestore('events', data, env.FIREBASE_API_KEY, env.PROJECT_ID)
      }
    } catch (e) {
      console.error('Firestore error:', e.message)
      return new Response('Internal Error', { status: 500 })
    }

    return new Response('OK', { status: 200 })
  }
}
