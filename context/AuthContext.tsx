import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "../services/firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginAsGuest: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.removeItem('isGuest'); // Clear guest flag if real login
      } else {
         // Check if we were in guest mode
         if (localStorage.getItem('isGuest') === 'true') {
             // Create a mock user object that satisfies the FirebaseUser type requirements for our app
             const guestUser = {
                uid: 'guest-user',
                displayName: 'Guest User',
                email: 'guest@jobiq.app',
                emailVerified: true,
                isAnonymous: true,
                phoneNumber: null,
                photoURL: null,
                providerId: 'guest',
                tenantId: null,
                metadata: {},
                providerData: [],
                refreshToken: '',
                delete: async () => {},
                getIdToken: async () => '',
                getIdTokenResult: async () => ({} as any),
                reload: async () => {},
                toJSON: () => ({}),
             } as unknown as FirebaseUser;
             setUser(guestUser);
         } else {
             setUser(null);
         }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
        uid: 'guest-user',
        displayName: 'Guest User',
        email: 'guest@jobiq.app',
        emailVerified: true,
        isAnonymous: true,
        photoURL: null,
        // Mock properties to satisfy TS
        metadata: {},
        providerData: [],
     } as unknown as FirebaseUser;
     
     localStorage.setItem('isGuest', 'true');
     setUser(guestUser);
  };

  const logout = async () => {
    try {
      localStorage.removeItem('isGuest');
      if (user?.uid === 'guest-user') {
          setUser(null);
          return;
      }
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};