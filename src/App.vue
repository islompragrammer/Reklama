<script setup>
import HeroHeader from './components/HeroHeader.vue'
import LeadForm from './components/LeadForm.vue'
import { PHONE, PHONE_LABEL } from './config'

const perks = [
  { text: "Finlandiya ta'lim usuli" },
  { text: 'Kichik guruhlar' },
  { text: '3 ta dars bepul', hl: true },
]
</script>

<template>
  <div class="wrap">
    <HeroHeader />
    <LeadForm />

    <div class="bottom">
      <div class="perks">
        <span v-for="p in perks" :key="p.text" :class="{ hl: p.hl }">{{ p.text }}</span>
      </div>

      <a class="call" :href="`tel:${PHONE}`">
        <span class="ph">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/></svg>
        </span>
        <span><small>Savollaringiz bormi? Qo'ng'iroq qiling</small><b>{{ PHONE_LABEL }}</b></span>
      </a>
    </div>
  </div>
</template>

<style scoped>
/* Ekranni bo'yiga to'liq egallaydi; ortiqcha joy pastki blok tepasiga taqsimlanadi */
.wrap {
  max-width: 480px; margin: 0 auto; position: relative; overflow: hidden;
  min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column;
}
.bottom { margin-top: auto; padding: 10px 14px 12px }

.perks { display: flex; flex-wrap: nowrap; gap: 6px; justify-content: center }
.perks span { white-space: nowrap; border: 1.5px solid rgba(255,255,255,.55); color: #fff; border-radius: 999px; padding: 5px 10px; font-size: 11px; font-weight: 700 }
.perks span.hl { background: #fff; color: var(--ink); border-color: #fff }

.call { margin-top: 10px; display: flex; align-items: center; gap: 12px; background: var(--teal-deep); border-radius: 16px; padding: 9px 14px; color: #fff; text-decoration: none }
.call .ph { width: 36px; height: 36px; flex: none; border-radius: 11px; background: var(--sun); display: grid; place-items: center }
.call .ph svg { width: 18px; height: 18px; stroke: var(--ink) }
.call small { display: block; font-size: 11px; color: #bfe0d8; font-weight: 600 }
.call b { display: block; font-size: 15px; font-weight: 800; margin-top: 1px }

@media (max-width: 360px) {
  .perks span { padding: 4px 8px; font-size: 10px }
}

/* Planshet va kompyuter: telefondagi dizayn, o'rtada, biroz kattaroq */
@media (min-width: 600px) {
  .wrap { max-width: 540px; justify-content: center }
  .bottom { margin-top: 0; padding-top: 20px }
  .perks span { font-size: 12px; padding: 6px 12px }
}

/* Past ekranlarda afzalliklar qatori yashiriladi ("3 ta dars bepul" sarlavhada bor) */
@media (max-height: 700px), (min-width: 600px) and (max-height: 780px) {
  .perks { display: none }
  .bottom { padding-top: 8px }
  .call { margin-top: 0 }
}
</style>
