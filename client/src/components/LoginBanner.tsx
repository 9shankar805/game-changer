import { useAuth } from "@/hooks/useAuth";
import { LogIn, X } from "lucide-react";
import { useState } from "react";

export default function LoginBanner() {
  const { user, loginWithGoogle } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (user || isDismissed) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-primary text-white z-40 md:hidden">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          <LogIn className="h-4 w-4" />
          <span className="text-sm font-medium">Sign in with Google</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="bg-white text-primary px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          <button onClick={() => setIsDismissed(true)} className="p-1 hover:bg-white/20 rounded">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}