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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
          <div>
            <h3 className="text-xl font-bold text-neutral-900">
              Edit Employee
            </h3>
            <p className="text-sm text-neutral-500">{employee.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="company_admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Engineering"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Senior Developer"
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-neutral-900 mb-2 flex items-center gap-2">
              <Shield size={18} className="text-blue-600" />
              Granular Permissions
            </h4>

            {isAdmin ? (
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 border border-blue-100">
                Admins automatically have all permissions. Granular permissions
                are disabled.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {ALL_PERMISSIONS.map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center gap-2 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50"
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(perm)}
                      onChange={() => handleTogglePermission(perm)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-neutral-700">
                      {perm.replace(".", " ")}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
