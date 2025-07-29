import { Claim } from "../../types/claim";
import { supabaseClient } from "../../utility/supabaseClient";

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

export const fetchAllClaimInPeriod = async (
  startDate: string,
  endDate: string,
): Promise<Date[]> => {
  const cacheKey = getCacheKey(startDate, endDate);
  const cachedData = claimCache[cacheKey];

  // Vérifie si les données sont dans le cache et si elles sont encore valides
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log("Récupération des réclamations depuis le cache");
    // Filtrer les données du cache pour la période demandée
    const filteredData = cachedData.data.filter(
      (claim) =>
        claim.created_at >= `${startDate}T00:00:00` &&
        claim.created_at <= `${endDate}T23:59:59`,
    );
    return filteredData.map((claim) => new Date(claim.created_at));
  }

  // Ajout du temps à la date de début et de fin
  const startDateWithTime = `${startDate}T00:00:00`;
  const endDateWithTime = `${endDate}T23:59:59`;

  let allData: Claim[] = [];
  let currentPage = 0;
  const pageSize = 1000; // Nombre de résultats par page (limite imposée par le supabase)
  let hasMoreData = true;

  while (hasMoreData) {
    try {
      const { data, error } = await supabaseClient
        .from("claim")
        .select("*")
        .gte("created_at", startDateWithTime)
        .lte("created_at", endDateWithTime)
        .order("created_at", { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1); // Pagination

      if (error) throw error;

      if (!data || data.length === 0) {
        hasMoreData = false;
        break;
      }

      allData = [...allData, ...data];
      currentPage++;

      console.log(`Page ${currentPage} récupérée : ${data.length} résultats`);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des réclamations dans la période:",
        error,
      );
      throw new Error(
        "Erreur lors de la récupération des réclamations dans la période.",
      );
    }
  }

  // Mettre à jour le cache avec les nouvelles données
  claimCache[cacheKey] = {
    data: allData,
    timestamp: Date.now(),
    startDate,
    endDate,
  };

  return allData.map((claim) => new Date(claim.created_at)); // Retourne les réclamations complètes
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
export const updateClaimStatus = async (
  claim_id: bigint,
  newStatus: string,
): Promise<void> => {
  try {
    const { error } = await supabaseClient
      .from("claim")
      .update({ status: newStatus })
      .eq("claim_id", claim_id);

    if (error) {
      console.error("Erreur Supabase:", error);
      throw error;
    }
  } catch (error) {
    console.error(
      `Erreur lors de la mise à jour du statut de la réclamation ${claim_id}:`,
      error,
    );
    throw error;
  }
};

export const fetchClaimsWithMessages = async () => {
  try {
    // Requête optimisée sans jointure directe (car pas de relation directe)
    const { data: claims, error } = await supabaseClient
      .from("claim")
      .select(
        `
          claim_id,
          claim_slug,
          order_id,
          user_id,
          channel_id,
          status,
          created_at,
          public_profile (
            first_name,
            last_name,
            avatar
          )
        `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des claims:", error);
      throw error;
    }

    // Récupérer tous les messages en une seule requête séparée
    const channelIds =
      claims?.map((claim) => claim.channel_id).filter(Boolean) || [];

    let allMessages: any[] = [];
    if (channelIds.length > 0) {
      const { data: messages, error: messagesError } = await supabaseClient
        .from("message_chat")
        .select("*")
        .in("channel_id", channelIds)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error(
          "Erreur lors de la récupération des messages:",
          messagesError,
        );
      } else {
        allMessages = messages || [];
      }
    }

    // Combiner les données
    const transformedClaims = claims?.map((claim: any) => {
      const messages = allMessages.filter(
        (msg) => msg.channel_id === claim.channel_id,
      );

      return {
        ...claim,
        messages: messages.sort(
          (a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
      };
    });

    console.log(
      `✅ Récupéré ${transformedClaims?.length || 0} claims avec leurs messages`,
    );
    return transformedClaims || [];
  } catch (error) {
    console.error("Erreur dans fetchClaimsWithMessages:", error);
    throw error;
  }
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

export const fetchClaimsWithMessagesPaginated = async (
  page = 1,
  pageSize = 20,
) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabaseClient
    .from("claim")
    .select(
      `
        claim_id,
        claim_slug,
        order_id,
        user_id,
        channel_id,
        status,
        created_at,
        public_profile (
          first_name,
          last_name,
          avatar
        ),
        message_chat!inner (
          id,
          channel_id,
          sender_id,
          content,
          created_at,
          updated_at
        )
      `,
      { count: "exact" },
    )
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "Erreur lors de la récupération des claims avec messages:",
      error,
    );
    throw new Error("Erreur lors de la récupération des claims avec messages.");
  }

  return {
    data,
    count,
  };
};
