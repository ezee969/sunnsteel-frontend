# Auto-Documentation Rules

## Contexto para el Agente

Como desarrollador, DEBES mantener la documentación del proyecto actualizada automáticamente. Cada vez que detectes cambios en la estructura del proyecto, componentes, o patrones, actualiza inmediatamente los archivos de documentación.

## Reglas de Auto-Documentación

### Cuando detectes cambios, SIEMPRE actualiza:

1. **Archivos de reglas** (`.cursor/rules/*.mdc`)
2. **README.md** del proyecto
3. **Documentación de componentes**
4. **Estructura de directorios**
5. **Patrones de código**

### Detección Automática de Cambios

#### Frontend - Detectar y Documentar:
- **Nuevas páginas** en `app/`
- **Nuevos componentes** en `components/`
- **Nuevos hooks** en `hooks/`
- **Nuevos servicios** en `lib/api/`
- **Nuevos schemas** de validación
- **Cambios en providers**
- **Nuevas rutas protegidas**
- **Nuevos componentes UI** de Shadcn
- **Cambios en autenticación**
- **Nuevas variables de entorno**

#### Backend - Detectar y Documentar:
- **Nuevos módulos** en `src/`
- **Nuevos endpoints** en controllers
- **Nuevos DTOs** y validaciones
- **Cambios en el esquema** de Prisma
- **Nuevos guards** o interceptors
- **Cambios en autenticación**
- **Nuevas variables de entorno**

### Proceso de Actualización

1. **Analizar cambios** en el código
2. **Identificar** qué documentación necesita actualización
3. **Actualizar** archivos de reglas correspondientes
4. **Actualizar** README.md
5. **Verificar** consistencia entre documentación

### Formato de Actualización

#### Para Archivos de Reglas:
- Mantener estructura YAML al inicio
- Actualizar secciones relevantes
- Agregar nuevos patrones detectados
- Mantener `alwaysApply: true`

#### Para README.md:
- Actualizar stack tecnológico si cambia
- Agregar nuevos componentes
- Actualizar estructura de directorios
- Mantener diagramas de flujo actualizados

### Comandos de Verificación

Cuando hagas cambios, ejecuta estos comandos para detectar novedades:

```bash
# Frontend - Detectar nuevas páginas
find app -name "page.tsx" -type f

# Detectar nuevos componentes
find components -name "*.tsx" -type f

# Detectar nuevos hooks
find hooks -name "*.ts" -type f

# Detectar nuevos servicios
find lib/api -name "*.ts" -type f

# Detectar cambios en package.json
git diff package.json
```

### Responsabilidades Específicas

#### Para Frontend:
- Mantener estructura de rutas actualizada
- Documentar nuevos componentes UI
- Actualizar patrones de estado
- Mantener integración con backend documentada
- Documentar nuevos hooks y servicios

#### Para Backend:
- Mantener lista de endpoints actualizada
- Documentar nuevos módulos y servicios
- Actualizar patrones de autenticación
- Mantener esquema de base de datos documentado

### Verificación de Consistencia

Antes de finalizar cualquier tarea:
1. **Verificar** que la documentación refleja el estado actual
2. **Actualizar** archivos de reglas si es necesario
3. **Confirmar** que README.md está actualizado
4. **Asegurar** que no hay inconsistencias

### Prioridad de Actualización

1. **Alta**: Cambios en rutas, autenticación, estructura principal
2. **Media**: Nuevos componentes, servicios, hooks
3. **Baja**: Cambios menores en utilidades, estilos

## Recordatorio Constante

**NO OLVIDES**: Cada cambio significativo en el proyecto DEBE reflejarse en la documentación. La documentación desactualizada es peor que la falta de documentación.
description:
globs:
alwaysApply: false
---
