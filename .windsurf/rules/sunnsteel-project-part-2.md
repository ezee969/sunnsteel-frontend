---
trigger: always_on
---

## Integración con Backend

### Endpoints Consumidos

- `POST /api/auth/login`: Inicio de sesión
- `POST /api/auth/register`: Registro
- `POST /api/auth/logout`: Cierre de sesión
- `POST /api/auth/refresh`: Renovación de tokens
- `GET /api/users/profile`: Perfil de usuario
- `POST /api/workouts/sessions/start`: Iniciar sesión de entrenamiento
- `GET /api/workouts/sessions/active`: Obtener sesión activa
- `GET /api/workouts/sessions`: Listado de sesiones (historial) con filtros y paginación
- `GET /api/workouts/sessions/:id`: Obtener sesión por id
- `PATCH /api/workouts/sessions/:id/finish`: Finalizar sesión
- `PUT /api/workouts/sessions/:id/set-logs`: Upsert de registros de sets
- `DELETE /api/workouts/sessions/:id/set-logs/:routineExerciseId/:setNumber`: Eliminar un set log específico

### Autenticación Flow

1. Login/Register → Access token en localStorage
2. Refresh token en cookies (httpOnly)
3. Auto-refresh cuando access token expira
4. Logout → Limpia tokens y redirige

## Características de la Aplicación

### Funcionalidades Principales

- **Dashboard**: Vista principal con estadísticas y rutinas
- **Workout Management**: Gestión de rutinas de entrenamiento
- **User Profile**: Perfil de usuario y configuración
- **Authentication**: Sistema completo de auth

### UX/UI Features

- **Responsive**: Mobile-first design
- **Loading States**: Estados de carga con TanStack Query
- **Error Boundaries**: Manejo de errores
- **Form Validation**: Validación en tiempo real
- **Accessibility**: Componentes accesibles

## Contexto para el Agente

Cuando implementes funcionalidades:

- Usa Next.js App Router patterns
- Implementa autenticación con JWT
- Sigue los patrones de TanStack Query
- Usa Shadcn/ui para componentes
- Valida formularios con Zod
- Mantén responsive design
- Considera accesibilidad
- Integra con el backend NestJS
