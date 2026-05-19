import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', animate = true, delay = 0 }) {
  const baseClasses = 'glass rounded-3xl p-6 shadow-lg';

  if (!animate) {
    return <div className={`${baseClasses} ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
}
