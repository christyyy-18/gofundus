import { Institution, MatchResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';


export async function fetchInstitutions(district?: string, search?: string): Promise<Institution[]> {
  try {
    let url = `${API_BASE_URL}/institutions/`;
    const params = new URLSearchParams();
    if (district && district !== 'All Districts') params.append('district', district);
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch institutions');
    return await res.json();
  } catch (error) {
    console.warn('API error, using local fallback:', error);
    return FALLBACK_INSTITUTIONS;
  }
}

export async function matchDonorStatement(text: string, lat = 6.6885, lng = -1.6244): Promise<MatchResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/match/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interest_statement: text, lat, lng })
    });
    if (!res.ok) throw new Error('Matching API failed');
    return await res.json();
  } catch (error) {
    console.warn('Match API error, generating mock response:', error);
    return computeMockMatches(text, lat, lng);
  }
}

export async function fetchClusters(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/clusters/`);
    if (!res.ok) throw new Error('Clusters API failed');
    return await res.json();
  } catch (error) {
    return {
      status: "success",
      optimal_k: 2,
      silhouette_score: 0.4817,
      clusters: [
        { cluster_id: 1, centroid_lat: 6.675375, centroid_lng: -1.56995, institution_count: 7 },
        { cluster_id: 2, centroid_lat: 6.698591, centroid_lng: -1.632418, institution_count: 8 }
      ]
    };
  }
}

export async function updateInstitutionNeed(id: string, data: Partial<Institution>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/institutions/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (error) {
    console.error('Error updating institution need:', error);
    return false;
  }
}

export async function sendInstitutionUpdatePrompt(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/institutions/${id}/notify_update/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch (error) {
    console.error('Error sending update prompt:', error);
    return false;
  }
}

export const FALLBACK_INSTITUTIONS: Institution[] = [
  {
    id: "mampong-1",
    name: "Mampong Babies Home (Kumasi Outreach)",
    district: "Asokwa",
    address: "Plot 14 Block B, Asokwa Residential Area, Kumasi",
    cause_description: "Dedicated to nurturing abandoned infants, toddlers, and vulnerable orphans. We provide 24/7 specialized pediatric care, infant milk formula, medical screening, and early childhood education.",
    gps_lat: 6.6698,
    gps_lng: -1.6142,
    children_count: 48,
    funding_gap: "18500.00",
    last_donation_date: "2026-06-30",
    urgency_days_since_donation: 42,
    contact_email: "info@mampongbabies-ks.org",
    contact_phone: "+233 24 412 3456",
    cluster_id: 1,
    image_url: "/images/mampong_home.png",
    established_year: 1967,
    created_at: new Date().toISOString()
  },
  {
    id: "king-jesus-2",
    name: "King Jesus Charity Home",
    district: "Ayigya",
    address: "Near KNUST Campus Gate 3, Ayigya, Kumasi",
    cause_description: "Providing holistic shelter, primary education, and nutritional support for street children and orphans. We focus on basic schooling fees, textbook provision, IT literacy, and vocational skills.",
    gps_lat: 6.6782,
    gps_lng: -1.5714,
    children_count: 72,
    funding_gap: "32000.00",
    last_donation_date: "2026-05-18",
    urgency_days_since_donation: 85,
    contact_email: "contact@kingjesuscharity.org",
    contact_phone: "+233 20 811 9922",
    cluster_id: 1,
    image_url: "/images/king_jesus_home.png",
    established_year: 1995,
    created_at: new Date().toISOString()
  },
  {
    id: "all-nations-3",
    name: "All Nations Charity Children's Home",
    district: "Ayigya Zongo",
    address: "House No. AK-102, Ayigya Zongo, Kumasi",
    cause_description: "Focusing on rescue, emergency shelter, and educational re-integration of street orphans and displaced children. We provide clean drinking water, sanitation facilities, and daily meals.",
    gps_lat: 6.6811,
    gps_lng: -1.5644,
    children_count: 55,
    funding_gap: "21500.00",
    last_donation_date: "2026-07-28",
    urgency_days_since_donation: 14,
    contact_email: "help@allnationschildren.org",
    contact_phone: "+233 24 399 4411",
    cluster_id: 1,
    image_url: "/images/youth_home.png",
    established_year: 2008,
    created_at: new Date().toISOString()
  },
  {
    id: "cherubs-4",
    name: "Cherubs Children's Home",
    district: "Santasi",
    address: "Santasi Anyinam Road, Kumasi",
    cause_description: "A safe haven for special needs orphans, disabled children, and abandoned toddlers. We offer physical rehabilitation, special education tools, wheel-chair accessible facilities, and healthcare.",
    gps_lat: 6.6543,
    gps_lng: -1.6421,
    children_count: 36,
    funding_gap: "14200.00",
    last_donation_date: "2026-06-12",
    urgency_days_since_donation: 60,
    contact_email: "admin@cherubshome.org",
    contact_phone: "+233 26 555 7890",
    cluster_id: 2,
    image_url: "/images/cherubs_home.png",
    established_year: 2012,
    created_at: new Date().toISOString()
  },
  {
    id: "suame-5",
    name: "Suame Youth & Children Shelter",
    district: "Suame",
    address: "Magazine Zone 4, Suame, Kumasi",
    cause_description: "Empowering teenage orphans and street youth with practical technical skills, auto-mechanics, welding, electrical wiring, computer repair, shelter, and financial literacy.",
    gps_lat: 6.7188,
    gps_lng: -1.6211,
    children_count: 80,
    funding_gap: "38000.00",
    last_donation_date: "2026-04-03",
    urgency_days_since_donation: 130,
    contact_email: "suameyouth@charity.org.gh",
    contact_phone: "+233 20 444 8899",
    cluster_id: 2,
    image_url: "/images/youth_home.png",
    established_year: 2016,
    created_at: new Date().toISOString()
  }
];

function computeMockMatches(queryText: string, donorLat: number, donorLng: number): MatchResponse {
  const queryLower = queryText.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(w => w.length > 3);

  const matches = FALLBACK_INSTITUTIONS.map((inst, index) => {
    let matchCount = 0;
    keywords.forEach(kw => {
      if (inst.cause_description.toLowerCase().includes(kw)) matchCount += 1;
    });

    const simScore = Math.min(0.45 + (matchCount * 0.18), 0.98);
    const childrenNorm = inst.children_count / 100;
    const gapNorm = Number(inst.funding_gap) / 50000;
    const timeNorm = Math.min(inst.urgency_days_since_donation / 180, 1.0);
    
    const priorityScore = (0.35 * childrenNorm) + (0.35 * gapNorm) + (0.30 * timeNorm);
    const finalScore = (0.4 * simScore) + (0.6 * priorityScore);

    return {
      rank: index + 1,
      institution: inst,
      similarity_score: Math.round(simScore * 100) / 100,
      priority_score: Math.round(priorityScore * 100) / 100,
      final_score: Math.round(finalScore * 100) / 100,
      distance_km: Math.round((Math.abs(Number(inst.gps_lat) - donorLat) + Math.abs(Number(inst.gps_lng) - donorLng)) * 111 * 10) / 10,
      match_reasons: [
        `Semantic Cause Match: ${Math.round(simScore * 100)}%`,
        `Children in Care: ${inst.children_count}`,
        `Funding Gap: GHS ${Number(inst.funding_gap).toLocaleString()}`,
        `Located in ${inst.district}`
      ]
    };
  });

  matches.sort((a, b) => b.final_score - a.final_score);
  matches.forEach((m, idx) => m.rank = idx + 1);

  return {
    query: queryText,
    total_matched: matches.length,
    matches
  };
}
const api = {
  get: (url) => fetch(`${API_BASE_URL}${url}`).then(r => r.json()),
  post: (url, data) => fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  patch: (url, data) => fetch(`${API_BASE_URL}${url}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json())
};

export default api;
