export interface Search {
    id: bigint; 
    created_at: Date; 
    service_id: bigint; 
    service_duration: number;
    search_details: any; 
    customer_id: string; 
    linkings_number?: number; 
    service_start: Date; 
    service_end: Date; 
    customer_latitude: number; 
    customer_longitude: number; 
    customer_city: string; 
    is_active: boolean; 
    confirmed_linking_id?: bigint; 
    status?: string;
    customer_selected_address_id: bigint; 
    service_name?: string; 
  }
  