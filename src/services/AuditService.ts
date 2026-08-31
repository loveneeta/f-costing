import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';


function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = "Operation timed out"): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export interface AuditLogData {
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  before?: Record<string, any>;
  after?: Record<string, any>;
  humanReadableDescription?: string;
}

export const logAuditEvent = async (
  tenantId: string | null,
  userId: string,
  data: AuditLogData
) => {
  try {
    await withTimeout(addDoc(collection(db, 'audit_logs'), {
      tenantId: tenantId || 'SYSTEM',
      userId,
      timestamp: serverTimestamp(),
      ...data
    }), 5000, 'Audit log timed out');
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Silent fail in production to avoid breaking the user flow, 
    // but in a strict system we might want to throw.
  }
};
