import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ClaimState {
    claims: { [id: string]: any };
    loading: boolean;
    error: string | null;
}

const initialState: ClaimState = {
    claims: {},
    loading: false,
    error: null
};

const claimSlice = createSlice({
    name: 'claims',
    initialState,
    reducers: {
        updateClaimStatus: (state, action: PayloadAction<{ claimId: string, newStatus: string }>) => {
            const { claimId, newStatus } = action.payload;
            if (state.claims[claimId]) {
                state.claims[claimId].status = newStatus;
            }
        },
        setClaims: (state, action: PayloadAction<any>) => {
            if (Array.isArray(action.payload)) {
                state.claims = action.payload.reduce((acc, claim) => ({
                    ...acc,
                    [claim.claim_id]: claim
                }), {});
            } else {
                state.claims = action.payload;
            }
        }
    }
});

export const { updateClaimStatus, setClaims } = claimSlice.actions;
export default claimSlice.reducer; 