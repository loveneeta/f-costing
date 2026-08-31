const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

const newErrorHandler = `export function handleAuthError(
  err: any,
  action: "login" | "register" | "reset-password" | "update-password",
): Error {
  let code = err?.code || "";
  const rawMessage = err?.message || "An unexpected authentication error occurred.";
  
  if (!code && typeof rawMessage === "string") {
    const match = rawMessage.match(/\\((auth\\/[a-zA-Z0-9-]+)\\)/);
    if (match) {
      code = match[1];
    }
  }

  const isUserCredentialError = [
    "auth/invalid-credential",
    "auth/invalid-login-credentials",
    "auth/user-not-found",
    "auth/wrong-password",
    "auth/invalid-email",
    "auth/email-already-in-use",
    "auth/weak-password"
  ].includes(code);

  const logFn = isUserCredentialError ? console.warn : console.error;
  logFn(
    \`[AuthContext Diagnostic Log] Action: \${action} | Code: \${code} | Details:\`,
    { code, rawMessage, action }
  );

  let userFriendlyMessage = "An unexpected error occurred. Please try again.";

  if (code === "auth/email-already-in-use") {
    userFriendlyMessage =
      'An account with this email address already exists. Please switch to "Sign In" or click "Forgot password?" to reset your password.';
  } else if (
    code === "auth/invalid-credential" ||
    code === "auth/invalid-login-credentials" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password"
  ) {
    if (action === "reset-password") {
      userFriendlyMessage =
        "If an account exists with this email address, a password reset link has been sent. Please check your inbox.";
    } else {
      userFriendlyMessage =
        'Invalid email address or password. Please verify your credentials, click "Forgot password?", or select "Register New" to create a workspace.';
    }
  } else if (code === "auth/invalid-email") {
    userFriendlyMessage = "Please enter a valid email address.";
  } else if (code === "auth/weak-password") {
    userFriendlyMessage = "Password is too weak. Please use at least 6 characters.";
  } else if (code === "auth/too-many-requests") {
    userFriendlyMessage = "Too many failed attempts. Please wait a few moments before trying again.";
  } else if (code === "auth/user-disabled") {
    userFriendlyMessage = "This account has been disabled. Please contact your system administrator.";
  } else if (code === "auth/network-request-failed") {
    userFriendlyMessage = 'Network connection issue when contacting authentication server. Please check your network connection and click "Sign in" to try again.';
  } else if (code === "auth/operation-not-allowed") {
    userFriendlyMessage = "Email/Password sign-in is disabled in your Firebase configuration. Please enable it in Firebase Console.";
  } else if (code === "auth/unauthorized-domain") {
    userFriendlyMessage = "This domain is not authorized for authentication operations in Firebase settings.";
  } else if (rawMessage.includes("email-already-in-use")) {
    userFriendlyMessage = 'An account with this email address already exists. Please switch to "Sign In" or reset your password.';
  } else {
    // If we couldn't map it, sanitize the raw message
    let sanitized = rawMessage.replace(/Firebase: /gi, "").replace(/\\(auth\\/.*\\)\\.?/g, "").trim();
    if (sanitized.toLowerCase() === "error" || sanitized === "") {
        userFriendlyMessage = "Authentication failed due to an unknown issue. Please verify your details.";
    } else {
        userFriendlyMessage = sanitized;
    }
  }

  return new Error(userFriendlyMessage);
}`;

// We need to replace the entire handleAuthError function
const functionStart = 'export function handleAuthError(';
const functionEnd = '  return new Error(userFriendlyMessage);\n}';

const startIndex = code.indexOf(functionStart);
const endIndex = code.indexOf(functionEnd) + functionEnd.length;

if (startIndex !== -1 && code.indexOf(functionEnd) !== -1) {
  const newCode = code.slice(0, startIndex) + newErrorHandler + code.slice(endIndex);
  fs.writeFileSync('src/contexts/AuthContext.tsx', newCode);
  console.log('Successfully replaced handleAuthError');
} else {
  console.log('Could not find function boundaries');
}
