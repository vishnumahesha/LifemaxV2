'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AccordionContextType {
  openItems: string[];
  toggle: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextType | null>(null);

interface AccordionProps {
  children: ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
}

export function Accordion({ children, type = 'single', defaultValue, className }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const toggle = (value: string) => {
    setOpenItems((prev) => {
      if (type === 'single') {
        return prev.includes(value) ? [] : [value];
      }
      return prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggle, type }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export function AccordionItem({ children, value, className }: AccordionItemProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');

  const isOpen = context.openItems.includes(value);

  return (
    <div
      className={cn(
        'border border-border rounded-xl overflow-hidden transition-colors',
        isOpen && 'border-border-accent',
        className
      )}
      data-state={isOpen ? 'open' : 'closed'}
    >
      {children}
    </div>
  );
}

interface AccordionTriggerProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export function AccordionTrigger({ children, value, className }: AccordionTriggerProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionTrigger must be used within Accordion');

  const isOpen = context.openItems.includes(value);

  return (
    <button
      className={cn(
        'w-full flex items-center justify-between p-4 text-left bg-background-secondary hover:bg-background-tertiary transition-colors',
        className
      )}
      onClick={() => context.toggle(value)}
      data-state={isOpen ? 'open' : 'closed'}
    >
      <span className="font-medium">{children}</span>
      <ChevronDown
        className={cn(
          'h-4 w-4 text-foreground-muted transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
}

interface AccordionContentProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export function AccordionContent({ children, value, className }: AccordionContentProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionContent must be used within Accordion');

  const isOpen = context.openItems.includes(value);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className={cn('p-4 pt-0 bg-background-secondary', className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
