import React, { useState } from "react";
import { X, Shield } from "lucide-react";
import { AppUser } from "../contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { logAuditEvent } from "../services/AuditService";
import { useAuth } from "../contexts/AuthContext";

interface EmployeeModalProps {
  employee: AppUser;
  onClose: () => void;
  onUpdate: () => void;
}

const ALL_PERMISSIONS = [
  "projects.view",
  "projects.create",
  "projects.edit",
  "projects.delete",
  "rates.view",
  "rates.manage",
  "templates.view",
  "templates.manage",
  "employees.view",
  "employees.manage",
  "settings.view",
  "settings.manage",
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  employee,
  onClose,
  onUpdate,
}) => {
  const { appUser } = useAuth();
  const [role, setRole] = useState(employee.role);
  const [department, setDepartment] = useState(employee.department || "");
  const [designation, setDesignation] = useState(employee.designation || "");
  const [permissions, setPermissions] = useState<string[]>(
    employee.permissions || [],
  );
  const [loading, setLoading] = useState(false);

  const isAdmin = role === "company_admin";

  const handleTogglePermission = (perm: string) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const handleSave = async () => {
    if (!appUser?.tenantId) return;
    setLoading(true);
    try {
      const updates: any = {
        role,
        department,
        designation,
        permissions: isAdmin ? [] : permissions,
      };

      await updateDoc(doc(db, "users", employee.uid), updates);

      await logAuditEvent(appUser.tenantId, appUser.uid, {
        action: "employee.update",
        entityType: "user",
        entityId: employee.uid,
        before: { role: employee.role, permissions: employee.permissions },
        after: updates,
        humanReadableDescription: `Updated employee ${employee.email} role/permissions.`,
      });

      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Edit Employee
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 truncate max-w-xs sm:max-w-md">{employee.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="company_admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. Engineering"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Designation
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. Senior Estimator"
              />
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" />
              Granular Permissions
            </h4>

            {isAdmin ? (
              <div className="bg-blue-50/80 p-4 rounded-xl text-xs sm:text-sm text-blue-800 border border-blue-100">
                Company Admins automatically have all permissions. Granular permissions are disabled.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_PERMISSIONS.map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center gap-2.5 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors min-h-[44px]"
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(perm)}
                      onChange={() => handleTogglePermission(perm)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-xs sm:text-sm font-medium text-slate-700 capitalize">
                      {perm.replace(".", " ")}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20 transition-all"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
