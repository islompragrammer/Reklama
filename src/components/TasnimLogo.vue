<script setup>
// Tasnim logotipi: tepada toj, ostida uchli qism, pastda "Tasnim" yozuvi
import '@fontsource/orbitron/latin-700.css'
</script>

<template>
  <div class="tasnim-logo" role="img" aria-label="Tasnim">
    <svg class="mark" viewBox="0 0 56 66" aria-hidden="true">
      <!-- toj (yuqori qism) -->
      <path d="M5 0H51L56 6L46 13H10L0 6Z" fill="currentColor"/>
      <!-- pastki uchli qism -->
      <path d="M10.5 14.6H45.5L28.8 65H27.2Z" fill="currentColor"/>
    </svg>
    <span class="word">Tasnim</span>
  </div>
</template>

<style scoped>
.tasnim-logo { display: inline-flex; flex-direction: column; align-items: center; gap: .12em; color: #fff; font-size: var(--logo-size, 16px); line-height: 1 }
.mark { width: 2.2em; height: auto; display: block }
.word { font-family: 'Orbitron', var(--font); font-weight: 700; font-size: 1em; letter-spacing: .08em; margin-right: -.08em }
</style>
