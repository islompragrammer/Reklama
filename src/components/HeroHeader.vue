<template>
  <header class="hero">
    <svg class="wave" viewBox="0 0 260 520" fill="none" aria-hidden="true">
      <path d="M180 0C120 120 260 200 200 320S120 460 160 520" stroke="#f7b648" stroke-width="4"/>
      <path d="M260 40C190 160 300 260 230 380S190 480 260 520V40Z" fill="#14524a" opacity=".55"/>
    </svg>
    <div class="top">
      <div class="logo">
        <svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true">
          <!-- toj (yuqori qism) -->
          <path d="M30 6H70L80 16L72 25H28L20 16Z" fill="#fff"/>
          <!-- pastki uchli qism -->
          <path d="M28 29H72L51 96H49Z" fill="#fff"/>
        </svg>
        <b>Tasnim</b>
      </div>
      <div class="badge">Qabul boshlandi!</div>
    </div>
    <h1>Birinchi 3 ta dars<span>bepul!</span></h1>
    <p class="lead">Ismingiz va raqamingizni qoldiring — administratorimiz siz bilan bog'lanadi.</p>
  </header>
</template>

<style scoped>
.hero { position: relative; flex: none; padding: clamp(12px, 2.5vh, 28px) 18px clamp(50px, 9vh, 90px); color: #fff }
.hero svg.wave { position: absolute; right: -60px; top: -20px; width: 220px; height: 440px; pointer-events: none; opacity: .9 }
.top { position: relative; display: flex; align-items: center; justify-content: space-between }
.logo { display: inline-flex; align-items: center; gap: 6px }
.logo b { font-weight: 700; font-size: 18px; letter-spacing: 1.5px; line-height: 1 }
.badge { background: var(--sun); color: var(--ink); font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 999px }
.hero h1 { position: relative; margin-top: clamp(12px, 3vh, 34px); font-weight: 900; font-style: italic; font-size: clamp(26px, min(7.5vw, 5vh), 40px); line-height: 1.02; letter-spacing: -.5px }
.hero h1 span { display: block; color: var(--sun) }
.lead { display: none }

/* Juda tor / past ekranlar (320px) */
@media (max-width: 360px) {
  .hero { padding-left: 14px; padding-right: 14px }
  .badge { font-size: 11px; padding: 5px 10px }
  .logo b { font-size: 16px }
}
@media (max-height: 600px) {
  .hero { padding-top: 10px; padding-bottom: 46px }
  .hero h1 { margin-top: 8px; font-size: 24px }
}

/* Planshet va kompyuter */
@media (min-width: 600px) {
  .hero h1 { font-size: clamp(34px, 5vh, 42px) }
  .lead { display: block; position: relative; margin-top: 10px; font-weight: 600; font-size: 15px; line-height: 1.5; max-width: 34ch; color: #dff0ec }
}
@media (min-width: 600px) and (max-height: 760px) {
  .lead { display: none }
}
</style>
