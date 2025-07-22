export interface ArchiveSearchResult {
    id: number; 
    created_at: Date | null; 
    service_id: number | null; 
    service_duration: number | null;
    search_details: any | null; 
    customer_id: string | null; 
    linkings_number: number | null; 
    service_start: Date | null; 
    service_end: Date | null; 
    customer_latitude: number | null; 
    customer_longitude: number | null; 
    customer_city: string | null; 
    is_active: boolean | null; 
    confirmed_linking_id: number | null; 
    status: string | null; 
    customer_selected_address_id: number | null; 
    service_name: string | null; 
    customer_first_name: string | null; 
    customer_last_name: string | null; 
    customer_rating: number | null; 
    search_id: number | null; 
    updated_at: Date | null; 
    fliiinker_id: string | null; 
    events: any | null; 
    dist_meters: number | null; 
    fliiinker_name: string | null; 
    fliiinker_rating: number | null; 
    fliiinker_is_validated: boolean | null; 
    fliiinker_is_pro: boolean | null; 
    fliiinker_avatar: string | null; 
    total_price: number | null; 
    fliiinker_service_hourly_rate: number | null; 
  }
  