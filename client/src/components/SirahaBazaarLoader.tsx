import React from 'react';

interface SirahaBazaarLoaderProps {
  isLoading: boolean;
  position?: 'center' | 'bottom';
  overlay?: boolean;
}

export default function SirahaBazaarLoader({ 
  isLoading, 
  position = 'bottom',
  overlay = false 
}: SirahaBazaarLoaderProps) {
  if (!isLoading) return null;

  const positionClasses = {
    center: 'fixed inset-0 flex items-center justify-center z-50',
    bottom: 'fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50'
  };

  return (
    <>
      {overlay && position === 'center' && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40" />
      )}
      <div className={positionClasses[position]}>
        <div className="relative w-[60px] h-[60px]">
          {/* Orange spinning ring */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          
          {/* SirahaBazaar logo in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="/assets/icon2.png" 
              alt="Siraha Bazaar" 
              className="w-[30px] h-[30px] object-contain"
            />
          </div>
        </div>
        
        {position === 'center' && (
          <div className="absolute top-full mt-4 text-center">
            <p className="text-gray-600 text-sm font-medium">Loading...</p>
          </div>
        )}
      </div>
    </>
  );
}