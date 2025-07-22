import { Claim } from "../../types/claim";
import { supabaseClient } from "../../utility/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

export const fetchNotResolvedClaims = async (): Promise<Claim[]> => {
    try {
        console.log("Récupération des réclamations non résolues depuis le supabase")
        const { data, error } = await supabaseClient
            .from('claim')
            .select('*')
            .neq('status', 'RESOLVED');

        if (error) {
            console.error("Erreur Supabase:", error);
            throw error;
    }

        return data || [];
    } catch (error) {
        console.error('Erreur détaillée:', error);
        throw error;
    }
}


// Fonction pour s'abonner aux changements en temps réel sur la table `claim`
// Met à jour l'état des réclamations résolues dès qu'un changement est détecté

export const subscribeToClaimNotResolved = (
    setClaimResolved: React.Dispatch<React.SetStateAction<Claim[]>>,
    onError?: (error: any) => void
): RealtimeChannel => {
    try {
        console.log("S\'abonner aux changements des reclamations resolues");

        const handleRealtimeChange = async (payload: any) => {
            console.log('Changement détecté:', payload.eventType, payload);
            const claims = await fetchNotResolvedClaims();
            setClaimResolved(claims);
            console.log('Données mises à jour:', claims.length, 'réclamations non résolues');
        };  

        // Créer un canal Realtime pour s'abonner aux changements
        const channel = supabaseClient
            .channel('claim-resolved')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'claim'
            }, handleRealtimeChange)
            .subscribe((status) => {
                console.log('Statut de la subscription:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('Subscription réussie aux changements des reclamations');
                    fetchNotResolvedClaims().then(setClaimResolved);
                }
                else if (status === 'CLOSED') {
                    console.log('Déconnecté du canal de réclamations résolues');
                }
                else if (status === 'CHANNEL_ERROR') {
                    console.error('Erreur de canal:', status);
                    if (onError) onError('Erreur de connexion au canal');
                }
            });

        return channel;
    } catch (error) {
        console.error('Erreur détaillée:', error);
        throw error;
    }
};

export const unsubscribeFromClaimNotResolved = (channel: RealtimeChannel): void => {
    if (channel) {
        console.log('Désabonnement du canal de réclamations non résolues');
        supabaseClient.removeChannel(channel);
    }
}


