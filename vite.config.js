import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  // Netlify'ning vaqtinchalik fayllari kuzatilmaydi (Windows'da EBUSY xatosi chiqaradi)
  server: { watch: { ignored: ['**/.netlify/**'] } },
})
