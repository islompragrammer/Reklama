// Backend: arizalarni qabul qilish, saqlash va CRM'ga berish.
//   POST /api/arizalar                     — sayt formasi arizani yuboradi (hamma uchun ochiq)
//   GET  /api/arizalar?key=KALIT            — CRM uchun JSON ro'yxat
//   GET  /api/arizalar?key=KALIT&format=csv — CSV (Excel / Google Sheets)
//   GET  /api/health                        — backend ishlayaptimi
// Sozlamalar (backend/.env yoki Netlify → Environment variables):
//   ARIZA_TOKEN                 — CRM kaliti (GET uchun majburiy)
//   TG_TOKEN, TG_CHAT_ID        — ixtiyoriy: har bir ariza Telegram guruhga ham keladi
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { store } from './store.js'

const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max)

// Sahifa ochilganda yaratilgan id: harf, raqam va chiziqcha
const ID_RE = /^[A-Za-z0-9-]{8,64}$/
const FIELDS = ['id', 'name', 'phone', 'course', 'source', 'created_at', 'updated_at']

function toCsv(items) {
  const cell = (v) => {
    let s = String(v ?? '')
    if (/^[=+\-@]/.test(s) && !/^\+\d/.test(s)) s = `'${s}` // Excel formulasi bo'lib ketmasin (telefon "+998..." bundan mustasno)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = [FIELDS.join(','), ...items.map((it) => FIELDS.map((f) => cell(it[f])).join(','))]
  return '﻿' + rows.join('\r\n') // BOM — Excel o'zbekcha harflarni to'g'ri ko'rsatadi
}

async function notifyTelegram(lead, isNew) {
  const { TG_TOKEN, TG_CHAT_ID } = process.env
  if (!TG_TOKEN || !TG_CHAT_ID) return
  const title = isNew ? '🆕 Yangi ariza' : '✏️ Ariza yangilandi'
  const time = new Date(lead.updated_at).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })
  const text = `${title} (${lead.source || 'sayt'})\n👤 Ism: ${lead.name}\n📞 Tel: ${lead.phone}\n📚 Kurs: ${lead.course}\n🕒 ${time}`
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {} // Telegram ishlamasa ham ariza saqlangan bo'ladi
}

export const app = new Hono().basePath('/api')

app.use('*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400,
}))
app.use('*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store')
})

app.get('/health', (c) => c.json({ ok: true }))

app.post('/arizalar', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: "Ma'lumot noto'g'ri" }, 400)

  const name = clean(body.name, 80)
  const phone = clean(body.phone, 25)
  const digits = phone.replace(/\D/g, '')
  if (name.length < 2 || digits.length < 9) return c.json({ error: 'Ism yoki telefon noto‘g‘ri' }, 400)
  const courses = (Array.isArray(body.courses) ? body.courses : [body.courses]).map((item) => clean(item, 60)).filter(Boolean).slice(0, 10)

  // Bir sahifadagi "yangilandi" yuborishlari bitta arizani yangilaydi
  const id = ID_RE.test(String(body.id || '')) ? body.id : `${Date.now().toString(36)}-${digits.slice(-9)}`
  const db = store()
  const old = await db.get(id)
  const now = new Date().toISOString()
  const lead = {
    id,
    name,
    phone,
    course: courses.join(', '),
    source: clean(body.source, 80) || old?.source || '',
    created_at: old?.created_at || now,
    updated_at: now,
  }
  await db.set(id, lead)
  await notifyTelegram(lead, !old)
  return c.json({ ok: true })
})

app.get('/arizalar', async (c) => {
  const token = process.env.ARIZA_TOKEN
  const given =
    (c.req.header('authorization') || '').replace(/^(Bearer|Token)\s+/i, '') ||
    c.req.header('x-api-key') ||
    c.req.query('key') || c.req.query('token') || ''
  if (!token || given !== token) return c.json({ error: 'Kalit noto‘g‘ri' }, 401)

  const items = await store().all()
  items.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))

  if (c.req.query('format') === 'csv') {
    return c.body(toCsv(items), 200, { 'Content-Type': 'text/csv; charset=utf-8' })
  }
  return c.json(items) // CRM namunasidagidek: [ {...}, {...} ]
})

app.notFound((c) => c.json({ error: 'Topilmadi' }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Serverda xatolik' }, 500)
})
