export interface Linking {
    id: number; // bigint généré par défaut comme identité
    created_at: Date; // timestamp with time zone
    updated_at: Date; // timestamp with time zone
    status: string; // character varying
    search_id: number; // bigint
    customer_id: string; // uuid
    fliiinker_id: string; // uuid
    events: object; // jsonb (peut être un objet ou un tableau)
    dist_meters: number; // real
    fliiinker_name: string; // text
    fliiinker_rating: number | null; // real, nullable
    fliiinker_is_validated: boolean; // boolean
    fliiinker_is_pro: boolean; // boolean
    fliiinker_avatar: string | null; // text, nullable
    total_price: number; // double precision
    service_duration: number; // real
    fliiinker_service_hourly_rate: number; // double precision
  }