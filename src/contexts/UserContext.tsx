import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '@/db/user';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface SDKUser {
  fid: number | string;
  username?: string;
  displayName?: string;
  display_name?: string;
  pfpUrl?: string;
  pfp_url?: string;
  renaissanceUserId?: number | string;
}

// Helper to check if a user is valid
const isValidUser = (user: SDKUser | null | undefined): boolean => {
  if (!user) return false;
  const fid = typeof user.fid === 'string' ? parseInt(user.fid, 10) : user.fid;
  return fid !== 0 || !!user.renaissanceUserId || !!user.username;
};

// Helper to try getting user from all possible SDK sources
const tryGetSDKUser = async (): Promise<SDKUser | null> => {
  if (typeof window === 'undefined') return null;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  
  // Check early detection first (fastest)
  if (win.__FARCASTER_USER__ && isValidUser(win.__FARCASTER_USER__)) {
    return win.__FARCASTER_USER__;
  }
  
  // Try window.farcaster.context
  if (win.farcaster?.context) {
    try {
      const context = await Promise.resolve(win.farcaster.context);
      if (context?.user && isValidUser(context.user)) {
        return context.user;
      }
    } catch {
      // Ignore
    }
  }
  
  // Try __renaissanceAuthContext
  if (win.__renaissanceAuthContext?.user && isValidUser(win.__renaissanceAuthContext.user)) {
    return win.__renaissanceAuthContext.user;
  }
  
  // Try getRenaissanceAuth()
  if (typeof win.getRenaissanceAuth === 'function') {
    try {
      const context = win.getRenaissanceAuth();
      if (context?.user && isValidUser(context.user)) {
        return context.user;
      }
    } catch {
      // Ignore
    }
  }
  
  return null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'renaissance_app_user';

// Helper to get user from localStorage
const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Helper to store user in localStorage
const storeUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // Storage might be unavailable
  }
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with stored user - no loading flash if we have cached data
  const storedUser = getStoredUser();
  const [user, setUser] = useState<User | null>(storedUser);
  // Only show loading if we don't have a stored user
  const [isLoading, setIsLoading] = useState<boolean>(!storedUser);
  const [error, setError] = useState<string | null>(null);
  const hasAuthenticated = useRef(false);

  // Sync user state to localStorage whenever it changes
  useEffect(() => {
    storeUser(user);
  }, [user]);

  // Function to authenticate user from SDK context
  const authenticateFromSDK = async (sdkUser: SDKUser): Promise<boolean> => {
    if (hasAuthenticated.current) return true;
    
    try {
      const normalizedData = {
        fid: String(sdkUser.fid),
        username: sdkUser.username,
        displayName: sdkUser.displayName || sdkUser.display_name,
        pfpUrl: sdkUser.pfpUrl || sdkUser.pfp_url,
      };
      
      const authResponse = await fetch('/api/auth/miniapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedData),
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.user) {
          hasAuthenticated.current = true;
          setUser(authData.user);
          setError(null);
          setIsLoading(false);
          return true;
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout | null = null;
    
    const fetchUser = async () => {
      // If we already have a stored user, don't set loading
      // Just validate in background
      if (!storedUser) {
        setIsLoading(true);
      }
      
      try {
        // Quick SDK check first
        const quickUser = await tryGetSDKUser();
        if (quickUser && mounted) {
          await authenticateFromSDK(quickUser);
          return;
        }
        
        // Poll for SDK (but shorter timeout - 3 seconds)
        let pollAttempts = 0;
        const maxPollAttempts = 6;
        
        pollInterval = setInterval(async () => {
          if (!mounted) return;
          pollAttempts++;
          
          const polledUser = await tryGetSDKUser();
          if (polledUser) {
            if (pollInterval) clearInterval(pollInterval);
            await authenticateFromSDK(polledUser);
            return;
          }
          
          if (pollAttempts >= maxPollAttempts) {
            if (pollInterval) clearInterval(pollInterval);
            // Fall back to API check
            checkAPI();
          }
        }, 500);
        
        // Also check via Farcaster SDK module
        if (typeof window !== 'undefined') {
          try {
            const sdkModule = await import('@farcaster/miniapp-sdk');
            const sdk = sdkModule.sdk;
            
            if (sdk?.context) {
              const context = await Promise.resolve(sdk.context);
              if (context && typeof context === 'object' && 'user' in context) {
                const contextWithUser = context as { user?: SDKUser };
                if (contextWithUser.user && isValidUser(contextWithUser.user as SDKUser)) {
                  await authenticateFromSDK(contextWithUser.user as SDKUser);
                  return;
                }
              }
            }
          } catch {
            // SDK not available
          }
          
          // Listen for events
          const userEventHandler = async (event: Event) => {
            const customEvent = event as CustomEvent<SDKUser>;
            if (customEvent.detail && mounted) {
              await authenticateFromSDK(customEvent.detail);
            }
          };
          window.addEventListener('farcaster:user', userEventHandler);
          
          return () => {
            window.removeEventListener('farcaster:user', userEventHandler);
          };
        }
      } catch (err) {
        console.error('Error in user fetch:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };
    
    const checkAPI = async () => {
      if (!mounted || hasAuthenticated.current) return;
      
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user && mounted) {
            setUser(data.user);
          }
        }
      } catch {
        // API check failed, that's ok
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();
    
    // Fallback timeout - never loading for more than 3 seconds
    const timeout = setTimeout(() => {
      if (mounted && isLoading) {
        setIsLoading(false);
      }
    }, 3000);
    
    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
