# Registro activo de deuda técnica

Este documento registra únicamente deuda técnica activa y accionable. Los
problemas funcionales y las capacidades pendientes pertenecen al
[roadmap de producto](product-roadmap.md); en particular, los problemas de
perfiles, unidades y Quick Workout no se trasladan aquí.

## Reglas de mantenimiento

- Cada entrada debe describir impacto, evidencia verificable, dirección de
  solución y criterios de cierre.
- La deuda se elimina de este registro cuando se cierra. La evidencia extensa
  de auditorías cerradas se conserva en `docs/history/`.
- Las decisiones de producto se enlazan, pero no se duplican aquí.
- Una limitación aceptada se documenta como contexto y no se convierte en deuda
  activa sin evidencia nueva que justifique priorizarla.

## Deuda activa

### TD-27 · `WorkoutProgressService.getProgress` recorre todo el historial

**Estado:** activo. Relacionado con `DATA-01`–`DATA-05` del
[roadmap de producto](product-roadmap.md#analytics-and-historical-data-foundation).

**Impacto:** el coste de `GET /workouts/progress` crece con todo el historial de
entrenamiento del usuario. Cada petición transfiere y procesa todos los sets
completados necesarios para volumen y récords, además de todas las fechas de
sesiones completadas para calcular rachas. Esto aumenta trabajo de base de
datos, memoria y CPU del backend, y puede degradar la latencia del dashboard a
medida que crece el historial.

**Evidencia:** en
`../sunnsteel-backend/src/workouts/workout-progress.service.ts`, `getProgress`
ejecuta en cada llamada un `setLog.findMany` sin ventana temporal ni límite y un
`workoutSession.findMany` separado, también sin límite, para todas las fechas
históricas. Después calcula volumen, récords personales y rachas en memoria. El
frontend consume esa petición mediante `useWorkoutProgress` en el dashboard.

**Dirección de solución:** sustituir los recorridos de por vida por datos
persistidos y consultas acotadas. `DATA-01` aporta récords personales
persistentes; `DATA-02` y `DATA-03`, eventos y acumulados para volumen y rachas;
`DATA-04`, snapshots que preservan el significado histórico; y `DATA-05`, un
backfill repetible para los usuarios existentes. La respuesta pública de
progreso debe conservar su contrato mientras cambia la fuente de los cálculos.

**Criterios de cierre:**

- `getProgress` deja de consultar todos los sets completados y todas las fechas
  históricas en cada petición.
- Los récords, acumulados y eventos se actualizan de forma consistente e
  idempotente, con backfill repetible para el historial existente.
- Los tests de lógica y contrato demuestran que la respuesta mantiene los
  resultados actuales, incluidos volumen, récords, actividad reciente y
  rachas.
- Una inspección de consultas o medición con un historial representativo
  confirma que el trabajo de lectura queda acotado y no crece linealmente con
  toda la vida del usuario.

## Limitaciones aceptadas

- No se dispone de mediciones reales en iPhone. Las comprobaciones de escritorio
  pueden validar orden y comportamiento, pero no cuantifican el rendimiento de
  la PWA en ese dispositivo.
- La suite deliberadamente no incluye tests de componentes ni E2E: Vitest se
  mantiene en entorno Node para lógica pura, orquestación de auth y contratos de
  API. Esta frontera de cobertura se acepta hasta que una necesidad concreta
  justifique ampliar herramientas y mantenimiento.

## Auditoría anterior

Los 27 elementos de la auditoría anterior fueron cerrados o replanteados. Su
contenido completo permanece como evidencia en la
[auditoría técnica de julio de 2026](../history/technical-debt-audit-2026-07.md);
no debe usarse como lista de deuda activa.
