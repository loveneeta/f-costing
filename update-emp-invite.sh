#!/bin/bash
sed -i '/const handleSendInvite = async (e: React.FormEvent) => {/a\
    if (!checkLimit('\''users'\'', employees.length)) {\
      alert('\''User limit reached. Your current plan does not allow adding more users. Upgrade your subscription to add more.'\'');\
      return;\
    }' src/views/EmployeeManagement.tsx
