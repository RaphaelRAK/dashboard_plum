import { MessageChat } from "../../types/message";
import { supabaseClient } from "../../utility";
import { RealtimeChannel } from "@supabase/supabase-js";

// Fonction pour récupérer tous les messages de chat
export const fetchMessages = async (): Promise<MessageChat[]> => {
  try {
    // Sélectionne tous les messages de chat en ordre croissant par date de création
    const { data, error } = await supabaseClient
      .from("message_chat")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error(error);
    throw new Error(
      "Erreur lors de la récupération des message_chat dans claimApi.",
    );
  }
};

// Fonction pour s'abonner aux messages d'un canal spécifique
export const subscribeToMessages = (
  channelId: string,
  onMessage: (message: MessageChat) => void,
  setChatMessages: React.Dispatch<React.SetStateAction<MessageChat[]>>,
  onError?: (error: any) => void,
): RealtimeChannel => {
  try {
    // Crée un canal pour écouter les changements sur les messages du canal spécifié
    const channel = supabaseClient
      .channel(`message_chat_${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Écoute tous les types d'événements
          schema: "public",
          table: "message_chat",
          filter: `channel_id=eq.${channelId}`, // Filtrer par l'ID du canal
        },
        (payload) => {
          console.log("Changement détecté:", payload);
          switch (payload.eventType) {
            case "INSERT":
              console.log("Insertion d'un nouveau message:", payload.new);
              onMessage(payload.new as MessageChat);
              break;
            case "UPDATE":
              console.log("Mise à jour d'un message:", payload.new);
              setChatMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === payload.new.id ? { ...msg, ...payload.new } : msg,
                ),
              );
              break;
            case "DELETE":
              console.log("Suppression d'un message:", payload.old);
              setChatMessages((prevMessages) =>
                prevMessages.filter((msg) => msg.id !== payload.old.id),
              );
              break;
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(
            "Connecté au canal de messages en temps réel pour le canal",
            channelId,
          );
        }
        if (status === "CLOSED") {
          console.log(
            "Déconnecté du canal de messages en temps réel pour le canal",
            channelId,
          );
        }
        if (status === "CHANNEL_ERROR") {
          console.error("Erreur de canal:", status);
          onError?.("Erreur de connexion au canal");
        }
      });
    console.log(
      `++++++++++++++++++++++++ Channel ${channelId}: ++++++++++++++++++++++`,
      channel,
    );
    return channel;
  } catch (error) {
    console.error("Erreur lors de la configuration de la subscription:", error);
    throw error;
  }
};

// Fonction pour se désabonner d'un canal de messages
export const unsubscribeFromMessages = (channel: RealtimeChannel): void => {
  supabaseClient.removeChannel(channel);
};

// Fonction pour récupérer les messages d'un canal spécifique
export const fetchMessagesByChannel = async (
  channelId: string,
): Promise<MessageChat[]> => {
  try {
    // Sélectionne tous les messages du canal spécifié en ordre croissant par date de création
    const { data, error } = await supabaseClient
      .from("message_chat")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error(error);
    throw new Error(
      `Erreur lors de la récupération des messages pour le canal ${channelId}`,
    );
  }
};

// Interface mise à jour pour inclure le timestamp
export interface LastMessageInfo {
  message: string;
  time: string;
  timestamp: string; // Ajouter le vrai timestamp
}

export interface LastMessagesMap {
  [channelId: number]: LastMessageInfo;
}

// Fonction utilitaire pour formater la différence de temps
const formatTimeDifference = (createdAt: string): string => {
  const now = new Date();
  const messageDate = new Date(createdAt);
  const diffInMinutes = Math.floor(
    (now.getTime() - messageDate.getTime()) / (1000 * 60),
  );

  if (diffInMinutes < 1) return "À l'instant";
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
  return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
};

//  FONCTION OPTIMISÉE : Récupérer tous les derniers messages en une seule requête
export const fetchLastMessagesForChannels = async (
  channelIds: string[],
): Promise<LastMessagesMap> => {
  console.log(
    "🚀 fetchLastMessagesForChannels - Début avec",
    channelIds.length,
    "channels",
  );

  if (channelIds.length === 0) {
    console.log("Aucun channel_id fourni");
    return {};
  }

  try {
    // Requête optimisée : récupérer tous les messages pour tous les channels en une fois
    const { data: allMessages, error } = await supabaseClient
      .from("message_chat")
      .select("*")
      .in("channel_id", channelIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Erreur lors de la récupération des messages:", error);
      throw error;
    }

    console.log(
      "✅ Récupéré",
      allMessages?.length || 0,
      "messages en une seule requête",
    );

    // Grouper par channel_id et trouver le dernier message de chaque
    const lastMessagesMap: LastMessagesMap = {};

    channelIds.forEach((channelId) => {
      const channelMessages =
        allMessages?.filter((msg) => msg.channel_id.toString() === channelId) ||
        [];

      if (channelMessages.length > 0) {
        const lastMessage = channelMessages[channelMessages.length - 1]; // Dernier message (déjà trié)
        lastMessagesMap[parseInt(channelId)] = {
          message: lastMessage.message,
          time: formatTimeDifference(lastMessage.created_at),
          timestamp: lastMessage.created_at, // Vrai timestamp
        };
      } else {
        lastMessagesMap[parseInt(channelId)] = {
          message: "Aucun message",
          time: "",
          timestamp: "", // Timestamp vide si pas de message
        };
      }
    });

    console.log(
      "✅ Map créé avec",
      Object.keys(lastMessagesMap).length,
      "entrées",
    );
    return lastMessagesMap;
  } catch (error) {
    console.error("💥 Erreur dans fetchLastMessagesForChannels:", error);
    throw error;
  }
};
