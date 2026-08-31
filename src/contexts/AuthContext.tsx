import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { logAuditEvent } from "../services/AuditService";


function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = "Operation timed out"): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: "super_admin" | "company_admin" | "manager" | "employee";
  tenantId: string | null;
  status: "active" | "inactive" | "suspended";
  permissions: string[];
  department?: string;
  designation?: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name?: string;
  companyName?: string;
  invitationToken?: string;
  role?: "super_admin" | "company_admin" | "manager" | "employee";
  tenantId?: string | null;
}

export function handleAuthError(
  err: any,
  action: "login" | "register" | "reset-password" | "update-password",
): Error {
  let code = err?.code || "";
  const rawMessage = err?.message || "An unexpected authentication error occurred.";
  
  if (!code && typeof rawMessage === "string") {
    const match = rawMessage.match(/\((auth\/[a-zA-Z0-9-]+)\)/);
    if (match) {
      code = match[1];
    }
  }

  const isUserCredentialError = [
    "auth/invalid-credential",
    "auth/invalid-login-credentials",
    "auth/user-not-found",
    "auth/wrong-password",
    "auth/invalid-email",
    "auth/email-already-in-use",
    "auth/weak-password"
  ].includes(code);

  const logFn = isUserCredentialError ? console.warn : console.error;
  logFn(
    `[AuthContext Diagnostic Log] Action: ${action} | Code: ${code} | Details:`,
    { code, rawMessage, action }
  );

  let userFriendlyMessage = "An unexpected error occurred. Please try again.";

  if (code === "auth/email-already-in-use") {
    userFriendlyMessage =
      'An account with this email address already exists. Please switch to "Sign In" or click "Forgot password?" to reset your password.';
  } else if (
    code === "auth/invalid-credential" ||
    code === "auth/invalid-login-credentials" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password"
  ) {
    if (action === "reset-password") {
      userFriendlyMessage =
        "If an account exists with this email address, a password reset link has been sent. Please check your inbox.";
    } else {
      userFriendlyMessage =
        'Invalid email address or password. Please verify your credentials, click "Forgot password?", or select "Register New" to create a workspace.';
    }
  } else if (code === "auth/invalid-email") {
    userFriendlyMessage = "Please enter a valid email address.";
  } else if (code === "auth/weak-password") {
    userFriendlyMessage = "Password is too weak. Please use at least 6 characters.";
  } else if (code === "auth/too-many-requests") {
    userFriendlyMessage = "Too many failed attempts. Please wait a few moments before trying again.";
  } else if (code === "auth/user-disabled") {
    userFriendlyMessage = "This account has been disabled. Please contact your system administrator.";
  } else if (code === "auth/network-request-failed") {
    userFriendlyMessage = 'Network connection issue when contacting authentication server. Please check your network connection and click "Sign in" to try again.';
  } else if (code === "auth/operation-not-allowed") {
    userFriendlyMessage = "Email/Password sign-in is disabled in your Firebase configuration. Please enable it in Firebase Console.";
  } else if (code === "auth/unauthorized-domain") {
    userFriendlyMessage = "This domain is not authorized for authentication operations in Firebase settings.";
  } else if (rawMessage.includes("email-already-in-use")) {
    userFriendlyMessage = 'An account with this email address already exists. Please switch to "Sign In" or reset your password.';
  } else {
    // If we couldn't map it, sanitize the raw message
    let sanitized = rawMessage.replace(/Firebase: /gi, "").replace(/\(auth\/.*\)\.?/g, "").trim();
    if (sanitized.toLowerCase() === "error" || sanitized === "") {
        userFriendlyMessage = "Authentication failed due to an unknown issue. Please verify your details.";
    } else {
        userFriendlyMessage = sanitized;
    }
  }

  return new Error(userFriendlyMessage);
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (params: RegisterParams) => Promise<AppUser>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
  logoutAllSessions: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshAppUser: () => Promise<AppUser | null>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDoc = async (firebaseUser: User): Promise<AppUser | null> => {
    try {
      // Check if suspended before loading session
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let data: AppUser;

      if (userDoc.exists()) {
        data = { uid: firebaseUser.uid, ...userDoc.data() } as AppUser;
      } else {
        // Create initial admin user profile if not found
        const newUser: Omit<AppUser, "uid"> = {
          email: firebaseUser.email || "",
          name:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "Admin User",
          role: "super_admin",
          tenantId: null,
          status: "active",
                    permissions: [],
        };
        try {
          await setDoc(
            userDocRef,
            { ...newUser, createdAt: new Date().toISOString() },
            { merge: true },
          );
        } catch (setErr) {
          console.warn(
            "[AuthContext] Warning setting user doc in Firestore:",
            setErr,
          );
        }
        data = { uid: firebaseUser.uid, ...newUser } as AppUser;
      }

      if (data.status === "suspended" || data.status === "inactive") {
        await signOut(auth);
        throw new Error(
          "Your account has been deactivated. Please contact your administrator.",
        );
      }

      // Check tenant subscription status
      if (data.tenantId) {
        try {
          const subsQuery = query(
            collection(db, "subscriptions"),
            where("tenantId", "==", data.tenantId)
          );
          const subsSnap = await withTimeout(getDocs(subsQuery), 5000, "Subscription fetch timed out.");
          if (!subsSnap.empty) {
            const sub = subsSnap.docs[0].data();
            let isExpired = false;
            
            if (sub.status === "EXPIRED" || sub.status === "PAST_DUE") {
              isExpired = true;
            } else if (sub.renewalDate) {
              const renewalDate = new Date(sub.renewalDate);
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              if (renewalDate < now) {
                isExpired = true;
              }
            }

            if (isExpired) {
              await signOut(auth);
              throw new Error("Your organization's subscription has expired. Please contact support to renew your plan.");
            }
          }
        } catch (subErr: any) {
          if (subErr.message === "Your organization's subscription has expired. Please contact support to renew your plan.") {
            throw subErr;
          }
          console.warn("[AuthContext] Could not verify subscription:", subErr);
        }
      }

      // Check session validity
      const sessionId = localStorage.getItem("erp_session_id");
      if (sessionId) {
        try {
          const sessionDoc = await getDoc(
            doc(db, "users", firebaseUser.uid, "sessions", sessionId),
          );
          if (!sessionDoc.exists() || sessionDoc.data().status === "revoked") {
            await signOut(auth);
            localStorage.removeItem("erp_session_id");
            throw new Error("Your session has expired or was revoked.");
          } else {
            // Update last activity
            await updateDoc(
              doc(db, "users", firebaseUser.uid, "sessions", sessionId),
              {
                lastActivity: new Date().toISOString(),
              },
            ).catch((e) =>
              console.warn("Failed to update session activity", e),
            );
          }
        } catch (e) {
          console.warn("Session check failed", e);
        }
      }

      setAppUser(data);
      return data;
    } catch (error: any) {
      console.warn(
        "[AuthContext] Could not fetch user doc from Firestore:",
        error,
      );
      if (
        error.message.includes("deactivated") ||
        error.message.includes("session")
      ) {
        setAppUser(null);
        throw error;
      }
      // fallback
      const fallbackData: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        name:
          firebaseUser.displayName ||
          firebaseUser.email?.split("@")[0] ||
          "User",
        role: "super_admin",
        tenantId: null,
        status: "active",
                permissions: [],
      };
      setAppUser(fallbackData);
      return fallbackData;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await withTimeout(fetchUserDoc(firebaseUser), 10000, "Auth state fetch timed out.").catch(e => console.warn(e));
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const withAuthRetry = async <T,>(
    fn: () => Promise<T>,
    maxRetries = 2,
    delayMs = 400,
  ): Promise<T> => {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const code = err?.code || "";
        if (
          (code === "auth/network-request-failed" ||
            err?.message?.includes("network-request-failed")) &&
          attempt < maxRetries
        ) {
          console.warn(
            `[AuthContext] Network request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delayMs}ms...`,
          );
          await new Promise((res) =>
            setTimeout(res, delayMs * Math.pow(1.5, attempt)),
          );
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  };

  const login = async (email: string, pass: string): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      console.log(`[AuthContext] Executing login attempt`);
      const cred = await withAuthRetry(() =>
        withTimeout(signInWithEmailAndPassword(auth, cleanEmail, pass), 10000, "Sign-in request timed out"),
      );

      if (!cred.user.emailVerified && cred.user.email?.includes("@")) {
        // Note: can be forced for production
        // console.warn("Email not verified yet.");
      }

      const userDoc = await withTimeout(fetchUserDoc(cred.user), 8000, "User profile fetch timed out. The network might be blocking Firestore.");

      // Create session
      try {
        const sessionRef = await withTimeout(addDoc(
          collection(db, "users", cred.user.uid, "sessions"),
          {
            userAgent: navigator.userAgent,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            status: "active",
          },
        ), 5000, "Session creation timed out.");
        localStorage.setItem("erp_session_id", sessionRef.id);

        await logAuditEvent(userDoc?.tenantId || null, cred.user.uid, {
          action: "user.login",
          entityType: "user",
          entityId: cred.user.uid,
          humanReadableDescription: "User successfully logged in.",
        });
      } catch (e) {
        console.warn("Failed to create session record", e);
      }
    } catch (err: any) {
      // Record failed attempt
      try {
        await withTimeout(addDoc(collection(db, "failed_logins"), {
          email: cleanEmail,
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent,
          reason: err.code || "unknown",
        }), 2000, "Failed login log timed out");
      } catch (e) {} // Ignore unauthenticated write errors if rules block it
      throw handleAuthError(err, "login");
    }
  };

  const register = async (params: RegisterParams): Promise<AppUser> => {
    const cleanEmail = params.email.trim().toLowerCase();
    try {
      console.log(`[AuthContext] Executing registration attempt`);
      let cred;
      try {
        cred = await withAuthRetry(() =>
          createUserWithEmailAndPassword(auth, cleanEmail, params.password),
        );
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use' && params.invitationToken) {
          console.log("[AuthContext] Email in use. Trying sign in for invite.");
          cred = await withAuthRetry(() => signInWithEmailAndPassword(auth, cleanEmail, params.password));
        } else {
          throw createErr;
        }
      }

      await sendEmailVerification(cred.user);

      let tenantId = params.tenantId || null;
      let invitationId = null;

      let role: "super_admin" | "company_admin" | "manager" | "employee" = params.role || "super_admin";
      if (params.invitationToken) {
        const encoder = new TextEncoder();
        const data = encoder.encode(params.invitationToken);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const q = query(
          collection(db, "invitations"),
          where("tokenHash", "==", tokenHash),
          where("email", "==", cleanEmail),
          where("status", "==", "pending")
        );
        const invSnap = await withTimeout(getDocs(q), 8000, "Invitation check timed out");
        if (invSnap.empty) {
          throw new Error("Invitation is invalid or expired.");
        }
        const invitation = invSnap.docs[0];
        const invData = invitation.data();
        tenantId = invData.tenantId;
        role = invData.role;
                invitationId = invitation.id;
        
        console.log("Updating invitation status...");
        try {
          await withTimeout(updateDoc(invitation.ref, { status: "accepted" }), 5000, "Update invite timed out");
        } catch (updateInvErr) {
          console.error("Failed to update invitation doc:", updateInvErr);
          // throw updateInvErr; // Swallowing error so user can still login if rule fails
        }
      }

      
      // If registering a new company/tenant
      if (params.companyName) {
        tenantId = uuidv4();
        role = "company_admin";
        
        const newTenant = {
          name: params.companyName.trim(),
          email: cleanEmail,
          phone: "",
          status: "active",
          subscriptionPlan: "free",
          settings: {},
          createdAt: new Date().toISOString(),
        };
        await withTimeout(setDoc(doc(db, "tenants", tenantId), newTenant), 8000, "Tenant creation timed out");

        await logAuditEvent(tenantId, cred.user.uid, {
          action: "tenant.create",
          entityType: "tenant",
          entityId: tenantId,
          humanReadableDescription: "Tenant organization registered.",
        });
      }

      const userDocData = {
        email: cred.user.email || cleanEmail,
        name: params.name?.trim() || cleanEmail.split("@")[0],
        role,
                status: "active",
        tenantId,
        permissions:
          role === "company_admin" ? ["employees.manage", "settings.manage"] : [],
        createdAt: new Date().toISOString(),
        ...(invitationId ? { invitationId } : {})
      };

      const userDocRef = doc(db, "users", cred.user.uid);
      console.log("Creating user doc...");
      try {
        await withTimeout(setDoc(userDocRef, userDocData, { merge: true }), 8000, "User doc creation timed out");
      } catch (setUserErr) {
        console.error("Failed to set user doc:", setUserErr);
        throw setUserErr;
      }

      await logAuditEvent(tenantId, cred.user.uid, {
        action: "user.register",
        entityType: "user",
        entityId: cred.user.uid,
        humanReadableDescription: "User registered.",
      });

      // Create initial session
      try {
        const sessionRef = await addDoc(
          collection(db, "users", cred.user.uid, "sessions"),
          {
            userAgent: navigator.userAgent,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            status: "active",
          },
        );
        localStorage.setItem("erp_session_id", sessionRef.id);
      } catch (e) {
        console.warn("Failed to create session record", e);
      }

      const createdAppUser = { uid: cred.user.uid, ...userDocData } as AppUser;
      setAppUser(createdAppUser);
      return createdAppUser;
    } catch (err: any) {
      throw handleAuthError(err, "register");
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error("Please enter your email address.");
    }
    try {
      console.log(
        `[AuthContext] Sending password reset email`,
      );
      await withAuthRetry(() => sendPasswordResetEmail(auth, cleanEmail));
      console.log(
        `[AuthContext] Password reset email dispatched successfully`,
      );
    } catch (err: any) {
      throw handleAuthError(err, "reset-password");
    }
  };

  const logout = async () => {
    console.log(`[AuthContext] Logging out user`);
    if (auth.currentUser) {
      const sessionId = localStorage.getItem("erp_session_id");
      if (sessionId) {
        try {
          await withTimeout(updateDoc(
            doc(db, "users", auth.currentUser.uid, "sessions", sessionId),
            { status: "revoked" },
          ), 5000, "Logout session update timed out");
        } catch (e) {}
      }
      try {
        await logAuditEvent(appUser?.tenantId || null, auth.currentUser.uid, {
          action: "user.logout",
          entityType: "user",
          entityId: auth.currentUser.uid,
          humanReadableDescription: "User logged out.",
        });
      } catch (e) {}
    }
    localStorage.removeItem("erp_session_id");
    await signOut(auth);
    setUser(null);
    setAppUser(null);
  };

  const logoutAllSessions = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, "users", auth.currentUser.uid, "sessions"),
        where("status", "==", "active"),
      );
      const snapshot = await withTimeout(getDocs(q), 5000, "Get sessions timed out");

      const updatePromises = snapshot.docs.map((sessionDoc) =>
        updateDoc(
          doc(db, "users", auth.currentUser!.uid, "sessions", sessionDoc.id),
          { status: "revoked" },
        ),
      );

      await Promise.all(updatePromises);

      await logAuditEvent(appUser?.tenantId || null, auth.currentUser.uid, {
        action: "user.logout_all",
        entityType: "user",
        entityId: auth.currentUser.uid,
        humanReadableDescription: "User revoked all sessions.",
      });

      localStorage.removeItem("erp_session_id");
      await signOut(auth);
      setUser(null);
      setAppUser(null);
    } catch (e) {
      console.warn("Failed to logout all sessions", e);
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    try {
      const uid = auth.currentUser.uid;
      const tenantId = appUser?.tenantId || null;
      
      await withTimeout(deleteDoc(doc(db, "users", uid)), 5000, "Delete user doc timed out");
      
      try {
        await logAuditEvent(tenantId, uid, {
          action: "user.delete_account",
          entityType: "user",
          entityId: uid,
          humanReadableDescription: "User permanently deleted their account.",
        });
      } catch (e) {}
      
      await deleteUser(auth.currentUser);
      localStorage.removeItem("erp_session_id");
      setUser(null);
      setAppUser(null);
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        throw new Error("For security reasons, please log out and log back in before deleting your account.");
      }
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!auth.currentUser || !auth.currentUser.email)
      throw new Error("Not logged in");
    try {
      const cred = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPass,
      );
      await reauthenticateWithCredential(auth.currentUser, cred);
      await firebaseUpdatePassword(auth.currentUser, newPass);

      await logAuditEvent(appUser?.tenantId || null, auth.currentUser.uid, {
        action: "user.password_change",
        entityType: "user",
        entityId: auth.currentUser.uid,
        humanReadableDescription: "User changed their password.",
      });

      // Optionally call logoutAllSessions() here
    } catch (error: any) {
      throw handleAuthError(error, "update-password");
    }
  };

  const refreshAppUser = async (): Promise<AppUser | null> => {
    if (auth.currentUser) {
      return await fetchUserDoc(auth.currentUser);
    }
    return null;
  };

  const hasPermission = (permission: string) => {
    if (!appUser) return false;
    if (appUser.role === "super_admin") return true;
    if (appUser.role === "company_admin") return true;
    return appUser.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        loading,
        login,
        register,
        resetPassword,
        changePassword,
        deleteAccount,
        logout,
        logoutAllSessions,
        hasPermission,
        refreshAppUser,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
