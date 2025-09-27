# Prompt para GitHub Copilot - Refactorización de Componente

## Contexto
Tengo un componente React de muchas líneas que necesita ser refactorizado para mejorar la mantenibilidad y reutilización del código.

## Instrucciones para Copilot

**Analiza este componente completo y identifica oportunidades de refactorización siguiendo estas prioridades:**

### 1. Extracción de Lógica de Negocio
- Identifica lógica compleja que pueda extraerse a custom hooks
- Busca patrones de estado y efectos que se repitan
- Encuentra cálculos o transformaciones de datos que puedan modularizarse
- Sugiere hooks para: manejo de formularios, llamadas API, validaciones, etc.

### 2. Componentes UI Reutilizables
- Detecta bloques JSX repetitivos o similares
- Identifica elementos UI que podrían ser componentes independientes
- Busca patrones de layout o estructura que se repitan
- Sugiere componentes para: botones, modales, listas, formularios, cards, etc.

### 3. Utilidades y Helpers
- Encuentra funciones utilitarias que puedan extraerse
- Identifica constantes o configuraciones que deberían estar en archivos separados
- Busca validaciones o transformaciones de datos reutilizables

### 4. Estructura del Refactor
Para cada oportunidad identificada, proporciona:
- **Qué extraer**: Descripción clara del código a extraer
- **Por qué**: Beneficio específico de la extracción
- **Cómo**: Ejemplo de código del nuevo hook/componente
- **Impacto**: Estimación de líneas que se reducirían

### 5. Orden de Refactorización
Prioriza las extracciones por:
1. Mayor impacto en reducción de líneas
2. Mayor potencial de reutilización
3. Mejora en legibilidad y mantenimiento

## Formato de Respuesta Esperado

```markdown
## Análisis de Refactorización

### 🎯 Resumen
- Líneas actuales: ~600
- Líneas estimadas después: ~X
- Número de archivos sugeridos: X

### 🔧 Custom Hooks Sugeridos
1. **useFormLogic** (~50 líneas extraídas)
   - Extrae: lógica de validación y manejo de estado del formulario
   - Beneficio: reutilizable en otros formularios
   
2. **useApiData** (~40 líneas extraídas)
   - Extrae: llamadas API y manejo de loading/error
   - Beneficio: patrón estándar para todas las llamadas API

### 🧩 Componentes UI Sugeridos
1. **ActionButton** (~30 líneas extraídas)
   - Extrae: botones con loading y variantes
   - Beneficio: consistencia visual en toda la app

### 🛠 Utilidades Sugeridas
1. **validation.utils.js**
   - Extrae: funciones de validación
   - Beneficio: reutilizable y testeable independientemente

### 📋 Plan de Refactorización
1. Paso 1: Extraer [hook/componente más impactante]
2. Paso 2: Extraer [siguiente prioridad]
...
```

---

**Ahora analiza mi componente y proporciona el análisis de refactorización siguiendo este formato.**