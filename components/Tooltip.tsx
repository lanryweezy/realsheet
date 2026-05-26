import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({ content, shortcut, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg shadow-2xl z-[300] whitespace-nowrap pointer-events-none"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-white">{content}</span>
              {shortcut && (
                <span className="px-1.5 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] font-mono text-slate-400">
                  {shortcut}
                </span>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[6px] border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
