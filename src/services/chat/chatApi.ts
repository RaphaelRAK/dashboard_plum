import { MessageChat } from "../../types/message";
import { supabaseClient } from "../../utility";
import { RealtimeChannel } from '@supabase/supabase-js';

// Fonction pour récupérer tous les messages de chat
export const fetchMessages = async (): Promise<MessageChat[]> => {
    try {
        // Sélectionne tous les messages de chat en ordre croissant par date de création
        const { data, error } = await supabaseClient
            .from('message_chat')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error: any) {
        console.error(error);
        throw new Error('Erreur lors de la récupération des message_chat dans claimApi.');
    }
};

// Fonction pour s'abonner aux messages d'un canal spécifique
export const subscribeToMessages = (
    channelId: string,
    onMessage: (message: MessageChat) => void,
    setChatMessages: React.Dispatch<React.SetStateAction<MessageChat[]>>,
    onError?: (error: any) => void
): RealtimeChannel => {
    try {
        // Crée un canal pour écouter les changements sur les messages du canal spécifié
        const channel = supabaseClient
            .channel(`message_chat_${channelId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Écoute tous les types d'événements
                    schema: 'public',
                    table: 'message_chat',
                    filter: `channel_id=eq.${channelId}` // Filtrer par l'ID du canal
                },
                (payload) => {
                    console.log('Changement détecté:', payload);
                    switch (payload.eventType) {
                        case 'INSERT':
                            console.log('Insertion d\'un nouveau message:', payload.new);
                            onMessage(payload.new as MessageChat);
                            break;
                        case 'UPDATE':
                            console.log('Mise à jour d\'un message:', payload.new);
                            setChatMessages(prevMessages => 
                                prevMessages.map(msg => 
                                    msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                                )
                            );
                            break;
                        case 'DELETE':
                            console.log('Suppression d\'un message:', payload.old);
                            setChatMessages(prevMessages => 
                                prevMessages.filter(msg => msg.id !== payload.old.id)
                            );
                            break;
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Connecté au canal de messages en temps réel pour le canal', channelId);
                }
                if (status === 'CLOSED') {
                    console.log('Déconnecté du canal de messages en temps réel pour le canal', channelId);
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('Erreur de canal:', status);
                    onError?.('Erreur de connexion au canal');
                }
            });
        console.log(`++++++++++++++++++++++++ Channel ${channelId}: ++++++++++++++++++++++`, channel);
        return channel;
    } catch (error) {
        console.error('Erreur lors de la configuration de la subscription:', error);
        throw error;
    }
};

// Fonction pour se désabonner d'un canal de messages
export const unsubscribeFromMessages = (channel: RealtimeChannel): void => {
    supabaseClient.removeChannel(channel);
};

// Fonction pour récupérer les messages d'un canal spécifique
export const fetchMessagesByChannel = async (channelId: string): Promise<MessageChat[]> => {
    try {
        // Sélectionne tous les messages du canal spécifié en ordre croissant par date de création
        const { data, error } = await supabaseClient
            .from('message_chat')
            .select('*')
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error: any) {
        console.error(error);
        throw new Error(`Erreur lors de la récupération des messages pour le canal ${channelId}`);
    }
};