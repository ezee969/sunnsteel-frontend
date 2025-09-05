'use client';

import { motion } from 'framer-motion';
import { redirect } from 'next/navigation';

export default function HomePage() {
  // This will redirect to /dashboard if authenticated, or /login if not
  redirect('/dashboard');

  // This return is just a fallback that should never be rendered
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p 
          className="mt-2 text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Redirecting...
        </motion.p>
      </motion.div>
    </div>
  );
}
