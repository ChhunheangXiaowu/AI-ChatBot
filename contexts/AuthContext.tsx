import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  socialLogin: (provider: 'google' | 'github') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const user: User = {
                    uid: firebaseUser.uid,
                    username: firebaseUser.displayName || firebaseUser.email,
                };
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const socialLogin = async (providerName: 'google' | 'github'): Promise<void> => {
        const provider = providerName === 'google' 
            ? new GoogleAuthProvider() 
            : new GithubAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Authentication failed:", error);
            throw error; // Re-throw to be caught by the UI
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign out failed:", error);
        }
    };
    
    return (
        <AuthContext.Provider value={{ currentUser, socialLogin, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
