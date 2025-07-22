import { Public_profile } from "../../types/public_profileTypes";
import { supabaseClient } from "../../utility/supabaseClient";
import { fetchAllPublicProfiles, fetchPublicProfileById } from '../../store/slices/publicProfileSlice';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let profileCache: { [key: string]: Public_profile } = {};
let lastFetchTimestamp = 0;

// récupérer tous les profils publics
export const fetchAllPublicProfilesService = async (): Promise<{ data: Public_profile[], error: any }> => {
    const now = Date.now();
    // Vérifier si le cache existe et si le dernier fetch est dans les 5 minutes
    if(Object.keys(profileCache).length > 0 && now - lastFetchTimestamp < CACHE_DURATION) {
        console.log("Recupération dans le cache des public_profiles dans la fonction fetchAllPublicProfilesService");
        return { data: Object.values(profileCache), error: null };
    }

    try {
        let allProfiles: Public_profile[] = [];
        let page = 0;
        const pageSize = 1000;

        while (true) {
            console.log(`📄 Chargement de la page ${page + 1}...`);
            const { data, error } = await supabaseClient
                .from('public_profile')
                .select('*')
                .range(page * pageSize, (page + 1) * pageSize - 1)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Erreur lors du chargement de la page:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                break;
            }

            allProfiles = [...allProfiles, ...data];
            console.log(`✅ Page ${page + 1} chargée: ${data.length} profils`);

            if (data.length < pageSize) {
                break;
            }

            page++;
        }

        console.log(`🎉 Total des profils chargés: ${allProfiles.length}`);

        // Mise à jour du cache
        profileCache = allProfiles.reduce((acc: { [key: string]: Public_profile }, profile) => {
            acc[profile.id] = profile;
            return acc;
        }, {});
        lastFetchTimestamp = now;

        return { data: allProfiles, error: null };
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des profils:', error);
        return { data: [], error };
    }
}

export const fetchPublicProfileWithBillingDetailsService = async () => {
    const now = Date.now();
    if(Object.keys(profileCache).length > 0 && now - lastFetchTimestamp < CACHE_DURATION) {
        return { data: Object.values(profileCache), error: null };
    }
    const { data, error } = await supabaseClient
        .from('public_profile')
        .select('*, billing(*)')
        

    if (error) throw error;

    // Mettre à jour le cache
    profileCache = data.reduce((acc: { [key: string]: Public_profile }, profile) => {
        acc[profile.id] = profile;
        return acc;
    }, {});
    lastFetchTimestamp = now;

    return data;
}

export const fetchPublicProfileByIdService = async (id: string) => {
    const now = Date.now();
    if(profileCache[id] && now - lastFetchTimestamp < CACHE_DURATION) {
        return { data: profileCache[id], error: null };
    }
    
    const { data, error } = await supabaseClient
        .from('public_profile')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return { data: null, error };
    }

    if (!data) {
        return { data: null, error: new Error('Profil non trouvé') };
    }

    // Mettre à jour le cache
    profileCache[id] = data;
    lastFetchTimestamp = now;

    return { data, error: null };
}


export const fetchAllCustomersService = async (): Promise<{ data: Public_profile[], error: any }> => {
    console.log("🔍 [API] Récupération des customers (sans cache)");
    
    try {
        let allProfiles: Public_profile[] = [];
        let page = 0;
        const pageSize = 1000;

        while (true) {
            console.log(`📄 Chargement de la page ${page + 1} (customers seulement)...`);
            const { data, error } = await supabaseClient
                .from('public_profile')
                .select('*')
                .eq('is_fliiinker', false)
                .range(page * pageSize, (page + 1) * pageSize - 1)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Erreur lors du chargement de la page:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.log(`✅ Fin de pagination - Aucune donnée page ${page + 1}`);
                break;
            }

            allProfiles = [...allProfiles, ...data];
            console.log(`✅ Page ${page + 1} chargée: ${data.length} customers`);

            if (data.length < pageSize) {
                console.log(`✅ Dernière page atteinte (${data.length} < ${pageSize})`);
                break;
            }

            page++;
        }

        console.log(`🎉 Total des customers chargés: ${allProfiles.length}`);
        
        // Vérification que tous les profils sont bien des customers
        const fliiinkersFound = allProfiles.filter(profile => profile.is_fliiinker);
        if (fliiinkersFound.length > 0) {
            console.error(`❌ ERREUR: ${fliiinkersFound.length} fliiinkers trouvés dans les customers !`);
        }

        return { data: allProfiles, error: null };
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des customers:', error);
        return { data: [], error };
    }
}


