import { chromium } from '@playwright/test'
const routes = ['/dashboard','/routines','/routines/new','/workouts','/workouts/history','/profile','/search?q=press','/settings']
const b = await chromium.launch()
const c = await b.newContext({ storageState: '.auth/state.json', baseURL: 'http://localhost:3000', viewport: { width: 390, height: 900 } })
const p = await c.newPage()
const msgs = []
p.on('console', m => { if (['error','warning'].includes(m.type())) msgs.push(`[${m.type()}] ${p.url().replace('http://localhost:3000','')} :: ${m.text().slice(0,180)}`) })
p.on('pageerror', e => msgs.push(`[pageerror] ${p.url().replace('http://localhost:3000','')} :: ${String(e).slice(0,180)}`))
for (const r of routes) { await p.goto(r, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200) }
const act = await p.evaluate(async () => { const k = Object.keys(localStorage).find(k=>k.startsWith('sb-')&&k.endsWith('-auth-token')); const t = JSON.parse(localStorage.getItem(k)).access_token; const r = await fetch('http://localhost:4000/api/workouts/sessions/active',{headers:{Authorization:`Bearer ${t}`}}); return r.status + ' ' + (await r.text()).slice(0,120) })
console.log('ACTIVE SESSION:', act)
console.log('MSGS', msgs.length); for (const m of [...new Set(msgs)]) console.log(m)
await b.close()
