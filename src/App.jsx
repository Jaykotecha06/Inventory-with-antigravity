import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, onValue } from 'firebase/database';
import { auth, db } from './services/firebase';
import { setUser, setAuthLoading } from './redux/slices/authSlice';

import AuthRoute from './components/AuthRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import Businesses from './pages/Businesses';
import Purchases from './pages/Purchases';
import Quotations from './pages/Quotations';
import Team from './pages/Team';
import Ledger from './pages/Ledger';
import Sessions from './pages/Sessions';

function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);

  useEffect(() => {
    let sessionUnsubscribe = null;

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (sessionUnsubscribe) {
        sessionUnsubscribe();
        sessionUnsubscribe = null;
      }

      if (firebaseUser) {
        try {
          const userRef = ref(db, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          const sessionId = localStorage.getItem('sessionId');

          if (snapshot.exists()) {
            const userData = snapshot.val();
            dispatch(setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userData, sessionId }));
          } else {
            dispatch(setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'Staff', sessionId }));
          }

          // Session Guard: Listen for remote logout
          if (sessionId) {
            const sessionRef = ref(db, `sessions/${firebaseUser.uid}/${sessionId}`);
            sessionUnsubscribe = onValue(sessionRef, (snap) => {
              if (!snap.exists()) {
                // Session was revoked
                signOut(auth);
                localStorage.removeItem('sessionId');
                dispatch(setUser(null));
              }
            });
          }

        } catch (e) {
          console.error("Auth sync error:", e);
          dispatch(setUser(null));
        }
      } else {
        dispatch(setUser(null));
        localStorage.removeItem('sessionId');
      }
    });

    // CRITICAL: Safety timeout to prevent getting stuck on "Initializing..."
    const timer = setTimeout(() => {
      dispatch(setAuthLoading(false));
    }, 4000);

    return () => {
      unsubscribe();
      if (sessionUnsubscribe) sessionUnsubscribe();
      clearTimeout(timer);
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Connecting to system...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/" element={<AuthRoute allowedRoles={['Admin', 'Manager', 'Staff']}><Layout /></AuthRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="customers" element={<AuthRoute allowedRoles={['Admin', 'Manager', 'Staff']}><Customers /></AuthRoute>} />

          <Route path="inventory" element={<Inventory />} />
          <Route path="sales" element={<Sales />} />
          <Route path="businesses" element={<Businesses />} />
          <Route path="purchases" element={<AuthRoute allowedRoles={['Admin', 'Manager']}><Purchases /></AuthRoute>} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="team" element={<AuthRoute allowedRoles={['Admin']}><Team /></AuthRoute>} />

          <Route path="reports" element={<AuthRoute allowedRoles={['Admin', 'Manager']}><Reports /></AuthRoute>} />
          <Route path="settings" element={<AuthRoute allowedRoles={['Admin', 'Manager', 'Staff']}><Settings /></AuthRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
