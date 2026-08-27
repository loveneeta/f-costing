const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  `      const cred = await withAuthRetry(() =>\n        createUserWithEmailAndPassword(auth, cleanEmail, params.password),\n      );`,
  `      let cred;\n      try {\n        cred = await withAuthRetry(() =>\n          createUserWithEmailAndPassword(auth, cleanEmail, params.password),\n        );\n      } catch (createErr: any) {\n        if (createErr.code === 'auth/email-already-in-use' && params.invitationToken) {\n          console.log(\"[AuthContext] Email in use. Trying sign in for invite.\");\n          cred = await withAuthRetry(() => signInWithEmailAndPassword(auth, cleanEmail, params.password));\n        } else {\n          throw createErr;\n        }\n      }`
);

code = code.replace(
  `      try {\n        await setDoc(userDocRef, userDocData);\n      } catch (setUserErr) {\n        console.error(\"Failed to set user doc:\", setUserErr);\n        throw setUserErr;\n      }`,
  `      try {\n        await setDoc(userDocRef, userDocData, { merge: true });\n      } catch (setUserErr) {\n        console.error(\"Failed to set user doc:\", setUserErr);\n        throw setUserErr;\n      }`
);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log('Success!');
