import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * iOS-style page header with a back chevron, title, and optional right slot.
 * Used on every secondary route so users always have a way back.
 *
 * Props:
 *  - title    — string shown center
 *  - onBack   — optional callback, defaults to navigate(-1)
 *  - right    — optional ReactNode rendered on the right
 *  - subtitle — optional string under the title
 */
export default function PageHeader({ title, onBack, right, subtitle }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else if (window.history.length > 1) navigate(-1);
    else navigate('/home', { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-5 -mx-1"
    >
      <button
        onClick={handleBack}
        aria-label="Back"
        className="flex items-center gap-1 text-white/85 hover:text-white active:scale-95 transition-all px-1 py-1.5 rounded-lg"
      >
        <ChevronLeft size={26} strokeWidth={2.4} />
        <span className="text-base font-medium tracking-tight">Back</span>
      </button>

      <div className="text-center flex-1 min-w-0">
        <h1 className="text-white font-bold text-base tracking-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-white/50 text-[11px] mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      <div className="min-w-[68px] flex justify-end">
        {right}
      </div>
    </motion.div>
  );
}
