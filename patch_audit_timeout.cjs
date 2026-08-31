const fs = require('fs');
let code = fs.readFileSync('src/services/AuditService.ts', 'utf8');

const timeoutHelper = `
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = "Operation timed out"): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}
`;

if (!code.includes('withTimeout')) {
  code = code.replace(
    "export interface AuditLogData {",
    timeoutHelper + "\nexport interface AuditLogData {"
  );
  
  code = code.replace(
    "await addDoc(collection(db, 'audit_logs'), {",
    "await withTimeout(addDoc(collection(db, 'audit_logs'), {"
  );
  
  code = code.replace(
    "      ...data\n    });",
    "      ...data\n    }), 5000, 'Audit log timed out');"
  );
}

fs.writeFileSync('src/services/AuditService.ts', code);
console.log('Patched AuditService.ts');
