import { Order } from "../../../types/orderTypes"
import { supabaseClient } from "../../../utility/supabaseClient"
import { RealtimeChannel } from '@supabase/supabase-js';


export const fetchOrderConfirmed = async (): Promise<Order[]> => {
    // if (confirmedOrderCache && Date.now() - confirmedOrderCache.timestamp < CACHE_DURATION) {
    //     console.log('Récupération des commandes confirmées depuis le cache');
    //     return confirmedOrderCache.data;
    // }
    console.log("Récupération des commandes confirmées depuis le supabase")
    try {
        console.log('Récupération des commandes confirmées');
        const { data, error } = await supabaseClient
            .from('order')
            .select('*')
            .eq('status', 'payment_confirmed');
            
        if (error) {
            console.error("Erreur Supabase:", error);
            throw error;
        }
        
        console.log('Commandes confirmées récupérées:', data?.length || 0, 'résultats');

        return data || [];
    } catch (error) {
        console.error('Erreur détaillée:', error);
        throw error;
    }
}


// Fonction pour s'abonner aux changements en temps réel sur la table `order`
// Met à jour l'état des commandes confirmées dès qu'un changement est détecté
export const subscribeToOrderConfirmed = (
    setOrderConfirmed: React.Dispatch<React.SetStateAction<Order[]>>,
    onError?: (error: any) => void
): RealtimeChannel => {
    try {
        console.log('S\'abonner aux changements de commandes confirmées');
        
        // Fonction pour mettre à jour les données en temps réel
        const handleRealtimeChange = async (payload: any) => {
            console.log('Changement détecté:', payload.eventType, payload);
            // Rafraîchir les données après un changement
            const orders = await fetchOrderConfirmed();
            setOrderConfirmed(orders);
            console.log('Données mises à jour:', orders.length, 'commandes confirmées');
        };

        // Créer un canal Realtime pour s'abonner aux changements
        const channel = supabaseClient
            .channel('order-confirmed')
            .on('postgres_changes', {
                event: '*',  // Écoute tous les événements (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'order'
            }, handleRealtimeChange)
            .subscribe((status) => {
                console.log('Statut de la subscription:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('Subscription réussie aux changements de commandes');
                    // Charger les données initiales
                    fetchOrderConfirmed().then(setOrderConfirmed);
                }
                else if (status === 'CLOSED') {
                    console.log('Déconnecté du canal de commandes confirmées');
                }
                else if (status === 'CHANNEL_ERROR') {
                    console.error('Erreur de canal:', status);
                    if (onError) onError('Erreur de connexion au canal');
                }
            });

        return channel;
    } catch (error) {
        console.error('Erreur dans orderConfirmedApi:', error);
        if (onError) {
            onError(error);
        }
        throw error;
    }
};

export const unsubscribeFromOrderConfirmed = (channel: RealtimeChannel): void => {
    if (channel) {
        console.log('Désabonnement du canal de commandes confirmées');
        supabaseClient.removeChannel(channel);
    }
}