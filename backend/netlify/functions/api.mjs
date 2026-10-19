// Netlify'da backend shu funksiya orqali ishlaydi: /api/* so'rovlari app.js ga boradi
import { app } from '../../src/app.js'

export default (req) => app.fetch(req)

export const config = { path: '/api/*' }
