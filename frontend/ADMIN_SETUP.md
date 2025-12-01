# Admin Setup Guide

## Option 1: Manual Setup via Firebase Console (Easiest)

### Step 1: Get Your User ID (Firebase UID)
1. Log in to your application
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Type: `firebase.auth().currentUser.uid` (if using Firebase SDK directly)
   OR check the Network tab when you log in to see your user ID
   OR use the method below to find it

### Step 2: Add Admin to Firebase Realtime Database
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Realtime Database** in the left sidebar
4. Click **Create Database** (if not already created)
5. Start in **Test Mode** (we'll add security rules later)
6. In the database, create this structure:

```
admins/
  └── YOUR_USER_ID_HERE/
      ├── isAdmin: true
      ├── email: "your-email@example.com"
      ├── createdAt: "2024-01-15T10:00:00.000Z"
      └── expiresAt: null
```

**Example:**
```
admins/
  └── abc123xyz789/
      ├── isAdmin: true
      ├── email: "admin@merrysway.com"
      ├── createdAt: "2024-01-15T10:00:00.000Z"
      └── expiresAt: null
```

### Step 3: Verify
1. Log out and log back in to your application
2. You should now see the Settings (⚙️) icon in the header
3. Click it to access the Admin Dashboard

---

## Option 2: Using Browser Console (Quick Method)

1. Log in to your application
2. Open browser Developer Tools (F12)
3. Go to **Application** tab → **Local Storage** → Find your Firebase auth token
4. OR go to **Console** tab and run:

```javascript
// Get your current user ID
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('Your User ID:', auth.currentUser?.uid);
```

5. Copy your User ID
6. Go to Firebase Console → Realtime Database
7. Add the admin entry as shown in Option 1

---

## Option 3: Using the Admin Dashboard (After First Admin is Set)

Once you have at least one admin set up:

1. Log in as that admin
2. Go to Admin Dashboard (`/admin`)
3. Click **"Manage Admins"** button
4. Enter the email address of the new admin
5. When prompted, enter the Firebase UID of that user
6. Click **"Add Admin"**

**To find a user's Firebase UID:**
- Ask them to log in and check browser console
- Or check Firebase Console → Authentication → Users

---

## Firebase Security Rules (Recommended)

Add these rules to your Realtime Database for security:

```json
{
  "rules": {
    "admins": {
      "$userId": {
        ".read": "auth != null && (root.child('admins').child(auth.uid).child('isAdmin').val() == true || $userId == auth.uid)",
        ".write": "auth != null && root.child('admins').child(auth.uid).child('isAdmin').val() == true"
      }
    },
    "orders": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "products": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).child('isAdmin').val() == true"
    }
  }
}
```

---

## Troubleshooting

### Can't see Admin Dashboard?
- Make sure you added your user ID to `/admins/{userId}/` in Firebase
- Check that `isAdmin` is set to `true` (boolean, not string)
- Log out and log back in
- Clear browser cache

### "Access denied" error?
- Verify your user ID matches exactly in Firebase
- Check that the database path is `/admins/{userId}/isAdmin`
- Make sure you're logged in with the correct account

### How to find my Firebase UID?
1. **Method 1:** Check Firebase Console → Authentication → Users
2. **Method 2:** Add this to your code temporarily:
   ```javascript
   console.log('User ID:', currentUser?.uid);
   ```
3. **Method 3:** Check browser Network tab when logging in

---

## Quick Setup Script

If you want to set up the first admin programmatically, you can temporarily add this to your code:

```javascript
// Add this temporarily to AdminDashboard.tsx or create a setup page
import { addAdmin } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';

// In a component:
const { currentUser } = useAuth();

const setupFirstAdmin = async () => {
  if (currentUser) {
    await addAdmin(
      currentUser.uid,
      currentUser.email || 'admin@example.com'
    );
    console.log('Admin setup complete!');
  }
};
```

Then call `setupFirstAdmin()` once, and remove the code after.

