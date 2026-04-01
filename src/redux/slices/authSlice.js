import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, signInWithPopup } from 'firebase/auth';
import { ref, get, set, remove, push, child } from 'firebase/database';
import { auth, db, googleProvider } from '../../services/firebase';
import { getDeviceInfo } from '../../utils/uaParser';

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create Session
        const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const sessionData = {
            device: getDeviceInfo(),
            loginDate: Date.now(),
            lastActive: Date.now(),
            email: user.email
        };
        await set(ref(db, `sessions/${user.uid}/${sessionId}`), sessionData);
        localStorage.setItem('sessionId', sessionId);

        return { uid: user.uid, email: user.email, sessionId };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const signupUser = createAsyncThunk('auth/signup', async ({ email, password, name, role }, { rejectWithValue }) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userData = { email, name, role: role || 'Staff', createdAt: Date.now() };
        await set(ref(db, `users/${user.uid}`), userData);

        // Create Session
        const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const sessionData = {
            device: getDeviceInfo(),
            loginDate: Date.now(),
            lastActive: Date.now(),
            email: user.email
        };
        await set(ref(db, `sessions/${user.uid}/${sessionId}`), sessionData);
        localStorage.setItem('sessionId', sessionId);

        return { uid: user.uid, ...userData, sessionId };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const googleLogin = createAsyncThunk('auth/googleLogin', async (userDataParams, { rejectWithValue }) => {
    try {
        const { name: providedName, role: providedRole } = userDataParams || {};
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Create Session Helper
        const setupSession = async (uid, email) => {
            const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const sessionData = {
                device: getDeviceInfo(),
                loginDate: Date.now(),
                lastActive: Date.now(),
                email: email
            };
            await set(ref(db, `sessions/${uid}/${sessionId}`), sessionData);
            localStorage.setItem('sessionId', sessionId);
            return sessionId;
        };

        // Check if user already exists in RTDB
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const existingUser = snapshot.val();
            if (providedRole && existingUser.role !== providedRole) {
                await signOut(auth);
                return rejectWithValue(`This email is already assigned the role: ${existingUser.role}. Please use a different email or select the correct role.`);
            }
            const sessionId = await setupSession(user.uid, user.email);
            return { uid: user.uid, ...existingUser, sessionId };
        } else {
            const userData = {
                email: user.email,
                name: providedName || user.displayName,
                role: providedRole || 'Staff',
                createdAt: Date.now()
            };
            await set(userRef, userData);
            const sessionId = await setupSession(user.uid, user.email);
            return { uid: user.uid, ...userData, sessionId };
        }
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState, rejectWithValue }) => {
    try {
        const { auth: { user, sessionId } } = getState();
        if (user && sessionId) {
            await remove(ref(db, `sessions/${user.uid}/${sessionId}`));
        }
        localStorage.removeItem('sessionId');
        await signOut(auth);
        return null;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, { rejectWithValue }) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const initialState = {
    user: null,
    sessionId: null,
    loading: true, // initial load check
    error: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.loading = false;
        },
        setAuthLoading: (state, action) => {
            state.loading = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.sessionId = action.payload.sessionId;
                state.isAuthenticated = true;
            })
            .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(signupUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(signupUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.sessionId = action.payload.sessionId;
                state.isAuthenticated = true;
            })
            .addCase(signupUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(googleLogin.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.sessionId = action.payload.sessionId;
                state.isAuthenticated = true;
            })
            .addCase(googleLogin.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.sessionId = null;
                state.isAuthenticated = false;
            });
    },
});

export const { setUser, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
