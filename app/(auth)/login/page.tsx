'use client';

import { motion } from 'framer-motion';
import { LoginHeader } from './components/LoginHeader';
import { LoginForm } from './components/LoginForm';
import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { authService } from '@/lib/api/services/authService';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const triedSilentRefresh = useRef(false);

  // If already authenticated (access token present), redirect to dashboard.
  // We do this client-side to avoid middleware loops with stale cookies.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  // One-time silent refresh to detect an existing session via cookie and redirect.
  useEffect(() => {
    if (isAuthenticated || triedSilentRefresh.current) return;
    // If we just logged out, skip silent refresh to avoid extra rerenders
    let skip = false;
    try {
      if (
        typeof window !== 'undefined' &&
        window.sessionStorage &&
        (window.sessionStorage.getItem('skipLoginSilentRefresh') === '1' ||
          window.sessionStorage.getItem('authShuttingDown') === '1')
      ) {
        skip = true;
        window.sessionStorage.removeItem('skipLoginSilentRefresh');
        window.sessionStorage.removeItem('authShuttingDown');
      }
    } catch {}
    if (skip) return;
    triedSilentRefresh.current = true;
    authService
      .refreshToken()
      .then(() => {
        router.replace('/dashboard');
      })
      .catch(() => {
        // Stay on login if no valid session; suppress errors
      });
  }, [isAuthenticated, router]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('google-identity-ready'));
          }
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <LoginHeader />
        <LoginForm />
      </motion.div>
    </>
  );
}
