#!/bin/bash
sed -i '/<select/,/<\/select>/c\
                <select \
                  value={plan}\
                  onChange={(e) => setPlan(e.target.value)}\
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"\
                >\
                  {availablePlans.length > 0 ? availablePlans.map(p => (\
                    <option key={p.id} value={p.id}>{p.name}</option>\
                  )) : (\
                    <>\
                      <option value="free">Free Tier</option>\
                      <option value="basic">Basic Plan</option>\
                      <option value="professional">Professional</option>\
                      <option value="enterprise">Enterprise</option>\
                    </>\
                  )}\
                </select>' src/views/TenantManagement.tsx
