import { Search } from "../../types/search";
import { supabaseClient } from "../../utility/supabaseClient";
import { RealtimeChannel } from '@supabase/supabase-js';

// Fonction pour récupérer toutes les recherche 
export const fetchSearchAnalytics = async (): Promise<Search[]> => {
    
    try {
        console.log("Récupération des recherches depuis le supabase")
            const {data, error} = await supabaseClient
            .from('search')
            .select('*')
        
        if(error){
            console.error("Erreur Supabase:", error);
            throw error;
        }
        // console.log("Données reçues:", data?.length || 0, "résultats");
        return data || [];
    } catch (error) {
        console.error('Erreur détaillée:', error);
        throw error;
    }
}

// Fonction pour récupérer les nombre de recherche en temps réel
export const subscribeToSearchAnalytics = (
    onSearch: (search: Search) => void,
    setSearch: React.Dispatch<React.SetStateAction<Search[]>>,
    onError?: (error: any) => void
): RealtimeChannel => {
    try {
        // Créer un canal pour écouter les changements sur les données de recherche
        const channel = supabaseClient
            .channel('search-analytics')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'search'
            }, (payload) => {
                console.log('Changement détecté:', payload);
                switch (payload.eventType) {
                    case 'INSERT':
                        console.log('Nouvelle recherche:', payload.new);
                        onSearch(payload.new as Search);
                        break;
                    case 'UPDATE':
                        console.log('Mise à jour de la recherche:', payload.new);
                        setSearch(prevSearch => 
                            prevSearch.map(sa => 
                                sa.id === payload.new.id ? { ...sa, ...payload.new } : sa
                            )
                        );
                        break;
                    case 'DELETE':
                        console.log('Suppression de la recherche:', payload.old);
                        setSearch(prevSearch => 
                            prevSearch.filter(sa => sa.id !== payload.old.id)
                        );
                        break;
                }
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                // console.log('Connecté au canal de recherche en temps réel');
            }
            if (status === 'CLOSED') {
                // console.log('Déconnecté du canal de recherche en temps réel');
            }
            if (status === 'CHANNEL_ERROR') {
                console.error('Erreur de canal:', status);
                onError?.('Erreur de connexion au canal');
            }
        });
        return channel;
    } catch (error) {
        console.error('Erreur détaillée:', error);
        throw error;
    }
}

// Fonction pour se désabonner d'un canal de recherche en temps réel
export const unsubscribeFromSearchAnalytics = (channel: RealtimeChannel): void => {
    supabaseClient.removeChannel(channel);
}
