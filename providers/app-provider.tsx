'use client';

import { ReactNode } from 'react';
// import { Provider } from 'react-redux';
// import { store } from '@/lib/redux/store';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    // <Provider store={store}>
    // {/* </Provider> */}
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
