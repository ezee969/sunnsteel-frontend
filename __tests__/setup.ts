import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useParams: () => ({ id: 'test-id' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Provide Supabase env vars for tests
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

// Mock Supabase client for tests
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: null },
        error: null,
      })),
      getUser: vi.fn(async () => ({
        data: { user: null },
        error: null,
      })),
    },
  },
}));

// Radix UI Select calls scrollIntoView on options; jsdom doesn't implement it.
// Provide a no-op to avoid unhandled rejections in tests.
if (!('scrollIntoView' in Element.prototype)) {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
}

// jsdom does not implement window.alert - mock to silence warnings
if (!('alert' in window)) {
  // @ts-ignore
  window.alert = vi.fn();
} else {
  // override existing (noop in real browser env not needed, but safe here)
  window.alert = vi.fn();
}

// Mock ResizeObserver for cmdk (shadcn Command component)
if (!('ResizeObserver' in global)) {
  (global as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
