import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  companyName: string;
  companyId: string;
  role: 'admin' | 'member';
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signup: (name: string, email: string, password: string, companyName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Always returns a usable companyId — from profile if loaded, derived from user email otherwise. */
  getCompanyId: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Derive a stable companyId from an email address
  // e.g. pm@tcs.com → "tcs", founder@startup.io → "startup"
  const deriveCompanyId = (email: string): string => {
    const domain = email.split("@")[1] || email;
    // Strip common public email suffixes; use full domain otherwise
    const publicDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "protonmail.com"];
    const isPublic = publicDomains.includes(domain.toLowerCase());
    if (isPublic) {
      // Fall back to sanitized email prefix for public domains
      return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
    }
    // Use the first segment of the domain (e.g. tcs from tcs.com)
    return domain.split(".")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
  };

  // Fetch Firestore profile whenever user changes
  useEffect(() => {
    const initPersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log("[AuthContext] Persistence set to LOCAL on startup.");
      } catch (err) {
        console.error("[AuthContext] Failed to set persistence on startup:", err);
      }
    };
    initPersistence();

    console.log("[AuthContext] Initializing auth listener...");
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[AuthContext] AUTH USER:", firebaseUser ? `${firebaseUser.email} (UID: ${firebaseUser.uid})` : "No active session");
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            // Auto-create profile for users who signed in without going through signup
            // (e.g. existing users, users added manually, or future OAuth providers)
            const email = firebaseUser.email || "";
            const companyId = deriveCompanyId(email);
            const companyName = companyId.charAt(0).toUpperCase() + companyId.slice(1);
            const autoProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || email.split("@")[0],
              email,
              companyId,
              companyName,
              role: "admin",
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, "users", firebaseUser.uid), autoProfile);
            console.log("[AuthContext] Auto-created user profile", { uid: firebaseUser.uid, companyId });
            setProfile(autoProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const signup = async (name: string, email: string, password: string, companyName: string) => {
    await setPersistence(auth, browserLocalPersistence);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    
    // Use stable derivation from email to ensure consistency with auto-profiles
    const companyId = deriveCompanyId(email);
    
    const userProfile: UserProfile = {
      uid: cred.user.uid,
      name,
      email,
      companyName,
      companyId,
      role: 'admin',
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", cred.user.uid), userProfile);
    setProfile(userProfile);
  };

  const login = async (email: string, password: string) => {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    console.log("[AuthContext] Logging out...");
    try {
      // 1. Clear local state immediately
      setUser(null);
      setProfile(null);
      // 2. Call Firebase signOut
      await signOut(auth);
      console.log("[AuthContext] Signed out from Firebase.");
    } catch (error) {
      console.error("[AuthContext] Logout error:", error);
      throw error;
    }
  };

  const getCompanyId = (): string | null => {
    // If we have a profile, its companyId is the absolute source of truth
    if (profile?.companyId) return profile.companyId;
    
    // If we have a user but are still loading the profile, do NOT derive a fallback yet
    // to avoid race conditions where the derived ID differs from the profile ID.
    if (user && loading) return null;
    
    // Fall back to deriving from the firebase user email only if profile is definitely missing
    const email = user?.email;
    if (!email) return null;
    return deriveCompanyId(email);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signup, login, logout, getCompanyId }}>
      {children}
    </AuthContext.Provider>
  );
};
