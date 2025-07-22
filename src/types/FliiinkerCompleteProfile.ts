import { Meeting } from "./meeting";

export interface Address {
  id: number;
  created_at: string;
  name: string;
  street: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  user_id: string;
  city: string | null;
}

export interface FliiinkerCompleteProfile {
    id: string;
    created_at: string;
    email: string;
    email_confirmed_at?: string;
    phone?: string;
    phone_confirmed_at?: string;
    last_name?: string;
    first_name?: string;
    is_fliiinker?: boolean;
    avatar?: string;
    gender: string;
    birthday?: string;
    
    description?: string;
    degree?: string;
    tagline?: string;
    status?: string;
    is_pro?: boolean;
    is_validated?: boolean;
    spoken_languages?: any[];
    status_config?: boolean;
    supa_powa?: any[];
    fliiinker_pictures?: any;
    Pictures1?: string;
    Pictures2?: string;
    Pictures3?: string;
    
    fliiinker_profile?: {
      id?: string;
      description?: string;
      degree?: string;
      tagline?: string;
      status?: string;
      is_pro?: boolean;
      is_validated?: boolean;
      spoken_languages?: any[];
      status_config?: boolean;
      supa_powa?: any[];
      fliiinker_pictures?: any;
      Pictures1?: string;
      Pictures2?: string;
      Pictures3?: string;
      
      administrative_data?: {
        id?: number;
        created_at?: string;
        country?: string;
        social_security_number?: string;
        ssn_is_valid?: boolean;
        has_driver_liscence?: boolean;
        has_car?: boolean;
        iban?: string;
        siret?: string;
        id_card_verification_status?: string;
        is_entrepreneur?: boolean;
        fliiinker_profile_id?: string;
        status_config?: boolean;
      };
      
      fliiinker_meeting?: Meeting;
    };
    
    administrative_data?: {
      id?: number;
      created_at?: string;
      country?: string;
      social_security_number?: string;
      ssn_is_valid?: boolean;
      has_driver_liscence?: boolean;
      has_car?: boolean;
      iban?: string;
      siret?: string;
      id_card_verification_status?: string;
      is_entrepreneur?: boolean;
      fliiinker_profile_id?: string;
      status_config?: boolean;
    };
    
    services?: Array<{
      id?: number;
      service_id: number;
      hourly_rate?: number;
      description?: string;
      is_active: boolean;
      created_at?: string;
      options?: any;
      tags?: string[];
      service_type?: string;
      fliiinker_id?: string;
    }>;
    

    administrative_images?: {
      fliiinker_id?: string;
      created_at?: string;
      front_image?: string;
      back_image?: string;
    }[];

    addresses?: Address[];
    
    meeting?: Meeting;
}