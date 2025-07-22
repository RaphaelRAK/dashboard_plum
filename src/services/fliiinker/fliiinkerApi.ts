import { supabaseClient } from '../../utility/supabaseClient';
import { FliiinkerProfile } from '../../types/fliiinkerProfileTypes';
import { store } from '../../store/store';
import { fetchPublicProfilesIfNeeded } from '../../store/slices/publicProfileSlice';
import { Public_profile } from '../../types/public_profileTypes';

// export const getFliiinkerProfiles = async (): Promise<FliiinkerProfile[]> => {
//   try {
//     const { data, error } = await supabaseClient
//       .from('fliiinker_profile')
//       .select('*, public_profile(*)')
//       .order('created_at', { ascending: false });

//     if (error) throw error;
//     return data || [];
//   } catch (error) {
//     console.error('Erreur lors de la récupération des profils Fliiinker:', error);
//     throw new Error('Erreur lors de la récupération des profils Fliiinker.');
//   }
// };

export const fetchFliiinkerProfiles = async (): Promise<FliiinkerProfile[]> => {
  try {
    console.log('🌐 Appel API effectué à Supabase');
    let allProfiles: FliiinkerProfile[] = [];
    let page = 0;
    const pageSize = 1000; // Imposé par Supabase

    const { data, error } = await supabaseClient
      .from('fliiinker_profile')
      .select(`
        *,
        public_profile (*)   
      `)
      .eq('public_profile.is_fliiinker', true)
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ Aucun profil Fliiinker trouvé');
      return [];
    }

    console.log('✅ Profils Fliiinker récupérés:', data.length);
    console.log('page : ', page);
    
    allProfiles = [...allProfiles, ...data];
    if (data.length < pageSize) {
      console.log('✅ Tous les profils Fliiinker ont été récupérés');
      return allProfiles;
    }
    page++;

    console.log('✅ Profils Fliiinker récupérés:', data.length);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des profils Fliiinker:', error);
    throw error;
  }
};


// export const fetchAllFliiinkerProfiles = async (): Promise<FliiinkerProfile[]> => {
//   try {
//     let allProfiles: FliiinkerProfile[] = [];

//     while (true) {
//       const { data, error } = await supabaseClient
//         .from('public_profile')
//         .select('*')
//         .eq('is_fliiinker', true)
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       if (!data || data.length === 0) {
//         console.log('Aucun profil Fliiinker trouvé.');
//         break;
//       }
//       allProfiles = [...allProfiles, ...data];
//     }
//     return allProfiles;
//   } catch (error) {
//     console.error('Erreur lors de la récupération des profils Fliiinker:', error);
//     throw new Error('Erreur lors de la récupération des profils Fliiinker.');
//   }
// };

export const fetchFliiinkerProfileById = async (id: string): Promise<FliiinkerProfile | null> => {
  try {
    const { data, error } = await supabaseClient
      .from('fliiinker_profile')
      .select('*, public_profile(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    // console.log("*************** data", data);
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil Fliiinker par ID:', error);
    throw new Error('Erreur lors de la récupération du profil Fliiinker par ID.');
  }
};

export const fetchFliiinkerNameById = async (id: string): Promise<string | null> => {
  try {
    const state = store.getState();
    const profile = state.publicProfiles.profiles[id];
    // console.log("🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪")
    // console.log(profile)
    if (profile) {
      return `${profile.last_name} ${profile.first_name}`;
    }

    await store.dispatch(fetchPublicProfilesIfNeeded());
    const updatedState = store.getState();
    const updatedProfile = updatedState.publicProfiles.profiles[id];

    return updatedProfile ? `${updatedProfile.last_name} ${updatedProfile.first_name}` : null;
  } catch (error) {
    console.error('Erreur lors de la récupération du nom Fliiinker par ID:', error);
    throw new Error('Erreur lors de la récupération du nom Fliiinker par ID.');
  }
};


// Durée de vie du cache en millisecondes (5 minutes)
const CACHE_LIFETIME =  5 * 60 * 1000; 

// Clé pour stocker le cache
const CACHE_KEY = 'fliiinkers_total_count';

// Fonction pour récupérer les données paginées avec cache
export const fetchPaginatedFliiinkers = async (
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
        .eq('is_fliiinker', true);

      totalCount = count || 0;

      // Mettre à jour le cache avec le nouveau total et un nouveau timestamp
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: now, count: totalCount })
      );
      console.log('✅ Cache mis à jour avec le nouveau total des fliiinkers');
    }

    // Récupérer les données paginées
    const { data, error } = await supabaseClient
      .from('public_profile')
      .select(`
        *,
        fliiinker_profile (
          *
        )
      `)
      .eq('is_fliiinker', true)
      .range(start, end)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      throw error;
    }

    console.log('📊 Données brutes reçues:', data);

    console.log(`✅ Page ${page} chargée: ${data?.length || 0} fliiinkers`);
    console.log(`✅ Total des fliiinkers: ${totalCount}`);
    console.log("*************** data", data);

    return {
      data: data || [],
      total: totalCount,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des profils Fliiinker:', error);
    throw error;
  }
};

export const searchFliiinkers = async (
  searchTerm: string
): Promise<{ data: Public_profile[] }> => {
  try {
    const terms = searchTerm.toLowerCase().split(' ');

    const { data, error } = await supabaseClient
      .from('public_profile')
      .select(`
        *,
        fliiinker_profile (*)
      `)
      .eq('is_fliiinker', true)
      .or(
        terms
          .map(
            (term) =>
              `or(first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%)`
          )
          .join(',')
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Recherche "${searchTerm}": ${data?.length || 0} fliiinkers trouvés`);

    return {
      data: data || [],
    };
  } catch (error) {
    console.error('❌ Erreur lors de la recherche des Fliiinkers:', error);
    throw error;
  }
};