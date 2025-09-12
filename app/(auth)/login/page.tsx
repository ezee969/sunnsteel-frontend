'use client';

import { motion } from 'framer-motion';
import { LoginHeader } from './components/LoginHeader';
import { SupabaseLoginForm } from './components/SupabaseLoginForm';

export default function LoginPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <LoginHeader />
      <SupabaseLoginForm />
    </motion.div>
  );
}
