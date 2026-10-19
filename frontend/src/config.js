// Sozlamalar frontend/.env faylidan olinadi (frontend/.env.example ga qarang)
const env = import.meta.env

// Backend manzili. Bo'sh bo'lsa — shu saytning o'zi (/api/...):
// Netlify'da ham, kompyuterda ham (Vite proxy orqali) shunday ishlaydi.
// Backend boshqa serverda bo'lsa: VITE_API_URL=https://api.sizning-sayt.uz
export const API_URL = (env.VITE_API_URL || '').replace(/\/$/, '')

// Ariza yuborilgach foydalanuvchi shu Telegram kanalga yo'naltiriladi
export const TG_CHANNEL = env.VITE_TG_CHANNEL || 'https://t.me/Tasnim_Akademiya'

export const PHONE = env.VITE_PHONE || '+998000000000'
export const PHONE_LABEL = env.VITE_PHONE_LABEL || '+998 [TELEFON]'
