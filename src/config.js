// Sozlamalar .env faylidan olinadi (.env.example ga qarang)
const env = import.meta.env

export const TG_TOKEN = env.VITE_TG_TOKEN || ''
export const TG_CHAT_ID = env.VITE_TG_CHAT_ID || ''
export const SUBMIT_URL = env.VITE_SUBMIT_URL || ''

export const PHONE = env.VITE_PHONE || '+998000000000'
export const PHONE_LABEL = env.VITE_PHONE_LABEL || '+998 [TELEFON]'
