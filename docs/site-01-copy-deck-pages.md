# SITE-01 — Copy deck, part 2: the public pages

The copy of `/features`, its six feature pages, the three use-case pages and
`/pricing`, in English and Spanish, written together. **Status: approved by
the owner on 2026-11-21**, after taking partner encouragement out. Part 1, the landing, is
[site-01-copy-deck.md](site-01-copy-deck.md) (approved); its conventions
apply unchanged: English leads in US spelling, Spanish is neutral with *tú*
and the glossary's words, `{name}` arguments come from code, and every claim
names its source in the plan's §12.

Structure follows the templates of the plan (§12.15 feature page, §12.17
use-case page, §12.19 overview, §12.20 pricing). Where a string already
exists in the app, the deck names the app's key instead of retyping it.

---

## 0. Shared — `site.shared`

| Key | English | Spanish |
| --- | --- | --- |
| `breadcrumb.label` | Breadcrumb | Ruta de navegación |
| `breadcrumb.features` | Features | Funciones |
| `breadcrumb.useCases` | Use cases | Casos de uso |
| `updated` | Updated {date} | Actualizado: {date} |
| `seePricing` | See pricing | Ver precios |
| `startFree` | Start free | Empezar gratis |
| `related` | Related | Relacionado |
| `questions` | Questions | Preguntas |
| `howItWorks` | How it works | Cómo funciona |
| `workedExample` | Worked example | Ejemplo trabajado |
| `whatItCovers` | What's free and what's Pro | Qué es Free y qué es Pro |
| `tips` | Tips | Consejos |
| `included` / `notIncluded` | Included / Not included | Incluido / No incluido |
| `example` | Example | Ejemplo |

`{date}` is a month and year formatted by the language ("November 2026",
"noviembre de 2026"). The compact closing band reuses `site.closing`'s
heading, subline and actions.

---

## 1. Features overview — `/features` (`site.featuresIndex`)

| Key | English | Spanish |
| --- | --- | --- |
| `meta.title` | Features — Sunnsteel | Funciones — Sunnsteel |
| `meta.description` | Everything Sunnsteel does to plan, log, measure and reward your training, with what's free and what's Pro. | Todo lo que hace Sunnsteel para planificar, registrar, medir y premiar tu entrenamiento, con lo que es Free y lo que es Pro. |
| `heading` | Everything Sunnsteel does | Todo lo que hace Sunnsteel |
| `subline` | Plan your routine, train with less to think about, read your progress in numbers and earn your rank. Here is all of it, and what each part costs. | Planifica tu rutina, entrena con menos en qué pensar, lee tu progreso en números y gánate tu rango. Aquí está todo, y lo que cuesta cada parte. |
| `facts.free` | Free to start | Gratis para empezar |
| `facts.exercises` | {count}+ exercises | {count}+ ejercicios |
| `facts.languages` | English and Spanish | Español e inglés |
| `facts.browser` | Runs in your browser | Funciona en tu navegador |
| `groups.plan` / `train` / `measure` / `earn` / `people` | Plan / Train / Measure / Earn / Together | Planifica / Entrena / Mide / Gana / Con otros |
| `cards.routineBuilder` | Weekly or rotating routines, templates, versions and supersets, with a summary of what each week adds up to. | Rutinas semanales o en rotación, plantillas, versiones y superseries, con un resumen de lo que suma cada semana. |
| `cards.progression` | Weights that move from what you actually lift, and 8-week blocks with Pro. | Pesos que avanzan según lo que de verdad levantas, y bloques de 8 semanas con Pro. |
| `cards.workoutTracker` | Last time beside every set, rest that starts itself, plates and warm-ups worked out. | La vez anterior junto a cada serie, descanso que arranca solo, discos y calentamientos calculados. |
| `cards.progress` | Strength, the body map, records and body weight, with signals and reviews on Pro. | Fuerza, el mapa del cuerpo, récords y peso corporal, con señales y revisiones en Pro. |
| `cards.ranks` | {ranks} ranks and {milestones} milestones earned by training, and records found in your sets. | {ranks} rangos y {milestones} logros que se ganan entrenando, y récords que salen de tus series. |
| `cards.community` | Follows, training partners and messages, with each part of your profile shown to whom you choose. | Seguidores, compañeros de entrenamiento y mensajes, con cada parte de tu perfil visible para quien elijas. |
| `glance.heading` | At a glance | De un vistazo |
| `glance.caption` | Every capability, by what it helps you do, and whether it's in Free or Pro. | Cada función, según lo que te ayuda a hacer, y si está en Free o en Pro. |
| `pricingLine` | Training itself is free. Pro adds planning depth, longer history and the AI tools. `<link>`See pricing`</link>` | Entrenar es gratis. Pro suma profundidad para planificar, más historial y las herramientas con IA. `<link>`Ver precios`</link>` |

The "At a glance" rows are the app's `/plans` rows (`plans.ts`,
`billing.plans`) and its always-free list (`billing.alwaysFree`), never
retyped.

**Questions** (`site.featuresIndex.faq`):

| Question (EN / ES) | Answer (EN) | Answer (ES) |
| --- | --- | --- |
| What's free? / ¿Qué es gratis? | Everything you do in a workout, your history, records, ranks and everything social. Pro adds planning depth, longer history and the AI tools. | Todo lo que haces al entrenar, tu historial, los récords, los rangos y todo lo social. Pro suma profundidad para planificar, más historial y las herramientas con IA. |
| Do I need an app store? / ¿Necesito una tienda de apps? | No. It runs in your browser and installs from it on any phone. `<link>`How to install`</link>` | No. Funciona en tu navegador y se instala desde ahí en cualquier teléfono. `<link>`Cómo instalarla`</link>` |
| Is my data mine? / ¿Mis datos son míos? | Yes. Download everything as one file whenever you want, and delete your account completely at any time. | Sí. Descarga todo en un archivo cuando quieras y borra tu cuenta por completo en cualquier momento. |

---

## 2. Workout tracker — `/features/workout-tracker` (`site.features.workoutTracker`)

| Key | English | Spanish |
| --- | --- | --- |
| `meta.title` | Workout tracker — Sunnsteel | Registro de entrenamiento — Sunnsteel |
| `meta.description` | Log every set in seconds: last time beside each set, a rest timer that starts itself, plates and warm-ups worked out. Free. | Registra cada serie en segundos: la vez anterior junto a cada serie, un descanso que arranca solo, discos y calentamientos calculados. Gratis. |
| `heading` | Log every set in seconds | Registra cada serie en segundos |
| `subline` | The workout screen shows your last numbers, starts the rest timer, loads the bar for you and keeps going when the signal drops. | La pantalla del entrenamiento muestra tus últimos números, arranca el descanso, te carga la barra y sigue funcionando si se corta la señal. |
| `overview` | It's built for one hand between sets. Each exercise states today's prescription once, shows what you did last time beside every set, and saves a set the moment you mark it. | Está pensada para una mano entre series. Cada ejercicio dice la prescripción de hoy una sola vez, muestra lo que hiciste la vez anterior junto a cada serie y guarda una serie en cuanto la marcas. |
| `highlights.last.title` / `.body` | Last time, beside every set / The weight and reps from your last workout sit next to each set, so you know what to beat. | La vez anterior, junto a cada serie / El peso y las reps de tu último entrenamiento están al lado de cada serie, así sabes qué superar. |
| `highlights.rest.title` / `.body` | Rest that starts itself / Marking a set starts the timer, and with notifications on it tells you when rest is over, even with the screen locked. | Un descanso que arranca solo / Marcar una serie arranca el temporizador y, con las notificaciones activadas, te avisa cuando termina, incluso con la pantalla bloqueada. |
| `highlights.plates.title` / `.body` | Plates and warm-ups worked out / The plate calculator loads each side from your gym's plates, and warm-ups can follow your working weight. | Discos y calentamientos calculados / La calculadora de discos carga cada lado con los discos de tu gimnasio, y los calentamientos pueden seguir tu peso de trabajo. |
| `facts.plan` | Free | Free |
| `facts.kinds` | {count} set kinds: working, warm-up, drop, optional | {count} tipos de serie: efectiva, calentamiento, descendente, opcional |
| `facts.extra` | Up to {max} extra sets per exercise | Hasta {max} series extra por ejercicio |
| `facts.corrections` | Your latest workout can be corrected for {hours} hours | Tu último entrenamiento se puede corregir durante {hours} horas |
| `steps.1` | Start today's workout from your dashboard or your schedule. | Empieza el entrenamiento de hoy desde tu inicio o tu calendario. |
| `steps.2` | Each exercise shows its prescription once, and your last numbers beside every set. | Cada ejercicio muestra su prescripción una vez, y tus últimos números junto a cada serie. |
| `steps.3` | Type the weight and reps and mark the set: it saves at once and the rest timer starts. | Escribe el peso y las reps y marca la serie: se guarda al instante y arranca el descanso. |
| `steps.4` | Swap an exercise, add an extra set or write a note when the day calls for it. | Cambia un ejercicio, agrega una serie extra o escribe una nota cuando el día lo pida. |
| `steps.5` | Finish and read your recap: totals, records and what moves next time. | Termina y lee tu resumen: totales, récords y lo que cambia la próxima vez. |
| `example.title` | Warm-ups and plates for a 100 kg working set | Calentamientos y discos para una serie de 100 kg |
| `example.caption` | Worked out by the rule the workout screen uses, with a 20 kg bar and a standard set of plates. | Calculado con la regla que usa la pantalla del entrenamiento, con una barra de 20 kg y un juego estándar de discos. |
| `example.columns` | Step · Weight · Reps · Plates per side | Paso · Peso · Reps · Discos por lado |
| `covers.all` | Everything in a workout is free. | Todo lo que pasa en un entrenamiento es gratis. |
| `tips.1` | Log the weight you actually lifted: progression reads what you did, not what was planned. | Registra el peso que levantaste de verdad: la progresión lee lo que hiciste, no lo planificado. |
| `tips.2` | Mark a set only when it's done; a skipped set never moves your routine. | Marca una serie solo cuando la terminaste; una serie salteada nunca mueve tu rutina. |
| `tips.3` | Training with gloves or chalk? Turn on larger controls in Settings. | ¿Entrenas con guantes o magnesio? Activa los controles más grandes en Ajustes. |
| `tips.4` | Use a note for what the numbers can't say. | Usa una nota para lo que los números no dicen. |

**Questions:**

| Question (EN / ES) | Answer (EN) | Answer (ES) |
| --- | --- | --- |
| Does the rest alert work with the screen locked? / ¿El aviso de descanso funciona con la pantalla bloqueada? | Yes, once notifications are on. On iPhone, notifications need the installed app. The alert says rest is over and what comes next; it doesn't show a countdown. | Sí, con las notificaciones activadas. En iPhone, las notificaciones necesitan la app instalada. El aviso dice que terminó el descanso y qué sigue; no muestra una cuenta regresiva. |
| What if the signal drops? / ¿Y si se corta la señal? | Keep logging. Your sets are sent when the connection returns, as long as the app stays open, and it tells you when changes are waiting. | Sigue registrando. Tus series se envían cuando vuelve la conexión, mientras la app siga abierta, y te avisa cuando hay cambios esperando. |
| Can I add an exercise mid-workout? / ¿Puedo agregar un ejercicio en pleno entrenamiento? | Not a new one: the routine is the plan. You can swap an exercise for today, add extra sets, or change the routine for next time. | Uno nuevo no: la rutina es el plan. Puedes cambiar un ejercicio por hoy, agregar series extra o cambiar la rutina para la próxima. |
| Can I fix a finished workout? / ¿Puedo corregir un entrenamiento terminado? | Your latest one, for {hours} hours and until you start another. Records and progression are worked out again from the corrected sets. | El último, durante {hours} horas y hasta que empieces otro. Los récords y la progresión se recalculan con las series corregidas. |
| I forgot to log a workout. / Me olvidé de registrar un entrenamiento. | You can log a past workout of one of your routines afterwards, with the date and the sets you did. | Puedes registrar después un entrenamiento pasado de una de tus rutinas, con la fecha y las series que hiciste. |

---

## 3. Routine builder — `/features/routine-builder` (`site.features.routineBuilder`)

| Key | English | Spanish |
| --- | --- | --- |
| `meta.title` | Routine builder — Sunnsteel | Constructor de rutinas — Sunnsteel |
| `meta.description` | Build weekly or rotating routines from scratch or a template, with a summary of weekly sets, duration and equipment. Drafts from a description on Pro. | Arma rutinas semanales o en rotación desde cero o con una plantilla, con un resumen de series semanales, duración y equipamiento. Borradores desde una descripción en Pro. |
| `heading` | Build the routine you'll actually follow | Arma la rutina que vas a seguir |
| `subline` | Weekly or rotating, from scratch or a template, with a summary that tells you what each week adds up to before you save it. | Semanal o en rotación, desde cero o con una plantilla, con un resumen que te dice lo que suma cada semana antes de guardarla. |
| `overview` | A routine is your plan: its days, each day's exercises, and for each exercise its sets, reps, rest and how it progresses. Everything you train starts here. | Una rutina es tu plan: sus días, los ejercicios de cada día y, para cada ejercicio, sus series, reps, descanso y cómo progresa. Todo lo que entrenas empieza aquí. |
| `highlights.schedule.title` / `.body` | Weekly or rotation / Train on set weekdays, or run your days in order on any day you train. | Semanal o en rotación / Entrena en días fijos de la semana, o haz tus días en orden cualquier día que entrenes. |
| `highlights.templates.title` / `.body` | Start from a template / {count} programs open as drafts, with every weight left for you to fill in. | Empieza con una plantilla / {count} programas se abren como borradores, con todos los pesos para que los completes tú. |
| `highlights.summary.title` / `.body` | Know what you planned / Weekly sets per muscle, an estimated length for each day and the equipment it needs, before you save. | Sabe lo que planificaste / Series semanales por músculo, una duración estimada de cada día y el equipamiento que necesita, antes de guardar. |
| `facts.days` | Up to {max} days per routine | Hasta {max} días por rutina |
| `facts.versions` | {free} saved versions on Free, {pro} on Pro | {free} versiones guardadas en Free, {pro} en Pro |
| `facts.custom` | Up to {max} exercises of your own | Hasta {max} ejercicios propios |
| `facts.drafts` | {count} routine drafts a month on Pro | {count} borradores de rutina por mes en Pro |
| `steps.1` | Choose weekly or rotation, and your training days. | Elige semanal o rotación, y tus días de entrenamiento. |
| `steps.2` | Add exercises from the catalog, or create your own. | Agrega ejercicios del catálogo, o crea los tuyos. |
| `steps.3` | Set sets, reps or a rep range, rest, and how each exercise progresses. | Define series, reps o un rango de reps, descanso y cómo progresa cada ejercicio. |
| `steps.4` | Link exercises into supersets or circuits if you train them in rounds. | Enlaza ejercicios en superseries o circuitos si los haces por rondas. |
| `steps.5` | Read the summary and create it. Nothing is saved until you do. | Lee el resumen y créala. No se guarda nada hasta que lo haces. |
| `example.title` | What Upper / Lower plans each week | Qué planifica Superior / inferior cada semana |
| `example.caption` | Weekly sets per muscle, counted as the app counts them: each set counts 1 for a primary muscle and 0.5 for a secondary one. | Series semanales por músculo, contadas como las cuenta la app: cada serie cuenta 1 para un músculo principal y 0,5 para uno secundario. |
| `example.columns` | Muscle · Weekly sets | Músculo · Series semanales |
| `draft.heading` (`id="draft"`, Pro tag) | Describe it, get a draft | Descríbela y recibe un borrador |
| `draft.body` | Tell it what you want -- days, goal, equipment -- and a draft opens in the builder, every weight left blank. Your text goes to Anthropic to write the draft and isn't stored. It's a starting point, not medical advice. | Cuéntale qué quieres (días, objetivo, equipamiento) y se abre un borrador en el constructor, con todos los pesos en blanco. Tu texto va a Anthropic para escribir el borrador y no se guarda. Es un punto de partida, no un consejo médico. |
| `covers.rows` | Weekly and rotating routines · templates · your own exercises: Free and Pro. Saved versions: {free} / {pro}. Routine drafts: Pro, {drafts} a month. Training blocks and 8-week blocks: Pro. | Rutinas semanales y en rotación · plantillas · ejercicios propios: Free y Pro. Versiones guardadas: {free} / {pro}. Borradores de rutina: Pro, {drafts} por mes. Bloques de entrenamiento y de 8 semanas: Pro. |
| `tips.1` | Leave weights blank on a new routine: your first workout sets them. | Deja los pesos en blanco en una rutina nueva: tu primer entrenamiento los define. |
| `tips.2` | Train on different days each week? Use a rotation. | ¿Entrenas días distintos cada semana? Usa una rotación. |
| `tips.3` | Save a version before a big change; you can compare it and restore it later. | Guarda una versión antes de un cambio grande; después puedes compararla y restaurarla. |

**Questions:**

| Question (EN / ES) | Answer (EN) | Answer (ES) |
| --- | --- | --- |
| What is a rotation? / ¿Qué es una rotación? | Days that run in order whenever you train, instead of on fixed weekdays. A missed day doesn't get skipped: the next one waits for you. | Días que se hacen en orden cada vez que entrenas, en lugar de en días fijos. Un día que no hiciste no se saltea: el siguiente te espera. |
| Can I share or copy a routine? / ¿Puedo compartir o copiar una rutina? | Yes. Share it with a link or on your profile, and anyone allowed to see it can copy it into their own routines. A copy is independent: your training never travels with it. | Sí. Compártela con un enlace o en tu perfil, y quien pueda verla puede copiarla a sus rutinas. Una copia es independiente: tu entrenamiento nunca viaja con ella. |
| How many versions can I keep? / ¿Cuántas versiones puedo guardar? | {free} per routine on Free and {pro} on Pro. Older versions you already have are kept. | {free} por rutina en Free y {pro} en Pro. Las versiones que ya tienes se conservan. |
| What does a draft send? / ¿Qué envía un borrador? | Only the text you write, to Anthropic, to write the draft; it isn't stored. The draft arrives with no weights, and nothing is saved until you create the routine. | Solo el texto que escribes, a Anthropic, para escribir el borrador; no se guarda. El borrador llega sin pesos y no se guarda nada hasta que creas la rutina. |

---

## 4. Automatic progression — `/features/progression` (`site.features.progression`)

| Key | English | Spanish |
| --- | --- | --- |
| `meta.title` | Automatic progression — Sunnsteel | Progresión automática — Sunnsteel |
| `meta.description` | Double progression moves your weights from what you actually lift. With Pro, 8-week blocks set each week's load from a reference max. | La doble progresión mueve tus pesos según lo que de verdad levantas. Con Pro, los bloques de 8 semanas fijan la carga de cada semana desde un máximo de referencia. |
| `heading` | The weight goes up when you earn it | El peso sube cuando te lo ganas |
| `subline` | Double progression moves your weights from what you actually lift. With Pro, an 8-week block sets every week's load from a reference max. | La doble progresión mueve tus pesos según lo que de verdad levantas. Con Pro, un bloque de 8 semanas fija la carga de cada semana desde un máximo de referencia. |
| `overview` | Each exercise chooses how it progresses. Most progress by double progression: work up the rep range at one weight, then add weight. The app does the arithmetic at the end of each workout, from the sets you marked done. | Cada ejercicio elige cómo progresa. La mayoría lo hace con doble progresión: subes reps dentro del rango con un mismo peso y después agregas peso. La app hace la cuenta al final de cada entrenamiento, con las series que marcaste. |
| `highlights.double.title` / `.body` | Double progression / When every set reaches the top of its range, the next workout adds one step. | Doble progresión / Cuando todas las series llegan al tope de su rango, el siguiente entrenamiento suma un paso. |
| `highlights.perSet.title` / `.body` | Set by set, if you prefer / Dynamic double progression moves each set on its own. | Serie por serie, si prefieres / La doble progresión dinámica mueve cada serie por separado. |
| `highlights.block.title` / `.body` | 8-week blocks / Eight weeks of loads from a reference max, ending in an estimate of your new max. | Bloques de 8 semanas / Ocho semanas de cargas desde un máximo de referencia, que terminan con una estimación de tu nuevo máximo. |
| `facts.step` | Default step: {step} | Paso por defecto: {step} |
| `facts.schemes` | Double, set by set, 8-week block or none | Doble, serie por serie, bloque de 8 semanas o ninguna |
| `facts.block` | A block is {weeks} weeks, {sets} working sets a week | Un bloque son {weeks} semanas, {sets} series efectivas por semana |
| `facts.deload` | Progression pauses during a deload | La progresión se pausa durante una descarga |
| `steps.1` | Give the exercise a rep range, such as 8–12, and a step. | Dale al ejercicio un rango de reps, como 8–12, y un paso. |
| `steps.2` | Train, and mark each set with the weight and reps you did. | Entrena y marca cada serie con el peso y las reps que hiciste. |
| `steps.3` | When every working set reaches the top of the range, the next workout's weight rises by the step. | Cuando todas las series efectivas llegan al tope del rango, el peso del siguiente entrenamiento sube un paso. |
| `steps.4` | If they don't, the weight you lifted stays, and you work up the range again. | Si no llegan, se mantiene el peso que levantaste y vuelves a subir dentro del rango. |
| `example.title` | Double progression on 3 × 8–12, workout by workout | Doble progresión en 3 × 8–12, entrenamiento a entrenamiento |
| `example.caption` | Bench Press with a 2.5 kg step, checked against the rule the server applies. | Press de banca con un paso de 2,5 kg, comprobado con la regla que aplica el servidor. |
| `example.columns` | Workout · Weight · Reps · Next workout | Entrenamiento · Peso · Reps · Siguiente entrenamiento |
| `block.heading` (Pro tag) | An 8-week block from a 100 kg reference max | Un bloque de 8 semanas desde un máximo de referencia de 100 kg |
| `block.caption` | Three working sets a week at the week's share of your reference max, rounded to your step. Weeks 1–4 keep 2–3 reps in reserve and end with a set of as many good reps as you can; weeks 5–8 keep 1–2 in reserve. | Tres series efectivas por semana al porcentaje de esa semana de tu máximo de referencia, redondeado a tu paso. Las semanas 1 a 4 dejan 2–3 reps en reserva y terminan con una serie de tantas reps bien hechas como puedas; las semanas 5 a 8 dejan 1–2 en reserva. |
| `block.columns` | Week · Share · Load · Reps in reserve | Semana · Porcentaje · Carga · Reps en reserva |
| `covers.rows` | Double and set-by-set progression: Free and Pro. 8-week blocks and planned deloads: Pro. | Progresión doble y serie por serie: Free y Pro. Bloques de 8 semanas y descargas planificadas: Pro. |
| `tips.1` | Pick a step your gym can load: 2.5 kg on a barbell, less where you have smaller plates. | Elige un paso que tu gimnasio pueda cargar: 2,5 kg en una barra, menos si tienes discos más chicos. |
| `tips.2` | Log the reps you really did; rounding up moves the weight before you're ready. | Registra las reps que de verdad hiciste; redondear hacia arriba mueve el peso antes de tiempo. |
| `tips.3` | A swapped exercise never moves the prescription, so swapping is safe. | Un ejercicio cambiado nunca mueve la prescripción, así que cambiar es seguro. |

**Questions:**

| Question (EN / ES) | Answer (EN) | Answer (ES) |
| --- | --- | --- |
| What if I miss my reps? / ¿Y si no llego a las reps? | The weight you lifted carries over and nothing goes up. Work up the range again at that weight. | Se mantiene el peso que levantaste y nada sube. Vuelve a subir dentro del rango con ese peso. |
| Can I switch it off for one exercise? / ¿Puedo apagarla para un ejercicio? | Yes. Each exercise has its own setting, and "None" keeps its weights where you put them. | Sí. Cada ejercicio tiene su propio ajuste, y "Ninguna" deja sus pesos donde los pusiste. |
| What step does it use? / ¿Qué paso usa? | The one you set for the exercise, {step} unless you choose another. | El que definiste para el ejercicio, {step} si no eliges otro. |
| Does a deload move my weights? / ¿Una descarga mueve mis pesos? | No. Progression pauses for deload workouts, so the plan you lightened keeps its weights. | No. La progresión se pausa en los entrenamientos de descarga, así que el plan que aligeraste conserva sus pesos. |

---

## 5. Progress — `/features/progress` (`site.features.progress`)

| Key | English | Spanish |
| --- | --- | --- |
| `meta.title` | Progress — Sunnsteel | Progreso — Sunnsteel |
| `meta.description` | Strength trends, a body map of weekly sets, records and body weight, each with the number behind it. Signals, comparisons and reviews on Pro. | Tendencias de fuerza, un mapa del cuerpo con las series semanales, récords y peso corporal, cada uno con su número. Señales, comparaciones y revisiones en Pro. |
| `heading` | Progress you can read | Un progreso que se puede leer |
| `subline` | Strength, muscles, records and body weight, each with the number behind it, and analysis that states what changed, never why. | Fuerza, músculos, récords y peso corporal, cada uno con su número, y un análisis que dice qué cambió, nunca por qué. |
| `overview` | Everything here is read from the sets you logged. Every chart says what it counts, and every flag prints the rule that raised it. | Todo se lee de las series que registraste. Cada gráfico dice qué cuenta, y cada aviso muestra la regla que lo activó. |
| `highlights.strength.title` / `.body` | Strength over time / Your estimated 1RM per exercise, with every record that moved it. | Fuerza en el tiempo / Tu 1RM estimado por ejercicio, con cada récord que lo movió. |
| `highlights.map.title` / `.body` | The body map / Weekly sets per muscle, front and back, beside the number behind each color. | El mapa del cuerpo / Series semanales por músculo, de frente y de espalda, junto al número detrás de cada color. |
| `highlights.plateaus.title` / `.body` | Plateau watch / Lifts with no new best after several sessions, with the rule written above them. | Control de estancamiento / Ejercicios sin una nueva mejor marca después de varias sesiones, con la regla escrita arriba. |
| `facts.strength` | Strength history: {days} days on Free, longer on Pro | Historial de fuerza: {days} días en Free, más en Pro |
| `facts.muscles` | Muscle history: {free} weeks on Free, {pro} on Pro | Historial muscular: {free} semanas en Free, {pro} en Pro |
| `facts.goals` | Goals: {free} on Free, {pro} on Pro | Objetivos: {free} en Free, {pro} en Pro |
| `facts.reviews` | Training reviews: {count} a month on Pro | Revisiones de entrenamiento: {count} por mes en Pro |
| `steps.1` | Log your workouts; records are found in your sets as you go. | Registra tus entrenamientos; los récords salen de tus series a medida que avanzas. |
| `steps.2` | Read strength by exercise, and each exercise's own page with its history. | Lee la fuerza por ejercicio, y la página de cada ejercicio con su historial. |
| `steps.3` | Check the body map each week to see where your sets went. | Mira el mapa del cuerpo cada semana para ver adónde fueron tus series. |
| `steps.4` | Let plateau watch tell you which lifts have stopped setting bests. | Deja que el control de estancamiento te diga qué ejercicios dejaron de marcar mejores registros. |
| `steps.5` | With Pro, compare blocks and sessions, read your training signals and ask for a review. | Con Pro, compara bloques y sesiones, lee tus señales de entrenamiento y pide una revisión. |
| `example.title` | How one workout lands on the body map | Cómo un entrenamiento llega al mapa del cuerpo |
| `example.caption` | Bench Press, 3 working sets: each set counts 1 for its primary muscles and 0.5 for its secondary ones; warm-ups don't count. | Press de banca, 3 series efectivas: cada serie cuenta 1 para sus músculos principales y 0,5 para los secundarios; los calentamientos no cuentan. |
| `example.columns` | Muscle · Role · Sets counted | Músculo · Rol · Series contadas |
| `covers.rows` | Records, plateau watch, body weight: Free and Pro. Strength trends: {days} days / longer. Body map: {free} weeks / {pro}. Goals: {freeGoals} / {proGoals}. Body measurements beyond weight, training signals and the deload suggestion, comparisons, goal suggestions, training reviews: Pro. | Récords, control de estancamiento, peso corporal: Free y Pro. Tendencias de fuerza: {days} días / más. Mapa del cuerpo: {free} semanas / {pro}. Objetivos: {freeGoals} / {proGoals}. Medidas además del peso, señales de entrenamiento y sugerencia de descarga, comparaciones, sugerencias de objetivos, revisiones: Pro. |
| `tips.1` | Log RPE on your hard sets to see effort in signals and reviews. | Registra el RPE en tus series duras para ver el esfuerzo en señales y revisiones. |
| `tips.2` | Weigh yourself in the same conditions each time for a cleaner line. | Pésate siempre en las mismas condiciones para una línea más clara. |
| `tips.3` | A plateau flag is a fact to look at, not a verdict. | Un aviso de estancamiento es un dato para mirar, no un veredicto. |

**Questions:**

| Question (EN / ES) | Answer (EN) | Answer (ES) |
| --- | --- | --- |
| What is estimated 1RM? / ¿Qué es el 1RM estimado? | The app's own definition (`core` `definition` of estimated 1RM): the heaviest single rep a set suggests, worked out from its weight and reps. It's an estimate, not a lift you tried. | La definición de la app: la repetición única más pesada que sugiere una serie, calculada con su peso y sus repeticiones. Es una estimación, no un levantamiento que probaste. |
| Why don't bodyweight sets add volume? / ¿Por qué las series con peso corporal no suman volumen? | Volume is the load you added times the reps. A bodyweight set counts as a set but adds no load. | El volumen es la carga que agregaste por las reps. Una serie con peso corporal cuenta como serie pero no suma carga. |
| Do signals tell me what's wrong? / ¿Las señales me dicen qué está mal? | No. They show what changed, with the numbers and the rule; the reason is yours to judge. | No. Muestran qué cambió, con los números y la regla; el porqué lo juzgas tú. |
| What's Pro here? / ¿Qué es Pro aquí? | Longer history, body measurements beyond weight, training signals and the deload suggestion, comparisons, goal suggestions and training reviews. | Más historial, medidas además del peso, señales de entrenamiento y sugerencia de descarga, comparaciones, sugerencias de objetivos y revisiones de entrenamiento. |

---

## 6. Ranks and achievements — `/features/ranks` (`site.features.ranks`)

| Key | English | Spanish |
| --- | --- | --- |
| `meta.title` | Ranks and achievements — Sunnsteel | Rangos y logros — Sunnsteel |
| `meta.description` | {ranks} ranks and {milestones} milestones earned by training, comebacks recognized, and records found in your sets. Free. | {ranks} rangos y {milestones} logros que se ganan entrenando, regresos reconocidos y récords que salen de tus series. Gratis. |
| `heading` | Earned by showing up | Se gana con constancia |
| `subline` | {ranks} ranks and {milestones} milestones, earned from your workouts, and records found in your sets. Nothing here is for posting. | {ranks} rangos y {milestones} logros que se ganan con tus entrenamientos, y récords que salen de tus series. Nada de esto es para publicar. |
| `overview` | A rank rewards attendance: workouts across different weeks. Milestones mark totals you reach. Records are detected from your sets the moment you set one. | Un rango premia la asistencia: entrenamientos en semanas distintas. Los logros marcan totales que alcanzas. Los récords se detectan en tus series en el momento en que los haces. |
| `highlights.ranks.title` / `.body` | {ranks} ranks / From {first} to {last}, each with its crest, earned by workouts in different weeks. | {ranks} rangos / De {first} a {last}, cada uno con su escudo, que se ganan con entrenamientos en semanas distintas. |
| `highlights.milestones.title` / `.body` | {milestones} milestones / Workouts, sets, volume, records and streaks, each in steps. | {milestones} logros / Entrenamientos, series, volumen, récords y rachas, cada uno por etapas. |
| `highlights.comebacks.title` / `.body` | Comebacks / Time away is never punished: coming back is recognized. | Regresos / El tiempo afuera nunca se castiga: volver se reconoce. |
| `facts.comeback` | A comeback: {active} active days within {window} days, after {away} days away | Un regreso: {active} días activos en {window} días, después de {away} días afuera |
| `facts.featured` | Feature up to {max} accomplishments on your profile | Destaca hasta {max} logros en tu perfil |
| `facts.plan` | Free | Free |
| `steps.1` | Train: every week you work out counts as an active week, however many workouts it holds. | Entrena: cada semana en la que entrenas cuenta como semana activa, sin importar cuántos entrenamientos tenga. |
| `steps.2` | Reach a rank's workouts and active weeks, and the rank is yours. | Alcanza los entrenamientos y las semanas activas de un rango, y el rango es tuyo. |
| `steps.3` | Milestones arrive as your totals cross them. | Los logros llegan a medida que tus totales los superan. |
| `steps.4` | Choose who sees your rank, and feature what you're proud of on your profile. | Elige quién ve tu rango y destaca en tu perfil lo que te enorgullece. |
| `example.title` | The ladder and the milestones | La escalera y los logros |
| `example.caption` | Read from the app's own catalog. | Tomado del catálogo de la app. |
| `example.ladderColumns` | Rank · Workouts · Different weeks | Rango · Entrenamientos · Semanas distintas |
| `example.milestoneColumns` | Category · Steps | Categoría · Etapas |
| `covers.all` | Ranks, milestones, comebacks and records are free. | Los rangos, logros, regresos y récords son gratis. |
| `tips.1` | Consistency beats bursts: three weeks with one workout each count more toward a rank than one week with three. | La constancia gana a los arranques: tres semanas con un entrenamiento cada una cuentan más para un rango que una semana con tres. |
| `tips.2` | Don't chase a streak at the cost of rest; the milestones will wait. | No persigas una racha a costa del descanso; los logros esperan. |

**Questions:**

| Question (EN / ES) | Answer (EN) | Answer (ES) |
| --- | --- | --- |
| How is a rank earned? / ¿Cómo se gana un rango? | By a number of workouts spread over a number of different weeks; both have to be met. | Con una cantidad de entrenamientos repartidos en una cantidad de semanas distintas; hay que cumplir las dos. |
| What is a comeback? / ¿Qué es un regreso? | After {away} days or more without training, {active} active days within {window} days record a comeback. | Después de {away} días o más sin entrenar, {active} días activos en {window} días registran un regreso. |
| Who sees my rank? / ¿Quién ve mi rango? | You choose: everyone, your followers, or only you. | Tú eliges: todos, tus seguidores o solo tú. |
| Are records found automatically? / ¿Los récords se detectan solos? | Yes, from your sets, as you train. If you correct a workout, its records are worked out again. | Sí, en tus series, mientras entrenas. Si corriges un entrenamiento, sus récords se recalculan. |

---

## 7. Training with people — `/features/community` (`site.features.community`)

| Key | English | Spanish |
| --- | --- | --- |
| `meta.title` | Training with people — Sunnsteel | Entrenar con otros — Sunnsteel |
| `meta.description` | Follow people, train with partners and send what you trained, with each part of your profile shown only to whom you choose. Free. | Sigue a otros, entrena con compañeros y comparte lo que entrenaste, con cada parte de tu perfil visible solo para quien elijas. Gratis. |
| `heading` | Train with people, on your terms | Entrena con otros, a tu manera |
| `subline` | Follow, train with partners and send what you trained, with each part of your profile shown only to whom you choose. | Sigue, entrena con compañeros y comparte lo que entrenaste, con cada parte de tu perfil visible solo para quien elijas. |
| `overview` | Your activity comes from what you train, not from posts. Followers see what you let them; partners see what you grant; messages carry the real thing. | Tu actividad sale de lo que entrenas, no de publicaciones. Tus seguidores ven lo que les permites; tus compañeros, lo que les das; y los mensajes llevan lo real. |
| `highlights.activity.title` / `.body` | Activity / Workouts, records and milestones from people you follow, with {reactions} reactions and comments. | Actividad / Entrenamientos, récords y logros de la gente que sigues, con {reactions} reacciones y comentarios. |
| `highlights.partners.title` / `.body` | Training partners / Up to {max} partners, each choosing what the other sees, with an alert when a partner finishes a workout if you want one. | Compañeros de entrenamiento / Hasta {max} compañeros, cada uno elige qué ve el otro, con un aviso cuando un compañero termina un entrenamiento, si lo quieres. |
| `highlights.messages.title` / `.body` | Messages / One to one, carrying a routine, a workout, a record, a milestone, a comeback or a month of training. | Mensajes / Uno a uno, con una rutina, un entrenamiento, un récord, un logro, un regreso o un mes de entrenamiento. |
| `facts.privacy` | {count} parts of your profile, each with its own audience | {count} partes de tu perfil, cada una con su público |
| `facts.partners` | Up to {max} training partners | Hasta {max} compañeros de entrenamiento |
| `facts.message` | Messages up to {max} characters | Mensajes de hasta {max} caracteres |
| `facts.plan` | Free | Free |
| `steps.1` | Follow people you train with or admire. | Sigue a la gente con la que entrenas o que admiras. |
| `steps.2` | See their workouts, records and milestones, and react or comment. | Mira sus entrenamientos, récords y logros, y reacciona o comenta. |
| `steps.3` | Become training partners and choose what each of you sees. | Háganse compañeros de entrenamiento y elijan qué ve cada uno. |
| `steps.4` | Send a routine, a workout or a record in a message, or share a workout with a link. | Manda una rutina, un entrenamiento o un récord en un mensaje, o comparte un entrenamiento con un enlace. |
| `example.title` | Your profile, part by part | Tu perfil, parte por parte |
| `example.caption` | Each part has its own audience: Everyone, Followers or Only me. | Cada parte tiene su público: Todos, Seguidores o Solo yo. |
| `example.columns` | Part · What it controls | Parte · Qué controla |
| `covers.all` | Everything social, and messages, is free. | Todo lo social, y los mensajes, es gratis. |
| `tips.1` | Set each part of your profile once in Settings; you can change it any time. | Configura cada parte de tu perfil una vez en Ajustes; puedes cambiarla cuando quieras. |
| `tips.2` | A share link shows only the parts you pick, and you can revoke it. | Un enlace compartido muestra solo las partes que eliges, y puedes revocarlo. |

**Questions:**

| Question (EN / ES) | Answer (EN) | Answer (ES) |
| --- | --- | --- |
| Are messages end-to-end encrypted? / ¿Los mensajes tienen cifrado de extremo a extremo? | No. They're stored on our servers. A moderator reads a message only if it's reported, and then only that message and up to {context} before it. | No. Se guardan en nuestros servidores. Un moderador lee un mensaje solo si lo denuncian, y en ese caso solo ese mensaje y hasta {context} anteriores. |
| Who can message me? / ¿Quién me puede escribir? | You choose: people you follow, everyone (people you don't follow arrive as requests), or nobody. | Tú eliges: la gente que sigues, todos (quien no sigues llega como solicitud) o nadie. |
| Can I share a workout with someone without an account? / ¿Puedo compartir un entrenamiento con alguien sin cuenta? | Yes, with a link that shows only the parts you pick. You can revoke it, and it stops working at once. | Sí, con un enlace que muestra solo las partes que eliges. Puedes revocarlo y deja de funcionar al instante. |
| How do blocks and reports work? / ¿Cómo funcionan los bloqueos y las denuncias? | A block hides you from each other everywhere and removes follows both ways. A report goes to a moderator, who reads only what it's about. | Un bloqueo los oculta mutuamente en todas partes y quita los seguimientos en ambos sentidos. Una denuncia llega a un moderador, que lee solo lo denunciado. |

---

## 8. Use cases — `site.useCases`

### Shared

| Key | English | Spanish |
| --- | --- | --- |
| `whatChanges` | What changes at this level | Qué cambia en este nivel |
| `program` | The program | El programa |
| `tools` | Tools for this level | Herramientas para este nivel |
| `stepByStep` | Step by step | Paso a paso |
| `next` | Next level | Siguiente nivel |
| `startWith` | Start with {template} | Empezar con {template} |
| `seeFeatures` | See every feature | Ver todas las funciones |

### Beginners — `/use-cases/beginners`

| Key | English | Spanish |
| --- | --- | --- |
| `meta.title` | Sunnsteel for beginners | Sunnsteel para principiantes |
| `eyebrow` | For beginners · Free | Para principiantes · Gratis |
| `heading` | Start lifting with a plan | Empieza a entrenar con un plan |
| `subline` | A full-body program three days a week, the weights worked out for you, and progress you can see from the first month. | Un programa de cuerpo completo tres días por semana, los pesos calculados por ti y un progreso que se ve desde el primer mes. |
| `audience` | For anyone in their first months of lifting | Para quien está en sus primeros meses de entrenamiento |
| `facts` | 3 days a week · Full body · Free | 3 días por semana · Cuerpo completo · Gratis |
| `changes.1` | Learn a few movements well / A short list of exercises, repeated, teaches them faster than variety. | Aprende bien pocos movimientos / Una lista corta de ejercicios, repetida, los enseña más rápido que la variedad. |
| `changes.2` | Your first weights are yours to find / Templates leave every weight blank; your first workout sets them. | Tus primeros pesos los encuentras tú / Las plantillas dejan todos los pesos en blanco; tu primer entrenamiento los define. |
| `changes.3` | Add weight when you've earned it / When every set reaches the top of its range, the next workout adds a step. | Suma peso cuando te lo ganas / Cuando todas las series llegan al tope de su rango, el siguiente entrenamiento suma un paso. |
| `changes.4` | Show up most weeks / Ranks reward workouts across different weeks, not long sessions. | Aparece casi todas las semanas / Los rangos premian entrenamientos en semanas distintas, no sesiones largas. |
| `tools` | Workout tracker · Automatic progression · Ranks and achievements · Routine builder | Registro de entrenamiento · Progresión automática · Rangos y logros · Constructor de rutinas |
| `steps.1` | Create a free account and tell it your days and goals. | Crea una cuenta gratis y dile tus días y objetivos. |
| `steps.2` | Start with Full Body Foundations, or the program it recommends. | Empieza con Fundamentos de cuerpo completo, o el programa que te recomiende. |
| `steps.3` | In your first workout, find a weight you can do with good form for the low end of each range. | En tu primer entrenamiento, encuentra un peso que puedas hacer bien para el mínimo de cada rango. |
| `steps.4` | Train three days a week; let progression move the weights. | Entrena tres días por semana; deja que la progresión mueva los pesos. |
| `steps.5` | When plateau watch flags a lift for weeks, read the intermediates' page. | Cuando el control de estancamiento marque un ejercicio durante semanas, lee la página de intermedios. |
| `next` | Ready for more? Intermediates | ¿Listo para más? Intermedios |
| `faq.1` | Do I need a gym? / ¿Necesito un gimnasio? → Full Body Foundations uses common gym equipment. You can build your own routine for what you have, and your gym's plates are saved for the plate calculator. / Fundamentos de cuerpo completo usa equipamiento común de gimnasio. Puedes armar tu propia rutina con lo que tengas, y los discos de tu gimnasio se guardan para la calculadora. | |
| `faq.2` | How do I know my starting weights? / ¿Cómo sé mis pesos iniciales? → Your first workout finds them: pick a weight you can do with good form at the low end of the range, and log it. / Tu primer entrenamiento los encuentra: elige un peso que puedas hacer bien en el mínimo del rango y regístralo. | |

### Intermediates — `/use-cases/intermediates`

| Key | English | Spanish |
| --- | --- | --- |
| `meta.title` | Sunnsteel for intermediates | Sunnsteel para intermedios |
| `eyebrow` | For intermediates · Free | Para intermedios · Gratis |
| `heading` | Keep progressing past the first months | Sigue progresando después de los primeros meses |
| `subline` | Split your week, track weekly sets per muscle and read your plateaus as numbers, not guesses. | Divide tu semana, sigue las series semanales por músculo y lee tus estancamientos como números, no como suposiciones. |
| `audience` | For lifters whose first program has stopped moving | Para quien siente que su primer programa dejó de avanzar |
| `facts` | 4 to 6 days a week · Upper/lower or push/pull/legs · Free | 4 a 6 días por semana · Superior/inferior o empuje/tirón/piernas · Gratis |
| `changes.1` | Progress slows / Adding weight every week stops; a range takes longer to climb. | El progreso se hace más lento / Sumar peso cada semana se termina; subir un rango lleva más tiempo. |
| `changes.2` | Split the body / Upper/lower or push/pull/legs give each muscle more weekly sets. | Divide el cuerpo / Superior/inferior o empuje/tirón/piernas le dan a cada músculo más series semanales. |
| `changes.3` | Weekly sets become the measure / How many sets each muscle gets in a week matters more than any single workout. | Las series semanales pasan a ser la medida / Cuántas series recibe cada músculo en una semana importa más que un entrenamiento suelto. |
| `changes.4` | Plateaus are read, not guessed / A lift that stops setting bests is flagged with its numbers. | Los estancamientos se leen, no se adivinan / Un ejercicio que deja de marcar mejores registros se señala con sus números. |
| `tools` | The body map · Plateau watch · Routine versions · Supersets | El mapa del cuerpo · Control de estancamiento · Versiones de rutina · Superseries |
| `steps.1` | Choose Upper / Lower or Push / Pull / Legs, or build your own split. | Elige Superior / inferior o Empuje / tirón / piernas, o arma tu propia división. |
| `steps.2` | Use your current weights as the new routine's starting weights. | Usa tus pesos actuales como pesos iniciales de la rutina nueva. |
| `steps.3` | Check the body map weekly and adjust sets where a muscle falls short. | Mira el mapa del cuerpo cada semana y ajusta series donde un músculo se queda corto. |
| `steps.4` | Save a version before each change, so you can compare. | Guarda una versión antes de cada cambio, para poder comparar. |
| `steps.5` | When a lift stalls for weeks, try an 8-week block (Pro). | Cuando un ejercicio se estanca por semanas, prueba un bloque de 8 semanas (Pro). |
| `next` | Ready for blocks and deloads? Advanced | ¿Listo para bloques y descargas? Avanzados |
| `faq.1` | Upper/lower or push/pull/legs? / ¿Superior/inferior o empuje/tirón/piernas? → Upper / Lower is four days on set weekdays; Push / Pull / Legs is a rotation, each day twice a week. Choose the one that fits the days you have. / Superior / inferior son cuatro días fijos; Empuje / tirón / piernas es una rotación, cada día dos veces por semana. Elige la que encaje con los días que tienes. | |

### Advanced — `/use-cases/advanced`

| Key | English | Spanish |
| --- | --- | --- |
| `meta.title` | Sunnsteel for advanced lifters | Sunnsteel para avanzados |
| `eyebrow` | For advanced lifters · Pro | Para avanzados · Pro |
| `heading` | Plan blocks, deloads and the long game | Planifica bloques, descargas y el largo plazo |
| `subline` | 8-week blocks from a reference max, planned deloads, and comparisons that put each block beside the one before. | Bloques de 8 semanas desde un máximo de referencia, descargas planificadas y comparaciones que ponen cada bloque al lado del anterior. |
| `audience` | For lifters who plan their training in blocks | Para quien planifica su entrenamiento por bloques |
| `facts` | 8-week blocks · Planned deloads · Pro | Bloques de 8 semanas · Descargas planificadas · Pro |
| `changes.1` | Training runs in blocks / Weeks are planned in advance, each with its own load. | El entrenamiento va por bloques / Las semanas se planifican de antemano, cada una con su carga. |
| `changes.2` | Deloads are planned, not improvised / A lighter week goes on the calendar before you need it. | Las descargas se planifican, no se improvisan / Una semana más liviana entra al calendario antes de que la necesites. |
| `changes.3` | Blocks are compared / Each block sits beside the one before, with its numbers and no verdict. | Los bloques se comparan / Cada bloque va al lado del anterior, con sus números y sin veredicto. |
| `changes.4` | Signals are read over weeks / Effort, rep targets and declines, two weeks against the two before. | Las señales se leen en semanas / Esfuerzo, objetivos de reps y caídas, dos semanas frente a las dos anteriores. |
| `tools` | 8-week blocks · Training blocks · Planned deloads · Signals and comparisons · Training review | Bloques de 8 semanas · Bloques de entrenamiento · Descargas planificadas · Señales y comparaciones · Revisión del entrenamiento |
| `steps.1` | Build your routine, or start from a template you'll change. | Arma tu rutina, o empieza con una plantilla que vas a cambiar. |
| `steps.2` | Give your main lifts an 8-week block from a reference max. | Dale a tus ejercicios principales un bloque de 8 semanas desde un máximo de referencia. |
| `steps.3` | Plan a deload where the block calls for one. | Planifica una descarga donde el bloque la pida. |
| `steps.4` | At the end of the block, read the estimate and choose what comes next. | Al final del bloque, lee la estimación y elige qué sigue. |
| `steps.5` | Compare the block with the one before, and ask for a review of the workouts you choose. | Compara el bloque con el anterior y pide una revisión de los entrenamientos que elijas. |
| `next` | Back to every feature | Volver a todas las funciones |
| `faq.1` | Is there an advanced template? / ¿Hay una plantilla avanzada? → No: advanced training is yours to build. The builder, the 8-week block and deloads are where you build it. / No: el entrenamiento avanzado lo armas tú. El constructor, el bloque de 8 semanas y las descargas son donde lo armas. | |

---

## 9. Pricing — `/pricing` (`site.pricing`)

| Key | English | Spanish |
| --- | --- | --- |
| `meta.title` | Pricing — Free and Pro — Sunnsteel | Precios — Free y Pro — Sunnsteel |
| `meta.description` | Training is free. Pro adds planning depth, longer history and the AI tools for {price} a month, with {days} days free. | Entrenar es gratis. Pro suma profundidad para planificar, más historial y las herramientas con IA por {price} por mes, con {days} días gratis. |
| `eyebrow` | Pro · {days} days free | Pro · {days} días gratis |
| `heading` | Free to train. Pro to plan further. | Gratis para entrenar. Pro para planificar más lejos. |
| `subline` | Everything you do in a workout is free. Pro adds planning depth, longer history and the AI tools. | Todo lo que haces al entrenar es gratis. Pro suma profundidad para planificar, más historial y las herramientas con IA. |
| `tryPro` | Try Pro free for {days} days | Probar Pro {days} días gratis |
| `startFree` | Start free | Empezar gratis |
| `facts.price` | {price} a month | {price} por mes |
| `facts.trial` | {days} days free | {days} días gratis |
| `facts.cancel` | Cancel any time | Cancela cuando quieras |
| `free.heading` (`id="free"`) | Is it free? | ¿Es gratis? |
| `free.body` | Yes: logging, progression, history, records, ranks and everything social are free, with no card. | Sí: registrar, la progresión, el historial, los récords, los rangos y todo lo social son gratis, sin tarjeta. |
| `pro.heading` (`id="pro"`) | What Pro adds | Qué suma Pro |
| `compare.heading` | Free and Pro, row by row | Free y Pro, fila por fila |
| `who.heading` | Who Pro is for | Para quién es Pro |
| `who.planners` | Lifters who plan blocks and deloads, and want each block's loads set in advance. | Quien planifica bloques y descargas, y quiere la carga de cada bloque fijada de antemano. |
| `who.readers` | Lifters who read their training closely: long history, comparisons and signals. | Quien lee su entrenamiento de cerca: historial largo, comparaciones y señales. |
| `who.ai` | Anyone who wants a routine drafted from a description, or a review of their own workouts. | Quien quiere un borrador de rutina a partir de una descripción, o una revisión de sus propios entrenamientos. |

The four outcomes and their descriptions are `billing.offer.outcomes`; the
comparison table and its always-free line are `billing.plans`; the questions
are the app's `billing.plans.faq` (cancelling, the trial, refunds, how the
charge is made, leaving Pro), with the legal links of `LegalLinks`.

---

## Checked before approval

- **Every number is an argument from code:** the step, the set kinds, the
  extra-set and correction limits, the routine days, versions, own exercises,
  drafts and reviews a month, the history windows, goals, the comeback rule,
  the featured slots, the partner limit, the message
  length and context, the ranks and milestones, the price and the trial.
- **Worked examples** (warm-ups and plates; Upper / Lower's weekly sets; the
  double-progression ledger; the 8-week block at a 100 kg reference max; one
  workout on the body map; the ladder and milestones; the privacy parts) are
  computed at build by the app's own rules; the deck only names their
  columns and captions.
- **Claims held to the code:** progression adds a step only when every
  working set reaches the target; a deload pauses progression; a rotation
  waits for a missed day; corrections only on the latest workout, for 48
  hours, until another starts; no countdown on the lock screen; messages not
  end-to-end encrypted; Anthropic receives draft text and chosen workouts and
  nothing is stored; a block removes follows both ways.
- **Not claimed:** results, a member count, a default privacy, an advanced
  template, that a rank cannot be lost.
