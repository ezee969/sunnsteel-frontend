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

// Radix UI Select calls scrollIntoView on options; jsdom doesn't implement it.
// Provide a no-op to avoid unhandled rejections in tests.
if (!('scrollIntoView' in Element.prototype)) {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
}
