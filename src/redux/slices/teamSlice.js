import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, set, remove, push, child } from 'firebase/database';
import { db } from '../../services/firebase';

// 1. Admin action: Invite User
export const inviteUser = createAsyncThunk('team/inviteUser', async ({ businessId, email, password, role }, { getState, rejectWithValue }) => {
    try {
        const { business: { activeBusiness } } = getState();
        const businessName = activeBusiness?.name || 'A Business';

        const newInviteRef = push(child(ref(db), `businesses/${businessId}/invitations`));
        const inviteData = { email, password, role, status: 'pending', createdAt: Date.now() };
        await set(newInviteRef, inviteData);

        // Mirror to a lookup node for efficient authentication checks
        const sanitizedEmail = email.toLowerCase().replace(/\./g, ',');
        await set(ref(db, `invitation_lookup/${sanitizedEmail}/${newInviteRef.key}`), {
            businessId,
            role,
            password,
            businessName
        });

        return { id: newInviteRef.key, ...inviteData };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

// 2. Admin action: Fetch Team Members and Invitations
export const fetchTeamMembers = createAsyncThunk('team/fetchTeamMembers', async (businessId, { rejectWithValue }) => {
    try {
        // Fetch pending invitations
        const invitesRef = ref(db, `businesses/${businessId}/invitations`);
        const invitesSnap = await get(invitesRef);
        let invitations = [];
        if (invitesSnap.exists()) {
            const data = invitesSnap.val();
            invitations = Object.keys(data).map(key => ({ id: key, ...data[key], type: 'invitation' }));
        }

        // Fetch active users linked to this business
        const usersRef = ref(db, `businesses/${businessId}/users`);
        const usersSnap = await get(usersRef);
        let activeUsers = [];
        if (usersSnap.exists()) {
            const data = usersSnap.val();
            activeUsers = Object.keys(data).map(key => ({ userId: key, ...data[key], type: 'active' }));
        }

        return { invitations, activeUsers };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

// 3. Admin action: Remove member or revoke invitation
export const removeTeamMember = createAsyncThunk('team/removeTeamMember', async ({ businessId, id, type, userId }, { rejectWithValue }) => {
    try {
        if (type === 'invitation') {
            const inviteSnap = await get(ref(db, `businesses/${businessId}/invitations/${id}`));
            if (inviteSnap.exists()) {
                const email = inviteSnap.val().email;
                const sanitizedEmail = email.toLowerCase().replace(/\./g, ',');
                await remove(ref(db, `invitation_lookup/${sanitizedEmail}/${id}`));
            }
            await remove(ref(db, `businesses/${businessId}/invitations/${id}`));
            return { id, type };
        } else if (type === 'active') {
            await remove(ref(db, `businesses/${businessId}/users/${userId}`));
            // Remove business from user's list as well
            await remove(ref(db, `users/${userId}/businesses/${businessId}`));
            return { userId, type };
        }
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

// 4. Staff/Manager action: Fetch their own pending invitations matching their email
// We need to query across all businesses to find matching emails.
// Since we structure as businesses/{businessId}/invitations, we need to iterate globally or structure differently.
// For scalability, better to write to a global 'user_invitations' collection keyed by sanitized email.
// However, since we already have it in businesses/, we can fetch all businesses. Since DB is small, it's fine for now.
// For a production app, we would write invitations to users/{email}/invitations
// Let's do a global scan on businesses just for prototype, OR we can add a user_invites node.
// Adding a `user_invites` node is cleaner.
export const fetchUserInvitations = createAsyncThunk('team/fetchUserInvitations', async (email, { rejectWithValue }) => {
    try {
        // Find all businesses, then check invitations
        // To do this securely without fetching all businesses, we SHOULD use a secondary index.
        const businessesRef = ref(db, 'businesses');
        const snap = await get(businessesRef);
        const userInvites = [];

        if (snap.exists()) {
            const allBusinesses = snap.val();
            Object.keys(allBusinesses).forEach(bId => {
                const business = allBusinesses[bId];
                if (business.invitations) {
                    Object.keys(business.invitations).forEach(invId => {
                        const inv = business.invitations[invId];
                        if (inv.email === email && inv.status === 'pending') {
                            userInvites.push({
                                id: invId,
                                businessId: bId,
                                businessName: business.name || 'Unnamed Business',
                                ...inv
                            });
                        }
                    });
                }
            });
        }
        return userInvites;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

// 5. Staff/Manager action: Accept invitation
export const acceptInvitation = createAsyncThunk('team/acceptInvitation', async ({ invitationId, businessId, userId, email, role }, { rejectWithValue }) => {
    try {
        // 1. Add user to business's users list
        await set(ref(db, `businesses/${businessId}/users/${userId}`), { email, role, joinedAt: Date.now() });

        // 2. Add business to user's businesses list
        await set(ref(db, `users/${userId}/businesses/${businessId}`), { role, joinedAt: Date.now() });

        // 3. Mark invite as accepted or delete it
        await remove(ref(db, `businesses/${businessId}/invitations/${invitationId}`));

        return invitationId;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});


const teamSlice = createSlice({
    name: 'team',
    initialState: {
        members: [],
        invitations: [],
        userPendingInvitations: [], // Invitations for the logged-in user
        loading: false,
        error: null,
    },
    reducers: {
        clearTeamState: (state) => {
            state.members = [];
            state.invitations = [];
            state.userPendingInvitations = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Invite User
            .addCase(inviteUser.pending, (state) => { state.loading = true; })
            .addCase(inviteUser.fulfilled, (state, action) => {
                state.loading = false;
                state.invitations.push({ ...action.payload, type: 'invitation' });
            })
            .addCase(inviteUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // Fetch Team Members
            .addCase(fetchTeamMembers.pending, (state) => { state.loading = true; })
            .addCase(fetchTeamMembers.fulfilled, (state, action) => {
                state.loading = false;
                state.invitations = action.payload.invitations;
                state.members = action.payload.activeUsers;
            })
            .addCase(fetchTeamMembers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // Remove Member
            .addCase(removeTeamMember.fulfilled, (state, action) => {
                if (action.payload.type === 'invitation') {
                    state.invitations = state.invitations.filter(i => i.id !== action.payload.id);
                } else {
                    state.members = state.members.filter(m => m.userId !== action.payload.userId);
                }
            })

            // Fetch User Invitations
            .addCase(fetchUserInvitations.pending, (state) => { state.loading = true; })
            .addCase(fetchUserInvitations.fulfilled, (state, action) => {
                state.loading = false;
                state.userPendingInvitations = action.payload;
            })
            .addCase(fetchUserInvitations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // Accept Invitation
            .addCase(acceptInvitation.fulfilled, (state, action) => {
                state.userPendingInvitations = state.userPendingInvitations.filter(i => i.id !== action.payload);
            });
    }
});

export const { clearTeamState } = teamSlice.actions;
export default teamSlice.reducer;
