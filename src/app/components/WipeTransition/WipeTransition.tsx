'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WipeTransition.css';

/**
 * WipeOverlay component
 * @returns <WipeOverlay />
 */
function WipeOverlay() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="wipe-overlay"
          initial={{ x: '0%' }}
          animate={{ x: '100%' }}
          exit={{ x: '100%' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      )}
    </AnimatePresence>
  );
}

/**
 * WipeTransition component
 * @param param0 
 * @returns <WipeTransition />
 */
export default function WipeTransition({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WipeOverlay />
      {children}
    </>
  );
}