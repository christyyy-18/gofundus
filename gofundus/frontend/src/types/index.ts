export interface Institution {
  id: string;
  name: string;
  district: string;
  address: string;
  cause_description: string;
  gps_lat: number | string;
  gps_lng: number | string;
  children_count: number;
  funding_gap: string | number;
  most_lacking_need?: string;
  funding_last_updated?: string;
  last_donation_date: string | null;
  urgency_days_since_donation: number;
  contact_email: string;
  contact_phone: string;
  cluster_id?: number;
  image_url?: string;
  established_year?: number;
  created_at: string;
}

export interface MatchResult {
  rank: number;
  institution: Institution;
  similarity_score: number;
  priority_score: number;
  final_score: number;
  distance_km: number;
  match_reasons: string[];
}

export interface MatchResponse {
  query: string;
  total_matched: number;
  matches: MatchResult[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'donor' | 'institution_admin' | 'system_admin';
  phone?: string;
}
