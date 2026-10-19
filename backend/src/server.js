// Backendni kompyuterda (yoki istalgan Node.js serverda) ishga tushirish:  npm run dev:backend
import { serve } from '@hono/node-server'
import { app } from './app.js'

const port = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend ishlayapti: http://localhost:${port}/api/health`)
})
