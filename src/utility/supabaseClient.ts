import { createClient } from "@refinedev/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env
  .VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
        timeout: 30000,
        heartbeat: {
          interval: 15000,
        },
        reconnect: {
          retries: 3,
          delay: 3000,
          maxDelay: 15000,
        },
      },
    },
    db: {
      schema: "public",
    },
    auth: {
      persistSession: true,
    },
  },
);

// Augmenter la limite des listeners
if (supabaseClient.realtime) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Accéder aux propriétés internes du WebSocket
  if (supabaseClient.realtime.transport?.socket) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    supabaseClient.realtime.transport.socket.setMaxListeners(50);
  }
}
