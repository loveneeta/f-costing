import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  doc,
  getDocs,
  query,
  collection,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export const AcceptInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid invitation link. Missing token or email.");
    }
  }, [token, email]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Verify invitation exists and is valid
      const q = query(
        collection(db, "invitations"),
        where("tokenHash", "==", await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token!)).then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''))),
        where("email", "==", email),
        where("status", "==", "pending"),
      );

      const invSnap = await getDocs(q);

      if (invSnap.empty) {
        throw new Error("Invitation is invalid, expired, or already accepted.");
      }

      const invitation = invSnap.docs[0];
      const invData = invitation.data();

      if (new Date(invData.expiresAt) < new Date()) {
        await updateDoc(invitation.ref, { status: "expired" });
        throw new Error("This invitation has expired.");
      }

      // 2. Register the user
      await register({
        email: email!,
        password,
        name,
        role: invData.role,
        tenantId: invData.tenantId,
      });

      // 3. Mark invitation as accepted
      await updateDoc(invitation.ref, { status: "accepted" });

      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Account Created!
          </h2>
          <p className="text-neutral-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 text-white p-3 rounded-xl shadow-md">
            <Building size={28} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-neutral-900 tracking-tight mb-2">
          Accept Invitation
        </h1>
        <p className="text-sm text-neutral-500 text-center mb-6">
          You have been invited to join an organization. Create your account to
          continue.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-6 border border-red-200 flex items-start gap-2">
            <AlertCircle
              size={18}
              className="text-red-600 mt-0.5 flex-shrink-0"
            />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleAccept} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email || ""}
              disabled
              className="w-full px-4 py-2 border border-neutral-200 bg-neutral-50 rounded-lg text-neutral-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Create Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                size={16}
              />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="••••••••"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Must be at least 8 characters.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 text-sm shadow-sm mt-4"
          >
            {loading ? "Creating Account..." : "Accept Invitation"}
          </button>
        </form>
      </div>
    </div>
  );
};
