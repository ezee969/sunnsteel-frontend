# SITE-01 — Copy deck, part 1: the landing

Phase 1 of [site-01-landing-plan.md](site-01-landing-plan.md) (§8): every
string the landing shows, in English and Spanish, written together.
**Status: approved by the owner on 2026-11-21.** Part 2 -- the eleven
public pages -- is [site-01-copy-deck-pages.md](site-01-copy-deck-pages.md).

**How to read it.** Each section lists its message keys under `site.<area>`,
the English and the Spanish. `{name}` is an ICU argument filled from code
(contracts, the catalog, the app's own messages), never typed into the copy;
`<mark>…</mark>` and `<link>…</link>` are rich-text tags. Labels are written
in sentence case and set in capitals by their rank.

**Choices made for the whole deck.**
- **English leads** (the owner, 2026-11-21: a varied audience, in English
  first), written in US spelling: *program*, not *programme*.
- **Spanish is neutral Latin American with *tú*** and the glossary's words
  ([i18n.md](reference/i18n.md)): *serie*, *calentamiento*, *descarga*,
  *denunciar* (not *reportar*), *mapa del cuerpo*, *marcar* a set
  (not *tildar*).
- **Every claim is checked against the code** (the plan's §12 names each
  source); nothing promises a result, a cause or a default the product does
  not keep. Plan names stay *Free* and *Pro* in both languages.
- **No hype words**: no *ultimate*, *revolutionary*, *unlock*, *supercharge*,
  *game-changer*; the voice is plain and exact, the headlines short.

---

## 1. Top bar — `site.topBar`

| Key | English | Spanish |
| --- | --- | --- |
| `home` (accessible name of the lockup) | Sunnsteel, home | Sunnsteel, inicio |
| `skip` | Skip to content | Saltar al contenido |
| `navLabel` | Main | Principal |
| `product` | Product | Producto |
| `pricing` | Pricing | Precios |
| `language` | Language | Idioma |
| `english` / `spanish` | English / Español | English / Español |
| `signIn` | Sign in | Iniciar sesión |
| `startFree` | Start free | Empezar gratis |
| `openMenu` / `closeMenu` | Open menu / Close menu | Abrir menú / Cerrar menú |
| `columns.features` | Features | Funciones |
| `columns.useCases` | Use cases | Casos de uso |
| `columns.plans` | Plans | Planes |
| `links.allFeatures` | All features | Todas las funciones |
| `links.workoutTracker` | Workout tracker | Registro de entrenamiento |
| `links.routineBuilder` | Routine builder | Constructor de rutinas |
| `links.progression` | Automatic progression | Progresión automática |
| `links.progress` | Progress | Progreso |
| `links.ranks` | Ranks and achievements | Rangos y logros |
| `links.community` | Training with people | Entrenar con otros |
| `links.beginners` | Beginners | Principiantes |
| `links.intermediates` | Intermediates | Intermedios |
| `links.advanced` | Advanced lifters | Avanzados |
| `links.pricing` | Pricing | Precios |
| `links.isItFree` | Is it free? | ¿Es gratis? |
| `links.pro` | Pro | Pro |
| `links.install` | Install the app | Instalar la app |

## 2. Hero — `site.hero`

| Key | English | Spanish |
| --- | --- | --- |
| `eyebrow` | Free to start · No app store needed | Gratis para empezar · Sin tienda de apps |
| `headline` | Statues aren't born. They're `<mark>`carved`</mark>`. | Las estatuas no nacen. `<mark>`Se esculpen`</mark>`. |
| `subline` | Plan, log every set, and watch your records and rank grow in a history nobody can fake. | Planifica, registra cada serie y mira crecer tus récords y tu rango en un historial que nadie puede inventar. |
| `createAccount` | Create a free account | Crear cuenta gratis |
| `signIn` | Sign in | Iniciar sesión |
| `install` | Runs in your browser and installs on any phone, with no app store. `<link>`How to install`</link>` | Funciona en el navegador y se instala en cualquier teléfono, sin tienda de apps. `<link>`Cómo instalarla`</link>` |
| `pauseVideo` / `playVideo` | Pause background video / Play background video | Pausar el video de fondo / Reproducir el video de fondo |
| `example` | Example | Ejemplo |
| `recordCard` | New record · {exercise} {weight} × {reps} | Nuevo récord · {exercise} {weight} × {reps} |
| `meta.title` | Sunnsteel — Statues aren't born. They're carved. | Sunnsteel — Las estatuas no nacen. Se esculpen. |
| `meta.description` | A workout tracker where every set becomes evidence: plan, log, and watch records, ranks and your history grow. Free to start. | Un registro de entrenamiento donde cada serie es evidencia: planifica, registra y mira crecer tus récords, tu rango y tu historial. Gratis para empezar. |

*Why this subline:* it names the three things a visitor does (plan, log,
watch) and the one thing only Sunnsteel claims (a history nobody can fake),
in about 90 characters, so it fits two lines at 390 in both languages. The
Spanish uses *inventar* rather than *falsificar*, which reads as forgery.

*Why this headline (the owner, 2026-11-21, replacing "Forge yourself. Prove
it in every set.", which read as corny):* the Greek statue, the golden era's
sculpting and the discipline of the gym in one line, said as process rather
than a promise of results -- nobody is told what they will look like. It
reads three lines at 390 in both languages, and the rule sits under
*carved* / *Se esculpen*, the work. The closing band answers it with "Start
carving." / "Empieza a esculpir."

**Open (the owner, 2026-11-21; plan §11 row 44):**
- **"Free" is said four times in the first viewport** -- the top bar's
  `startFree`, the hero's `eyebrow` and `createAccount`, and the proof band's
  `freeValue` / `free` -- and should be said once or twice.
- **"in a history nobody can fake" is corny**; the `subline` needs a better
  line. Both are rewritten with the owner once the hero passes its gate.

## 3. Proof band — `site.proof`

| Key | English | Spanish |
| --- | --- | --- |
| `label` | In figures | En cifras |
| `members` | Members | Miembros |
| `workouts` | Workouts logged | Entrenamientos registrados |
| `exercises` | Exercises in the catalog | Ejercicios en el catálogo |
| `freeValue` / `free` | Free / To start | Gratis / Para empezar |
| `milestones` (reserve) | Milestones to earn | Logros por ganar |
| `ranks` (reserve) | Ranks to reach | Rangos por alcanzar |
| `mockTag` | Mock figure | Cifra ficticia |
| `cellSr` | {value} {label} | {value} {label} |

The placeholder figures (12,400 members; 350,000 workouts) are values in
`lib/site/proof-figures.ts`, not copy; production shows the reserves instead
(§12.3).

## 4. The four verbs — `site.verbs`

| Key | English | Spanish |
| --- | --- | --- |
| `heading` | Plan. Train. Measure. Earn. | Planifica. Entrena. Mide. Gana. |
| `plan.title` | Build your routine, or start from a template | Arma tu rutina o empieza con una plantilla |
| `plan.body` | Weekly or rotating schedules and rep ranges that progress on their own. With Pro, 8-week blocks and planned deloads. | Semanas fijas o rotaciones, y rangos de repeticiones que progresan solos. Con Pro, bloques de 8 semanas y descargas planificadas. |
| `plan.link` | See the routine builder | Ver el constructor de rutinas |
| `plan.callout` | {template} · {days, plural, one {# day} other {# days}} a week | {template} · {days, plural, one {# día} other {# días}} por semana |
| `train.title` | Load the bar without the math | Carga la barra sin hacer cuentas |
| `train.body` | Your last numbers beside every set, a rest timer that starts itself, and warm-ups and plates worked out from your working weight. | Tus últimos números junto a cada serie, un descanso que arranca solo, y calentamientos y discos calculados desde tu peso de trabajo. |
| `train.link` | See the workout tracker | Ver el registro de entrenamiento |
| `train.callout` | {weight} · {plates} per side | {weight} · {plates} por lado |
| `measure.title` | See what is really moving | Mira qué avanza de verdad |
| `measure.body` | Strength by estimated 1RM, the muscles you trained each week on a body map, and your weight over time. With Pro, training signals that give numbers, never verdicts. | Fuerza por 1RM estimado, los músculos que entrenaste cada semana en un mapa del cuerpo y tu peso a lo largo del tiempo. Con Pro, señales de entrenamiento que dan números, nunca veredictos. |
| `measure.link` | See progress | Ver el progreso |
| `measure.callout` | {exercise} · e1RM {weight} · +{change} in {weeks} weeks | {exercise} · 1RM est. {weight} · +{change} en {weeks} semanas |
| `earn.title` | Records, milestones and ranks you earn by training | Récords, logros y rangos que se ganan entrenando |
| `earn.body` | Every record is found in your sets. Milestones and {ranks} ranks reward showing up, never posting. | Cada récord sale de tus series. Los logros y los {ranks} rangos premian que vengas a entrenar, no que publiques. |
| `earn.link` | See ranks and achievements | Ver rangos y logros |
| `earn.callout` | Rank reached · {rank} | Rango alcanzado · {rank} |

## 5. Tools for every workout — `site.tools`

| Key | English | Spanish |
| --- | --- | --- |
| `heading` | Tools for every workout | Herramientas para cada entrenamiento |
| `progression.eyebrow` | Automatic progression | Progresión automática |
| `progression.title` | Reach the top of your range. The weight goes up. | Llega al tope de tu rango. El peso sube. |
| `progression.body` | When every set reaches the top of its rep range, your next workout adds one step, {step} unless you choose another. Fall short and the weight you lifted carries over. | Cuando todas las series llegan al tope de su rango, el siguiente entrenamiento suma un paso: {step} si no eliges otro. Si no llegas, se mantiene el peso que levantaste. |
| `progression.link` | See automatic progression | Ver la progresión automática |
| `progression.columns` | Workout · Weight · Reps | Entrenamiento · Peso · Reps |
| `rest.eyebrow` | Rest | Descanso |
| `rest.title` | Rest that starts itself | Un descanso que arranca solo |
| `rest.body` | It starts when you mark a set done and tells you when it's over, even with the screen locked, once notifications are on (on iPhone, in the installed app). | Arranca al marcar la serie y te avisa cuando termina, incluso con la pantalla bloqueada, si activaste las notificaciones (en iPhone, con la app instalada). |
| `supersets.eyebrow` | Supersets and circuits | Superseries y circuitos |
| `supersets.title` | Link exercises and train in rounds | Enlaza ejercicios y entrena por rondas |
| `supersets.body` | Up to {max} exercises in a group, one set of each per round, each keeping its own weights and progression. | Hasta {max} ejercicios por grupo, una serie de cada uno por ronda, y cada uno conserva sus pesos y su progresión. |
| `swap.eyebrow` | Swap an exercise | Cambiar un ejercicio |
| `swap.title` | Machine taken? Swap it for today. | ¿Máquina ocupada? Cámbiala por hoy. |
| `swap.body` | Close alternatives, ranked by movement and muscles. Your routine stays as it is unless you choose to update it. | Alternativas parecidas, ordenadas por movimiento y músculos. Tu rutina queda igual salvo que elijas actualizarla. |

The rest card's notification reads the server's own words (`restOverTitle`,
`restNextBody`); the superset and swap fragments use the app's own labels
("Superset A", "Round 2 of 3", "Swapped from …").

## 6. Progress you can read — `site.progress`

| Key | English | Spanish |
| --- | --- | --- |
| `heading` | Progress you can read | Un progreso que se puede leer |
| `map.title` | Every set you log lands on the map | Cada serie que registras llega al mapa |
| `map.body` | Weekly sets per muscle on a body map, front and back, with the number behind every color, and your estimated 1RM week by week. | Series semanales por músculo en un mapa del cuerpo, de frente y de espalda, con el número detrás de cada color, y tu 1RM estimado semana a semana. |
| `map.week` | Week {n} | Semana {n} |
| `map.planLine` | {free} weeks free, up to {pro} with Pro. | {free} semanas gratis, hasta {pro} con Pro. |
| `map.strength` | {exercise} · estimated 1RM | {exercise} · 1RM estimado |
| `cards.plateaus.name` | Plateau watch (the app's `planning.plateaus.heading`) | Control de estancamiento (el mismo mensaje) |
| `cards.plateaus.body` | Lifts with no new best after several sessions, with the rule written above them. | Ejercicios sin una nueva mejor marca después de varias sesiones, con la regla escrita arriba. |
| `cards.signals.name` | Training signals | Señales de entrenamiento |
| `cards.signals.body` | Effort, rep targets, declines and workouts over two weeks against the two before. A change is marked, never explained. | Esfuerzo, objetivos de repeticiones, caídas y entrenamientos en dos semanas frente a las dos anteriores. Un cambio se marca, nunca se explica. |
| `cards.deload.name` | Deload suggestion | Sugerencia de descarga |
| `cards.deload.body` | When a load signal holds, it proposes a lighter week with its dates. Nothing changes until you save it. | Cuando una señal de carga se mantiene, propone una semana más liviana con sus fechas. Nada cambia hasta que la guardas. |
| `cards.review.name` | Training review | Revisión del entrenamiento |
| `cards.review.body` | Pick a question and a few workouts. The answer describes your logs, cites every number from them and never guesses a cause. | Elige una pregunta y algunos entrenamientos. La respuesta describe tus registros, cita cada número y nunca adivina una causa. |
| `tags.free` / `tags.pro` | Free / Pro | Free / Pro |

The mock-ups' rows ("No new best in 4 sessions", "Changed", "Plan this
deload", the review's question) are the app's own messages.

## 7. Ranks — `site.ranks`

| Key | English | Spanish |
| --- | --- | --- |
| `heading` | Ranks earned by consistency | Rangos que se ganan con constancia |
| `body` | {count} ranks, from {first} to {last}, earned by workouts across different weeks: attendance, never how much you lift or how often you post. Your rank dresses your profile, and you choose who sees it. | {count} rangos, de {first} a {last}, que se ganan con entrenamientos en semanas distintas: asistencia, nunca cuánto levantas ni cuánto publicas. Tu rango viste tu perfil, y tú eliges quién lo ve. |
| `ladderLabel` | The ranks, in order | Los rangos, en orden |
| `requirement` | {workouts, plural, one {# workout} other {# workouts}} in {weeks, plural, one {# week} other {# different weeks}} | {workouts, plural, one {# entrenamiento} other {# entrenamientos}} en {weeks, plural, one {# semana} other {# semanas distintas}} |
| `firstRank` | Where everyone starts | Donde todos empiezan |
| `profileName` | Your name | Tu nombre |
| `profileHandle` | @yourname | @tunombre |

Rank names and descriptions are the catalog's (`catalog.ranks`).

## 8. Start with a program — `site.templates`

| Key | English | Spanish |
| --- | --- | --- |
| `heading` | Start with a program | Empieza con un programa |
| `body` | Three programs to start from, each opening as a draft you can change. The weights are yours to fill in: a template can't know your strength. | Tres programas para empezar; cada uno se abre como un borrador que puedes cambiar. Los pesos los completas tú: una plantilla no puede saber tu fuerza. |
| `levels.beginner` / `levels.intermediate` / `levels.advanced` | Beginner / Intermediate / Advanced | Principiante / Intermedio / Avanzado |
| `start` | Start with this one | Empezar con esta |
| `previous` / `next` | Previous program / Next program | Programa anterior / Programa siguiente |
| `show` | Show {name} | Mostrar {name} |
| `position` | {name}, {position} of {total} | {name}, {position} de {total} |
| `exercises` | {count, plural, one {# exercise} other {# exercises}} | {count, plural, one {# ejercicio} other {# ejercicios}} |
| `noneFit.title` | None of these? | ¿Ninguna te sirve? |
| `noneFit.build` | Build your own | Arma la tuya |
| `noneFit.describe` | Describe it, get a draft | Descríbela y recibe un borrador |
| `noneFit.advanced` | The 8-week block is built in the same builder. | El bloque de 8 semanas se arma en el mismo constructor. |
| `handoff` (onboarding) | You picked {template}. | Elegiste {template}. |

Template names, schedules, descriptions and day names are the app's
(`routines.templates`).

## 9. Train with people — `site.people`

| Key | English | Spanish |
| --- | --- | --- |
| `heading` | Train with people | Entrena con otros |
| `subline` | Free, like everything you do in a workout. | Gratis, como todo lo que haces al entrenar. |
| `activity.eyebrow` | Activity | Actividad |
| `activity.title` | Follow people and see them train | Sigue a otros y míralos entrenar |
| `activity.body` | Workouts, records and milestones from people you follow, with {reactions} reactions and comments. There's nothing to post. | Entrenamientos, récords y logros de la gente que sigues, con {reactions} reacciones y comentarios. No hay nada que publicar. |
| `activity.entry` | {name} finished {day} · {records, plural, one {# record} other {# records}} | {name} terminó {day} · {records, plural, one {# récord} other {# récords}} |
| `partners.eyebrow` | Training partners | Compañeros de entrenamiento |
| `partners.title` | Train with partners | Entrena con compañeros |
| `partners.body` | Up to {max} partners. Each of you chooses what the other sees, and you can be told when a partner finishes a workout. | Hasta {max} compañeros. Cada uno elige qué ve el otro, y puedes recibir un aviso cuando un compañero termina un entrenamiento. |
| `partners.shares` | Shares with you: {parts} | Comparte contigo: {parts} |
| `messages.eyebrow` | Messages | Mensajes |
| `messages.title` | Send what you trained | Comparte lo que entrenaste |
| `messages.body` | One-to-one messages that can carry a routine, a workout, a record, a milestone or a month of training. People you don't follow can only send you a request, and only if you allow it. | Mensajes uno a uno que pueden llevar una rutina, un entrenamiento, un récord, un logro o un mes de entrenamiento. Quien no sigues solo puede mandarte una solicitud, y solo si lo permites. |
| `messages.sample` | Try this one | Prueba esta |
| `messages.copied` | In your routines | En tus rutinas |
| `privacy.title` | You choose who sees each part | Tú eliges quién ve cada parte |
| `privacy.body` | {count} parts of your profile, each set to Everyone, Followers or Only me. Block anyone, report anything, and delete your account or take your data with you whenever you want. | {count} partes de tu perfil, cada una en Todos, Seguidores o Solo yo. Bloquea a quien quieras, denuncia lo que haga falta, y borra tu cuenta o llévate tus datos cuando quieras. |

The four reactions, the partner limit, the partner alert's wording and the
privacy rows' names are the app's and contracts' (§12.9). **Partner
encouragement is never mentioned on the site** (the owner, 2026-11-21).

## 10. Free and Pro — `site.plans`

| Key | English | Spanish |
| --- | --- | --- |
| `eyebrow` | Plans | Planes |
| `heading` | Free to train. Pro to plan further. | Gratis para entrenar. Pro para planificar más lejos. |
| `free.name` | Free | Free |
| `free.note` | No card needed | Sin tarjeta |
| `free.lines.log` | Log every set, with rest alerts | Registra cada serie, con avisos de descanso |
| `free.lines.progression` | Automatic progression, warm-ups and plates | Progresión automática, calentamientos y discos |
| `free.lines.record` | History, records, milestones and ranks | Historial, récords, logros y rangos |
| `free.lines.window` | Strength trends for {days} days and muscle history for {weeks} weeks | Tendencias de fuerza de {days} días e historial muscular de {weeks} semanas |
| `free.lines.social` | Everything social, and messages | Todo lo social y los mensajes |
| `free.lines.data` | Export your data or delete your account at any time | Exporta tus datos o borra tu cuenta cuando quieras |
| `free.limits` | Up to {versions} routine versions, {goals} goals and {gyms, plural, one {# gym} other {# gyms}} | Hasta {versions} versiones de rutina, {goals} objetivos y {gyms, plural, one {# gimnasio} other {# gimnasios}} |
| `free.action` | Start free | Empezar gratis |
| `pro.name` | Pro | Pro |
| `pro.price` | {price} a month | {price} por mes |
| `pro.trial` | First {days} days free, once per account | Los primeros {days} días gratis, una vez por cuenta |
| `pro.cancel` | Cancel any time; Pro lasts until the end of what you paid. | Cancela cuando quieras; Pro dura hasta el final de lo que pagaste. |
| `pro.paid` | Paid with Mercado Pago | Pago con Mercado Pago |
| `pro.ai` | Includes up to {drafts} routine drafts and {reviews} training reviews a month | Incluye hasta {drafts} borradores de rutina y {reviews} revisiones de entrenamiento por mes |
| `pro.action` | Try Pro free for {days} days | Probar Pro {days} días gratis |
| `pro.priceSr` | {price} a month, first {days} days free | {price} por mes, los primeros {days} días gratis |
| `compare` | See the full comparison | Ver la comparación completa |

The four outcomes are the app's (`billing.offer.outcomes`: Plan ahead ·
Compare and adjust · See all your history · Make it yours / Planifica con
anticipación · Compara y ajusta · Mira todo tu historial · Hazlo tuyo); the
legal links are `LegalLinks`'. **Open (PRODUCT.md):** Pro is priced in ARS
through Mercado Pago Argentina, which an international English audience may
not be able to pay; the copy states the price as it is.

## 11. Questions — `site.questions`

| Key | English | Spanish |
| --- | --- | --- |
| `heading` | Questions | Preguntas |
| `contact` | Something else? Write to {email}. | ¿Otra cosa? Escríbenos a {email}. |

| # | Question (EN / ES) | Answer (EN) | Answer (ES) |
| --- | --- | --- | --- |
| 1 | Is it free? / ¿Es gratis? | Yes. Logging, progression, your history, records, ranks and everything social are free, with no card. Pro is optional: {price} a month, with the first {days} days free once per account. | Sí. Registrar, la progresión, tu historial, los récords, los rangos y todo lo social son gratis, sin tarjeta. Pro es opcional: {price} por mes, con los primeros {days} días gratis una vez por cuenta. |
| 2 | Do I need to download anything? / ¿Tengo que descargar algo? | No app store. Sunnsteel runs in your browser and installs from it: on iPhone, tap Share in Safari and choose Add to Home Screen; on Android, choose Install app in your browser's menu; on a computer, use the install icon in the address bar. On iPhone, notifications need the installed app. | No hay tienda de apps. Sunnsteel funciona en tu navegador y se instala desde ahí: en iPhone, toca Compartir en Safari y elige Agregar a pantalla de inicio; en Android, elige Instalar app en el menú del navegador; en una computadora, usa el ícono de instalar de la barra de direcciones. En iPhone, las notificaciones necesitan la app instalada. |
| 3 | Does it work offline? / ¿Funciona sin conexión? | If the signal drops mid-workout, keep logging: your sets are sent when it comes back, as long as the app stays open, and it tells you when changes are waiting. | Si se corta la señal en pleno entrenamiento, sigue registrando: tus series se envían cuando vuelve, mientras la app siga abierta, y te avisa cuando hay cambios esperando. |
| 4 | Is it for beginners? / ¿Sirve si recién empiezo? | Yes. There's a beginner program, a first-run recommendation based on your days and goals, and warm-ups and plates worked out for you. It grows with you to blocks and deloads with Pro. | Sí. Hay un programa para principiantes, una recomendación inicial según tus días y objetivos, y calentamientos y discos calculados por ti. Crece contigo hasta bloques y descargas con Pro. |
| 5 | Which languages? / ¿En qué idiomas está? | English and Spanish. You can switch at any time. | Español e inglés. Puedes cambiar cuando quieras. |
| 6 | What does Pro add? / ¿Qué agrega Pro? | Planning ahead with 8-week blocks, training blocks and deloads; comparisons, training signals and reviews; your full history; and routine drafts from a description. `<link>`See Free and Pro side by side`</link>`. | Planificar con bloques de 8 semanas, bloques de entrenamiento y descargas; comparaciones, señales de entrenamiento y revisiones; tu historial completo; y borradores de rutina a partir de una descripción. `<link>`Ver Free y Pro lado a lado`</link>`. |
| 7 | How do I cancel? / ¿Cómo cancelo? | From Settings, in Account, or with the `<link>`cancellation button`</link>` without signing in. Pro lasts until the end of what you paid, and nothing is deleted. Within {revocation} days of buying, you can also use the `<link>`revocation button`</link>`. | Desde Ajustes, en Cuenta, o con el `<link>`botón de baja`</link>` sin iniciar sesión. Pro dura hasta el final de lo que pagaste y no se borra nada. Dentro de los {revocation} días de la compra, también puedes usar el `<link>`botón de arrepentimiento`</link>`. |
| 8 | Who sees my profile and my workouts? / ¿Quién ve mi perfil y mis entrenamientos? | You choose, for each of {count} parts of your profile: everyone, your followers, or only you. You can block anyone and report anything. | Tú eliges, para cada una de las {count} partes de tu perfil: todos, tus seguidores o solo tú. Puedes bloquear a quien quieras y denunciar lo que haga falta. |
| 9 | Are messages private? / ¿Los mensajes son privados? | They're one to one and stored on our servers; they're not end-to-end encrypted. A moderator reads a message only if it's reported, and then only that message and up to {context} before it, as the person who reported it saw them. | Son uno a uno y se guardan en nuestros servidores; no tienen cifrado de extremo a extremo. Un moderador lee un mensaje solo si lo denuncian, y en ese caso solo ese mensaje y hasta {context} anteriores, como los vio quien lo denunció. |
| 10 | What happens to what I give the AI? / ¿Qué pasa con lo que le doy a la IA? | Only Pro's routine drafts and training reviews use it. What you write, or the workouts you choose, go to Anthropic to write the answer and aren't stored by us; we keep only that a request was made, to count your month. Answers describe; they don't diagnose. | Solo la usan los borradores de rutina y las revisiones de entrenamiento de Pro. Lo que escribes, o los entrenamientos que eliges, van a Anthropic para escribir la respuesta y no los guardamos; solo registramos que hubo una solicitud, para contar tu mes. Las respuestas describen; no diagnostican. |
| 11 | Can I take my data or delete my account? / ¿Puedo llevarme mis datos o borrar mi cuenta? | Yes. Download everything as one file from Settings whenever you want, and deleting your account is immediate and complete. | Sí. Descarga todo en un archivo desde Ajustes cuando quieras, y borrar tu cuenta es inmediato y completo. |
| 12 | Is this medical advice? / ¿Esto es consejo médico? | No. Sunnsteel records and describes your training. For pain, injury or health questions, see a professional. | No. Sunnsteel registra y describe tu entrenamiento. Ante dolor, lesiones o dudas de salud, consulta a un profesional. |

Answer 2's iPhone and Android labels are checked on real devices before
approval (Safari's Spanish label varies by version).

## 12. Closing band — `site.closing`

| Key | English | Spanish |
| --- | --- | --- |
| `heading` | Start carving. | Empieza a esculpir. |
| `subline` | Free to start, in your browser, in English or Spanish. | Gratis para empezar, en tu navegador, en español o inglés. |
| `createAccount` / `signIn` | Create a free account / Sign in | Crear cuenta gratis / Iniciar sesión |
| `install` | How to install | Cómo instalarla |
| `qr.title` | Open it on your phone | Ábrelo en tu teléfono |
| `qr.hint` | Scan it with your camera | Escanéalo con la cámara |
| `qr.alt` | QR code that opens {url} | Código QR que abre {url} |
| `helper.title` | Install Sunnsteel on this phone | Instala Sunnsteel en este teléfono |
| `helper.install` | Install Sunnsteel | Instalar Sunnsteel |
| `helper.iosSteps` | 1. Tap Share in Safari's toolbar. 2. Choose Add to Home Screen. | 1. Toca Compartir en la barra de Safari. 2. Elige Agregar a pantalla de inicio. |
| `helper.iosNote` | Notifications work once it's installed. | Las notificaciones funcionan una vez instalada. |
| `helper.dismiss` | Not now | Ahora no |

## 13. Footer — `site.footer`

| Key | English | Spanish |
| --- | --- | --- |
| `navLabel` | Footer | Pie de página |
| `tagline` | Statues aren't born. They're carved. | Las estatuas no nacen. Se esculpen. |
| `columns.product` / `useCases` / `help` / `legal` | Product / Use cases / Help / Legal | Producto / Casos de uso / Ayuda / Legal |
| `links.questions` | Questions | Preguntas |
| `links.install` | Install the app | Instalar la app |
| `links.contact` | Contact | Contacto |
| `links.terms` / `privacy` / `refunds` | Terms / Privacy / Refunds | Términos / Privacidad / Reembolsos |
| `copyright` | © {year} Sunnsteel | © {year} Sunnsteel |

The feature, use-case and pricing links reuse the top bar's keys; the two
legal buttons are `LegalLinks`' own.

---

## Checked before approval

- **Facts against their sources** (the plan's §12): the step (2.5 kg), the
  superset maximum (6), the partner maximum (20), the privacy parts (10), the
  message context (5), the revocation days (10), the plan limits, the price
  and the trial all arrive as arguments from contracts or the app, so the
  copy cannot drift from them.
- **Glossary:** every Spanish term above is the glossary's; *denunciar* for
  report, *marcar* for completing a set, *mapa del cuerpo*.
- **Length:** the longest Spanish strings (the hero subline, the plans'
  window line, answer 2) are measured at 320 and 390 in the build; a line
  that does not fit is rephrased, never shrunk.
- **Not claimed anywhere:** a member count, a rating, a testimonial, a
  default privacy, that a rank cannot be lost, a cause or a result.
