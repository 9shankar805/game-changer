import { useEffect, useState } from 'react';
import SirahaBazaarLoader from './SirahaBazaarLoader';

interface PageLoaderProps {
  children: React.ReactNode;
  minLoadTime?: number;
}

export default function PageLoader({ children, minLoadTime = 800 }: PageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [minLoadTime]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <SirahaBazaarLoader isLoading={true} position="center" />
      </div>
    );
  }

  return <>{children}</>;
}