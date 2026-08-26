import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
    await addDoc(collection(db, 'audit_logs'), {
      tenantId: tenantId || 'SYSTEM',
      userId,
      timestamp: serverTimestamp(),
      ...data
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Silent fail in production to avoid breaking the user flow, 
    // but in a strict system we might want to throw.
  }
};
