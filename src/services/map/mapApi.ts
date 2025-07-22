// import { LocationData } from "../../types/location";
// import { supabaseClient } from "../../utility/supabaseClient";

// export const fetchLocationData = async (): Promise<LocationData[]> => {
//     try {
//         console.log("Début de la récupération des données dans mapApi");

//         let allData: LocationData[] = [];
//         let start = 0;
//         const limit = 1000; // Nombre d'entrées à récupérer par requête (limite imposée par supabase)
//         let hasMoreData = true;

//         while (hasMoreData) {
//             const { data, error } = await supabaseClient
//                 .from('archive_search_results')
//                 .select('id,customer_id,customer_latitude, customer_longitude, customer_city, customer_first_name, customer_last_name')
//                 .range(start, start + limit - 1); // Récupère les données par lots

//             if (error) {
//                 console.error("Erreur Supabase:", error);
//                 throw error;
//             }

//             if (data && data.length > 0) {
//                 allData = [...allData, ...data]; // Ajoute les données au tableau global
//                 start += limit; // Passe au lot suivant
//             } else {
//                 hasMoreData = false; // Arrête la boucle si aucune donnée n'est retournée
//             }
//         }

//         console.log("Données reçues:", allData.length, "résultats");
//         console.log("*********************************************");
//         console.log("donnée dans mapApi");
//         console.log("data", allData);
//         console.log("*********************************************");

//         return allData;
//     } catch (error) {
//         console.error("Erreur lors de la récupération des données:", error);
//         throw error;
//     }
// };


import { LocationData } from "../../types/location";
import { supabaseClient } from "../../utility/supabaseClient";


let customerConfirmedCache: {
    data: LocationData[];
    timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchLocationData = async (): Promise<LocationData[]> => {
    if (customerConfirmedCache && Date.now() - customerConfirmedCache.timestamp < CACHE_DURATION) {
        console.log('Récupération des données depuis le cache');
        return customerConfirmedCache.data;
    }

    let allData: LocationData[] = [];
    let start = 0;
    const limit = 1000;
    let hasMoreData = true;

    try {
        console.log("Début de la récupération des données dans mapApi");

        // Récupère toutes les données triées par customer_id et created_at
        const { data, error } = await supabaseClient
            .from('archive_search_results')
            .select('id, customer_id, customer_latitude, customer_longitude, customer_city, customer_first_name, customer_last_name, created_at')
            .order('customer_id', { ascending: true })
            .range(start, start + limit - 1);

        if (error) {
            console.error("Erreur Supabase:", error);
            throw error;
        }

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            start += limit;
        } else {
            hasMoreData = false;
        }
        

        // Filtre les données pour ne garder qu'une entrée par customer_id
        const uniqueData = removeDuplicates(allData);

        customerConfirmedCache = {
            data: uniqueData,
            timestamp: Date.now()
        };

        console.log("Données uniques:", uniqueData.length, "résultats");
        console.log("*********************************************");
        console.log("Données uniques:", uniqueData);
        console.log("*********************************************");
        console.log("Données uniques:", uniqueData.length, "résultats");
        return uniqueData;
    } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        throw error;
    }
};

const removeDuplicates = (data: LocationData[]): LocationData[] => {
    const uniqueEntries = new Map<string, LocationData>();

    for (const entry of data) {
        if (!uniqueEntries.has(entry.customer_id)) {
            uniqueEntries.set(entry.customer_id, entry);
        }
    }

    return Array.from(uniqueEntries.values());
};