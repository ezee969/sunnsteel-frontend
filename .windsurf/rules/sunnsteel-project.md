---
trigger: always_on
---

# Sunnsteel Frontend - Fitness Application

Este es el proyecto frontend para Sunnsteel, una aplicación de fitness y entrenamiento.

## Stack Tecnológico

- **Framework**: Next.js 15.2.1 (App Router) con TypeScript
- **UI Library**: React 19 con TailwindCSS v4
- **Componentes**: Shadcn/ui con Radix UI primitives
- **Estado**: TanStack Query (React Query) para server state
- **Formularios**: React Hook Form con Zod validation
- **Iconos**: Lucide React
- **Fuentes**: Geist Sans y Geist Mono
- **Autenticación**: JWT con refresh tokens

## Estructura del Proyecto

### App Router Structure

- **`app/(auth)/`**: Páginas de autenticación (login, signup)
- **`app/(protected)/`**: Páginas protegidas (dashboard, routines)
- **`app/layout.tsx`**: Layout principal con providers
- **`app/page.tsx`**: Página de inicio

### Páginas Disponibles

- **`app/(auth)/login/page.tsx`**: Página de inicio de sesión
- **`app/(auth)/signup/page.tsx`**: Página de registro
- **`app/(protected)/dashboard/page.tsx`**: Dashboard principal
- **`app/(protected)/routines/page.tsx`**: Gestión de rutinas
- **`app/page.tsx`**: Página de inicio pública

### Directorios Principales

- **`components/`**: Componentes reutilizables
  - `ui/`: Componentes base de Shadcn/ui (12 componentes disponibles)
  - `layout/`: Componentes de layout
- **`providers/`**: Context providers (Auth, App, Query)
- **`hooks/`**: Custom hooks (useAuthProtection, useSidebar)
- **`lib/`**: Utilidades y servicios
  - `api/`: Servicios de API y hooks (9 servicios disponibles)
  - `utils.ts`: Utilidades generales
- **`schema/`**: Esquemas de validación Zod (loginSchema, signupSchema)

### Middleware

- **`middleware.ts`**: Protección de rutas y redirecciones
- Rutas protegidas: `/dashboard`, `/workouts`, `/profile`, `/settings`
- Rutas de auth: `/login`, `/signup`

## Patrones de Desarrollo

### Autenticación

- **AuthProvider**: Context para estado de autenticación
- **useAuth**: Hook para acceder al estado de auth
- **useAuthProtection**: Hook para proteger rutas
- **useSidebar**: Hook para manejo de sidebar
- **Token Management**: Access tokens en localStorage, refresh tokens en cookies
- **Auto-refresh**: Renovación automática de tokens

### API Integration

- **httpClient**: Cliente HTTP centralizado con interceptors
- **Services**:
  - `authService.ts`: Servicios de autenticación
  - `userService.ts`: Servicios de usuario
  - `tokenService.ts`: Servicios de tokens
- **API Hooks**:
  - `useRegister.ts`, `useLogin.ts`, `useLogout.ts`
  - `useUser.ts`, `useRefreshToken.ts`
- **Types**: `auth.type.ts` para tipos de autenticación
- **TanStack Query**: Para cache y estado del servidor
- **Error Handling**: Manejo centralizado de errores

### Formularios

- **React Hook Form**: Para manejo de formularios
- **Zod Schemas**: Validación de tipos y runtime
- **Schemas disponibles**:
  - `loginSchema`: Validación de login
  - `signupSchema`: Validación de registro

### UI/UX

- **Shadcn/ui**: Componentes base consistentes
- **TailwindCSS**: Styling utility-first
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Soporte para tema oscuro
- **Accessibility**: Componentes accesibles con Radix

## Componentes Disponibles

### UI Components (Shadcn)

- **Form Components**: Button, Input, Label, Form
- **Layout Components**: Card, Separator, Scroll Area
- **Navigation**: Tabs, Dropdown Menu
- **Data Display**: Avatar, Badge, Progress

### Layout Components

- **Sidebar navigation**: Navegación lateral
- **Protected route wrappers**: Envoltorios de rutas protegidas
- **Auth layouts**: Layouts de autenticación

## Configuración

### Variables de Entorno

- `NEXT_PUBLIC_API_URL`: URL del backend API
- `NEXT_PUBLIC_FRONTEND_URL`: URL del frontend

### Scripts Disponibles

- `npm run dev`: Desarrollo con Turbopack
- `npm run dev:all`: Frontend + Backend simultáneo
- `npm run build`: Build de producción
- `npm run lint`: Linting con ESLint

## Patrones de Código

### Imports y Aliases

- `@/components`: Componentes
- `@/lib`: Utilidades y servicios
- `@/hooks`: Custom hooks
- `@/providers`: Context providers
- `@/schema`: Esquemas de validación

### Convenciones

- **Componentes**: PascalCase, functional components
- **Hooks**: camelCase con prefijo "use"
- **Services**: camelCase con sufijo "Service"
- **Types**: PascalCase con sufijo "Type"
- **Schemas**: camelCase con sufijo "Schema"

### Manejo de Estado

- **Server State**: TanStack Query
- **Client State**: React Context + useState
- **Form State**: React Hook Form
- **Auth State**: AuthProvider context

## Integración con Backend

### Endpoints Consumidos

- `POST /api/auth/login`: Inicio de sesión
- `POST /api/auth/register`: Registro
- `POST /api/auth/logout`: Cierre de sesión
- `POST /api/auth/refresh`: Renovación de tokens
- `GET /api/users/profile`: Perfil de usuario

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
