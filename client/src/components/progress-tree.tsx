import { motion } from "framer-motion";

interface ProgressTreeProps {
  progress: number; // 0 to 1
  className?: string;
}

export default function ProgressTree({ progress, className }: ProgressTreeProps) {
  const height = Math.max(0, Math.min(progress, 1)) * 100;
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Soil */}
      <div className="w-12 h-2 bg-amber-700 rounded-t" />
      {/* Tree trunk & leaves */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: progress, transformOrigin: "bottom center" }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-2 bg-amber-900"
        style={{ height: `${height}px` }}
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: progress }}
        transition={{ type: "spring", stiffness: 100, damping: 10 }}
        className="w-8 h-8 bg-primary rounded-full -mt-4"
      />
    </div>
  );
} 