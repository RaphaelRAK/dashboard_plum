import { supabaseClient } from "../../utility/supabaseClient";
import { MessageChat } from "../../types/message";
import { RealtimeChannel } from "@supabase/supabase-js";

const adminId = import.meta.env.VITE_CURRENT_USER_ID;

let notificationCache: {
  data: MessageChat[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Récupérer les canaux de réclamation
export const fetchClaimChannels = async () => {
  const { data: claims, error } = await supabaseClient
    .from("claim")
    .select("channel_id")
    .not("channel_id", "is", null);

  if (error) throw error;
  return claims?.map((claim) => claim.channel_id) || [];
};

// Configurer le canal de notification
export const setupNotificationChannel = (
  channelIds: number[],
  channelName: string,
  onNewMessage: (message: MessageChat) => void,
): RealtimeChannel => {
  // Vérifier si le canal existe déjà et le supprimer
  const existingChannel = supabaseClient
    .getChannels()
    .find((ch) => ch.topic === channelName);
  if (existingChannel) {
    console.log("Suppression du canal existant:", channelName);
    supabaseClient.removeChannel(existingChannel);
  }

  return supabaseClient
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "message_chat",
        filter: `channel_id=in.(${channelIds.join(",")})`,
      },
      (payload) => {
        const newMessage = payload.new as MessageChat;
        onNewMessage(newMessage);
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("Canal de notification connecté:", channelName);
      }
      if (status === "CHANNEL_ERROR") {
        console.error(
          "Erreur de connexion au canal de notification:",
          channelName,
        );
      }
    });
};

// Récupérer l'historique des notifications
export const fetchNotificationHistory = async (limit = 50) => {
  if (
    notificationCache &&
    Date.now() - notificationCache.timestamp < CACHE_DURATION &&
    notificationCache.data.length > 0
  ) {
    console.log(
      "Récupération de l'historique des notifications depuis le cache",
    );
    return notificationCache.data;
  }

  const { data, error } = await supabaseClient
    .from("message_chat")
    .select("*")
    .neq("sender_id", adminId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  notificationCache = {
    data: data || [],
    timestamp: Date.now(),
  };

  return data || [];
};
