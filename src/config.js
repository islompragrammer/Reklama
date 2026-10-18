// Sozlamalar .env faylidan olinadi (.env.example ga qarang)
const env = import.meta.env

export const TG_TOKEN = env.VITE_TG_TOKEN || ''
export const TG_CHAT_ID = env.VITE_TG_CHAT_ID || ''
export const SUBMIT_URL = env.VITE_SUBMIT_URL || ''

// CRM bazasi (Supabase). Publishable kalit ochiq bo'lishi mumkin — u faqat
// reklama_submit_lead funksiyasini chaqira oladi (supabase/reklama_lead.sql).
export const SUPABASE_URL = env.VITE_SUPABASE_URL || ''
export const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || ''

// Ariza yuborilgach foydalanuvchi shu Telegram kanalga yo'naltiriladi
export const TG_CHANNEL = env.VITE_TG_CHANNEL || 'https://t.me/Tasnim_Akademiya'

export const PHONE =env.VITE_PHONE || '+998000000000'
export const PHONE_LABEL = env.VITE_PHONE_LABEL || '+998 [TELEFON]'
