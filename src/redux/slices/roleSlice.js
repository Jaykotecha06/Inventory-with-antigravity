import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, set, remove, update } from 'firebase/database';
import { db } from '../../services/firebase';

// Default permissions for standard roles
const DEFAULT_ROLES = {
    Admin: { all: true },
    Manager: {
        dashboard: true,
        products: true,
        customers: true,
        inventory: true,
        sales: true,
        quotations: true,
        purchases: true,
        reports: true,
        team: false,
        settings: true
    },
    Staff: {
        dashboard: false,
        products: true,
        customers: true,
        inventory: true,
        sales: true,
        quotations: true,
        purchases: false,
        reports: false,
        team: false,
        settings: true
    }
};

export const fetchRoles = createAsyncThunk('roles/fetchRoles', async (businessId, { rejectWithValue }) => {
    try {
        const rolesRef = ref(db, `businesses/${businessId}/roles`);
        const snapshot = await get(rolesRef);
        if (snapshot.exists()) {
            return snapshot.val();
        }
        // If no roles exist for this business yet, initialize with defaults
        await set(rolesRef, DEFAULT_ROLES);
        return DEFAULT_ROLES;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const updateRolePermissions = createAsyncThunk('roles/updateRolePermissions', async ({ businessId, roleName, permissions }, { rejectWithValue }) => {
    try {
        await set(ref(db, `businesses/${businessId}/roles/${roleName}`), permissions);
        return { roleName, permissions };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const roleSlice = createSlice({
    name: 'roles',
    initialState: {
        permissions: DEFAULT_ROLES,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoles.pending, (state) => { state.loading = true; })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.loading = false;
                state.permissions = action.payload;
            })
            .addCase(fetchRoles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateRolePermissions.fulfilled, (state, action) => {
                state.permissions[action.payload.roleName] = action.payload.permissions;
            });
    }
});

export default roleSlice.reducer;
