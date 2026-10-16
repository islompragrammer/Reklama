// Arizalarni saqlash va CRM'ga berish (Netlify Functions + Netlify Blobs).
//   POST /.netlify/functions/arizalar  — sayt formasi arizani yuboradi (hamma uchun ochiq)
//   GET  /.netlify/functions/arizalar?key=KALIT             — CRM uchun JSON ro'yxat
//   GET  /.netlify/functions/arizalar?key=KALIT&format=csv  — CSV (Excel / Google Sheets)
// Netlify → Site configuration → Environment variables:
//   ARIZA_TOKEN  — CRM kaliti (majburiy)
//   TG_TOKEN, TG_CHAT_ID — ixtiyoriy: har bir ariza Telegram guruhga ham keladi (token sayt kodida ko'rinmaydi)
import { getStore } from '@netlify/blobs'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
}
const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
})
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

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  const store = getStore({ name: 'arizalar', consistency: 'strong' })

  if (req.method === 'POST') {
    let body
    try {
      body = await req.json()
    } catch {
      return json(400, { error: "Ma'lumot noto'g'ri" })
    }
    const name = clean(body.name, 80)
    const phone = clean(body.phone, 25)
    const digits = phone.replace(/\D/g, '')
    if (name.length < 2 || digits.length < 9) return json(400, { error: 'Ism yoki telefon noto‘g‘ri' })
    const courses = (Array.isArray(body.courses) ? body.courses : [body.courses]).map((item) => clean(item, 60)).filter(Boolean).slice(0, 10)
    // Bir sahifadagi "yangilandi" yuborishlari bitta arizani yangilaydi
    const id = ID_RE.test(String(body.id || '')) ? body.id : `${Date.now().toString(36)}-${digits.slice(-9)}`
    const old = await store.get(id, { type: 'json' }).catch(() => null)
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
    await store.setJSON(id, lead)
    await notifyTelegram(lead, !old)
    return json(200, { ok: true })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const token = process.env.ARIZA_TOKEN
    const given =
      (req.headers.get('authorization') || '').replace(/^(Bearer|Token)\s+/i, '') ||
      req.headers.get('x-api-key') ||
      url.searchParams.get('key') || url.searchParams.get('token') || ''
    if (!token || given !== token) return json(401, { error: 'Kalit noto‘g‘ri' })

    const { blobs } = await store.list()
    const items = (await Promise.all(blobs.map((blob) => store.get(blob.key, { type: 'json' }).catch(() => null)))).filter(Boolean)
    items.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))

    if (url.searchParams.get('format') === 'csv') {
      return new Response(toCsv(items), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }
    return json(200, items) // CRM namunasidagidek: [ {...}, {...} ]
  }

  return json(405, { error: 'Ruxsat yo‘q' })
}
