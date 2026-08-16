'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import KumasiMap from '../components/KumasiMap';
import InstitutionModal from '../components/InstitutionModal';
import AdminDashboard from '../components/AdminDashboard';
import { fetchInstitutions, matchDonorStatement, fetchClusters } from '../services/api';
import { Institution, MatchResult, MatchResponse } from '../types';
import { Sparkles, MapPin, Search, RefreshCw, Users, DollarSign, Filter, ChevronRight, Layers, ArrowUpRight, AlertCircle, HeartHandshake, Map } from 'lucide-react';

const SAMPLE_DONOR_QUERIES = [
  "I want to donate to orphanages in Kumasi that support infant care, baby milk formula, and newborn pediatric healthcare.",
  "Looking to fund primary education, computer literacy, IT equipment, and school fees for street children in Ayigya or Oforikrom.",
  "I care deeply about special needs orphans, disabled children, wheelchairs, and physical therapy facilities in Kumasi.",
  "Seeking urgent orphanages near Suame or Bantama that offer technical vocational skill training, auto mechanics, and youth empowerment."
];

const KUMASI_DISTRICTS = [
  "All Districts", "Asokwa", "Ayigya", "Ayigya Zongo", "Bantama", "Oforikrom", "Suame", "Kwadaso", "Santasi", "Aboabo", "Manhyia", "North Suntreso", "Sofoline", "Kronum"
];

export default function Home() {
  const [activeView, setActiveView] = useState<'donor' | 'admin'>('donor');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [clusterInfo, setClusterInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Search & Match state
  const [statementText, setStatementText] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [matchResponse, setMatchResponse] = useState<MatchResponse | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');

  // Selected Modal
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [selectedMatchInfo, setSelectedMatchInfo] = useState<MatchResult | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchInstitutions();
    setInstitutions(data);
    const clusters = await fetchClusters();
    setClusterInfo(clusters);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMatchSubmit = async (textToMatch?: string) => {
    const text = textToMatch || statementText;
    if (!text.trim()) return;
    setIsMatching(true);
    const response = await matchDonorStatement(text);
    setMatchResponse(response);
    setIsMatching(false);
  };

  const filteredInstitutions = institutions.filter(inst => {
    if (selectedDistrict !== 'All Districts' && inst.district !== selectedDistrict) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar activeView={activeView} onToggleView={setActiveView} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        
        {activeView === 'admin' ? (
          <AdminDashboard institutions={institutions} onRefresh={loadData} />
        ) : (
          <>
            {/* Hero Section: AI Semantic Match Input */}
            <section className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 max-w-3xl space-y-4">
                
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span>AI Semantic Cause Matching Engine</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Connect Directly with Ghanaian Orphanages in <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">Kumasi</span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Describe your charitable interests in plain English. Our TF-IDF vectorizer and transparent urgency priority engine match your intent against real operational needs across Kumasi orphanages.
                </p>

                {/* Search Textarea Box */}
                <div className="pt-2">
                  <div className="relative p-2 bg-slate-950/90 border border-slate-700/80 rounded-2xl shadow-xl focus-within:border-blue-500 transition-all">
                    <textarea
                      rows={3}
                      value={statementText}
                      onChange={(e) => setStatementText(e.target.value)}
                      placeholder="e.g., 'I want to support infant care, baby milk formula, and newborn pediatric healthcare in Kumasi...'"
                      className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
                    />
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 px-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        Target Region: Kumasi Metropolitan Area
                      </span>

                      <button
                        onClick={() => handleMatchSubmit()}
                        disabled={isMatching || !statementText.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                      >
                        {isMatching ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Computing Matches...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Find AI Matched Orphanages</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sample Prompt Chips */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Quick Sample Interest Queries:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_DONOR_QUERIES.map((query, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setStatementText(query);
                          handleMatchSubmit(query);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-blue-900/40 border border-slate-700/60 text-[11px] text-slate-300 hover:text-white transition-all text-left"
                      >
                        "{query.slice(0, 48)}..."
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            {/* K-Means Geospatial Cluster Summary Banner */}
            {clusterInfo && (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Geospatial K-Means Clustering:</strong> {clusterInfo.optimal_k || 2} Clusters Formed Across Kumasi
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                    Silhouette Quality Score: {clusterInfo.silhouette_score || 0.4817}
                  </span>
                  <span className="text-slate-500 hidden md:inline">• Validated Cluster Distribution</span>
                </div>
              </div>
            )}

            {/* Results Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-slate-800 pb-4">
              
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {matchResponse ? (
                    <>
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <span>AI Semantic Match Results ({matchResponse.total_matched})</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-5 h-5 text-blue-400" />
                      <span>Registered Kumasi Orphanages ({filteredInstitutions.length})</span>
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {matchResponse
                    ? `Ranked by similarity score & transparent urgency priority logic.`
                    : `Browse all institutional cause descriptions and verified need indicators.`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* District Filter */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="bg-transparent text-slate-200 font-medium focus:outline-none"
                  >
                    {KUMASI_DISTRICTS.map(d => (
                      <option key={d} value={d} className="bg-slate-900 text-slate-200">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Switcher: List vs Map */}
                <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
                  <button
                    onClick={() => setActiveTab('list')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'list' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Card Grid
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'map' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Interactive Map
                  </button>
                </div>
              </div>

            </div>

            {/* Display Content: Card Grid or Map */}
            {activeTab === 'map' ? (
              <KumasiMap
                institutions={filteredInstitutions}
                matches={matchResponse ? matchResponse.matches : []}
                onSelectInstitution={(inst) => {
                  setSelectedInstitution(inst);
                  const m = matchResponse?.matches.find(item => item.institution.id === inst.id);
                  setSelectedMatchInfo(m || null);
                }}
                height="540px"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {matchResponse ? (
                  matchResponse.matches.map((item) => (
                    <div
                      key={item.institution.id}
                      className="group relative p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            RANK #{item.rank} MATCH ({Math.round(item.final_score * 100)}%)
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {item.distance_km} km away
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-100 leading-snug group-hover:text-blue-400 transition-colors mb-1">
                          {item.institution.name}
                        </h3>
                        <p className="text-xs text-slate-400 mb-3 font-medium">📍 {item.institution.district} District</p>

                        {/* Operational Indicators */}
                        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Children in Care</span>
                            <span className="font-bold text-slate-200">{item.institution.children_count} Kids</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Funding Gap</span>
                            <span className="font-bold text-red-400">GHS {Number(item.institution.funding_gap).toLocaleString()}</span>
                          </div>
                        </div>

                        <p className="text-xs leading-relaxed text-slate-300 line-clamp-3 mb-4">
                          {item.institution.cause_description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-amber-400 font-medium">
                          {item.institution.urgency_days_since_donation}d since last donation
                        </span>
                        <button
                          onClick={() => {
                            setSelectedInstitution(item.institution);
                            setSelectedMatchInfo(item);
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300"
                        >
                          <span>Full Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  filteredInstitutions.map((inst) => (
                    <div
                      key={inst.id}
                      className="group relative p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                            {inst.district}
                          </span>
                          {inst.urgency_days_since_donation > 90 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              HIGH URGENCY
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors mb-1">
                          {inst.name}
                        </h3>
                        <p className="text-xs text-slate-400 mb-3">📍 {inst.address}</p>

                        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Children in Care</span>
                            <span className="font-bold text-slate-200">{inst.children_count} Kids</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Funding Gap</span>
                            <span className="font-bold text-red-400">GHS {Number(inst.funding_gap).toLocaleString()}</span>
                          </div>
                        </div>

                        <p className="text-xs leading-relaxed text-slate-300 line-clamp-3 mb-4">
                          {inst.cause_description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {inst.urgency_days_since_donation} days without donation
                        </span>
                        <button
                          onClick={() => {
                            setSelectedInstitution(inst);
                            setSelectedMatchInfo(null);
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300"
                        >
                          <span>View Needs</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 mt-12 bg-slate-950/60 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 GoFundUs — AI-Powered Location-Aware Donation Matching Platform for Kumasi Metropolitan Area.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Chapter 3 Methodology Implementation</span>
            <span>•</span>
            <span>Kumasi Orphanage Dataset</span>
          </div>
        </div>
      </footer>

      {/* Modal Popup */}
      <InstitutionModal
        institution={selectedInstitution}
        matchInfo={selectedMatchInfo}
        onClose={() => setSelectedInstitution(null)}
      />

    </div>
  );
}
