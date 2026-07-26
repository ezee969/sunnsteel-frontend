const asBoolean = (value: string | undefined): boolean => value === 'true';

export const APP_ENV = process.env.NODE_ENV ?? 'development';
export const IS_DEVELOPMENT = APP_ENV === 'development';

export const PUBLIC_ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SHOW_PERFORMANCE_PANEL: asBoolean(
    process.env.NEXT_PUBLIC_SHOW_PERFORMANCE_PANEL,
  ),
  ENABLE_PERFORMANCE_LOGS: asBoolean(
    process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_LOGS,
  ),
  ENABLE_DEBUG_LOGS: asBoolean(process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS),
} as const;

export const SHOULD_SHOW_PERFORMANCE_PANEL =
  IS_DEVELOPMENT && PUBLIC_ENV.SHOW_PERFORMANCE_PANEL;
export const SHOULD_LOG_PERFORMANCE =
  IS_DEVELOPMENT || PUBLIC_ENV.ENABLE_PERFORMANCE_LOGS;
export const SHOULD_LOG_DEBUG = IS_DEVELOPMENT || PUBLIC_ENV.ENABLE_DEBUG_LOGS;
