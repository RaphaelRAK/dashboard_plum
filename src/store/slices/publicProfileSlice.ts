// Importations des modules nécessaires
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseClient } from '../../utility/supabaseClient';
import { Public_profile } from '../../types/public_profileTypes';
import { RootState } from '../../store/store';
import {fetchAllPublicProfilesService,fetchPublicProfileByIdService} from '../../services/public_profile/publicProfileApi';
import { PayloadAction } from '@reduxjs/toolkit';

// Ajoutez ces constantes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Définition de l'interface pour l'état des profils publics
interface PublicProfileState {
  profiles: { [key: string]: Public_profile }; // Cache des profils par ID
  loading: boolean; // Indicateur de chargement
  error: string | null; // Stockage des erreurs
  lastFetchTimestamp: number;
  isFetching: boolean; // Ajoutez cette propriété
}

// État initial de la slice
const initialState: PublicProfileState = {
  profiles: {}, // Aucun profil chargé initialement
  loading: false, // Pas de chargement en cours
  error: null, // Aucune erreur initialement
  lastFetchTimestamp: 0,
  isFetching: false
};

// Action asynchrone pour récupérer un profil public par ID
export const fetchPublicProfile = createAsyncThunk(
  'publicProfile/fetchOne',
  async (id: string, { getState }) => {
    console.group(`🔍 [API Call] fetchPublicProfile - ID: ${id}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Appelé depuis:', new Error().stack?.split('\n')[2]);

    const state = getState() as RootState;

    // Vérifie si le profil est déjà en cache pour éviter un appel API inutile
    if (state.publicProfiles.profiles[id]) {
      console.log(`✅ Profil ID ${id} récupéré depuis le cache.`);
      console.groupEnd();
      return state.publicProfiles.profiles[id];
    }

    // Appel API pour récupérer le profil depuis Supabase
    const { data, error } = await fetchPublicProfileByIdService(id);

    // Gestion des erreurs
    if (error) {
      console.error('❌ Erreur lors de la récupération du profil :', error);
      console.groupEnd();
      throw error;
    }

    console.log('✅ Profil récupéré avec succès:', data);
    console.groupEnd();
    return data;
  }
);

// Action asynchrone pour récupérer tous les profils publics
export const fetchAllPublicProfiles = createAsyncThunk(
  'publicProfile/fetchAll',
  async (_, { getState }) => {
    console.group('🔍 [API Call] fetchAllPublicProfiles');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Appelé depuis:', new Error().stack?.split('\n')[2]);

    // récupérer l'état global
    const state = getState() as RootState;
    const now = Date.now();
    
    if (
      Object.keys(state.publicProfiles.profiles).length > 0 &&
      now - state.publicProfiles.lastFetchTimestamp < CACHE_DURATION
    ) {
      console.log('✅ Données récupérées depuis le cache');
      //groupEnd sert à fermer le groupe de console
      console.groupEnd();
      // retourner les profils
      return Object.values(state.publicProfiles.profiles);
    }

    console.log('🌐 Appel API effectué à Supabase');
    const { data, error } = await fetchAllPublicProfilesService();

    if (error) {
      console.error('❌ Erreur API fetchAllPublicProfiles :', error);
      console.groupEnd();
      throw error;
    }

    console.log('✅ Données reçues:', data?.length, 'profils');
    console.groupEnd();
    return data;
  }
);

// Action asynchrone pour récupérer un profil par ID
export const fetchPublicProfileById = createAsyncThunk(
  'publicProfile/fetchById',
  async (id: string, { getState }) => {
    console.group('🔍 [API Call] fetchPublicProfileById');
    console.log('ID:', id);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Appelé depuis:', new Error().stack?.split('\n')[2]);

    const state = getState() as RootState;
    const cachedProfile = state.publicProfiles.profiles[id];
    
    if (cachedProfile && Date.now() - state.publicProfiles.lastFetchTimestamp < CACHE_DURATION) {
      console.log('✅ Profil récupéré depuis le cache');
      console.groupEnd();
      return cachedProfile;
    }

    const { data, error } = await fetchPublicProfileByIdService(id);
    
    if (error) {
      console.error('❌ Erreur lors de la récupération du profil:', error);
      console.groupEnd();
      throw error;
    }

    if (!data) {
      console.error('❌ Aucune donnée reçue pour le profil');
      console.groupEnd();
      throw new Error('Profil non trouvé');
    }

    console.log('✅ Profil récupéré avec succès');
    console.groupEnd();
    return data;
  }
);

export const fetchPublicProfilesIfNeeded = createAsyncThunk(
  'publicProfile/fetchIfNeeded',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    if (
      Object.keys(state.publicProfiles.profiles).length > 0 &&
      Date.now() - state.publicProfiles.lastFetchTimestamp < CACHE_DURATION
    ) {
      return null;
    }
    
    const { data, error } = await supabaseClient
      .from('public_profile')
      .select('*');
      
    if (error) throw error;
    return data;
  }
);

// Création de la slice Redux
const publicProfileSlice = createSlice({
  name: 'publicProfile',
  initialState,
  reducers: {
    setCustomers: (state, action: PayloadAction<Public_profile[]>) => {
      state.loading = false;
      state.lastFetchTimestamp = Date.now();
      
      console.log("🔄 [Redux] setCustomers - Remplacement complet du store");
      console.log("🔄 [Redux] Ancien store:", Object.keys(state.profiles).length, "profils");
      console.log("🔄 [Redux] Nouveaux customers:", action.payload.length);
      
      // IMPORTANT: Remplacer complètement le store avec seulement les customers
      state.profiles = {};
      
      // Ajouter les nouveaux customers
      action.payload.forEach(customer => {
        if (customer.is_fliiinker) {
          console.error("❌ [Redux] ERREUR: Un fliiinker a été ajouté dans setCustomers!", customer);
        }
        state.profiles[customer.id] = customer;
      });
      
      console.log("✅ [Redux] Nouveau store:", Object.keys(state.profiles).length, "customers seulement");
    },
  },
  extraReducers: (builder) => {
    builder
      // Gestion de l'état pendant la récupération d'un profil
      .addCase(fetchPublicProfile.pending, (state) => {
        console.log('⏳ [Redux] Début du chargement du profil public');
        state.loading = true; // Début du chargement
      })
      .addCase(fetchPublicProfile.fulfilled, (state, action) => {
        console.log('✅ [Redux] Profil public chargé avec succès');
        state.loading = false; // Fin du chargement
        state.profiles[action.payload.id] = action.payload; // Mise en cache du profil
        console.log('✅ [Redux] [action.payload.id]', action.payload.id);
      })
      .addCase(fetchPublicProfile.rejected, (state, action) => {
        console.error('❌ [Redux] Échec du chargement du profil public:', action.error);
        state.loading = false; // Fin du chargement
        state.error = action.error.message || null; // Stockage de l'erreur
        console.error('Erreur lors de la récupération du profil :', action.error);
      })

      // Gestion de la récupération de tous les profils
      .addCase(fetchAllPublicProfiles.pending, (state) => {
        console.log('⏳ [Redux] Début du chargement de tous les profils publics');
        state.loading = true; // Début du chargement
      })
      .addCase(fetchAllPublicProfiles.fulfilled, (state, action) => {
        console.log('✅ [Redux] Tous les profils publics chargés avec succès');
        state.loading = false; // Fin du chargement
        action.payload.forEach((profile: Public_profile) => {
          state.profiles[profile.id] = profile; // Mise en cache de chaque profil
        });
      })
      .addCase(fetchAllPublicProfiles.rejected, (state, action) => {
        console.error('❌ [Redux] Échec du chargement de tous les profils publics:', action.error);
        state.loading = false; // Fin du chargement
        state.error = action.error.message || null; // Stockage de l'erreur
        console.error('Erreur lors de la récupération de tous les profils :', action.error);
      })

      // Gestion de la récupération d'un profil par ID
      .addCase(fetchPublicProfileById.pending, (state) => {
        state.loading = true; // Début du chargement
      })
      .addCase(fetchPublicProfileById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
            state.profiles[action.payload.id] = action.payload;
        } else {
            console.error('Erreur: le payload est undefined');
        }
      })
      .addCase(fetchPublicProfileById.rejected, (state, action) => {
        state.loading = false; // Fin du chargement
        state.error = action.error.message || null; // Stockage de l'erreur
        console.error('Erreur lors de la récupération du profil par ID :', action.error);
      });
  },
});

// Exportation du reducer de la slice
export default publicProfileSlice.reducer;

export const { setCustomers } = publicProfileSlice.actions;