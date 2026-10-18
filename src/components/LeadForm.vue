<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { sendLead } from '../api'
import { TG_CHANNEL } from '../config'

const courses = [
  {
    value: 'Ingliz tili', note: 'Kids · General · CEFR',
    icon: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  },
  {
    value: 'Mental arifmetika', note: '5–12 yosh',
    icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18"/><circle cx="8" cy="7" r=".6"/><circle cx="14" cy="12.5" r=".6"/><circle cx="10" cy="17.5" r=".6"/>',
  },
  {
    value: 'Matematika', note: "Maktab o'quvchilari",
    icon: '<path d="M7 4v6M4 7h6M14 7h6M5 15l4 4M9 15l-4 4M14 15h6M14 19h6"/>',
  },
  {
    value: 'Kompyuter savodxonligi', note: 'Word, Excel, AI',
    icon: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  },
]

const name = ref('')
const phone = ref('+998 ')
const selected = ref([])
const errors = reactive({ name: false, phone: false, course: false })
const sending = ref(false)
const failed = ref(false)
const sent = ref(false)
const doneText = ref("Tez orada administratorimiz siz bilan bog'lanadi.")

watch(name, () => (errors.name = false))
watch(selected, () => (errors.course = false))

// +998 XX XXX XX XX formati
function onPhoneInput(e) {
  let d = e.target.value.replace(/\D/g, '')
  if (!d.startsWith('998')) d = '998' + d.replace(/^998?/, '')
  d = d.slice(0, 12)
  const p = d.slice(3)
  let out = '+998 ' + p.slice(0, 2)
  if (p.length > 2) out += ' ' + p.slice(2, 5)
  if (p.length > 5) out += ' ' + p.slice(5, 7)
  if (p.length > 7) out += ' ' + p.slice(7, 9)
  phone.value = out
  e.target.value = out
  errors.phone = false
}

function onPhoneKeydown(e) {
  if (e.key === 'Backspace' && phone.value.length <= 5) e.preventDefault()
}

/* ====== AVTOMATIK YUBORISH ======
   Ism, telefon va kurs to'g'ri to'ldirilgach, tugma bosilmasa ham
   ariza AUTO_DELAY ms dan keyin yuboriladi. Sahifa yopilsa — darhol.
   Bir xil ma'lumot ikki marta yuborilmaydi; o'zgartirilsa — "yangilandi" bo'lib boradi. */
const AUTO_DELAY = 1200

const isValid = computed(() =>
  name.value.trim().length >= 2 &&
  phone.value.replace(/\D/g, '').length === 12 &&
  selected.value.length > 0)

let timer = null
// Shu sahifadagi ariza raqami: "yangilandi" yuborishlari serverda bitta arizani yangilaydi
const formId = (crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`)
let lastSent = ''            // oxirgi yuborilgan ma'lumot (takrorlanmasligi uchun)
let queue = Promise.resolve() // yuborishlar navbat bilan, bir vaqtda bittadan

function deliver() {
  const p = queue.then(async () => {
    const data = {
      name: name.value.trim(),
      phone: phone.value,
      courses: [...selected.value],
    }
    const key = JSON.stringify(data)
    if (key === lastSent) return
    await sendLead({
      ...data,
      id: formId,
      status: lastSent ? 'update' : 'new',
      time: new Date().toLocaleString('uz-UZ'),
    })
    lastSent = key
  })
  queue = p.catch(() => {})
  return p
}

watch([name, phone, selected], () => {
  clearTimeout(timer)
  if (sent.value || !isValid.value) return
  timer = setTimeout(() => deliver().catch(() => {}), AUTO_DELAY)
}, { deep: true })

// Foydalanuvchi sahifadan chiqib ketsa / ilovani yopsa — kutmasdan yuborish
function flush() {
  if (sent.value || !isValid.value) return
  clearTimeout(timer)
  deliver().catch(() => {})
}
function onVisibility() {
  if (document.visibilityState === 'hidden') flush()
}
// Internet uzilib qaytsa — yuborilmay qolgan arizani qayta yuborish
onMounted(() => {
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', flush)
  window.addEventListener('online', flush)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pagehide', flush)
  window.removeEventListener('online', flush)
})

// Muvaffaqiyat oynasi qisqa ko'rinadi, so'ng Telegram kanal ochiladi.
// tg:// — telefondagi Telegram ilovasi (akkaunt ochiq) to'g'ridan-to'g'ri kanalda ochiladi.
// Ilova o'rnatilmagan bo'lsa (sahifa ochiq qolsa) — oddiy t.me sahifasi.
// Brauzerlar ilovani faqat bosishdan keyin ~5 soniya ichida ochishga ruxsat beradi, shuning uchun kutish qisqa.
const REDIRECT_DELAY = 800
const CHANNEL_USER = TG_CHANNEL.match(/t\.me\/([A-Za-z0-9_]+)/)?.[1]
function go(url) {
  try {
    window.top.location.href = url // iframe ichida bo'lsa — butun oyna
  } catch {
    window.location.href = url
  }
}
// Kompyuterda ilova tanlash oynasi (Windows) ochiq turganda ham sahifa "ko'rinadi" —
// shuning uchun t.me zaxira yo'li faqat telefonlarda ishlaydi.
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
function openChannel() {
  if (!CHANNEL_USER) return go(TG_CHANNEL)
  go(`tg://resolve?domain=${CHANNEL_USER}`)
  if (IS_MOBILE) {
    setTimeout(() => {
      if (document.visibilityState === 'visible') go(TG_CHANNEL)
    }, 1500)
  }
}
// "Telegram kanalga o'tish" tugmasi: telefonda ilovada ochadi,
// kompyuterda oddiy t.me havolasi (Telegram ilovasi bo'lmasa ham ishlaydi)
function onTgClick(e) {
  if (IS_MOBILE) {
    e.preventDefault()
    openChannel()
  }
}

async function submit() {
  const n = name.value.trim()
  errors.name = n.length < 2
  errors.phone = phone.value.replace(/\D/g, '').length !== 12
  errors.course = !selected.value.length
  if (errors.name || errors.phone || errors.course) return

  clearTimeout(timer)
  sending.value = true
  try {
    await deliver() // avtomatik yuborilgan bo'lsa, qayta yubormaydi
    doneText.value = `${n}, tez orada ${phone.value} raqamiga qo'ng'iroq qilamiz.`
    sent.value = true
    setTimeout(openChannel, REDIRECT_DELAY)
  } catch {
    failed.value = true
    alert("Yuborib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring yoki bizga qo'ng'iroq qiling.")
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="card">
    <form v-if="!sent" novalidate @submit.prevent="submit">
      <h2>Darsga yozilish</h2>
      <p class="sub">Ma'lumot qoldiring — o'zimiz bog'lanamiz.</p>

      <div class="field" :class="{ bad: errors.name }">
        <label for="name">Ismingiz</label>
        <input id="name" v-model="name" type="text" autocomplete="name" placeholder="Masalan: Dilnoza">
        <div class="hint">Ismingizni kiriting</div>
      </div>

      <div class="field" :class="{ bad: errors.phone }">
        <label for="phone">Telefon raqamingiz</label>
        <input
          id="phone" :value="phone" type="tel" inputmode="numeric" autocomplete="tel"
          @input="onPhoneInput" @keydown="onPhoneKeydown"
        >
        <div class="hint">Raqamni to'liq kiriting: +998 90 123 45 67</div>
      </div>

      <div class="field" :class="{ bad: errors.course }">
        <label>Qaysi kurs qiziqtiradi?</label>
        <div class="courses">
          <label
            v-for="c in courses" :key="c.value"
            class="course" :class="{ checked: selected.includes(c.value) }"
          >
            <input v-model="selected" type="checkbox" :value="c.value">
            <span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></span>
            <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="c.icon"></svg></span>
            <span class="txt"><strong>{{ c.value }}</strong><small>{{ c.note }}</small></span>
          </label>
        </div>
        <div class="hint">Kamida bitta kursni tanlang</div>
      </div>

      <button class="btn" type="submit" :disabled="sending">
        {{ sending ? 'Yuborilmoqda...' : failed ? 'Qayta yuborish' : 'Bepul darsga yozilish' }}
      </button>
      <p class="note">Ma'lumotlaringiz faqat bog'lanish uchun ishlatiladi.</p>
    </form>

    <div v-else class="done" role="status" aria-live="polite">
      <div class="ok"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></div>
      <h2>Arizangiz qabul qilindi!</h2>
      <p>{{ doneText }}</p>
      <p class="go">Telegram kanalimizga o'tmoqdasiz — <b>"Qo'shilish"</b> tugmasini bosing.</p>
      <a class="btn tg" :href="TG_CHANNEL" target="_top" rel="noopener" @click="onTgClick">Telegram kanalga o'tish</a>
    </div>
  </section>
</template>

<style scoped>
.card { position: relative; flex: none; margin: -40px 14px 0; background: var(--paper); border-radius: 20px; padding: 16px 16px 12px; box-shadow: 0 18px 40px rgba(8,40,35,.35) }
.card h2 { font-weight: 800; font-size: 18px; line-height: 1.2 }
.card .sub { margin-top: 3px; font-size: 12px; color: var(--muted); font-weight: 500; line-height: 1.35 }
.field { margin-top: clamp(8px, 1.8vh, 18px) }
.field > label { display: block; font-size: 12px; font-weight: 700; margin-bottom: 4px }
.field > input {
  width: 100%; height: clamp(42px, 6vh, 52px); border: 2px solid var(--line); border-radius: 12px; padding: 0 14px;
  font: 600 16px var(--font); color: var(--ink); background: #f7fbfa; outline: none; transition: border-color .15s, background .15s
}
.field > input:focus { border-color: var(--teal); background: #fff }
.field.bad > input { border-color: var(--err) }
.hint { font-size: 11px; color: var(--err); margin-top: 3px; font-weight: 600; display: none }
.field.bad .hint { display: block }

.courses { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px }
.course { position: relative; display: flex; align-items: center; gap: 8px; border: 2px solid var(--line); border-radius: 12px; padding: clamp(6px, 1.2vh, 12px) 22px clamp(6px, 1.2vh, 12px) 7px; cursor: pointer; background: #f7fbfa; transition: border-color .15s, background .15s; user-select: none; -webkit-tap-highlight-color: transparent }
.course input { position: absolute; opacity: 0; pointer-events: none }
.course .ic { flex: none; width: 30px; height: 30px; border-radius: 9px; background: var(--sun); display: grid; place-items: center }
.course .ic svg { width: 16px; height: 16px; stroke: var(--ink) }
.course .txt { min-width: 0 }
.course strong { display: block; font-size: 12px; font-weight: 800; line-height: 1.15 }
.course small { display: block; margin-top: 2px; font-size: 10px; font-weight: 600; color: var(--muted) }
.course .tick { position: absolute; top: 6px; right: 6px; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--line); background: #fff; display: grid; place-items: center }
.course .tick svg { width: 10px; height: 10px; stroke: #fff; opacity: 0 }
.course.checked { border-color: var(--teal); background: #eaf5f2 }
.course.checked .tick { background: var(--teal); border-color: var(--teal) }
.course.checked .tick svg { opacity: 1 }
.course:has(input:focus-visible) { outline: 3px solid var(--sun); outline-offset: 2px }

.btn {
  margin-top: clamp(12px, 2vh, 22px); width: 100%; height: clamp(46px, 6.5vh, 56px); border: 0; border-radius: 14px; background: var(--sun); color: var(--ink);
  font: 800 16px var(--font); cursor: pointer; box-shadow: 0 4px 0 var(--sun-deep); transition: transform .08s, box-shadow .08s
}
.btn:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--sun-deep) }
.btn:disabled { opacity: .7; cursor: wait }
.btn:focus-visible { outline: 3px solid var(--teal); outline-offset: 3px }
.note { margin-top: 8px; text-align: center; font-size: 10.5px; color: var(--muted); font-weight: 500 }

.done { text-align: center; padding: 14px 4px 6px }
.done .ok { width: 72px; height: 72px; margin: 0 auto 16px; border-radius: 50%; background: var(--teal); display: grid; place-items: center; animation: pop .45s cubic-bezier(.2,1.6,.4,1) }
.done .ok svg { width: 34px; height: 34px; stroke: #fff }
.done h2 { font-size: 22px }
.done p { margin-top: 8px; font-size: 14px; color: var(--muted); line-height: 1.5; font-weight: 500 }
/* Planshet va kompyuter */
@media (min-width: 600px) {
  .card { padding: 24px 24px 18px; border-radius: 24px }
  .card h2 { font-size: 22px }
  .card .sub { font-size: 13.5px }
  .field > label { font-size: 13px }
  .course strong { font-size: 13px }
  .course small { font-size: 11px }
}

/* Past ekranlar (kichik telefonlar) */
@media (max-height: 700px) {
  .course small { display: none }
  .course .ic { width: 26px; height: 26px }
  .note { margin-top: 6px }
}

/* Juda tor ekranlar (320–360px) */
@media (max-width: 360px) {
  .card { margin-left: 10px; margin-right: 10px; padding: 14px 12px 10px }
  .courses { gap: 6px }
  .course { gap: 6px; padding-left: 6px; padding-right: 18px }
  .course .ic { width: 24px; height: 24px; border-radius: 7px }
  .course .ic svg { width: 14px; height: 14px }
  .course strong { font-size: 11px; overflow-wrap: anywhere }
  .course .tick { top: 5px; right: 5px; width: 14px; height: 14px }
  .note { font-size: 10px }
}

/* Juda past ekranlar (masalan 320×568) */
@media (max-height: 600px) {
  .card .sub, .note { display: none }
  .field { margin-top: 7px }
  .field > input { height: 40px }
  .btn { margin-top: 10px; height: 44px }
}
.done .go { margin-top: 10px; font-size: 13px; color: var(--ink) }
.btn.tg { display: grid; place-items: center; text-decoration: none; background: #2aabee; color: #fff; box-shadow: 0 4px 0 #1c8fcb }
.btn.tg:active { box-shadow: 0 1px 0 #1c8fcb }
@keyframes pop { from { transform: scale(.4); opacity: 0 } to { transform: scale(1); opacity: 1 } }
</style>
