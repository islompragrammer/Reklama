import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    // Netlify'ning vaqtinchalik fayllari kuzatilmaydi (Windows'da EBUSY xatosi chiqaradi)
    watch: { ignored: ['**/.netlify/**'] },
    // Kompyuterda: /api/* so'rovlari backendga (npm run dev:backend) uzatiladi
    proxy: { '/api': 'http://localhost:3000' },
  },
})
