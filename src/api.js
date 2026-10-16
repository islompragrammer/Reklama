import { TG_TOKEN, TG_CHAT_ID, SUBMIT_URL } from './config'

const TIMEOUT = 8000 // bitta urinish uchun maksimal kutish (ms) — sahifa "qotib" qolmasligi uchun
const RETRIES = 2    // tarmoq xatosida qayta urinishlar soni

// keepalive — sahifa yopilayotgan paytda ham so'rov oxirigacha yetib boradi
async function post(url, body) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT)
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
      signal: ctrl.signal,
    })
    if (!r.ok) {
      const err = new Error(`HTTP ${r.status}`)
      err.fatal = r.status >= 400 && r.status < 500 && r.status !== 429 // noto'g'ri token va h.k. — qayta urinish foydasiz
      throw err
    }
  } finally {
    clearTimeout(t)
  }
}

async function withRetry(fn) {
  for (let i = 0; ; i++) {
    try {
      return await fn()
    } catch (e) {
      if (e.fatal || i >= RETRIES) throw e
      await new Promise(r => setTimeout(r, 600 * (i + 1)))
    }
  }
}

// Ariza qayerdan keldi: ?src=... parametri (QR, boshqa sayt) yoki oldingi sahifa manzili
const SOURCE_NAMES = { qr: 'QR kod' }
function detectSource() {
  const src = new URLSearchParams(location.search).get('src')
  if (src) return SOURCE_NAMES[src] || src
  try {
    const ref = document.referrer && new URL(document.referrer).hostname
    if (ref && ref !== location.hostname) return ref
  } catch {}
  return "to'g'ridan-to'g'ri"
}
const SOURCE = detectSource()

export function sendLead(data) {
  data = { ...data, source: SOURCE }
  if (SUBMIT_URL) return withRetry(() => post(SUBMIT_URL, data))

  if (TG_TOKEN && TG_CHAT_ID) {
    const title = data.status === 'update' ? '✏️ Ariza yangilandi' : '🆕 Yangi ariza'
    const text = `${title} (${data.source})\n👤 Ism: ${data.name}\n📞 Tel: ${data.phone}\n📚 Kurs: ${data.courses.join(', ')}\n🕒 ${data.time}`
    return withRetry(() => post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { chat_id: TG_CHAT_ID, text }))
  }

  console.log("Ariza (sozlama yo'q):", data) // test rejimi
  return Promise.resolve()
}
