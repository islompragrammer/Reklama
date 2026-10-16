// QR kod yaratish:  npm run qr -- https://sizning-sayt.netlify.app
// Natija: qr/tasnim-qr.png (chop etish uchun, 2000px) va qr/tasnim-qr.svg
import QRCode from 'qrcode'
import { mkdirSync } from 'node:fs'

const url = process.argv[2]
if (!url || !/^https?:\/\//.test(url)) {
  console.error('Manzilni bering: npm run qr -- https://sizning-sayt.netlify.app')
  process.exit(1)
}

mkdirSync('qr', { recursive: true })
const opts = {
  errorCorrectionLevel: 'H', // bosmada biroz shikastlansa ham o'qiladi
  margin: 2,
  color: { dark: '#123c35', light: '#ffffff' },
}
await QRCode.toFile('qr/tasnim-qr.png', url, { ...opts, width: 2000 })
await QRCode.toFile('qr/tasnim-qr.svg', url, { ...opts, type: 'svg' })
console.log(`QR tayyor → qr/tasnim-qr.png, qr/tasnim-qr.svg\nManzil: ${url}`)
