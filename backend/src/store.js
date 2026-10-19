// Arizalar ombori.
//   Netlify'da  — Netlify Blobs ("arizalar" to'plami, avvalgi arizalar shu yerda)
//   Kompyuterda — backend/data/arizalar.json fayli
import { getStore } from '@netlify/blobs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const FILE = process.env.DATA_FILE || join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'arizalar.json')

function blobStore() {
  const store = getStore({ name: 'arizalar', consistency: 'strong' })
  return {
    get: (id) => store.get(id, { type: 'json' }).catch(() => null),
    set: (id, lead) => store.setJSON(id, lead),
    async all() {
      const { blobs } = await store.list()
      const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' }).catch(() => null)))
      return items.filter(Boolean)
    },
  }
}

function fileStore() {
  const load = () => readFile(FILE, 'utf8').then(JSON.parse).catch(() => ({}))
  let queue = Promise.resolve() // yozishlar navbat bilan — fayl buzilmasin
  return {
    get: async (id) => (await load())[id] || null,
    set: (id, lead) => (queue = queue.then(async () => {
      const db = await load()
      db[id] = lead
      await mkdir(dirname(FILE), { recursive: true })
      await writeFile(FILE, JSON.stringify(db, null, 2))
    })),
    all: async () => Object.values(await load()),
  }
}

let cached
export function store() {
  if (cached) return cached
  try {
    return blobStore() // Netlify muhiti har so'rovda beriladi, shuning uchun keshlanmaydi
  } catch {
    return (cached = fileStore()) // Netlify tashqarisida — fayl
  }
}
