import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { UserProfile } from "../types/report";

interface AuthCtx {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isGestor: boolean;
}

const AuthContext = createContext<AuthCtx>({ firebaseUser: null, userProfile: null, loading: true, isGestor: false });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setUserProfile({ uid: user.uid, ...snap.data() } as UserProfile);
        } else {
          // Primeiro acesso: cria como operador
          const profile: Omit<UserProfile, "uid"> = {
            fullName: user.displayName ?? user.email ?? "",
            rankName: "",
            papel: "operador",
            email: user.email ?? "",
          };
          await setDoc(doc(db, "users", user.uid), profile);
          setUserProfile({ uid: user.uid, ...profile });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, isGestor: ["ADMINISTRADOR", "DESENVOLVEDOR"].includes(userProfile?.role ?? "") }}>
      {children}
    </AuthContext.Provider>
  );
}