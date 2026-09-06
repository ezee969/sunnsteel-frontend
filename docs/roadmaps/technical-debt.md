# Deuda técnica y TODOs

Derivado de la auditoría técnica del **2026-07-25** (lectura completa del árbol + `next build` real, exit 0).

Cada ítem indica **evidencia** (archivo:línea verificado) y estado:

- ✅ **Hecho verificado** — comprobado en el código o en la salida del build.
- ❓ **Requiere verificación** — deducido del código, no observado en runtime. Confirmar antes de tocar.

Convención: `TD-xx` = deuda técnica, `CL-xx` = limpieza, `M-xx` = medición, `T-xx` = testing, `Q-xx` = pregunta abierta / decisión de producto.

---

## Decisión estratégica — 2026-07-25

Se evaluaron cuatro caminos: (A) optimizar sobre Next.js, (B) migrar el proyecto a Vite in-place, (C) proyecto nuevo con Vite y traslado progresivo, (D) secuenciar A → medir → reevaluar plataforma.

**Decisión: D.** Optimizar sobre Next.js ahora, medir en un iPhone real con la PWA instalada, y reevaluar la plataforma con datos. **No se migra a Vite por el momento.**

**Fundamento (evidencia de la auditoría):**

- De los **13 problemas de rendimiento verificados, 10 son código propio** que sobreviviría intacto a cualquier migración (`providers/`, `hooks/`, `lib/api/`, `features/`). Migrar hoy los copiaría tal cual.
- El mayor coste individual medido son los **~3.4 s del `setTimeout` de TD-03**, unas cien veces el round trip de RSC que una migración eliminaría.
- El framework aporta como máximo **~25–40 kB gzip** de baseline evitable y **1 round trip en 5 de 18 rutas** — y ese round trip es mitigable sin migrar (ver TD-19).
- De los tres factores que determinan la sensación de navegación instantánea (chunk disponible / datos en caché / render barato), Vite sólo mejora un cuarto factor secundario. Los dos que hoy están rotos — **TD-02** (datos) y **TD-07** (render) — son idénticos en ambas plataformas.
- **No existe ni un test en el repo.** Una migración transversal de 18 rutas, dos flujos de auth y una sesión con autoguardado y optimistic updates, verificada sólo a mano, es el peor perfil de riesgo disponible.

**Prioridad declarada del proyecto:** fluidez extrema, PWA instalada en iPhone, arranque en frío mínimo y navegación entre secciones prácticamente instantánea. SEO y SSR **no son objetivos**. iOS descarga las PWA de memoria de forma agresiva, así que **los arranques en frío son frecuentes** — lo que refuerza la prioridad sobre TD-03, TD-18, TD-04 y TD-05.

**Qué quedaría pendiente después de esta fase, y que sí justificaría migrar algún día** (razones de mantenibilidad, **no** de rendimiento):

1. El mecanismo `ss_session` + `middleware.ts` + `app/api/session/route.ts` existe **únicamente** para satisfacer al middleware de Next. En una SPA desaparece entero.
2. El Service Worker artesanal con `CACHE_VERSION` manual es un pasivo, y ya provocó un incidente (documentado en `sw.js:109`). Workbox con revisionado por hash lo resuelve estructuralmente.

Si algún día se migra, el destino no es "Vite" a secas sino **Vite + TanStack Router + vite-plugin-pwa**: el router es lo que determina la sensación de navegación, no el bundler. Y debe hacerse **después** de T-01 (tests sobre lógica pura), nunca antes.

**Reevaluar esta decisión cuando:** ~~M-01 dé números y se hayan cerrado los bloques 1–3~~. **Actualizado 2026-07-25:** los bloques 1, 2 y 3 están cerrados, pero **no habrá medición en iPhone** (ver M-01). La decisión de no migrar se mantiene sobre el argumento estructural, no sobre datos de dispositivo. El prerrequisito bloqueante para reabrir Q-02 sigue siendo **T-01**.

---

## P0 — Impacto directo en usuarios

### TD-24 · Verificación de auth duplicada y respuestas obsoletas — **IMPLEMENTADO; smoke tests principales confirmados por el usuario (2026-09-05)**

**Evidencia:** el login por email y el provider llamaban a `verifyToken` para el mismo token; el callback OAuth repetía la lectura de sesión y la verificación. El provider invalidaba `['user']` después de cada verificación y no descartaba respuestas de una sesión anterior. Un `/verify` tardío podía volver a escribir el marcador después del logout.

**Cambios:** [auth-session-controller.ts](../../lib/auth/auth-session-controller.ts) separa la coordinación de eventos de React, mantiene síncrono el callback de Supabase y descarta resultados tras logout, cambio de cuenta o desmontaje. Los eventos `SIGNED_IN` repetidos y los refresh de una sesión ya verificada no repiten la verificación. `USER_UPDATED` sí refresca el perfil. El callback OAuth consume el estado del provider. La sesión habilita las queries antes de la verificación, preservando TD-18; la limpieza del marcador sigue precediendo a la sesión nula y al error, preservando TD-21.

[supabaseAuthService.ts](../../lib/api/services/supabaseAuthService.ts) comparte la verificación pendiente/completada del token actual en memoria, sin usar esa caché como autorización. Invalida resultados al cambiar de identidad y serializa los POST/DELETE del marcador: una respuesta antigua no puede encolar un nuevo POST, y un DELETE espera al POST que ya haya comenzado. Los POST fallidos no se cachean como login exitoso. Los DELETE siguen siendo best-effort; una UX de recuperación ante fallos de red al cerrar sesión queda pendiente.

**Verificación:** `npm run verify` exit 0: lint, TypeScript, **61 tests en 6 archivos** y build de producción con Next.js 15.5.25. Los 22 tests nuevos cubren deduplicación login/provider, token refresh, cambio de cuenta, logout con respuestas tardías, orden POST/DELETE y cleanup. No se añadieron jsdom ni Testing Library: las llamadas externas están mockeadas. Se comprobó por la ruta del proceso que el servidor de desarrollo en puerto 3000 pertenecía a otro proyecto; no compartía el `.next/` de Sunnsteel y no fue necesario detenerlo.

**Smoke tests confirmados por el usuario (2026-09-05):** Google login local, recarga autenticada conservando la sesión, logout seguido de acceso directo a `/dashboard` con retorno al login sin pantalla negra, y flujo completo de Google login en el sitio desplegado. Esta confirmación es una prueba manual del usuario, no una nueva ejecución automatizada del agente.

**Configuración de Google resuelta:** el error `Unsupported provider: missing OAuth secret` se corrigió creando el cliente OAuth web en Google Cloud, guardando sus credenciales en el proveedor Google de Supabase y configurando Site URL/Redirect URLs. No fue necesario cambiar código para resolver ese error. No se almacenan las credenciales en esta documentación.

**Verificación manual completada por el usuario (2026-09-06):** el usuario confirmó también el login por email, el arranque con sesión expirada y el comportamiento al volver a enfocar la pestaña. Con esto quedan cerrados los smoke tests de auth enumerados en este ítem. La comprobación de refocus es una confirmación manual del usuario, no una captura de red conservada en el repo.

### TD-25 · Service Worker interfería con desarrollo y actualizaba en momentos inseguros — **IMPLEMENTADO Y VERIFICADO (2026-09-05)**

**Evidencia:** [pwa-provider.tsx](../../providers/pwa-provider.tsx) registraba el worker también en desarrollo, por lo que HTML, manifest y bundles de `/_next/static/*` obsoletos podían ocultar el código actual. Cuando encontraba una actualización enviaba `SKIP_WAITING` a `navigator.serviceWorker.controller` — el worker activo anterior — en lugar de al worker nuevo. A la vez, [sw.js](../../public/sw.js) ejecutaba `skipWaiting()` incondicionalmente en `install`, por lo que no existía ninguna oportunidad real de aplazar el cambio. `activate` borraba además toda caché del origen cuyo nombre no coincidiera con las tres actuales, aunque no perteneciera a Sunnsteel, y el handler `fetch` interceptaba innecesariamente los GET al backend cross-origin.

**Cambios:** el worker se registra sólo en producción. En desarrollo se elimina una inscripción Sunnsteel `/sw.js` previa y exclusivamente las cachés con prefijo `ss-*`; si ese worker todavía controla la página, se recarga una vez para impedir que recree las cachés. Las actualizaciones se activan enviando el mensaje al worker `waiting`/`installing`; si el usuario está en `/workouts/sessions/*`, tanto la activación como cualquier recarga se aplazan hasta abandonar la sesión. La primera instalación ya no provoca una recarga innecesaria. `activate` conserva cachés ajenas, los GET cross-origin pasan directo a red y las escrituras en Cache Storage se esperan antes de resolver la respuesta.

**Cobertura y verificación:** [service-worker-policy.test.ts](../../lib/pwa/service-worker-policy.test.ts) cubre propiedad de cachés y la ruta protegida contra recargas. `npm run verify` finalizó con exit 0: lint, TypeScript, **75 tests en 7 archivos** y build de producción con Next.js 15.5.25. `node --check public/sw.js` también pasa.

**`CACHE_VERSION` deliberadamente NO se bumpeó:** no cambió el contenido de `PRECACHE_URLS`; el propio cambio de bytes de `sw.js` dispara el ciclo de actualización. Forzar un namespace nuevo sólo redescargaría contenido idéntico.

### TD-26 · Fallo de red al limpiar el marcador de sesión dejaba el logout sin recuperación — **IMPLEMENTADO (2026-09-06)**

**Evidencia:** `queueSessionMarker('DELETE')` registraba cualquier fallo de `/api/session` y lo convertía en éxito. El controlador publicaba después la sesión nula aunque la cookie `ss_session` siguiera viva, recreando el estado peligroso de TD-21 sin ofrecer al usuario ninguna salida visible.

**Cambios:** los DELETE fallidos vuelven a su llamador y las limpiezas concurrentes comparten una sola promesa. Al recibir una sesión nula, el controlador borra inmediatamente perfil y caché de queries para ocultar datos protegidos, pero conserva el valor anterior de `session` hasta que desaparezca el marcador. Mientras tanto el layout muestra una pantalla de limpieza. Si falla, muestra un mensaje con `Try again`; al reintentar correctamente publica la sesión nula y continúa hacia `/login`. El mismo mecanismo cubre un fallo de limpieza posterior a un error de verificación. Un login nuevo cancela visualmente cualquier recuperación obsoleta. El menú deshabilita logout mientras está en curso y muestra un toast si la operación falla antes de que aparezca la pantalla de recuperación.

**Verificación:** `npm run verify` terminó con exit 0: lint, typecheck, **81 tests en 8 archivos** y build de producción con Next.js 15.5.25. Los tres casos nuevos cubren deduplicación y reintento del DELETE, recuperación tras logout y recuperación después de un error de verificación. En navegador se confirmó que las opciones futuras del sidebar permanecen en `/dashboard`; al probar el logout, la navegación alcanzó `/login`, pero el servidor de desarrollo dejó de escuchar antes de entregar la página. La recuperación ante un DELETE fallido queda verificada de forma automatizada, no mediante una falla de red manual.

### TD-01 · El prefetch de datos nunca acierta la caché — ✔ **HECHO (2026-07-25)**

**Resuelto:** eliminado `hooks/use-navigation-prefetch.ts` (253 líneas) y su consumo en `Sidebar.tsx` (import, `useEffect` de `prefetchMainNavigation`, `handleNavHover`, `onMouseEnter`). El prefetch de rutas lo cubre `next/link`, que ya prefetchea automáticamente esos destinos (todos `○` estáticos). `npm run verify` en verde.

*Diagnóstico original abajo, conservado como referencia.*

---

<details>
<summary>Diagnóstico original</summary>

### TD-01 · El prefetch de datos nunca acierta la caché ✅

**Evidencia:** [hooks/use-navigation-prefetch.ts:73-77](../../hooks/use-navigation-prefetch.ts) escribe con `queryKey: [dataKey]` (un solo segmento), pero los hooks consumidores leen otras claves:

| Prefetch escribe | Hook real lee | Definido en |
|---|---|---|
| `['dashboard-routines']`, `['routines-all']`, `['routines-favorites']` | `['routines','nofilters']`, `['routines','isFavorite:true']` | `routine-query.ts:58-63` |
| `['dashboard-active-session']`, `['workouts-active-session']` | `['workout','session','active']` | `useWorkoutSession.ts:37` |
| `['workouts-history']` | `['workout','sessions','limit:20']` | `useWorkoutSession.ts:39` |

Ninguna coincide. El prefetch hace la petición, la guarda donde nadie lee, y el componente la vuelve a pedir. **Duplicación del 100%.** Peor: `performanceMonitor.recordPrefetch` lo contabiliza como éxito, así que las métricas mienten.

**Impacto medido:** en una carga fría de `/dashboard`, ~12 peticiones de las cuales **5 son desperdicio**, y `GET /workouts/sessions/active` se pide **3 veces**.

**Acción:** reescribir `prefetchData` para que reciba la query key real (importando `routineQueryKeys` y exportando el `qk` de `useWorkoutSession`), **o** eliminar el prefetch de datos por completo y quedarse sólo con `router.prefetch` de rutas. Recomiendo lo segundo como primer paso: es una línea de borrado y elimina el problema entero.

</details>

---

### TD-02 · `refetchOnMount: 'always'` anulaba el `staleTime` — ✔ **HECHO (2026-07-25)**

**Resuelto:** `refetchOnMount: true` en [providers/query-provider.tsx](../../providers/query-provider.tsx). El `staleTime: 5min` pasa a ser real: una query fresca se sirve de caché al navegar y no toca la red.

**Riesgo de datos rancios, gestionado explícitamente:** `useSession(id)` — la sesión de entrenamiento en vivo — lleva su propio **`staleTime: 0`**. Mostrar sets con minutos de retraso ahí no sería una página lenta, sería un bug de corrección. El resto de queries (rutinas, historial, perfil) sí tolera 5 minutos.

`useActiveSession` no necesita opt-out: `useFinishSession` invalida `qk.active` explícitamente ([useWorkoutSession.ts:186](../../lib/api/hooks/useWorkoutSession.ts)), así que queda marcada como stale y `refetchOnMount: true` la refetchea igual.

**Medido en navegador:** ida y vuelta `/dashboard` → `/routines` → `/dashboard` por el sidebar = **0 peticiones nuevas**. Tabla completa al final del bloque 3.

---

### TD-03 · Loader artificial de 3.4–3.8 s en móvil — ✔ **HECHO (2026-07-25)**

**Resuelto:** la animación **se conserva** (ver Q-01) pero deja de ser aditiva y se acorta a `SPLASH_DURATION_MS = 1200`.

Dos cambios, y el segundo es el importante:

1. **`children` se monta en el primer frame.** Antes el contenido sólo se montaba a los 3400 ms (`showContent && <motion.div>{children}</motion.div>`), así que **ninguna query de la página arrancaba hasta entonces**: el splash no tapaba la carga, la *retrasaba*. Ahora los hijos están montados desde el inicio con `opacity: 0` bajo el overlay `fixed z-50`, y sólo se anima su opacidad al salir. El tiempo del splash ahora **solapa** trabajo real en vez de sumarse a él.
2. **Coreografía recomprimida a ~1.2 s.** Los delays internos llegaban hasta 2.5 s (+1.2 s de la barra de progreso = 3.7 s). Reescalados proporcionalmente: título 0.25 s, divisor 0.4 s, tagline 0.55 s, barra de progreso 0.85→1.2 s. Salida del overlay 1 s → 0.5 s. `CORNER_ACCENTS` (delay 0.3→0.15, duración 0.8→0.5) en `corner-accent.tsx`.

**Neto:** de **3.8 s de espera aditiva** a **1.2 s solapados**. En el peor caso el usuario espera 1.2 s; si los datos tardan más que eso, el splash no cuesta nada.

`npm run verify` exit 0. Sin cambios en `First Load JS`.

**Pendiente opcional (tras TD-18):** una vez las queries arranquen en paralelo con la verificación, atar la salida a "datos listos" con suelo de 1.2 s es trivial. Hoy no aporta: `InitialLoadAnimation` sólo se monta *después* de que el layout resuelva la auth (early return de la cáscara vacía), así que no tiene visibilidad sobre la carga de datos.

---

### TD-04 · Logo de 1.76 MB precacheado por el Service Worker ✅

**Evidencia:** [public/sw.js:9](../../public/sw.js) incluye `/logo.png` en `PRECACHE_URLS`; `public/logo.png` pesa **1 803 258 bytes**.

Además `site.webmanifest` lo declara como icono **192×192 y 512×512** (misma imagen de 1024px para ambos), `app/layout.tsx:92-99` lo usa como icon + apple-touch-icon, y `openGraph.images` lo sirve a 1024×1024. **Todo usuario descarga 1.76 MB al instalar el SW.**

**Acción:** generar `icon-192.png`, `icon-512.png` y un `icon-512-maskable.png` optimizados (deberían quedar en decenas de KB), actualizar manifest + metadata, y dejar en `PRECACHE_URLS` sólo el de 192. Bumpear `CACHE_VERSION`.

---

### TD-05 · Chunk de 488 KB de Eruda en el build de producción ✅

**Evidencia:** `.next/static/chunks/0bdaa058.*.js` = **488 KB**, contiene Eruda. Se genera siempre por el `import('eruda')` de [components/Eruda.tsx:25](../../components/Eruda.tsx), independientemente del flag.

Es lazy (sólo se descarga si `SHOULD_ENABLE_ERUDA`), pero se publica en el output estático. Y ojo: `SHOULD_ENABLE_ERUDA = IS_DEVELOPMENT || PUBLIC_ENV.ENABLE_ERUDA` ([lib/config/env.ts:22-23](../../lib/config/env.ts)) — **en `next dev` está siempre activo**.

**Acción:** excluirlo del build de producción. Lo más simple: envolver el `import()` en `if (process.env.NODE_ENV !== 'production')` para que el bundler lo elimine, o mover Eruda a un bookmarklet / script externo cargado bajo demanda.

**❓ Verificar antes:** cuál es el valor de `NEXT_PUBLIC_ENABLE_ERUDA` en Vercel. En `.env.local` es `false`, pero no he podido comprobar el entorno de producción. Si estuviera a `true`, todo usuario móvil se estaría descargando esos 488 KB.

---

### TD-18 · Cascada de auth serial bloquea todo el primer render — ✔ **HECHO (2026-07-25)**

**Resuelto:** la verificación de backend deja de ser una barrera y pasa a correr **en paralelo** con las peticiones de datos. Tres cambios:

1. **`providers/supabase-auth-provider.tsx`** — `setIsLoading(false)` se movió **delante** del `await verifyToken`. Era el bloqueo de verdad: `isLoading` sólo se apagaba al terminar la verificación, así que gatear por `session` no habría servido de nada sin esto. Ahora la auth se considera resuelta en cuanto se sabe *si hay sesión*, no cuando el backend la confirma.
2. **`app/(protected)/layout.tsx`** — la cáscara vacía se gatea con `isLoading || !session` en vez de `isLoading || !isAuthenticated`. Los hijos (y sus queries) montan en cuanto hay un token que enviar. La redirección a `/login` ahora exige `!session` **o** una verificación fallida de verdad (`authError && !user`), no la simple ausencia de perfil verificado.
3. **Hooks de datos** — `useActiveSession` y `useSessions` ([useWorkoutSession.ts](../../lib/api/hooks/useWorkoutSession.ts)), `usePublicUser` y `useUserSearch` pasan de `isAuthenticated` a `!!session`.

**Secuencia antes:** `localStorage` → `POST /verify` (3 saltos: browser→backend→GoTrue) → `POST /api/session` → *ahí* arrancan `GET /routines`, `/sessions/active`, `/sessions`.
**Secuencia ahora:** `localStorage` → `GET /routines`, `/sessions/active`, `/sessions` **y** `/verify` a la vez.

**Dos round trips en serie eliminados del camino a los primeros datos.** El coste de backend no sube: es el mismo trabajo, en paralelo en vez de en serie.

**Lo que NO se hizo, y por qué:** estaba previsto sacar `await this.setSessionMarker()` (`POST /api/session`) del camino crítico en `supabaseAuthService.verifyToken`. Se descartó: con los cambios de arriba, `verify` + el marker ya no bloquean nada — nadie los espera. Hacerlo fire-and-forget no ganaría tiempo y sí arriesga el flujo de login, donde la cookie **no** existe todavía y el middleware la necesita en la navegación inmediata a `/dashboard`.

**Verificación manual completada (2026-09-06):** el usuario confirmó recarga autenticada, logout con acceso directo posterior a `/dashboard`, Google login local y desplegado, login por email, arranque con sesión expirada y refocus de pestaña (ver TD-24). Estas pruebas no constituyen una medición en iPhone.

`npm run verify` exit 0. Sin cambios en el bundle.

*Diagnóstico original y verificación del backend abajo.*

---

<details>
<summary>Diagnóstico original + qué hace `/auth/supabase/verify`</summary>

**Evidencia:**

- [providers/supabase-auth-provider.tsx:60-71](../../providers/supabase-auth-provider.tsx) — en `INITIAL_SESSION` hace `await supabaseAuthService.verifyToken(...)`, que a su vez encadena `POST /auth/supabase/verify` y luego `POST /api/session` ([supabaseAuthService.ts:178-192](../../lib/api/services/supabaseAuthService.ts)).
- `isAuthenticated = !!session && !!user` (línea 93) — requiere que ese round trip haya terminado.
- [app/(protected)/layout.tsx:103-112](<../../app/(protected)/layout.tsx>) — mientras tanto **renderiza una cáscara vacía**.
- `useActiveSession` y `useSessions` tienen `enabled: !isLoading && isAuthenticated` ([useWorkoutSession.ts:49](../../lib/api/hooks/useWorkoutSession.ts) y [:79](../../lib/api/hooks/useWorkoutSession.ts)) → **no arrancan hasta que la verificación termina**.

Secuencia real en un arranque en frío: leer sesión de `localStorage` → `POST /verify` → `POST /api/session` → recién ahí se habilitan las queries de datos → `GET /routines`, `GET /sessions/active`, `GET /sessions`. **Dos round trips en serie antes de la primera petición de datos**, con pantalla vacía todo ese tiempo.

Matiz: `useUser` sólo espera a `!!session` ([useUser.ts:17](../../lib/api/hooks/useUser.ts)), así que el perfil sí arranca antes. El problema afecta a los datos de entrenamiento, que son los que llenan el dashboard.

**Impacto agravado en iPhone:** iOS descarga la PWA de memoria con frecuencia, así que esta cascada se paga muchas veces al día.

**Acción a evaluar (requiere plan):**
- Habilitar las queries con `!!session` en vez de `isAuthenticated`, dejando que el 401 del backend sea la fuente de verdad. Las peticiones ya llevan el bearer token, así que son seguras aunque el backend aún no haya "verificado".
- Renderizar el layout con los datos disponibles en vez de la cáscara vacía, o
- Cachear el resultado de la verificación para no repetirla en cada arranque mientras el token siga vigente.

**✅ Verificado en el backend (2026-07-25) — la verificación es redundante, no un prerrequisito.**

`POST /auth/supabase/verify` ([supabase-auth.controller.ts:77-133](../../../sunnsteel-backend/src/auth/supabase-auth.controller.ts)) **no lleva guard** y hace exactamente esto:

1. `supabaseService.verifyToken(token)` → `supabase.auth.getUser(token)` ([supabase.service.ts:50-62](../../../sunnsteel-backend/src/auth/supabase.service.ts)). **No es validación local de JWT: es una llamada de red del backend a GoTrue.** O sea, el "round trip" real es de tres saltos (browser → backend → Supabase).
2. `getUserBySupabaseId()` — consulta extra a la BD **cuyo único uso es el log de analítica** `[Signup Analytics] ... (new|existing user)`. No afecta a la respuesta.
3. `getOrCreateUser()` — lee el usuario y lo crea/actualiza si hace falta (alta, sincronización de email, vinculación de `supabaseUserId`, 409 en conflicto de email).
4. `res.cookie('ss_session','1')` — **muerta en producción**: la pone en el dominio del backend, y el middleware lee la del dominio del frontend, que la pone `POST /api/session`.
5. Devuelve el perfil (`id, email, name, supabaseUserId, weightUnit`).

**Lo decisivo:** `SupabaseJwtStrategy.validate` ([supabase-jwt.strategy.ts:18-30](../../../sunnsteel-backend/src/auth/strategies/supabase-jwt.strategy.ts)) hace **los pasos 1 y 3 idénticos, en cada petición autenticada**, y `@UseGuards(SupabaseJwtGuard)` está a nivel de clase en **los cuatro** controladores de datos (`routines`, `workouts`, `exercises`, `users`).

Es decir: **cualquier `GET /routines` ya crea/sincroniza el usuario por sí mismo**. `/verify` no es un paso previo que el resto de endpoints necesite — es una duplicación del trabajo que el guard hace igual. Esperar a que termine antes de pedir datos no compra ninguna garantía.

Corolario: la opción 1 (habilitar las queries con `!!session`) es **segura**, y el coste de backend no aumenta — es el mismo trabajo, hecho en paralelo en vez de en serie.

**Y ya se estaba haciendo, sin problemas:** `useUser` se habilita con `!isLoadingSupabase && !!session` ([useUser.ts:17](../../lib/api/hooks/useUser.ts)) y llama a `GET /users/profile` ([userService.ts:14](../../lib/api/services/userService.ts)), que está detrás del mismo guard. O sea, la app **ya** golpeaba un endpoint protegido en paralelo a `/verify` en cada arranque en frío. El cambio no introdujo un patrón nuevo: extendió a los datos de entrenamiento el que ya usaba el perfil.

</details>

**Efecto secundario a asumir:** si `getOrCreateUser` lanza 409 (`Account conflict for this email`), hoy falla `/verify` y no se pide nada más; con el cambio, las queries de datos fallarán con 401 (el guard envuelve todo en `UnauthorizedException`). Hay que mantener una redirección/estado de error a partir del `error` del provider, no confiar en que "no se pidió nada".

---

### TD-21 · Pantalla negra permanente cuando la cookie sobrevive a la sesión — ✔ **HECHO (2026-07-25)**

**Encontrado validando el bloque 2 en el navegador, reproducido y corregido el mismo día.** No lo introdujo TD-18: con el código anterior el layout redirigía igual y el rebote era idéntico. Es la "deriva" entre cookie y sesión que este repo ya documentaba **sin que nadie actuara sobre ella**.

**Síntoma:** borrar `localStorage` estando logueado y recargar `/dashboard` deja la pantalla en negro para siempre.

**Cadena, verificada en vivo:**

1. `ss_session` es una cookie **HttpOnly de 7 días**; borrar `localStorage` no la toca — son almacenes distintos.
2. [middleware.ts:20](../../middleware.ts) sólo mira esa cookie → deja pasar a `/dashboard`.
3. El cliente no tiene sesión de Supabase → el layout pinta la cáscara vacía (fondo oscuro = negro) y hace `router.replace('/login')`.
4. [middleware.ts:28](../../middleware.ts) ve la cookie en `/login` → devuelve a `/dashboard`.

**No se percibe como un bucle**: la app queda **aparcada en `/dashboard` con el `body` vacío**. Por eso el síntoma es "pantalla negra" y no "parpadeo".

**Causa raíz:** `clearSessionMarker()` sólo se invocaba desde `signOut()` ([supabaseAuthService.ts](../../lib/api/services/supabaseAuthService.ts)). **Cualquier otra forma de perder la sesión** — storage borrado, refresh token muerto, sesión revocada en Supabase, backend que responde 401 — dejaba el marcador atrás.

**Resuelto** en [providers/supabase-auth-provider.tsx](../../providers/supabase-auth-provider.tsx): el marcador se borra en **las dos** rutas que dejan al cliente sin autenticar, y `clearSessionMarker` pasa a ser público.

- **Sin sesión:** `await clearSessionMarker()` **antes de `setSession(null)`**.
- **Verificación fallida** (`catch`): `await clearSessionMarker()` **antes** de `setError(...)`. El error es lo que dispara la redirección del layout, así que publicarlo antes reabriría la misma carrera.

En ambos casos **el orden es el arreglo**, no la llamada en sí. Si se refactoriza esto, ese orden es lo que hay que preservar.

#### Corrección del 2026-07-26 — el primer arreglo estaba incompleto

**El logout seguía dando pantalla negra.** El arreglo original borraba el marcador en la rama `else`, es decir **después** de `setSession(null)`, y funcionaba sólo por accidente: en la carga inicial `isLoading` todavía era `true` y eso frenaba el efecto de redirección del layout el tiempo suficiente para que el `DELETE` llegara.

En el logout no hay tal freno. `isLoading` ya está resuelto, así que:

1. `supabase.auth.signOut()` emite el evento con sesión `null`.
2. `setSession(null)` provoca re-render **inmediato**.
3. El layout ve `session === null` y redirige a `/login`.
4. La cookie **sigue puesta** — el `DELETE` va en camino. Middleware rebota a `/dashboard`. Pantalla negra.

**La corrección es mover el borrado antes de publicar la sesión nula**, fuera de la rama `else`:

```ts
if (!session) {
  await supabaseAuthService.clearSessionMarker()
}
setSession(session)
```

Así el invariante deja de depender de que `isLoading` esté casualmente en `true` y se cumple en **todos** los caminos: carga inicial, token muerto, sesión revocada y logout explícito.

**Lección:** "borrar la cookie antes de redirigir" no era una condición suficiente. La condición real es **borrarla antes de que cualquier render pueda observar la sesión nula**, porque es el render el que dispara la redirección.

**Verificado en el navegador (2026-07-26)** pulsando *Log out* con sesión real:

| Comprobación | Resultado |
|---|---|
| Ruta tras el logout, muestreada 4,2 s | `/login` y sólo `/login` |
| Pantalla | formulario visible, **no** vacía |
| Sesión de Supabase | 0 claves `sb-*` |
| Navegar a `/dashboard` después | `→ /login?redirectTo=%2Fdashboard` |

La última fila es la prueba de que la cookie se borró: la redirección la hace el **middleware**, no el cliente.

**Verificado en navegador** (dev, Chrome, `localhost:3000` contra backend real):

| | Antes | Después |
|---|---|---|
| `/dashboard` con cookie y sin sesión | aparcado en `/dashboard`, `body` vacío, pantalla negra | aterriza en `/login`, formulario renderizado, estable 3.6 s |
| Navegar de nuevo a `/dashboard` | seguía pasando el middleware | `→ /login?redirectTo=%2Fdashboard` |

La segunda fila es la prueba de que la cookie la borró el provider: la redirección pasa a venir del **middleware**, no del cliente.

**Trampa de diagnóstico, anotada para la próxima:** sondear el estado de la cookie con `fetch('/dashboard')` **desde la página miente**. El Service Worker es network-first para HTML pero con caché de fallback, así que devuelve `/dashboard` cacheado sin pasar por el middleware. Para comprobar el gateo de rutas hay que hacer una **navegación real**, o mirar `Set-Cookie` desde fuera del navegador.

---

### TD-22 · `StatsOverview` pedía `limit=100` y el backend devolvía 400 — ✔ **HECHO (2026-07-25)**

**Resuelto:** `useSessions({ limit: 50 })` en [StatsOverview.tsx:7](<../../app/(protected)/dashboard/components/StatsOverview.tsx>). 50 es el techo que impone el backend.

**Por qué el frontend y no subir el `@Max` del backend (Q-05):** es una línea, en este repo, sin desplegar el backend. Y subir el límite legitimaría traerse 100 sesiones al cliente para calcular 4 números, que es exactamente lo que TD-11 dice que está mal. La solución correcta a medio plazo sigue siendo agregar en el servidor; esto desbloquea la función mientras tanto.

**Coste asumido:** las métricas "total completadas" y "tasa de finalización" se calculan ahora sobre las 50 sesiones más recientes en vez de 100. Para un usuario con mucho historial eso subestima el total. Es estrictamente mejor que el 0 permanente de antes, y desaparece cuando se haga la agregación en backend.

**Verificado en navegador:** `GET /workouts/sessions?limit=50` → **200**, y **una sola petición** (antes: 400 × 4).

**Cuidado al validar esto visualmente:** en la cuenta de pruebas las tarjetas siguen mostrando 0, y es **correcto** — esa cuenta tiene una única sesión y está `ABORTED`, así que 0 completadas de 1 total = 0%. Un 0 en pantalla no distingue "roto" de "vacío", y por eso este bug sobrevivió tanto. La prueba real es el código de estado, no la UI.

**Corrige también TD-11:** ese ítem decía que `StatsOverview` "recalcula sobre 100 sesiones en cada render". Mientras estuvo roto **no recalculaba sobre nada**. Con esto arreglado, el coste que describe TD-11 pasa a ser real por primera vez — el `useMemo` que propone ahora sí hace falta.

*Diagnóstico original abajo.*

---

<details>
<summary>Diagnóstico original</summary>

**Descubierto midiendo el waterfall de TD-18 en el navegador (2026-07-25). No era deuda de rendimiento: era una función rota en producción.**

**Evidencia:** `GET /workouts/sessions?limit=100` → **400** en todos los intentos, capturado en `PerformanceResourceTiming.responseStatus` y en consola.

- [StatsOverview.tsx:7](<../../app/(protected)/dashboard/components/StatsOverview.tsx>) pide `useSessions({ limit: 100 })`.
- El DTO del backend valida `@Max(50)` sobre `limit` ([list-sessions.dto.ts:47](../../../sunnsteel-backend/src/workouts/dto/list-sessions.dto.ts)).
- Curiosamente el servicio **sí** lo toleraría: `clampTake` hace `Math.min(Math.max(limit ?? 20, 1), 50) + 1` ([workout-session-read.service.ts:29](../../../sunnsteel-backend/src/workouts/workout-session-read.service.ts)). La petición muere en la validación, antes de llegar ahí.

**Degradación silenciosa:** con la query en error, `data` es `undefined` → `sessions = []` ([StatsOverview.tsx:23](<../../app/(protected)/dashboard/components/StatsOverview.tsx>)) → las cuatro métricas calculan sobre un array vacío y pintan **0** sin ningún estado de error. Verificado en pantalla: "Weekly Workouts 0", "Active Days 0". Un usuario con historial real ve ceros y asume que la app perdió sus datos.

**Corrige también TD-11:** ese ítem dice que `StatsOverview` "recalcula sobre 100 sesiones en cada render". **No recalcula sobre nada** — nunca recibe una sola sesión. El coste que describe TD-11 no existe hoy; aparecerá en cuanto se arregle esto.

</details>

---

### TD-23 · El "no reintentar en 4xx" no funcionaba: cada 4xx se reintentaba 3 veces — ✔ **HECHO (2026-07-25)**

**Resuelto:** nueva clase `HttpError extends Error` con `status`, lanzada por `httpClient` en lugar de un `Error` plano ([httpClient.ts](../../lib/api/services/httpClient.ts)). El predicado de reintento que ya existía en `query-provider.tsx` **no se tocó** — simplemente ahora encuentra el `status` que siempre esperó.

También se le da `status: 401` al `throw` de `'Session expired'`: si no hay token que enviar, reintentar no puede ayudar.

Extiende `Error`, así que el manejo existente (`instanceof Error`, `.message`) no cambia. Se comprobó por grep que nada dependía del tipo concreto.

**Verificado en navegador:** `/routines/<uuid-inexistente>` → `GET /routines/00000000-…` → **404, 1 intento** (esperando 9 s). Antes, el 400 de TD-22 producía 4 intentos escalonados a lo largo de 9 s.

*Diagnóstico original abajo.*

---

<details>
<summary>Diagnóstico original</summary>

### TD-23 · El "no reintentar en 4xx" no funciona: cada 4xx se reintenta 3 veces ✅

**Evidencia:** el 400 de TD-22 se pidió **4 veces** en un solo arranque (t=989, 2641, 4947, 9259 ms), con separaciones de ~2.3 s y ~4.3 s — el backoff exponencial de `retryDelay`.

[query-provider.tsx:18-26](../../providers/query-provider.tsx) decide el reintento leyendo `error.status`:

```ts
const status = typeof error === 'object' && error !== null && 'status' in error
  ? (error as { status?: number }).status : undefined
if (typeof status === 'number' && status >= 400 && status < 500) return false
```

Pero `httpClient` lanza `new Error(errorMessage)` ([httpClient.ts:79](../../lib/api/services/httpClient.ts)) — un `Error` plano **sin propiedad `status`**. La condición nunca se cumple, así que **todos** los errores caen en `failureCount < 3`.

**Consecuencia:** cualquier 4xx (validación, 401, 404) se reintenta 3 veces con backoff. Multiplica por 4 el coste de cada error y retrasa hasta ~9 s el momento en que la UI se da por vencida.

**Acción:** adjuntar el estado al error en `httpClient` para que el predicado que ya existe funcione.

**Nota documental:** `CLAUDE.md` y `AGENTS.md` afirmaban "no retry on 4xx". Era falso; corregido.

</details>

---

## P1 — Rendimiento y coste de red

### TD-06 · `preloadAllCriticalComponents` descarga ~11 chunks de página de golpe — ✔ **HECHO (2026-07-25)**

**Resuelto:** eliminados `preloadAllCriticalComponents`, `preloadOnVisible` y el `useEffect` de precarga en `(protected)/layout.tsx`. `preloadComponents` podado de 11 entradas a las **3 que realmente consume `preloadOnHover`** (`activeWorkoutSession`, `newRoutinePage`, `workoutHistoryPage`). Se conserva `preloadOnHover`, que es precarga *bajo intención del usuario* y sí es útil.

**Nota:** `DashboardStats` sigue siendo un export muerto en ese archivo — se borra en el bloque 5 (CL-03).

*Diagnóstico original abajo.*

---

<details>
<summary>Diagnóstico original</summary>

### TD-06 · `preloadAllCriticalComponents` descarga ~11 chunks de página de golpe ✅

**Evidencia:** [lib/utils/dynamic-imports.tsx:86-97](../../lib/utils/dynamic-imports.tsx) recorre `preloadComponents`, que hace `import()` de `routines/page`, `workouts/page`, `dashboard/page`, `routines/new/page`, `routines/edit/[id]/page`, los 3 pasos del wizard, `workouts/sessions/[id]/page`, `workouts/history/page` y `workouts/history/[id]/page`. Se dispara desde [app/(protected)/layout.tsx:87-98](<../../app/(protected)/layout.tsx>) 2 s después de autenticar.

Esto es lo contrario de lazy loading: se descarga casi toda la app, incluidos los chunks más pesados (wizard, ~315 kB), tanto si el usuario va allí como si no.

**Acción:** reducirlo a las 2-3 rutas que el usuario visita realmente después del dashboard, o eliminarlo y confiar en `router.prefetch` sobre hover (que ya existe en el Sidebar y funciona bien).

</details>

---

### TD-07 · Doble invalidación tras guardar un set + cascada de re-render — ✔ **HECHO (2026-07-25)**

**Evidencia original:** `useUpsertSetLog` invalidaba `qk.session(id)` en `onSuccess` **y otra vez** en `onSettled`. Cada autoguardado disparaba un `GET /workouts/sessions/{id}` completo → nuevo array `setLogs` → se recalculaba `groupedLogs` → se re-renderizaban **todos** los `ExerciseGroup` y `SetLogInput`. En la pantalla más interactiva de la app, mientras el usuario teclea.

**Resuelto:** en el camino feliz **ya no hay refetch**. `onSuccess` reconcilia en sitio con la fila que devuelve el servidor vía `setQueryData`, y la invalidación queda sólo en `onError`.

**Por qué es seguro:** `upsertSetLog` del backend devuelve el `SetLog` completo y **no modifica la sesión** — sólo la lee para validar propiedad y estado ([workout-session-log.service.ts:35-110](../../../sunnsteel-backend/src/workouts/services/workout-session-log.service.ts)). No hay nada en la respuesta de la sesión que el refetch pudiera corregir. Como bonus, sustituye el id sintético `optimistic:…` que insertaba `onMutate` por el real.

**De 2 refetches por pulsación a 0.**

**Lo que NO se hizo, y por qué importa:** la acción (c) original proponía `React.memo` en `ExerciseGroup` y `SetLogInput`. **Sería inútil tal y como está el código.** `groupSetLogsByExercise` ([session-progress.utils.ts:146-186](../../lib/utils/session-progress.utils.ts)) reconstruye **todos** los objetos en cada llamada: `sortedExercises.map(...)` crea un objeto nuevo por grupo y `templateSets.map(...)` uno nuevo por set. `React.memo` hace comparación superficial, así que cada prop sería una referencia nueva y ningún memo cortaría nada.

Para que `React.memo` aportara algo habría que **primero** dar estabilidad referencial a `groupSetLogsByExercise` (reutilizar los objetos cuyo `SetLog` de origen no cambió). Eso es un cambio con su propio riesgo y merece su propio ítem — no añadir memos que no hacen nada.

---

### TD-08 · El Service Worker pide 5 páginas HTML en cada activación — ✔ **HECHO (2026-07-25)**

**Evidencia original:** `public/sw.js` — en `activate` hacía `fetch` de `/dashboard`, `/routines`, `/workouts`, `/login`, `/signup` y los cacheaba. Cada despliegue con `CACHE_VERSION` nuevo = 5 peticiones extra por usuario, incluyendo `/login` y `/signup` que un usuario autenticado nunca verá.

**Resuelto:** eliminado el bloque de prefetch del handler `activate`. La constante `CRITICAL_PAGES` se conserva porque el handler `fetch` la usa para decidir entre `PAGE_CACHE` y `RUNTIME_CACHE`; ahora esas páginas se cachean **cuando el usuario las visita**, que es el comportamiento correcto. El HTML sigue siendo network-first con caché de fallback, así que el offline no se degrada.

**`CACHE_VERSION` deliberadamente NO se bumpeó:** el cambio es sólo de comportamiento del handler, no del contenido cacheado. Bumpear habría forzado una redescarga completa innecesaria. Se bumpeará en el bloque 4 junto con TD-04, que sí cambia `PRECACHE_URLS`.

---

### TD-09 · Rutas del wizard a 315–316 kB de First Load JS ✅

**Evidencia:** salida de `next build`:

```
/routines/edit/[id]   9.45 kB   316 kB   ← máximo de la app
/routines/new         8.28 kB   315 kB
/routines             13 kB     295 kB
```

Ambas páginas importan los 4 pasos de forma estática y los seleccionan con un `switch` ([routines/new/page.tsx:18-21](<../../app/(protected)/routines/new/page.tsx>), [routines/edit/[id]/page.tsx:18-21](<../../app/(protected)/routines/edit/[id]/page.tsx>)).

**Acción:** `next/dynamic` para `BuildDays` y `ReviewAndCreate` (los dos pasos pesados). El usuario ve el paso 1 primero; no hay razón para descargar el 3 y el 4 antes de llegar.

---

### TD-10 · Doble fetch al cambiar filtros del historial — ✔ **HECHO (2026-07-26)**

**Confirmado en el navegador, pero la causa NO era la que decía este ítem.**

**Medido antes:** `/workouts/history` con URL limpia disparaba **2 peticiones** en la carga (`?status=COMPLETED&limit=20&sort=…` y `?limit=20&sort=…`), y **2 más** en cada cambio de filtro.

**Hipótesis original:** el `refetch()` que sigue a cada `setState` se ejecuta sobre la query del render actual (clave vieja). Se quitaron esos `refetch()` de los cuatro manejadores… y **el número de peticiones no cambió**. La hipótesis era incorrecta, o al menos no era la causa dominante.

**Causa real:** una incoherencia dentro de [use-workout-history-filters.ts](../../features/workout/use-workout-history-filters.ts) entre dos sitios que fijan el mismo estado:

- el inicializador de `status` usaba `search.get('status') ?? 'COMPLETED'`;
- el efecto que sincroniza desde la URL usa `setStatus(s ?? undefined)`.

Así que el primer render consultaba `status=COMPLETED`, el efecto lo reseteaba a `undefined` y salía una segunda petición con otra clave. El select de Status muestra **"All"** desde el principio, así que el default `'COMPLETED'` era el intruso: pedía datos que la UI nunca decía estar mostrando.

**Resuelto:** el inicializador pasa a `?? undefined`, coherente con el efecto y con lo que se ve en pantalla.

**Medido después:**

| | Antes | Después |
|---|---|---|
| Carga de `/workouts/history` | 2 peticiones | **1** |
| Cambio de filtro | 2 peticiones | **1**, con la clave correcta |

Verificado además que el filtro se sigue aplicando: al elegir "Aborted" sale `?status=ABORTED&…`, la UI muestra el chip y la lista devuelve la sesión abortada.

**Los `refetch()` se quedaron eliminados** aunque no fueran la causa: eran llamadas redundantes —el cambio de `params` ya dispara el fetch correcto— y quitarlas no alteró el comportamiento observado. Pero **no se les puede atribuir la mejora**.

*Diagnóstico original abajo.*

---

<details>
<summary>Diagnóstico original (hipótesis incorrecta)</summary>

### TD-10 · Doble fetch probable al cambiar filtros del historial ❓

**Evidencia:** [app/(protected)/workouts/history/page.tsx:100-143](<../../app/(protected)/workouts/history/page.tsx>) — `handleChangeStatus`, `handleChangeRoutine`, `handleChangeSort` y `handleClearFilter` llaman a `refetch()` justo después de un `setState` que modifica `params` y, por tanto, la query key.

**Razonamiento:** el `refetch` se ejecuta sobre el objeto de query del render actual (clave *antigua*) mientras React monta la query nueva → una petición con filtros viejos + otra con los nuevos.

**Acción:** confirmar en la pestaña Network cambiando un filtro. Si se confirma, borrar las llamadas a `refetch()`: el cambio de `params` ya dispara el fetch correcto por sí solo.

</details>

---

### TD-11 · `StatsOverview` recalcula sobre las sesiones en cada render ✅

> **Corregido el 2026-07-25.** Este ítem afirmaba que el componente recalculaba sobre 100 sesiones. Era falso: la petición devolvía **400** y el componente calculaba sobre un array vacío (ver TD-22). El coste descrito aquí **no existía**. Desde que TD-22 está arreglado, el componente recibe datos de verdad y este ítem pasa a ser real por primera vez — ahora sobre **50** sesiones, no 100.

**Resuelto (2026-07-25):** todo el cálculo derivado vive ahora en un único `useMemo` dependiente de `data`. Hubo que **subirlo por encima del `return` temprano de `isLoading`**: dejarlo donde estaba habría roto las reglas de hooks.

De paso se eliminó un doble filtrado real: `totalCompleted` y `completedSessionsCount` aplicaban `filter(s => s.status === 'COMPLETED')` por separado sobre la misma lista para obtener **el mismo número**. Ahora se calcula una vez.

**Cambio de comportamiento menor y aceptado:** el "inicio de semana" se calculaba en cada render, así que cruzar la medianoche con la app abierta lo actualizaba. Ahora se recalcula cuando cambian los datos. Irrelevante en la práctica: la página se remonta en cada navegación.

**Agregación implementada y smoke test en navegador verificado (2026-09-06):** `StatsOverview` consume `GET /workouts/stats` mediante servicio y hook. El backend cuenta todas las sesiones del usuario y todas las completadas en una transacción consistente; sólo lee timestamps de finalización del intervalo semanal para contar días activos en la zona horaria del navegador. La respuesta contiene cuatro números, sin el límite de 50 del historial. `TodaysWorkouts` conserva su consulta de sesiones para mostrar los entrenamientos del día.

La semana comienza el lunes local y usa un límite superior exclusivo; el hook revisa el intervalo cada minuto para cambiar de clave al pasar de semana. Inicio y finalización de sesión invalidan las estadísticas. La tasa conserva su definición (sesiones completadas / todas las sesiones), pero sus textos ya no dicen que mide sets. Los errores muestran un mensaje con reintento en lugar de ceros.

**Contrato compartido publicado (2026-09-06):** `@sunsteel/contracts@0.6.0` exporta `WorkoutStatsQuery` y `WorkoutStatsResponse`. Backend y frontend consumen `^0.6.0` desde npm; no usan enlaces `file:`. El DTO del backend conserva sólo los decoradores de validación e implementa el contrato compartido, mientras el helper frontend conserva el cálculo de la semana local y usa el tipo compartido. `npm run verify` pasó en contracts y backend; frontend pasó lint, typecheck y 81 tests. No se repitió `next build` porque el servidor de desarrollo estaba activo. Los endpoints locales de login y health respondieron 200. Desplegar el backend con `/workouts/stats` antes del frontend. No requiere migración de base de datos.

**Verificación completada (2026-09-06):** `npm run verify` frontend terminó con exit 0: lint, typecheck, 78 tests en 8 archivos y build de producción con Next.js 15.5.25, ejecutado tras confirmar que el dev server de este checkout estaba detenido. Backend: lint, typecheck, build y cuatro tests con base de datos mockeada (historial de más de 50 sesiones, pertenencia al usuario, fechas locales, historial vacío y validación de parámetros). Smoke test autenticado en `localhost:3000`, con backend en `4000`: las cuatro tarjetas muestran 0 entrenamientos semanales, 0 días activos, 1 entrenamiento total y 50% de finalización, también después de una recarga completa, sin mensaje de error de estadísticas. Esto verifica carga y persistencia visual, no una comparación independiente contra la base de datos ni una mutación de entrenamiento real.

---

## P2 — Corrección y coherencia

### TD-12 · `tailwind.config.ts` es configuración muerta ✅

**Evidencia:** Tailwind instalado es **4.3.2**; [app/globals.css:1](../../app/globals.css) usa `@import 'tailwindcss'` + `@theme inline`, **sin ninguna directiva `@config`**; `components.json` tiene `"tailwind": { "config": "" }`.

En Tailwind v4 el archivo de config sólo se carga con `@config`. Las 81 líneas de `tailwind.config.ts` (sintaxis v3: `content`, `theme.extend.colors`, keyframes de accordion) **no las lee nadie**.

**Acción:** borrar `tailwind.config.ts`, **pero antes** migrar a `globals.css` lo que aún haga falta. En concreto:

**❓ Verificar:** las keyframes `accordion-down` / `accordion-up` sólo están declaradas en el config muerto. Comprobar en el navegador si el acordeón de rutinas (`RoutineDayAccordion`) anima o hace un salto seco. Si salta, hay que declarar las animaciones en `globals.css`.

---

### TD-13 · La rama `/api/*` del Service Worker es inalcanzable ✅

**Evidencia:** [public/sw.js:70-97](../../public/sw.js) implementa cache-first para `/api/*` del mismo origen. Pero el backend vive en otro origen (`:4000` / dominio propio), y el único `/api/*` propio es `/api/session`, que sólo acepta `POST`/`DELETE` — mientras que el handler hace `if (request.method !== 'GET') return;` en la línea 64.

Ese bloque **nunca se ejecuta**. Es código que da falsa sensación de tener caché offline de API.

**Acción:** borrarlo, o documentar que es un placeholder para un futuro proxy `/api` en el propio frontend.

---

### TD-14 · `PerformanceObserver` se registra sin comprobar ningún flag ✅

**Evidencia:** [lib/utils/performance-monitor.ts:22-26](../../lib/utils/performance-monitor.ts) — el constructor llama a `initializeWebVitals()` si existe `window`, y `performanceMonitor` es una instancia a nivel de módulo. Registra tres observers (LCP, FID, CLS) **siempre**, aunque `SHOULD_LOG_PERFORMANCE` sea `false`.

Coste bajo, pero rompe la coherencia del sistema de flags (todo lo demás es opt-in) y acumula métricas en memoria que nadie lee.

**Acción:** condicionar la inicialización a `SHOULD_LOG_PERFORMANCE`.

---

### TD-15 · `theme_color` del manifest contradice la metadata ✅

**Evidencia:** `site.webmanifest` fija `"theme_color": "#FFFFFF"`, mientras [app/layout.tsx:104-107](../../app/layout.tsx) declara `themeColor` adaptativo (`#FFFFFF` light / `#000000` dark). En PWA instalada y modo oscuro, la barra queda blanca.

**Acción:** unificar. Aprovechar para añadir al manifest lo que falta: iconos `maskable`, `screenshots`, `shortcuts` y `id`.

---

### TD-16 · El middleware corre sobre `/auth/:path*` sin hacer nada ✅

**Evidencia:** [middleware.ts:39](../../middleware.ts) incluye `/auth/:path*` en el `matcher`, pero la función no trata esas rutas (no están en `PROTECTED_PREFIXES` ni en `AUTH_PAGES`), así que cae en `NextResponse.next()`.

Invocación de middleware (34.1 kB) sin efecto en cada visita a `/auth/callback`.

**Acción:** quitar la entrada del matcher, salvo que exista una razón que no esté en el código.

---

### TD-17 · Rutas de navegación que no existen — ✔ **HECHO (2026-09-06)**

**Evidencia:** [app/(protected)/layout.tsx:44-47](<../../app/(protected)/layout.tsx>) mapea `/progress`, `/exercises`, `/schedule` y `/achievements` en `getActiveNavFromPath`; el Sidebar los lista con `disabled: true` y un toast "Coming Soon" ([Sidebar.tsx:65-96](../../features/shell/components/Sidebar.tsx)).

No es un bug, pero el mapeo del layout sugiere rutas que no existen y confundirá a quien lea el código.

**Resuelto:** el layout ya no reconoce como rutas activas `/progress`, `/exercises`, `/schedule` ni `/achievements`. Los cuatro elementos siguen visibles como funciones futuras y conservan su toast, pero el tipo de navegación ya no permite asignarles un `href`; sólo los elementos habilitados pueden declarar una ruta real.

---

### TD-19 · Round trip de RSC en las 5 rutas dinámicas — ✔ **CONFIGURADO (2026-07-25)**

**Resuelto:** `experimental.staleTimes: { dynamic: 30, static: 180 }` en [next.config.ts](../../next.config.ts). El build lo confirma: `- Experiments (use with caution): · staleTimes`.

No afecta a la frescura de los datos: éstos vienen de TanStack Query, no del payload RSC. Lo único que se cachea es la cáscara de cliente de la ruta.

**❓ Impacto sin medir**, y probablemente pequeño: esas páginas son 100% `'use client'`, así que el payload es diminuto. Sigue siendo **el único coste de navegación atribuible al framework**, y ahora está mitigado sin migrar — que era justo el argumento de la § Decisión estratégica.

*Diagnóstico original abajo.*

---

<details>
<summary>Diagnóstico original</summary>

**Evidencia:** la salida de `next build` marca como `ƒ` (server-rendered on demand) a `/routines/[id]`, `/routines/edit/[id]`, `/workouts/history/[id]`, `/workouts/sessions/[id]` y `/profile/[[...userId]]`. `next.config.ts` **no configura `experimental.staleTimes`**.

Por el comportamiento documentado de Next 15, el Router Cache de cliente usa `staleTimes.dynamic = 0` por defecto, así que navegar a esas rutas refetchea el RSC payload cada vez. Para páginas que son 100% `'use client'` ese payload es pequeño, pero es un round trip.

Es **el único coste de navegación atribuible al framework**, y es mitigable sin migrar.

**Acción:** configurar `experimental.staleTimes: { dynamic: 30, static: 180 }` (segundos) y medir.

</details>

---

### TD-20 · Falta metadata `appleWebApp` para la PWA en iOS ✅

**Evidencia:** [app/layout.tsx](../../app/layout.tsx) define `metadata` completa (icons, manifest, openGraph) pero **no incluye `appleWebApp`**. Grep de `appleWebApp` / `apple-mobile` / `statusBarStyle` → 0 resultados.

Siendo iOS instalada la plataforma objetivo declarada del proyecto, conviene controlar explícitamente el título de la app instalada y el estilo de la barra de estado (`statusBarStyle`), que afecta directamente a cómo se ve la app a pantalla completa.

**Acción:** añadir `appleWebApp: { capable: true, title: 'Sunnsteel', statusBarStyle: 'black-translucent' }` y verificar en un iPhone real. Agrupar con TD-15 (coherencia de `theme_color`) y TD-04 (iconos).

---

## Medición y testing

### M-01 · No existe ninguna medición de referencia — **REPLANTEADO (2026-07-25)**

**Evidencia:** [lib/utils/performance-monitor.ts](../../lib/utils/performance-monitor.ts) instrumenta LCP/FID/CLS y métricas de prefetch, pero (a) nadie consume el reporte fuera del panel de debug, y (b) **miente**: `recordPrefetch` contabiliza como éxito los prefetch de TD-01, que nunca aciertan la caché.

Sin una línea base, ningún cambio de rendimiento es demostrable, y la decisión de plataforma (§ Decisión estratégica) no se puede reevaluar con datos.

**Replanteado el 2026-07-25: no habrá medición en iPhone.** El dueño del proyecto ha decidido no hacer pruebas en dispositivo. Eso cambia dos cosas y conviene ser explícito sobre ellas:

1. **No hay línea base de tiempos percibidos**, ni la habrá. Todo lo medido en los bloques 2 y 3 es Chrome de escritorio contra `localhost`, que sirve para verificar **orden y número de peticiones** — no para estimar cuánto tarda la app en una red móvil.
2. **La reevaluación de Q-02 se queda sin los datos que la iban a decidir.** La § Decisión estratégica decía "reevaluar cuando M-01 dé números". Esos números no van a llegar, así que la decisión de no migrar se sostiene sobre el argumento estructural (10 de 13 problemas eran código propio) y sobre las mediciones de red de abajo, que sí se hicieron.

**Lo que sí se midió, y sirve como línea base sustitutiva:**

- Waterfall del arranque en frío de `/dashboard` con tiempos e inicio de cada petición (ver TD-18).
- Número de peticiones y reintentos por arranque (ver TD-22 y TD-23, ambos encontrados así).
- `First Load JS` y tamaño por ruta de la salida de `next build`, antes y después de cada bloque (ver bloque 1).

Es una base más pobre que la planeada, pero es reproducible y ya ha demostrado su valor: **encontró dos bugs de producción que ninguna medición de tiempos habría revelado.**

**Nota:** arreglar TD-14 (observers sin flag) y TD-01 (métricas falsas) hace que `performanceMonitor` vuelva a ser fiable si más adelante se quiere automatizar.

---

### T-01 · Tests sobre la lógica pura de la sesión de entrenamiento — ✔ **HECHO (2026-07-25), ampliado con auth y PWA**

**Estado actual:** Vitest está integrado en `verify` y CI. La última ejecución pasó **81 tests en 8 archivos**. El bloque 7 detalla el alcance inicial y sus exclusiones; TD-24, TD-25 y TD-26 documentan las ampliaciones. La propuesta original siguiente se conserva como contexto y no implica que todas las unidades propuestas estén cubiertas.

**Propuesta original:**

**Evidencia:** cero archivos de test en el repo; CI sólo hace typecheck → lint → build.

No es una tarea de rendimiento, pero es **precondición de cualquier migración futura** y protege lo único irrecuperable: los datos de entrenamiento del usuario.

Objetivos de mayor retorno, todos lógica pura sin red ni DOM:

- `hooks/use-set-log-form.ts` — comparación de valores guardados, normalización de peso nulo, disparo del autoguardado
- `lib/utils/session-progress.utils.ts` — `calculateSessionProgress`, `areAllSetsCompleted`, `groupSetLogsByExercise`
- `lib/utils/session-validation.utils.ts` — `validateSetLogPayload`
- `lib/api/routines/routine-query.ts` — `serializeRoutineFilters`, `buildRoutineQueryString` (relevante para no repetir TD-01)

**Acción:** Vitest + un puñado de tests de estas cuatro unidades. No hace falta React Testing Library ni tests de componentes por ahora. Añadir `npm test` al `verify` y al CI.

**Prerrequisito bloqueante** para reabrir la discusión de migrar a Vite.

---

## P3 — Limpieza

### CL-01 · Dependencias declaradas y no usadas ✅

Verificado con grep en todo el código fuente — **0 importaciones**:

| Paquete | Nota |
|---|---|
| `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | 3 paquetes, ninguna importación |
| `recharts` | tampoco aparece en ningún chunk del build |
| `@supabase/ssr` | se usa `@supabase/supabase-js` directamente |
| `@tanstack/react-query-devtools` | importado sólo en línea comentada (`query-provider.tsx:53`) |
| `concurrently` (dev) | `dev:all` usa un script PowerShell |
| `cmdk` | sólo lo usa `components/ui/command.tsx`, que a su vez no se importa desde ningún sitio |

**Acción:** `npm uninstall`. Decidir aparte si `react-query-devtools` se quiere activar de verdad (útil para TD-01/TD-02) o se elimina.

---

### CL-02 · `eruda` es devDependency importada desde código de app ✅

**Evidencia:** declarada en `devDependencies` ([package.json:71](../../package.json)), importada en [components/Eruda.tsx:25](../../components/Eruda.tsx).

Funciona en Vercel porque las devDeps se instalan durante el build, pero es frágil: cualquier `npm ci --omit=dev` rompe el build. Relacionado con TD-05.

---

### CL-03 · Archivos muertos ✅

| Archivo | Estado |
|---|---|
| `hooks/use-auth-protection.ts` | 0 importaciones |
| `lib/utils/basic-hypertrophy.ts` | 0 importaciones |
| `lib/utils/volume.ts` | 0 importaciones |
| `lib/utils/timezones.ts` | 0 importaciones |
| `components/ui/command.tsx` | 0 importaciones (ver CL-01) |
| `DashboardStats` en `lib/utils/dynamic-imports.tsx:12` | export `next/dynamic` nunca usado; `dashboard/page.tsx:6` importa `StatsOverview` estáticamente |
| `tick()` en `lib/utils/save-status-store.ts:55-70` | redundante con `scheduleAutoIdle` |
| `use-set-log-form.ts:160-163` | rama `else if` cuyo cuerpo es `void 0` |
| `NEXT_PUBLIC_ENABLE_RTF_DEBUG` en `schema/env.client.ts` | último residuo de RtF, feature eliminada |

**Nota:** el único `next/dynamic` de aplicación (`DashboardStats`) está muerto. Es decir, **la app no tiene lazy loading de componentes en ninguna ruta**.

---

### CL-04 · Mocks de rutinas en el bundle de producción ✅

**Evidencia:** `ROUTINE_MOCKS_ENABLED = false` ([mock-routines.ts:139](../../features/routines/mocks/mock-routines.ts)), pero `WorkoutsList.tsx:19-22` importa `ROUTINE_MOCKS` estáticamente, así que los datos mock y `routine-monday-api-mock.json` entran en el bundle de `/routines`.

**Acción:** eliminar mocks y fixture, o moverlos detrás de un `import()` dinámico condicionado al flag.

---

### CL-05 · Script `docs:check` roto ✅

**Evidencia:** `package.json:18` apunta a `./scripts/update-docs.sh`; `scripts/` sólo contiene `start-dev.ps1`. Además `docs:update` es un `echo`.

**Acción:** borrar ambos scripts del `package.json`.

---

### CL-06 · Herramientas de formato instaladas pero no conectadas — ✔ **HECHO (2026-07-26)**

**Medido antes de tocar nada:** de 233 archivos `.ts`/`.tsx`, **93 seguían `.prettierrc`** (tabs, sin punto y coma) y **135 lo contradecían** (2 espacios, con punto y coma). Un 40/60, sin nada que arbitrara.

**Ejecutado:** los tres plugins conectados en `eslint.config.mjs` y un `eslint --fix` de una sola pasada — **224 archivos, 19 564 correcciones**, todas automáticas.

- `prettier/prettier` como error, con `eslint-config-prettier` **después** de los `extends` para apagar las reglas estilísticas heredadas que pelearían con él.
- `simple-import-sort/imports` y `/exports`. Los imports de efecto (`import './globals.css'`) **no se reordenan**: el plugin los trata como barreras, así que el orden de efectos de módulo se conserva. Ese era el riesgo que justificó aplazarlo, y está acotado por diseño del plugin.
- `import/no-duplicates`, la única regla de `eslint-plugin-import` útil sin resolver de TypeScript. Sus reglas de resolución de rutas (`no-unresolved`, `no-cycle`) se dejan **apagadas** a propósito: necesitan `eslint-import-resolver-typescript`, que no está instalado, y sólo recomprobarían lo que `tsc` ya comprueba.

**Un ajuste que no estaba previsto:** `.prettierrc` tenía `endOfLine: "lf"` y el repo usa `core.autocrlf=true`, o sea árbol en CRLF y repositorio en LF. Con `"lf"` fijo, Prettier marcaba **todos** los archivos como mal formados en cada checkout limpio. Cambiado a `"auto"`: git sigue normalizando a LF al commitear, y Prettier deja de pelearse con el checkout.

**Verificado:** `npm run verify` en verde (lint, typecheck, 33 tests, build) **y** prueba en navegador contra el backend real — `/dashboard` con 7 peticiones y **cero fallos**.

**Commit aislado**, sin ningún cambio funcional dentro, más un `.git-blame-ignore-revs` que lo apunta para que `git blame` siga atribuyendo las líneas a quien las escribió de verdad. Se dejó configurado en el repo local con `git config blame.ignoreRevsFile .git-blame-ignore-revs`; GitHub lo respeta solo.

*Diagnóstico original abajo.*

---

<details>
<summary>Diagnóstico original</summary>

**Evidencia:** `eslint-plugin-prettier`, `eslint-plugin-import` y `eslint-plugin-simple-import-sort` están en `devDependencies` pero **no aparecen en [eslint.config.mjs](../../eslint.config.mjs)**, que sólo extiende `next/core-web-vitals` + `next/typescript`.

Resultado: el repo tiene dos estilos de formato conviviendo (tabs+sin-semi en `lib/api/services/*`, 2-espacios+semi en `middleware.ts`, `providers/*`, `lib/config/env.ts`) y nada lo arbitra.

**Acción:** decidir (ver Q-03). O se conectan los plugins y se hace un reformateo único en un commit aislado, o se desinstalan y se acepta la convención "imita el archivo vecino".

</details>

---

### CL-07 · Cinzel se carga con 7 pesos ✅

**Evidencia:** [app/layout.tsx:35-40](../../app/layout.tsx) — `weight: ['400','500','600','700','800','900']` (+ el default). Es una fuente decorativa usada en títulos.

**Acción:** auditar qué pesos se usan de verdad en `globals.css` y componentes; probablemente bastan 2.

---

### CL-08 · Assets fuente sobredimensionados ✅

**Evidencia:** `public/backgrounds/vertical-hero-greek-columns.webp` = **5.23 MB**.

Mitigado: pasa por `next/image` (`fill`, `sizes="100vw"` en [HeroBackdrop.tsx:57-72](../../components/backgrounds/HeroBackdrop.tsx)), así que al usuario se le sirve una versión redimensionada. Pero el hero mide `h-[100px] sm:h-[130px]` **y se renderiza con `blur(5px)`** ([HeroSection.tsx:27](../../components/layout/HeroSection.tsx)).

**Acción:** re-exportar a ~1600px de ancho. Con ese tamaño y ese desenfoque nadie va a notar la diferencia, y se ahorra peso en repo + tiempo de optimización en el primer request.

---

## Preguntas abiertas / decisiones

### Q-01 · ¿Se conserva la animación de carga inicial? — **RESUELTA (2026-07-25)**

**Se conserva, acortada a 1.2 s y dejando de bloquear el montaje del contenido.** Ver TD-03.

**Fundamento:** el problema nunca fue que hubiera splash, sino que era **aditivo** — `children` no se montaba hasta los 3400 ms, así que ninguna query arrancaba durante la animación. Con el contenido montado debajo desde el primer frame, el splash pasa a cubrir carga real; eso solo ya elimina la mayor parte del coste sin tocar la marca.

Sobre la duración: 3.4 s está muy por encima del umbral en que un splash se lee como "premium" y pasa a leerse como "lenta". Alrededor de 1 s es donde la atención empieza a irse. 1.2 s da margen para que la coreografía completa se lea como **un solo gesto** (título → divisor → tagline → barra) y sale antes de que el usuario tenga tiempo de impacientarse. Eliminarla del todo habría sido la opción con peor retorno: cuesta lo mismo que acortarla y sacrifica lo único que diferencia el arranque de la app.

Se mantiene **móvil-only** (`innerWidth < 1024`) y **una vez por carga de página** (`hasShownInitialLoader` a nivel de módulo), como estaba.

### Q-02 · ¿Next.js sigue siendo la elección correcta? — **RESUELTA (2026-07-25)**

**Sí, por ahora.** Ver § Decisión estratégica. Se descartó migrar a Vite porque 10 de los 13 problemas de rendimiento son código propio que sobreviviría a la migración, y porque no hay tests que cubran una reescritura transversal.

Se reabre cuando M-01 dé números y estén cerrados los bloques 1–3. Prerrequisito bloqueante: **T-01**.

Lo que sí queda claro y guía el trabajo de aquí en adelante: **la app es una SPA y hay que asumirlo**. Dejar de reimplementar a mano el prefetch (TD-01), el lazy loading (TD-06 / CL-03) y la caché (TD-02) que el stack ya provee.

### Q-05 · ¿Dónde se arregla el `limit=100` del dashboard? — **RESUELTA (2026-07-25)**

**En el frontend, bajando a `limit: 50`.** Ver TD-22.

Descartadas: subir el `@Max` del backend a 100 exige desplegar el otro repo y consagra el patrón de traerse 100 sesiones al cliente para calcular 4 números; agregar en el servidor es lo correcto pero es trabajo de TD-11 y no debía bloquear una función rota en producción.

### Q-03 · ¿Se unifica el formato del código? — **RESUELTA Y EJECUTADA (2026-07-26)**

**Sí.** Se aplazó primero por dos motivos concretos —había un diff sin commitear de cinco bloques, y no había tests— y se ejecutó en cuanto ambos desaparecieron. Ver CL-06.

### Q-04 · ¿Se introduce testing? — **RESUELTA parcialmente (2026-07-25)**

**Sí, implementado: ver T-01.** Vitest corre en `verify` y CI; la última ejecución pasó 81 tests en 8 archivos (TD-26).

Alcance actual: lógica pura, contratos de API, coordinación de auth y políticas de PWA en Node, con llamadas externas mockeadas (bloque 7, TD-24 y TD-25). No se añadieron tests de componentes ni E2E.

Queda abierto si el alcance debe crecer, y eso depende de si se reabre Q-02: una migración de plataforma exigiría bastante más cobertura que T-01.

---

## Plan de ejecución

Cada bloque es un PR verificable con `npm run verify`. Los bloques están ordenados por *retorno ÷ riesgo*, no por prioridad nominal.

Marcas:
- **[directo]** — la acción ya está definida arriba con su evidencia. Se ejecuta sin diseño previo.
- **[plan]** — necesita una decisión de diseño o una verificación antes de tocar código.
- **[tuya]** — decisión de producto, no técnica.

---

### Bloque 0 · Línea base — **REPLANTEADO (2026-07-25)**
`M-01` — por decisión del usuario no se hará la medición en iPhone. Se conservan las mediciones de red de escritorio y del build como referencia; no demuestran tiempos percibidos en móvil.

### ~~Bloque 1 · Borrar desperdicio de red~~ — ✔ **COMPLETADO (2026-07-25)**
`TD-01` ✔ · `TD-06` ✔ · `TD-08` ✔ — `npm run verify` exit 0

**Resultado medido** (`next build` antes vs. después):

| Métrica | Antes | Después | Δ |
|---|---|---|---|
| Total `.next/static/chunks` | 2.9 MB | **2.7 MB** | −200 KB |
| `/routines/edit/[id]` route size | 9.45 kB | **3.12 kB** | −67% |
| `/routines/new` route size | 8.28 kB | **2.13 kB** | −74% |
| `/workouts/sessions/[id]` route size | 16 kB | **10.7 kB** | −33% |
| `/routines` route size | 13 kB | **8.86 kB** | −32% |
| `/dashboard` route size | 13.9 kB | **11 kB** | −21% |
| Líneas de código | — | — | **−417 / +101** |

**Lectura honesta de estos números:** el `First Load JS` compartido **no se movió** (103 kB) y el de cada ruta bajó sólo 1–3 kB. La caída grande está en el *route size*, que contabiliza los chunks async atribuibles a la ruta — es decir, **peso que era lazy pero que `preloadAllCriticalComponents` descargaba igual a los 2 s de cada sesión**. Esos ~200 KB dejaron de descargarse de verdad, aunque no aparecieran como `First Load`.

**Efecto en runtime** (deducido de la evidencia, no medido en dispositivo):
- **−5 peticiones a la API** en cada arranque en frío (las de TD-01)
- `GET /workouts/sessions/active` pasa de pedirse **3 veces a 1**
- **−11 descargas de chunk** a los 2 s de autenticar
- **−5 peticiones HTML** por cada despliegue con SW nuevo

### ~~Bloque 2 · Arranque en frío~~ — ✔ **COMPLETADO (2026-07-25)**
`TD-03` ✔ · `TD-18` ✔ · `TD-21` ✔ (bug preexistente, encontrado al validar) — `npm run verify` exit 0

Los dos atacaban el mismo síntoma desde lados distintos, y ambos resultaron ser **tiempo aditivo por accidente**, no trabajo real:

| | Antes | Después |
|---|---|---|
| Splash móvil | 3.8 s **con `children` sin montar** | 1.2 s **con `children` montado debajo** |
| Camino a la 1ª petición de datos | `verify` (browser→backend→GoTrue) → `POST /api/session` → queries | queries **y** `verify` en paralelo |
| Round trips en serie antes de datos | 2 | 0 |

Compuestos, el arranque en frío pasaba de `verify + /api/session + 3.4 s + datos` a `max(3 saltos de verify, 1.2 s de splash, datos)`. En un iPhone con la PWA descargada de memoria eso se paga varias veces al día.

**Sin medir en dispositivo todavía** — los números de arriba son deducidos del código, no cronometrados. Es exactamente lo que M-01 debe capturar.

**Waterfall medido en navegador (dev, Chrome, backend real), `/dashboard` en frío:**

| Petición | inicio (ms) | fin (ms) |
|---|---|---|
| `POST /auth/supabase/verify` | 766 | 1740 |
| `GET /users/profile` | 987 | 2034 |
| `GET /routines` | 988 | 2822 |
| `GET /workouts/sessions/active` | 988 | 1732 |
| `GET /workouts/sessions?status=COMPLETED…` | 989 | 1649 |
| `POST /api/session` (marcador) | 1788 | 2236 |

**TD-18 confirmado:** las cuatro peticiones de datos arrancan a **~988 ms, con `/verify` todavía en vuelo** (termina a 1740). Antes habrían esperado a `/verify` **y** a `POST /api/session`, es decir hasta **~2236 ms**. La primera petición de datos se adelanta **~1.25 s**, y el marcador de sesión queda fuera del camino crítico, exactamente como se diseñó.

`/verify` tarda **974 ms** él solo — es el triple salto browser→backend→GoTrue. Ese es el coste que ahora se solapa en vez de pagarse en serie.

**Dos hallazgos colaterales de esta medición, ajenos al bloque 2:** ver **TD-22** (el dashboard pide `limit=100`, el backend responde 400, las 4 tarjetas llevan mostrando 0) y **TD-23** (el "no reintentar en 4xx" no funciona).

**Medición en dispositivo descartada por decisión del usuario (M-01):** lo de arriba es Chrome de escritorio contra `localhost`; sirve para probar el **orden**, no para estimar tiempos en iPhone.

### ~~Bloque 3 · Navegación instantánea~~ — ✔ **COMPLETADO (2026-07-25)**
`TD-02` ✔ · `TD-07` ✔ · `TD-11` ✔ · `TD-19` ✔ — `npm run verify` exit 0

| Ítem | Cambio |
|---|---|
| TD-02 | `refetchOnMount: 'always'` → `true`; `staleTime: 0` explícito sólo en `useSession` |
| TD-07 | De **2 refetches de sesión por pulsación** a **0** (reconciliación con `setQueryData`) |
| TD-11 | Cálculo derivado en un `useMemo`, y un doble filtrado idéntico eliminado |
| TD-19 | `experimental.staleTimes: { dynamic: 30, static: 180 }` |

**TD-02 verificado en navegador (2026-07-25):**

| Momento | Peticiones a `:4000/api` (acumuladas) |
|---|---|
| Carga de `/dashboard`, ya asentada (t=1944 ms) | **7** |
| Tras click en "Routines" del sidebar | **7** |
| Tras volver a "Dashboard" por el sidebar (t=58 s) | **7** |

**Cero peticiones en el ida y vuelta.** Se confirmó que fueron navegaciones client-side y no recargas: las entradas de `PerformanceResourceTiming` persistieron y el `PerformanceNavigationTiming` siguió siendo el de la carga original. Con `refetchOnMount: 'always'` cada una de esas dos navegaciones habría refetcheado todas las queries de su destino.

**TD-07 verificado en runtime (2026-07-26)** con una sesión de entrenamiento real, en domingo, que es el día programado de la rutina *GE*:

1. Iniciada la sesión desde el dashboard.
2. Editados los campos de reps y peso de un set → **2 `PUT .../set-logs`** (un autoguardado por campo).
3. Peticiones a `GET /workouts/sessions/{id}` tras esos PUT: **0**.

Antes del cambio cada autoguardado invalidaba dos veces, así que esos dos autoguardados habrían provocado hasta **4 refetches completos de la sesión**. La sesión de prueba se finalizó al terminar para no dejar el banner de "sesión activa" colgado.

### ~~Bloque 4 · Peso~~ — ✔ **COMPLETADO (2026-07-25)**
`TD-04` ✔ · `TD-05` ✔ · `CL-08` ✔ · `TD-09` ✔ · y de paso `TD-15` ✔ · `TD-20` ✔ — `npm run verify` exit 0

**Bytes eliminados del camino del usuario:**

| Qué | Antes | Después | Δ |
|---|---|---|---|
| Precache del SW (`logo.png` → `icon-192.png`) | 1761 KB | **10 KB** | **−99%** |
| Hero `vertical-hero-greek-columns.webp` | 5357 KB (4000×6000) | **402 KB** (1600×2400) | **−92%** |
| Chunk de Eruda | 488 KB | **0** | eliminado |
| `/routines/new` First Load JS | 312 kB | **148 kB** | **−53%** |
| `/routines/edit/[id]` First Load JS | 313 kB | **276 kB** | −12% |
| Total `.next/static/chunks` | 2.44 MB | **2.1 MB** | −340 KB |

Ya no queda **ningún chunk por encima de 300 KB** en el build.

**TD-05 — Eruda eliminado por completo** (decisión del dueño del proyecto). Se fueron `components/Eruda.tsx`, la rama de `dev-injections.tsx`, la dependencia `eruda`, `SHOULD_ENABLE_ERUDA` y `PUBLIC_ENV.ENABLE_ERUDA`. Verificado por grep sobre `.next`: **cero rastro de eruda en el build**. Queda `NEXT_PUBLIC_ENABLE_ERUDA` como variable huérfana en el entorno de Vercel — se puede borrar de ahí cuando se quiera, ya no la lee nadie.

**TD-04 — iconos generados con `sharp`** (disponible como dependencia transitiva de `next`, no hizo falta instalar nada). Cinco assets, **159 KB en total** frente a los 1761 KB del único `logo.png`:

| Archivo | Tamaño | Uso |
|---|---|---|
| `icon-192.png` | 10 KB | manifest + precache del SW |
| `icon-512.png` | 55 KB | manifest |
| `icon-512-maskable.png` | 39 KB | manifest, `purpose: maskable` (logo al 80% sobre fondo opaco, para el recorte circular) |
| `apple-touch-icon.png` | 9 KB | iOS, aplanado sobre negro porque iOS no respeta la transparencia |
| `og-image.jpg` | 46 KB | Open Graph 1200×630 (JPEG: es una imagen fotográfica y todo scraper acepta JPEG) |

**CL-08** — el hero se re-exportó a 1600px de ancho. Se renderiza a `h-[100px] sm:h-[130px]` **y con `blur(5px)`**, así que 4000×6000 era absurdo.

**Los originales se borraron del árbol pero están en git.** Para recuperarlos: `git show HEAD:public/logo.png > logo.png`. Se comprobó con `git ls-files` que ambos estaban versionados **antes** de borrarlos.

**TD-15 + TD-20 agrupados aquí**, como recomendaba el bloque 6, porque tocan los mismos dos archivos que los iconos. `theme_color` y `background_color` del manifest pasan de `#FFFFFF` a `#000000` — coherente con el splash, que es `bg-black`. Añadidos `id`, `scope`, `lang` y `purpose` en los iconos. Y `appleWebApp: { capable, title, statusBarStyle: 'black-translucent' }` en la metadata.

**Verificado en navegador:** los 5 assets devuelven 200, `/logo.png` devuelve 404 (correcto), el manifest sirve `theme #000000` y los tres iconos con su `purpose`, las cachés pasaron a `v5` y las `v4` desaparecieron, y las metas `apple-mobile-web-app-title` y `apple-mobile-web-app-status-bar-style` están presentes.

**Detalle que difiere de lo que decía TD-20:** Next 15 emite **`mobile-web-app-capable=yes`**, el estándar moderno, en lugar del `apple-mobile-web-app-capable` obsoleto. iOS 15+ lo honra igual, así que es correcto — pero si alguien busca la meta antigua no la va a encontrar.

**`CACHE_VERSION` bumpeado a `v5`**, esta vez sí: `PRECACHE_URLS` cambió de contenido. Se confirmó en el navegador que el SW nuevo instaló bien (`ss-precache-v5` creado, luego `ss-pages-v5` y `ss-runtime-v5`), es decir que el `addAll` no falló por ninguna URL inexistente.

**Aviso de diagnóstico, otra vez el SW:** justo después del cambio, `fetch('/site.webmanifest')` seguía devolviendo el manifest **viejo**, servido desde `ss-precache-v4`. No era un fallo del cambio sino el precache haciendo su trabajo. Es la segunda vez en esta sesión que el Service Worker enmascara el estado real — ver también la nota en TD-21.

### ~~Bloque 5 · Limpieza~~ — ✔ **COMPLETADO (2026-07-25)**
`CL-01` ✔ · `CL-03` ✔ · `CL-04` ✔ · `CL-05` ✔ · `TD-13` ✔ · `TD-16` ✔ — `npm run verify` exit 0

**Resultado medido** (`next build` antes vs. después):

| Métrica | Antes | Después | Δ |
|---|---|---|---|
| Total `.next/static/chunks` | 2.7 MB | **2.44 MB** | −260 KB |
| `/routines` route size | 8.86 kB | **7.17 kB** | −19% |
| `/workouts` route size | 3.72 kB | **2.64 kB** | −29% |
| `/dashboard` route size | 11 kB | **9.65 kB** | −12% |
| Dependencias | — | **8 eliminadas** | — |
| Archivos borrados | — | **7** (~36 KB de fuente) | — |

**Qué se borró:**

- **CL-01** — `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `recharts`, `@supabase/ssr`, `@tanstack/react-query-devtools`, `cmdk`, `concurrently`. Se verificó por grep que ninguna tenía importaciones antes de desinstalar. **Decisión sobre `react-query-devtools`:** se elimina en vez de conectarlo. Estaba sólo en una línea comentada, y los dos problemas que habría ayudado a diagnosticar (TD-01, TD-02) ya están cerrados. Volver a añadirlo es un `npm i -D` si algún día hace falta.
- **CL-03** — `hooks/use-auth-protection.ts`, `lib/utils/basic-hypertrophy.ts`, `lib/utils/volume.ts`, `lib/utils/timezones.ts`, `components/ui/command.tsx`, el export `DashboardStats`, la rama `else if` cuyo cuerpo era `void 0` en `use-set-log-form.ts`, y `NEXT_PUBLIC_ENABLE_RTF_DEBUG` (5 apariciones en `schema/env.client.ts`) — último residuo de RtF.
- **CL-04** — `mock-routines.ts` y `routine-monday-api-mock.json` (13.4 KB de JSON que entraba en el bundle de `/routines`), más su uso en `WorkoutsList`. El directorio `features/routines/mocks/` ya no existe.
- **CL-05** — `docs:check` (apuntaba a un `.sh` inexistente) y `docs:update` (un `echo`) fuera de `package.json`.
- **TD-13** — eliminada la rama `/api/*` del Service Worker. Se confirmó **en el navegador** que era inalcanzable: las cachés vivas eran `ss-precache-v4`, `ss-pages-v4` y `ss-runtime-v4`; `ss-api-v4` **nunca llegó a crearse**. La constante `API_CACHE` también se fue, así que si alguna quedara suelta ahora se recolecta en el siguiente `activate`. Se dejó un comentario explicando dónde iría la estrategia si algún día hay un proxy `/api` propio.
- **TD-16** — `/auth/:path*` fuera del matcher del middleware.

**`CACHE_VERSION` deliberadamente NO se bumpeó**, misma lógica que en TD-08: el cambio es de comportamiento del handler, no del contenido cacheado. Se bumpeará en el bloque 4 junto con TD-04, que sí toca `PRECACHE_URLS`.

**Matiz sobre `tick()`:** este ítem lo listaba como código muerto, pero **sí se llamaba** (desde el listener de `useSaveState`). Era *redundante*, no huérfano: barría todo el store en cada emisión para hacer la transición `saved → idle`, algo que `scheduleAutoIdle` ya hace de forma determinista con un temporizador por clave. Se eliminó por redundante, no por muerto — la distinción importa porque quitarlo sí cambia el código ejecutado, aunque no el comportamiento observable.

**Nota:** `node_modules` sigue pesando 477 MB y el lockfile declara 497 paquetes. Las 8 desinstaladas apenas mueven esa aguja — el peso está en `next`, `typescript` y las herramientas de build. No es un problema de producción: nada de eso se despliega.

### ~~Bloque 6 · Config y PWA~~ — ✔ **COMPLETADO (2026-07-25)**
`TD-12` ✔ · `TD-14` ✔ · `TD-15` ✔ (en bloque 4) · `TD-20` ✔ (en bloque 4) · `CL-07` ✔ · `CL-06` ✔ **completado el 2026-07-26, ver Q-03**

**TD-12 — `tailwind.config.ts` borrado.** La verificación pendiente (¿anima el acordeón o da un salto seco?) se resolvió **sin necesidad de mirarlo en pantalla, y con más certeza que mirándolo**: `accordion-down` y `accordion-up` no aparecen en ningún archivo del repo salvo el propio config muerto. Ningún código puede usarlas.

Y hay una razón concreta: `AccordionContent` ([components/ui/accordion.tsx:59](../../components/ui/accordion.tsx)) **no usa keyframes**. Anima con un truco de CSS grid — `transition-[grid-template-rows]` pasando de `grid-rows-[0fr]` a `grid-rows-[1fr]` — más `animate-in`/`fade-in-0` de `tailwindcss-animate`, que se carga con `@plugin` desde `globals.css`, no desde el config. La animación nunca dependió del archivo borrado.

**CL-07 — Cinzel de 6 pesos a 2.** Auditados los 4 usos: **900** en los dos logotipos SUNNSTEEL (Sidebar y splash móvil) y **600** en el tagline y el texto de carga del splash. Nada más.

*Hipótesis que resultó falsa, y que conviene dejar escrita:* los 4 usos referencian la fuente por **nombre literal** (`fontFamily: '"Cinzel", ...'`) en vez de por la variable `--font-cinzel`, que no se referencia en ningún CSS. Parecía que estarían cayendo al fallback Times New Roman. **No es así:** se inspeccionó el CSS generado y `next/font` emite el `@font-face` con la familia real `Cinzel`, no con un nombre hasheado. Los usos resuelven bien.

**TD-14 — observers condicionados.** `PerformanceMonitor` registraba sus tres `PerformanceObserver` (LCP, FID, CLS) en el constructor a nivel de módulo, con el flag apagado o encendido. Ahora exige `SHOULD_LOG_PERFORMANCE`, como el resto de flags de `lib/config/env.ts`.

### Bloque 7 · Red de seguridad — **T-01 ✔ HECHO (2026-07-25)** · **TD-10 ✔ HECHO (2026-07-26)**

**T-01 resuelto con alcance ampliado.** Vitest instalado, **33 tests en 3 archivos**, `npm test` conectado a `verify` y al CI (paso `Test` entre Lint y Build).

| Archivo | Qué cubre |
|---|---|
| `lib/api/routines/routine-query.test.ts` | `serializeRoutineFilters`, `buildRoutineQueryString`, `routineQueryKeys` — independencia del orden, `false` vs. ausente, `week: 0`, ordenación de arrays |
| `lib/utils/session-validation.utils.test.ts` | `validateSetLogPayload`, `isSetComplete`, `validateSessionFinish`, `validateWeight` |
| `lib/api/services/workout-query.test.ts` | **contrato con el backend** — ver abajo |

**La ampliación de alcance está justificada por la evidencia del día, no por capricho.** El acuerdo original (Q-04) era "sólo lógica pura". Pero los dos bugs encontrados hoy —TD-21 y TD-22— **no los habría cazado ningún test de lógica pura**: eran de integración y de contrato. Así que se añadió una tercera categoría, barata, que sí habría cazado TD-22:

Se extrajo `buildSessionsQueryString` de `workoutService.listSessions` a una función pura, y con ella la constante **`MAX_SESSIONS_LIMIT = 50`**, que ahora **acota el límite en un solo sitio**. Pedir 100 ya no puede producir un 400: se envía 50. Los tests fijan el tope y documentan de dónde sale (`@Max(50)` en el DTO del backend).

Ese cambio es la protección real; los tests sólo evitan que alguien lo suba sin darse cuenta.

**Lo que NO cubre, deliberadamente:** `hooks/use-set-log-form.ts` estaba en la lista original de T-01, pero es un hook de React y testearlo exige `jsdom` + Testing Library. Eso es un salto de alcance real (dos dependencias más y un entorno de test distinto), no una omisión. `vitest.config.ts` usa `environment: 'node'` a propósito y lo dice en un comentario.

**TD-10 completado y verificado en navegador (2026-07-26):** la carga del historial y cada cambio de filtro pasaron de dos peticiones a una. La causa y la corrección están documentadas en TD-10; ya no queda pendiente esta comprobación.

---

**Resumen:** de los 27 ítems, **17 son [directo]** y sólo **8 necesitan [plan]** — casi todos por una verificación previa, no por complejidad de diseño. Dos son decisiones tuyas (Q-01 en el bloque 2, Q-03 en el bloque 6).
