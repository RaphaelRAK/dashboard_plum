import { Order } from "../../../types/orderTypes";
import { supabaseClient } from "../../../utility/supabaseClient";
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Récupère les commandes annulées depuis Supabase.
 * Cette fonction est utilisée pour charger les données initiales.
 */
export const fetchOrderCancelled = async (): Promise<Order[]> => {
    console.log("Récupération des commandes annulées depuis Supabase");
    try {
        const { data, error } = await supabaseClient
            .from('order')
            .select('*')
            .eq('status', 'cancelled');

        if (error) {
            console.error("Erreur Supabase:", error);
            throw error;
        }

        console.log("Données reçues: orderCancelled", data?.length || 0, "résultats");
        return data || [];
    } catch (error) {
        console.error('Erreur détaillée:', error);
        throw error;
    }
};

/**
 * S'abonne aux changements en temps réel sur la table `order`.
 * Met à jour l'état des commandes annulées dès qu'un changement est détecté.
 */
export const subscribeToOrderCancelled = (
    setOrderCancelled: React.Dispatch<React.SetStateAction<Order[]>>,
    onError?: (error: any) => void
): RealtimeChannel => {
    try {
        console.log('Abonnement aux changements de commandes en temps réel');

        // Fonction pour mettre à jour les données en temps réel
        const handleRealtimeChange = async (payload: any) => {
            console.log('Changement détecté:', payload.eventType, payload);

            // Rafraîchir les données après un changement
            const orders = await fetchOrderCancelled();
            setOrderCancelled(orders);
            console.log('Données mises à jour:', orders.length, 'commandes annulées');
        };

        // Créer un canal Realtime pour s'abonner aux changements
        const channel = supabaseClient
            .channel('order-changes')
            .on('postgres_changes', {
                event: '*', // Écoute tous les événements (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'order',
            }, handleRealtimeChange)
            .subscribe((status) => {
                console.log('Statut de la subscription:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('Abonnement réussi aux changements de commandes');
                    // Charger les données initiales
                    fetchOrderCancelled().then(setOrderCancelled);
                }
                else if (status === 'CLOSED') {
                    console.log('Déconnecté du canal de commandes annulées');
                }
                else if (status === 'CHANNEL_ERROR') {
                    console.error('Erreur de canal:', status);
                    if (onError) onError('Erreur de connexion au canal');
                }

            });

        return channel;
    } catch (error) {
        console.error('Erreur dans subscribeToOrderCancelled:', error);
        if (onError) {
            onError(error);
        }
        throw error;
    }
};

/**
 * Désabonne un canal Realtime.
 */
export const unsubscribeFromOrderCancelled = (channel: RealtimeChannel): void => {
    if (channel) {
        console.log('Désabonnement du canal');
        supabaseClient.removeChannel(channel);
    }
};