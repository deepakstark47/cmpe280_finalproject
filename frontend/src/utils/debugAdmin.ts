/**
 * Debug utility to check admin status
 * Run this in browser console: window.checkAdminStatus()
 */
import { checkAdminStatus } from '../services/adminService';
import { auth } from '../config/firebase';

export const debugAdminStatus = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('❌ No user logged in');
    return;
  }

  console.log('🔍 Checking admin status for:', user.email);
  console.log('👤 User ID:', user.uid);
  
  try {
    const isAdmin = await checkAdminStatus(user.uid);
    console.log(isAdmin ? '✅ User IS an admin' : '❌ User is NOT an admin');
    
    // Also check Firebase directly
    const { ref, get } = await import('firebase/database');
    const { database } = await import('../config/firebase');
    const adminRef = ref(database, `admins/${user.uid}`);
    const snapshot = await get(adminRef);
    
    if (snapshot.exists()) {
      console.log('📊 Admin data in Firebase:', snapshot.val());
    } else {
      console.log('⚠️ No admin entry found in Firebase at path: admins/' + user.uid);
      console.log('💡 Make sure you added the admin entry in Firebase Realtime Database');
    }
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).checkAdminStatus = debugAdminStatus;
}

