#!/bin/bash
sed -i '/const \[plan, setPlan\] = useState('\''basic'\'');/a\
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);\
\
  useEffect(() => {\
    const fetchPlans = async () => {\
      try {\
        const plansSnap = await getDocs(collection(db, '\''plans'\''));\
        setAvailablePlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() })));\
      } catch (e) {}\
    };\
    fetchPlans();\
  }, []);' src/views/TenantManagement.tsx
