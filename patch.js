const fs = require('fs');
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf-8');

content = content.replace(
  `let tenantId = params.tenantId || null;`,
  `let tenantId = params.tenantId || null;
      let invitationId = null;

      if (params.invitationToken) {
        const encoder = new TextEncoder();
        const data = encoder.encode(params.invitationToken);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const q = query(
          collection(db, "invitations"),
          where("tokenHash", "==", tokenHash),
          where("email", "==", cleanEmail),
          where("status", "==", "pending"),
        );
        const invSnap = await getDocs(q);
        if (invSnap.empty) {
          throw new Error("Invitation is invalid or expired.");
        }
        const invitation = invSnap.docs[0];
        const invData = invitation.data();
        tenantId = invData.tenantId;
        role = invData.role;
        isSuperAdmin = false;
        invitationId = invitation.id;
        
        await updateDoc(invitation.ref, { status: "accepted" });
      }`
);

// We need to add invitationToken to RegisterParams
content = content.replace(
  `companyName?: string;`,
  `companyName?: string;\n  invitationToken?: string;`
);

content = content.replace(
  `createdAt: new Date().toISOString(),`,
  `createdAt: new Date().toISOString(),
        ...(invitationId ? { invitationId } : {})`
);

fs.writeFileSync('src/contexts/AuthContext.tsx', content);
