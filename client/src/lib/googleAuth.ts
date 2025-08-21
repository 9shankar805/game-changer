import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirebaseConfig } from '@/config/firebase';

// Initialize Firebase
const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);

// Configure Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw new Error(error.message || 'Google sign-in failed');
  }
};

export const signOutGoogle = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

export { auth };