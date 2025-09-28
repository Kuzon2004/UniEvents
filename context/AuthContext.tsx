import { createUserWithEmailAndPassword, signInWithEmailAndPassword as firebaseSignIn, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth, db, handleUserSignUp } from '../firebaseConfig'; // Adjust path if needed

interface AuthContextType {
  user: User | null;
  role: string | null;
  isLoading: boolean;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  createUserWithEmailAndPassword: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  signInWithEmailAndPassword: async () => {},
  createUserWithEmailAndPassword: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in with email:', email);
    try {
      await firebaseSignIn(auth, email, password);
      console.log('Sign in successful, waiting for auth state change');
      // Role will be fetched by the onAuthStateChanged listener
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const createUserWithEmailAndPasswordFunc = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userWithRole = await handleUserSignUp(userCredential);
      setRole(userWithRole.role);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    // This listener is the key. It fires when the app starts and whenever
    // the user logs in or out.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed, user:', user ? user.email : 'null');
      setUser(user);
      if (user) {
        // Fetch role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const role = userDoc.data()?.role || null;
          setRole(role);
          console.log('User role fetched:', role);
        } catch (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setIsLoading(false);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isLoading, signInWithEmailAndPassword: signIn, createUserWithEmailAndPassword: createUserWithEmailAndPasswordFunc }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access the auth state in any component
export const useAuth = () => {
  return useContext(AuthContext);
};