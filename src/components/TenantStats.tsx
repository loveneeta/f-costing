import React, { useEffect, useState } from 'react';
import { collection, query, where, getCountFromServer, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const TenantStats: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [stats, setStats] = useState({ admin: '...', users: 0, employees: 0 });

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const usersQ = query(collection(db, 'users'), where('tenantId', '==', tenantId));
        const empQ = query(collection(db, 'users'), where('tenantId', '==', tenantId), where('role', '==', 'employee'));
        const adminQ = query(collection(db, 'users'), where('tenantId', '==', tenantId), where('role', '==', 'company_admin'), limit(1));

        const [usersSnap, empSnap, adminSnap] = await Promise.all([
          getCountFromServer(usersQ),
          getCountFromServer(empQ),
          getDocs(adminQ)
        ]);
        
        if (isMounted) {
          setStats({
            admin: adminSnap.empty ? 'None' : (adminSnap.docs[0].data().name || adminSnap.docs[0].data().email),
            users: usersSnap.data().count,
            employees: empSnap.data().count
          });
        }
      } catch (err) {
        if (isMounted) setStats({ admin: 'Error', users: 0, employees: 0 });
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, [tenantId]);

  return (
    <div className="flex flex-col gap-1 text-sm text-neutral-500">
      <div>Admin: <span className="font-medium text-neutral-800">{stats.admin}</span></div>
      <div>Users: <span className="font-medium text-neutral-800">{stats.users}</span> | Employees: <span className="font-medium text-neutral-800">{stats.employees}</span></div>
    </div>
  );
};
