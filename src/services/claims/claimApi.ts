import { Claim } from '../../types/claim';
import { Public_profile } from '../../types/public_profileTypes';
import { supabaseClient } from '../../utility/supabaseClient';
import { store } from '../../store/store';
import { fetchPublicProfilesIfNeeded } from '../../store/slices/publicProfileSlice';
import { fetchAllPublicProfilesService } from '../public_profile/publicProfileApi';
import { MessageChat } from '../../types/message';


// Interface pour le cache
interface CacheEntry {
    data: Claim[]; 
    timestamp: number;
    startDate: string;
    endDate: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const claimCache: Record<string, CacheEntry> = {}; // Cache indexé par une clé de période

// Fonction pour générer une clé de cache basée sur la période
const getCacheKey = (startDate: string, endDate: string): string => {
    return `${startDate}_${endDate}`;
};

export const fetchAllClaimInPeriod = async (startDate: string, endDate: string): Promise<Date[]> => {
    const cacheKey = getCacheKey(startDate, endDate);
    const cachedData = claimCache[cacheKey];

    // Vérifie si les données sont dans le cache et si elles sont encore valides
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        console.log('Récupération des réclamations depuis le cache');
        // Filtrer les données du cache pour la période demandée
        const filteredData = cachedData.data.filter(claim =>
            claim.created_at >= `${startDate}T00:00:00` && claim.created_at <= `${endDate}T23:59:59`
        );
        return filteredData.map(claim => new Date(claim.created_at));
    }

    // Ajout du temps à la date de début et de fin
    const startDateWithTime = `${startDate}T00:00:00`;
    const endDateWithTime = `${endDate}T23:59:59`;

    let allData: Claim[] = [];
    let currentPage = 0;
    const pageSize = 1000; // Nombre de résultats par page (limite imposée par le supabase)

    while (true) {
        try {
            const { data, error } = await supabaseClient
                .from('claim')
                .select('*')
                .gte('created_at', startDateWithTime)
                .lte('created_at', endDateWithTime)
                .order('created_at', { ascending: false })
                .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1); // Pagination

            if (error) throw error;

            if (!data || data.length === 0) {
                break; 
            }

            allData = [...allData, ...data];
            currentPage++;

            console.log(`Page ${currentPage} récupérée : ${data.length} résultats`);
        } catch (error) {
            console.error('Erreur lors de la récupération des réclamations dans la période:', error);
            throw new Error('Erreur lors de la récupération des réclamations dans la période.');
        }
    }

    // Mettre à jour le cache avec les nouvelles données
    claimCache[cacheKey] = {
        data: allData,
        timestamp: Date.now(),
        startDate,
        endDate,
    };

    return allData.map(claim => new Date(claim.created_at)); // Retourne les réclamations complètes
};

// // Fonction pour récupérer toutes les réclamations
// export const fetchClaims = async (): Promise<Claim[]> => {
//     const cacheKey = getCacheKey('all', 'all'); // Clé spéciale pour toutes les réclamations
//     const cachedData = claimCache[cacheKey];

//     // Vérifie si les données sont dans le cache et si elles sont encore valides
//     if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
//         console.log('Récupération des réclamations depuis le cache');
//         return cachedData.data;
//     }

//     try {
//         // Sélectionne toutes les réclamations en ordre décroissant par date de création
//         const { data, error } = await supabaseClient
//             .from('claim')
//             .select('*')
//             .order('created_at', { ascending: false });

//         if (error) throw error;

//         // Mettre à jour le cache avec les nouvelles données
//         claimCache[cacheKey] = {
//             data: data || [],
//             timestamp: Date.now(),
//             startDate: 'all', // Pas de période spécifique
//             endDate: 'all',
//         };

//         return data || [];
//     } catch (error: any) {
//         console.error('Erreur lors de la récupération des réclamations:', error);
//         throw new Error('Erreur lors de la récupération des réclamations.');
//     }
// };

// // Fonction pour récupérer tous les profils publics
// export const fetchPublicProfiles = async (): Promise<Public_profile[]> => {
//     try {
//         const { data, error } = await fetchAllPublicProfilesService();
//         if (error) throw error;
//         return data;
//     } catch (error: any) {
//         console.error('Erreur lors de la récupération des public_profiles dans claimApi:', error);
//         throw new Error('Erreur lors de la récupération des public_profiles dans claimApi.');
//     }
// };

// // Fonction pour récupérer les profils associés aux réclamations
// export const getClaimProfiles = async (): Promise<Public_profile[]> => {
//     try {
//         await store.dispatch(fetchPublicProfilesIfNeeded());
//         const state = store.getState();
//         return Object.values(state.publicProfiles.profiles);
//     } catch (error) {
//         console.error('Erreur lors de la récupération des profils de réclamation:', error);
//         throw new Error('Erreur lors de la récupération des profils de réclamation.');
//     }
// };

// Fonction pour mettre à jour le statut d'une réclamation
export const updateClaimStatus = async (claim_id: bigint, newStatus: string): Promise<void> => {
    try {
        const { error } = await supabaseClient
            .from('claim')
            .update({ status: newStatus })
            .eq('claim_id', claim_id);

        if (error) {
            console.error('Erreur Supabase:', error);
            throw error;
        }
    } catch (error: any) {
        console.error(`Erreur lors de la mise à jour du statut de la réclamation ${claim_id}:`, error);
        throw error;
    }
};

export const fetchClaimsWithMessages = async () => {
    const { data: claims, error: claimsError } = await supabaseClient
        .from('claim')
        .select(`
            claim_id,
            claim_slug,
            order_id,
            user_id,
            channel_id,
            status,
            public_profile (
                first_name,
                last_name,
                avatar
            )
        `)
        .order('created_at', { ascending: false });

    if (claimsError) throw claimsError;

    // Récupérer tous les messages pour chaque channel_id
    const channelIds = claims?.map(claim => claim.channel_id).filter(Boolean) || [];
    const { data: allMessages, error: messagesError } = await supabaseClient
        .from('message_chat')
        .select('*')
        .in('channel_id', channelIds)
        .order('created_at', { ascending: true }); // Optionnel : trier par date

    if (messagesError) throw messagesError;

    // Combiner les claims avec tous leurs messages
    const claimsWithMessages = claims?.map(claim => ({
        ...claim,
        messages: allMessages?.filter(msg => msg.channel_id === claim.channel_id) || []
    }));

    return claimsWithMessages;
};

// export const fetchClaimsWithLastMessages = async () => {
//     const { data: claims, error: claimsError } = await supabaseClient
//         .from('claim')
//         .select(`
//             claim_id,
//             claim_slug,
//             order_id,
//             user_id,
//             channel_id,
//             status,
//             public_profile!inner (
//                 first_name,
//                 last_name
//             )
//         `)
//         .order('created_at', { ascending: false });

//     if (claimsError) throw claimsError;

//     // Récupérer tous les messages pour les channel_id des claims
//     const channelIds = claims?.map(claim => claim.channel_id).filter(Boolean) || [];
//     const { data: messages, error: messagesError } = await supabaseClient
//         .from('message_chat')
//         .select('*')
//         .in('channel_id', channelIds)
//         .order('created_at', { ascending: false });

//     if (messagesError) throw messagesError;

//     // Créer un map pour stocker le dernier message par channel_id
//     const lastMessageMap: { [key: number]: MessageChat } = {};
//     messages?.forEach(msg => {
//         if (!lastMessageMap[msg.channel_id]) {
//             lastMessageMap[msg.channel_id] = msg; // Stocke le dernier message
//         }
//     });

//     // Combiner les claims avec leur dernier message
//     const claimsWithLastMessage = claims?.map(claim => ({
//         ...claim,
//         lastMessage: lastMessageMap[claim.channel_id] || null
//     }));

//     return claimsWithLastMessage;
// };