import { useState, useEffect } from 'react';

interface ScrollLoaderProps {
  isLoading: boolean;
}

export default function ScrollLoader({ isLoading }: ScrollLoaderProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      // Hide with delay like Daraz
      setTimeout(() => setShow(false), 300);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 h-1">
      <div className="h-full bg-white animate-pulse" style={{
        animation: 'loading-bar 1.5s ease-in-out infinite'
      }}>
        <style>{`
          @keyframes loading-bar {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
}