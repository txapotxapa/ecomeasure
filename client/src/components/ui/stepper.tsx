import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Step {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStepIndex: number;
  onStepChange?: (index: number) => void;
  className?: string;
}

export default function Stepper({ steps, currentStepIndex, onStepChange, className }: StepperProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isActive = index === currentStepIndex;
        return (
          <div key={step.id} className="flex items-center gap-2">
            {/* dot */}
            <button
              onClick={() => onStepChange?.(index)}
              disabled={!onStepChange}
              className={cn(
                "relative w-8 h-8 flex items-center justify-center rounded-full border-2 transition-colors",
                isCompleted ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground",
                isActive && !isCompleted && "ring-2 ring-accent"
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCompleted ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.span
                    key="index"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="text-sm font-medium"
                  >
                    {index + 1}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            {/* label */}
            <span className={cn("text-sm select-none", isCompleted ? "text-foreground/70 line-through" : isActive ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
            {index !== steps.length - 1 && (
              <div className="flex-1 h-px bg-border w-8" />
            )}
          </div>
        );
      })}
    </div>
  );
} 