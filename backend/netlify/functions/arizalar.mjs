// Eski manzil: /.netlify/functions/arizalar — CRM hali shu manzildan o'qiydi.
// So'rov /api/arizalar ga yo'naltiriladi, ya'ni ikkala manzil ham bir xil ishlaydi.
import { app } from '../../src/app.js'

export default (req) => {
  const url = new URL(req.url)
  url.pathname = '/api/arizalar'
  return app.fetch(new Request(url, { method: req.method, headers: req.headers, body: req.body, duplex: 'half' }))
}
