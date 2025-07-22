export interface ServiceBody {
    order: number;
    page_name: string;
  }
  
  export interface Service {
    id: string;
    created_at: string;
    name: string;
    logo: string;
    description?: string | null;
    body?: ServiceBody[] | null;
    is_published: boolean;
    updated_at: string;
    order: number;
  }
