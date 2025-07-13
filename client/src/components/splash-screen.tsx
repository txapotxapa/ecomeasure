import React, { useState, useEffect } from 'react';
import EcoMeasureLogo from './eco-measure-logo';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number; // Animation duration in milliseconds
  saveSkipPreference?: boolean; // Whether to remember skip preference
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 3000, saveSkipPreference = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'show' | 'fade-out'>('show');

  useEffect(() => {
    // Start fade-out shortly before completion
    const fadeOutTimer = setTimeout(() => {
      setAnimationPhase('fade-out');
    }, duration - 300);

    // Complete the splash screen
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, duration);

    return () => {
      // no skipHintTimer or fadeInTimer now
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 transition-all duration-500 select-none ${
        animationPhase === 'fade-out' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-green-400/30 rounded-full animate-float`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
        
        {/* Concentric circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-96 h-96 border border-green-500/20 rounded-full animate-pulse" />
          <div className="absolute w-[500px] h-[500px] border border-green-400/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute w-[600px] h-[600px] border border-green-300/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with enhanced animation */}
        <div 
          className={`transform transition-all duration-700 ${
            animationPhase === 'fade-out' ? 'scale-110 opacity-0 -rotate-12' : 'scale-100 opacity-100 rotate-0'
          }`}
        >
          <EcoMeasureLogo size={250} showText={true} />
        </div>

        {/* Skip indicator removed */}

        {/* Loading dots removed for faster display */}
      </div>

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none" />
    </div>
  );
};

export default SplashScreen;