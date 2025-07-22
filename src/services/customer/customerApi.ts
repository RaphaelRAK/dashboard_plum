import { supabaseClient } from '../../utility/supabaseClient';
import { Public_profile } from '../../types/public_profileTypes';
import { store } from '../../store/store';
import { fetchAllPublicProfiles, fetchPublicProfileById, fetchPublicProfilesIfNeeded } from '../../store/slices/publicProfileSlice';

export const fetchCustomerProfiles = async (): Promise<Public_profile[]> => {
  try {
    const state = store.getState();
    const profiles = state.publicProfiles.profiles;

    // Vérifier si les données sont déjà en cache
    if (Object.keys(profiles).length > 0) {
      return Object.values(profiles).filter(profile => !profile.is_fliiinker);
    }

    // Si pas en cache, déclencher l'action Redux
    await store.dispatch(fetchAllPublicProfiles());
    
    // Récupérer les données mises à jour
    const updatedState = store.getState();
    return Object.values(updatedState.publicProfiles.profiles).filter(profile => !profile.is_fliiinker);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des profils Customer:', error);
    throw new Error('Erreur lors de la récupération des profils Customer.');
  }
};

export const getCustomerName = async (customerId: string): Promise<string> => {
  try {
    const resultAction = await store.dispatch(fetchPublicProfileById(customerId));
    const profile = resultAction.payload as Public_profile;
    return `${profile.first_name} ${profile.last_name}`;
  } catch (error) {
    console.error('Erreur lors de la récupération du nom du client:', error);
    throw error;
  }
};

// export const getCustomerProfile = async (customerId: string): Promise<Public_profile> => {
//   try {
//     const state = store.getState();
//     const profile = state.publicProfiles.profiles[customerId];

//     if (profile) return profile;

//     await store.dispatch(fetchPublicProfilesIfNeeded());
//     const updatedState = store.getState();
//     return updatedState.publicProfiles.profiles[customerId];
//   } catch (error) {
//     console.error('Erreur lors de la récupération du profil du client:', error);
//     throw error;
//   }
// };

export const fetchUserById = async (userId: string): Promise<Public_profile> => {
  try {
    const state = store.getState();
    const profile = state.publicProfiles.profiles[userId];

    if (profile) {
      return profile;
    }

    // Si pas en cache, utiliser l'action Redux existante
    await store.dispatch(fetchPublicProfileById(userId));
    const updatedState = store.getState();
    return updatedState.publicProfiles.profiles[userId];
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur par ID:', error);
    throw error;
  }
};


// Durée de vie du cache en millisecondes (5 minutes)
const CACHE_LIFETIME =  5 * 60 * 1000; 

// Clé pour stocker le cache
const CACHE_KEY = 'customer_total_count';


// Fonction pour récupérer les données paginées avec cache
export const fetchPaginatedCustomers = async (
  page: number,
  pageSize: number
): Promise<{ data: Public_profile[]; total: number }> => {
  try {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // Vérifier si le cache existe et n'est pas expiré
    const cachedData = localStorage.getItem(CACHE_KEY);
    const now = Date.now();

    let totalCount: number | null = null;

    if (cachedData) {
      const { timestamp, count } = JSON.parse(cachedData);
      if (now - timestamp < CACHE_LIFETIME) {
        // Utiliser le cache si il n'est pas expiré
        totalCount = count;
        console.log('✅ Utilisation du cache pour le total des fliiinkers');
      }
    }

    // Si le cache est expiré ou inexistant, récupérer le total depuis Supabase
    if (totalCount === null) {
      const { count } = await supabaseClient
        .from('public_profile')
        .select('*', { count: 'exact', head: true })
        .eq('is_fliiinker', false);

      totalCount = count || 0;

      // Mettre à jour le cache avec le nouveau total et un nouveau timestamp
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: now, count: totalCount })
      );
      console.log('✅ Cache mis à jour avec le nouveau total des customers');
    }

    // Récupérer les données paginées
    const { data, error } = await supabaseClient
      .from('public_profile')
      .select(`
        *,
        fliiinker_profile(*)
        `)
      .eq('is_fliiinker', false)
      .range(start, end)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Page ${page} chargée: ${data?.length || 0} customers`);
    console.log(`✅ Total des customers: ${totalCount}`);

    return { 
      data: data || [], 
      total: totalCount 
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des profils Customer:', error);
    throw error;
  }
};
