import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTenant } from "../contexts/TenantContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { logAuditEvent } from "../services/AuditService";
import {
  Users,
  Plus,
  Shield,
  Search,
  Mail,
  UserX,
  CheckCircle,
  Clock,
  Edit2,
} from "lucide-react";
import { AppUser } from "../contexts/AuthContext";
import { EmployeeModal } from "../components/EmployeeModal";

// Simple representation for now. A full implementation would use a robust table component and a modal.
export const EmployeeManagement: React.FC = () => {
  const { appUser, hasPermission } = useAuth();
  const { tenant, checkLimit } = useTenant();
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<AppUser | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<
    "company_admin" | "manager" | "employee"
  >("employee");
  const [generatedLink, setGeneratedLink] = useState("");

  
  if (appUser?.role === "super_admin") {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
          <Shield size={20} />
          <p className="font-medium">Super Admins cannot manage tenant employees directly.</p>
        </div>
      </div>
    );
  }

  const canManage =
    hasPermission("employees.manage") || appUser?.role === "company_admin";

  useEffect(() => {
    fetchEmployees();
  }, [appUser?.tenantId]);

  const fetchEmployees = async () => {
    if (!appUser?.tenantId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("tenantId", "==", appUser.tenantId),
      );
      const querySnapshot = await getDocs(q);
      const emps: AppUser[] = [];
      querySnapshot.forEach((doc) => {
        emps.push({ uid: doc.id, ...doc.data() } as AppUser);
      });
      setEmployees(emps);
    } catch (error) {
      console.error("Error fetching employees", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    if (!checkLimit('users', employees.length)) {
      alert('User limit reached. Your current plan does not allow adding more users. Upgrade your subscription to add more.');
      return;
    }
    e.preventDefault();
    if (!appUser?.tenantId || !canManage) return;
    if (inviteRole === "super_admin" as any) {
      alert("Cannot invite super_admin from tenant management");
      return;
    }

    try {
      const invRef = doc(collection(db, "invitations"));
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const invData = {
        tenantId: appUser.tenantId,
        email: inviteEmail,
        role: inviteRole,
        tokenHash,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      await setDoc(invRef, invData);

      await logAuditEvent(appUser.tenantId, appUser.uid, {
        action: "employee.invite",
        entityType: "invitation",
        entityId: invRef.id,
        details: { email: inviteEmail, role: inviteRole },
      });

      const origin = window.location.origin.replace("ais-dev-", "ais-pre-");
      const link = `${origin}/#/accept-invitation?token=${token}&email=${encodeURIComponent(inviteEmail)}`;
      setGeneratedLink(link);
    } catch (err) {
      console.error("Failed to send invite", err);
      alert("Failed to send invite");
    }
  };

  const handleToggleStatus = async (emp: AppUser) => {
    if (!appUser?.tenantId || !canManage || emp.uid === appUser.uid) return;

    const newStatus = emp.status === "active" ? "suspended" : "active";
    try {
      await updateDoc(doc(db, "users", emp.uid), { status: newStatus });

      await logAuditEvent(appUser.tenantId, appUser.uid, {
        action: "employee.status_change",
        entityType: "user",
        entityId: emp.uid,
        before: { status: emp.status },
        after: { status: newStatus },
      });

      fetchEmployees();
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Employee Management
          </h1>
          <p className="text-neutral-500">
            Manage your organization's users, roles, and permissions.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} /> Invite Employee
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search employees..."
              className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Users size={16} /> {employees.length} Members
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-neutral-500">
            Loading employees...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                {canManage && (
                  <th className="px-6 py-3 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.uid}
                  className="border-b border-neutral-100 hover:bg-neutral-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">
                          {emp.name}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700 capitalize">
                      {emp.role === "company_admin" && (
                        <Shield size={12} className="text-blue-500" />
                      )}
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {emp.department || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {emp.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                        <CheckCircle size={14} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500">
                        <UserX size={14} /> Suspended
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 text-right">
                      {emp.uid !== appUser?.uid && (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
                            title="Edit Permissions"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {emp.status === "active" ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-neutral-500"
                  >
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editingEmployee && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onUpdate={fetchEmployees}
        />
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
              <h3 className="text-xl font-bold text-neutral-900">
                Invite Employee
              </h3>
              <p className="text-sm text-neutral-500">
                Send an invitation link to join your organization.
              </p>
            </div>

            {generatedLink ? (
              <div className="p-6 space-y-4">
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg border border-emerald-200">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle size={18} /> Invitation Generated!
                  </p>
                  <p className="text-sm">
                    Since email sending is mocked in this demo, please copy the
                    link below and send it to the user:
                  </p>
                </div>
                <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="block w-full px-4 py-2 mb-4 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium rounded-lg hover:underline text-center">Open Link in New Tab</a>
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-sm focus:outline-none"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setGeneratedLink("");
                    setInviteEmail("");
                  }}
                  className="w-full bg-neutral-100 text-neutral-700 font-medium py-2 rounded-lg hover:bg-neutral-200"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                      size={18}
                    />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="colleague@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="employee">Employee (Basic Access)</option>
                    <option value="manager">Manager (Manage Teams)</option>
                    <option value="company_admin">Company Admin (Full Access)</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setGeneratedLink("");
                    }}
                    className="flex-1 bg-white border border-neutral-300 text-neutral-700 font-medium py-2 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700"
                  >
                    Generate Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
