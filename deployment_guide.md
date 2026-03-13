# Vyapar Clone - Deployment Guide

This guide describes how to deploy your newly created React application to **Firebase Hosting** and configure the required **Firebase Realtime Database Rules**.

## Prerequisites
1. Node.js installed on your machine.
2. A Firebase project created (as per the config provided).

---

## 1. Firebase CLI Setup
First, install the Firebase CLI globally on your machine:

```bash
npm install -g firebase-tools
```

Login to your Google Account associated with the Firebase project:

```bash
firebase login
```

---

## 2. Initialize Firebase in the Project
In the root directory of your project (`innn`), initialize Firebase:

```bash
firebase init
```

*When prompted:*
1. **Which Firebase features do you want to set up?**
   - Select `Realtime Database`, `Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys`
2. **Project Setup:**
   - Select `Use an existing project`
   - Choose `dummy-47193`
3. **Database Setup:**
   - Press Enter to use the default configuration file for Realtime Database rules (`database.rules.json`).
4. **Hosting Setup:**
   - **What do you want to use as your public directory?** Enter `dist` (Vite's default build folder).
   - **Configure as a single-page app (rewrite all urls to /index.html)?** Yes
   - **Set up automatic builds and deploys with GitHub?** No (unless you want CI/CD).
   - **File dist/index.html already exists. Overwrite?** No

---

## 3. Database Security Rules
You need to set up rules for the Realtime Database to match the role-based system.
Replace the contents of generated `database.rules.json` with the following:

```json
{
  "rules": {
    "users": {
       "$uid": {
         ".read": "auth != null",
         ".write": "auth != null && $uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'Admin'"
       }
    },
    "products": {
      ".read": "auth != null",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'Admin' || root.child('users').child(auth.uid).child('role').val() === 'Manager')"
    },
    "inventory": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "sales": {
      ".read": "auth != null",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'Admin' || root.child('users').child(auth.uid).child('role').val() === 'Manager' || root.child('users').child(auth.uid).child('role').val() === 'Staff')"
    },
    "customers": {
      ".read": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'Admin' || root.child('users').child(auth.uid).child('role').val() === 'Manager')",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'Admin' || root.child('users').child(auth.uid).child('role').val() === 'Manager')"
    }
  }
}
```

Deploy these rules to your Firebase Database:
```bash
firebase deploy --only database
```

---

## 4. Build the React Application
Create the production build of the Vite React application:

```bash
npm run build
```
This generates optimized assets in the `dist` folder.

---

## 5. Deploy to Firebase Hosting
Deploy your web application to production:

```bash
firebase deploy --only hosting
```

Your app is now live at `https://dummy-47193.web.app`!
