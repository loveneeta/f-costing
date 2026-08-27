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
  Edit2,
  Building,
  X,
} from "lucide-react";
import { AppUser } from "../contexts/AuthContext";
import { EmployeeModal } from "../components/EmployeeModal";

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
  const [searchQuery, setSearchQuery] = useState("");

  if (appUser?.role === "super_admin") {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <Shield size={20} />
          <p className="font-medium text-sm">Super Admins cannot manage tenant employees directly.</p>
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
        email: inviteEmail.trim().toLowerCase(),
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

  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Employee Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your organization's users, roles, and permissions.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-bold shadow-sm transition-colors self-start sm:self-auto shrink-0"
          >
            <Plus size={16} /> Invite Employee
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Search & Stats Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 self-end sm:self-center">
            <Users size={15} /> {filteredEmployees.length} of {employees.length} Members
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Loading employees...
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    {canManage && (
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr
                      key={emp.uid}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {emp.name ? emp.name.charAt(0).toUpperCase() : emp.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-sm truncate">
                              {emp.name || "Unnamed"}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                          {emp.role === "company_admin" && (
                            <Shield size={13} className="text-blue-600" />
                          )}
                          {emp.role ? emp.role.replace("_", " ") : "employee"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {emp.department || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {emp.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle size={13} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                            <UserX size={13} /> Suspended
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          {emp.uid !== appUser?.uid && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingEmployee(emp)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Permissions"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(emp)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                                  emp.status === "active"
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {emp.status === "active" ? "Suspend" : "Activate"}
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td
                        colSpan={canManage ? 5 : 4}
                        className="px-6 py-12 text-center text-slate-400 text-sm"
                      >
                        No employees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <div key={emp.uid} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : emp.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {emp.name || "Unnamed"}
                        </h3>
                        <p className="text-xs text-slate-500 truncate break-all">
                          {emp.email}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {emp.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          <UserX size={12} /> Suspended
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 pt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                      {emp.role === "company_admin" && (
                        <Shield size={12} className="text-blue-600" />
                      )}
                      {emp.role ? emp.role.replace("_", " ") : "employee"}
                    </span>
                    {emp.department && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600">
                        <Building size={12} className="text-slate-400" />
                        {emp.department}
                      </span>
                    )}
                  </div>

                  {canManage && emp.uid !== appUser?.uid && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setEditingEmployee(emp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={13} /> Edit Permissions
                      </button>
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          emp.status === "active"
                            ? "text-red-700 bg-red-50 hover:bg-red-100"
                            : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        }`}
                      >
                        {emp.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {filteredEmployees.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No employees found matching the search.
                </div>
              )}
            </div>
          </>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Invite Employee
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send an invitation link to join your organization.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowInviteModal(false);
                  setGeneratedLink("");
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {generatedLink ? (
              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200">
                  <p className="font-bold text-sm mb-1 flex items-center gap-2 text-emerald-900">
                    <CheckCircle size={18} className="text-emerald-600" /> Invitation Generated!
                  </p>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Please copy the direct invitation link below and share it with the employee:
                  </p>
                </div>
                <a 
                  href={generatedLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block w-full px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 text-center transition-colors"
                >
                  Open Link in New Tab
                </a>
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-xs font-mono select-all focus:outline-none"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setGeneratedLink("");
                    setInviteEmail("");
                  }}
                  className="w-full bg-slate-100 text-slate-700 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="colleague@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="employee">Employee (Basic Access)</option>
                    <option value="manager">Manager (Manage Teams)</option>
                    <option value="company_admin">Company Admin (Full Access)</option>
                  </select>
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setGeneratedLink("");
                    }}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
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
