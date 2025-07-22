import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { FliiinkerProfile } from '../../types/fliiinkerProfileTypes';
import { RootState } from '../store';
import { fetchFliiinkerProfiles, fetchFliiinkerProfileById } from '../../services/fliiinker/fliiinkerApi';

interface FliiinkerProfileState {
  profiles: { [key: string]: FliiinkerProfile };
  loading: boolean;
  error: string | null;
  lastFetchTimestamp: number;
}

const initialState: FliiinkerProfileState = {
  profiles: {},
  loading: false,
  error: null,
  lastFetchTimestamp: 0,
};

export const fetchAllFliiinkerProfiles = createAsyncThunk(
  'fliiinkerProfile/fetchAll',
  async (_, { getState }) => {
    console.group('🔍 [API Call] fetchAllFliiinkerProfiles');
    console.log('Timestamp:', new Date().toISOString());

    const state = getState() as RootState;
    const now = Date.now();
    
    // Vérifier le cache
    if (
      Object.keys(state.fliiinkerProfiles.profiles).length > 0 &&
      now - state.fliiinkerProfiles.lastFetchTimestamp < 5 * 60 * 1000
    ) {
      console.log('✅ Données récupérées depuis le cache');
      console.groupEnd();
      return Object.values(state.fliiinkerProfiles.profiles);
    }

    try {
      const profiles = await fetchFliiinkerProfiles();
      if (!profiles || profiles.length === 0) {
        console.log('⚠️ Aucun profil Fliiinker trouvé');
        return [];
      }
      console.log('✅ Profils récupérés avec succès:', profiles.length);
      console.groupEnd();
      return profiles;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des profils:', error);
      console.groupEnd();
      throw error;
    }
  }
);

export const fetchSingleFliiinkerProfile = createAsyncThunk(
  'fliiinkerProfile/fetchOne',
  async (id: string, { getState }) => {
    console.group(`🔍 [API Call] fetchSingleFliiinkerProfile - ID: ${id}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Appelé depuis:', new Error().stack?.split('\n')[2]);

    const state = getState() as { fliiinkerProfiles: { profiles: { [key: string]: FliiinkerProfile } } };
    
    // Vérifie si le profil est déjà en cache
    if (state.fliiinkerProfiles.profiles[id]) {
      console.log(`✅ Profil avec l'ID ${id} déjà en cache`);
      console.groupEnd();
      return state.fliiinkerProfiles.profiles[id];
    }

    try {
      const profile = await fetchFliiinkerProfileById(id);
      console.log('✅ Profil récupéré avec succès:', profile);
      console.groupEnd();
      return profile;
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération du profil avec l'ID ${id}:`, error);
      console.groupEnd();
      throw error;
    }
  }
);

const fliiinkerProfileSlice = createSlice({
  name: 'fliiinkerProfile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Logs pour fetchAllFliiinkerProfiles
      .addCase(fetchAllFliiinkerProfiles.pending, (state) => {
        console.log('⏳ [Redux] Début du chargement de tous les profils Fliiinker');
        state.loading = true;
      })
      .addCase(fetchAllFliiinkerProfiles.fulfilled, (state, action) => {
        console.log('✅ [Redux] Profils Fliiinker chargés avec succès');
        state.loading = false;
        state.lastFetchTimestamp = Date.now();
        action.payload.forEach((profile: FliiinkerProfile) => {
          state.profiles[profile.id] = profile;
        });
      })
      .addCase(fetchAllFliiinkerProfiles.rejected, (state, action) => {
        console.error('❌ [Redux] Échec du chargement des profils Fliiinker:', action.error);
        state.loading = false;
        state.error = action.error.message || null;
      })
      .addCase(fetchSingleFliiinkerProfile.pending, (state) => {
        console.log('⏳ [Redux] Début du chargement du profil Fliiinker');
        state.loading = true;
      })
      .addCase(fetchSingleFliiinkerProfile.fulfilled, (state, action) => {
        console.log('✅ [Redux] Profil Fliiinker chargé avec succès');
        state.loading = false;
        if (action.payload) {
          state.profiles[action.payload.id] = action.payload;
        }
      })
      .addCase(fetchSingleFliiinkerProfile.rejected, (state, action) => {
        console.error('❌ [Redux] Échec du chargement du profil Fliiinker:', action.error);
        state.loading = false;
        state.error = action.error.message || null;
      });
  },
});

export default fliiinkerProfileSlice.reducer;