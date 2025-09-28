# TODO: Remove Google Auth, Add Email/Password Auth with Firestore Users Collection

## Steps to Complete

- [x] Update firebaseConfig.ts: Rename `handleGoogleSignIn` to `handleUserSignUp` for generalized user doc creation with default 'student' role.
- [x] Update context/AuthContext.tsx: Remove GoogleSignin imports, config, and signInWithGoogle function. Add signInWithEmailAndPassword and createUserWithEmailAndPassword functions. Update AuthContextType.
- [x] Update app/login.tsx: Remove Google button and signInWithGoogle usage. Add email/password TextInput fields, Login and Sign Up buttons with handlers. Update styles for form layout.
- [ ] Test implementation: Run the app and verify email/password login/sign-up works, users are created in Firebase Auth and 'users' collection with 'student' role.
- [x] Update TODO.md: Mark completed steps as done.

## Notes
- Ensure role fetching via onAuthStateChanged works for email/password users.
- Handle errors with Alert in login.tsx.
- No new dependencies needed; Firebase already integrated.
- TypeScript errors detected (missing modules for Firebase, React, etc.; JSX not enabled; Promise issues). Run suggested commands below to resolve.
