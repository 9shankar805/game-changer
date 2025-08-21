import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserData = async (userId: number) => {
    try {
      const response = await fetch(`/api/auth/refresh?userId=${userId}`);
      if (response.ok) {
        const responseData = await response.json();
        if (responseData.user) {
          setUser(responseData.user);
          safeSetItem("user", JSON.stringify(responseData.user));
        } else {
          console.warn("No user data in refresh response - clearing invalid session");
          setUser(null);
          localStorage.removeItem("user");
        }
      } else if (response.status === 404) {
        // User no longer exists in database - clear session
        console.warn("User not found in database - clearing invalid session");
        setUser(null);
        localStorage.removeItem("user");
      } else {
        console.warn("Failed to refresh user data:", response.status);
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        
        // Validate that user has required fields
        if (userData && userData.id && userData.email) {
          // CRITICAL FIX: Ensure user ID is properly handled as number
          const normalizedUser = {
            ...userData,
            id: typeof userData.id === 'string' ? parseInt(userData.id) : userData.id
          };
          
          console.log('Loading user from localStorage with normalized ID:', normalizedUser.id, typeof normalizedUser.id);
          
          setUser(normalizedUser);
          
          // Update localStorage with normalized data
          safeSetItem("user", JSON.stringify(normalizedUser));
          
          // Validate user exists in database on startup
          refreshUserData(normalizedUser.id);
          
          // If user is a shopkeeper with pending status, check for updates periodically
          if (normalizedUser.role === 'shopkeeper' && normalizedUser.status !== 'active') {
            const interval = setInterval(async () => {
              try {
                await refreshUserData(normalizedUser.id);
              } catch (error) {
                // Silently fail to avoid disrupting user experience
              }
            }, 30000); // Check every 30 seconds
            
            return () => clearInterval(interval);
          }
        } else {
          console.warn("Invalid user data in localStorage - clearing");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.warn("Corrupted user data in localStorage - clearing");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const { user } = await response.json();
    
    const normalizedUser = {
      ...user,
      id: typeof user.id === 'string' ? parseInt(user.id) : user.id
    };
    
    setUser(normalizedUser);
    safeSetItem("user", JSON.stringify(normalizedUser));
    
    if (normalizedUser.role === 'delivery_partner') {
      window.location.href = '/delivery-partner/dashboard';
    } else if (normalizedUser.role === 'shopkeeper') {
      checkAndRedirectShopkeeper(normalizedUser.id);
    }
  };

  // Safe localStorage with quota handling
  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        localStorage.clear();
        localStorage.setItem(key, value);
      } else {
        throw error;
      }
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { signInWithGoogle } = await import('@/lib/googleAuth');
      const googleUser = await signInWithGoogle();
      
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: googleUser.uid,
          email: googleUser.email,
          name: googleUser.displayName,
          picture: googleUser.photoURL
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Google authentication failed');
      }
      
      const { user } = await response.json();
      
      const normalizedUser = {
        ...user,
        id: typeof user.id === 'string' ? parseInt(user.id) : user.id
      };
      
      setUser(normalizedUser);
      safeSetItem('user', JSON.stringify(normalizedUser));
      
      if (normalizedUser.role === 'delivery_partner') {
        window.location.href = '/delivery-partner/dashboard';
      } else if (normalizedUser.role === 'shopkeeper') {
        checkAndRedirectShopkeeper(normalizedUser.id);
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    const { user } = await response.json();
    
    const normalizedUser = {
      ...user,
      id: typeof user.id === 'string' ? parseInt(user.id) : user.id
    };
    
    setUser(normalizedUser);
    safeSetItem("user", JSON.stringify(normalizedUser));
  };

  const isRestaurantByName = (storeName: string): boolean => {
    const restaurantKeywords = [
      'restaurant', 'cafe', 'food', 'kitchen', 'dining', 'eatery', 'bistro',
      'pizzeria', 'burger', 'pizza', 'chicken', 'biryani', 'dosa', 'samosa',
      'chinese', 'indian', 'nepali', 'thai', 'continental', 'fast food',
      'dhaba', 'hotel', 'canteen', 'mess', 'tiffin', 'sweet', 'bakery',
      'tyres' // Your specific restaurant name
    ];
    
    const lowerName = storeName.toLowerCase();
    return restaurantKeywords.some(keyword => lowerName.includes(keyword));
  };

  const checkAndRedirectShopkeeper = async (userId: number) => {
    try {
      const response = await fetch(`/api/stores/owner?userId=${userId}`);
      if (response.ok) {
        const stores = await response.json();
        if (stores.length > 0) {
          const store = stores[0];
          const isRestaurant = store.storeType === 'restaurant' || 
            isRestaurantByName(store.name);
          
          if (isRestaurant) {
            window.location.href = '/restaurant/dashboard';
          } else {
            window.location.href = '/seller/dashboard';
          }
        } else {
          window.location.href = '/seller/dashboard';
        }
      }
    } catch (error) {
      console.error('Failed to check store type:', error);
      window.location.href = '/seller/dashboard';
    }
  };

  const refreshUser = async () => {
    if (user?.id) {
      await refreshUserData(user.id);
    }
  };

  const logout = async () => {
    try {
      const { signOutGoogle } = await import('@/lib/googleAuth');
      await signOutGoogle();
    } catch (error) {
      console.error('Google sign out error:', error);
    }
    
    setUser(null);
    localStorage.removeItem("user");
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
