'use client';

import { motion } from 'framer-motion';
import { SignupHeader } from './components/SignupHeader';
import { SignupForm } from './components/SignupForm';

export default function SignupPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <SignupHeader />
      <SignupForm />
    </motion.div>
  );
}
