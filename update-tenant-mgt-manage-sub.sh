#!/bin/bash
sed -i '/<td className="px-6 py-4 text-right flex justify-end gap-3">/a\
                    <button \
                      onClick={() => { \
                        const newPlan = prompt('\''Enter Plan ID to assign to this tenant:'\'', t.subscriptionPlan);\
                        if (newPlan) {\
                          updateDoc(doc(db, '\''tenants'\'', t.id), { subscriptionPlan: newPlan }).then(() => {\
                             logAuditEvent(null, appUser!.uid, {\
                                action: '\''tenant.plan_change'\'',\
                                entityType: '\''tenant'\'',\
                                entityId: t.id,\
                                humanReadableDescription: `Super Admin changed plan to ${newPlan}`\
                             });\
                             fetchTenants();\
                          });\
                        }\
                      }}\
                      className="text-sm font-medium text-purple-600 hover:text-purple-800"\
                    >\
                      Plan\
                    </button>' src/views/TenantManagement.tsx
