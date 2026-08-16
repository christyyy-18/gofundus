'use client';

import React from 'react';
import { Institution, MatchResult } from '../types';
import { X, MapPin, Users, DollarSign, Calendar, Mail, Phone, Sparkles, CheckCircle2, HeartHandshake } from 'lucide-react';

interface InstitutionModalProps {
  institution: Institution | null;
  matchInfo?: MatchResult | null;
  onClose: () => void;
}

export default function InstitutionModal({ institution, matchInfo, onClose }: InstitutionModalProps) {
  if (!institution) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="relative p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/50 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {matchInfo && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rank #{matchInfo.rank} AI Match ({Math.round(matchInfo.final_score * 100)}% Match Score)</span>
            </div>
          )}

          <h2 className="text-2xl font-bold text-white tracking-tight">{institution.name}</h2>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{institution.address} ({institution.district} District, Kumasi)</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* Key Need Indicators */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Children in Care</span>
              <span className="text-lg font-bold text-slate-100">{institution.children_count} Kids</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
              <DollarSign className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Funding Gap</span>
              <span className="text-lg font-bold text-red-400">GHS {Number(institution.funding_gap).toLocaleString()}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
              <Calendar className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Last Donation</span>
              <span className="text-sm font-bold text-amber-300">
                {institution.urgency_days_since_donation} days ago
              </span>
            </div>
          </div>

          {/* Semantic Match Reasons */}
          {matchInfo && matchInfo.match_reasons && (
            <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-900/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                AI Semantic Alignment Breakdown
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {matchInfo.match_reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Institutional Cause Description */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">Institutional Mission & Cause</h3>
            <p className="text-sm leading-relaxed text-slate-300 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
              {institution.cause_description}
            </p>
          </div>

          {/* Contact Details */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{institution.contact_email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{institution.contact_phone}</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
          
          <button
            onClick={() => {
              alert(`Support request initiated for ${institution.name}. Institutional contact details: ${institution.contact_phone}`);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Connect & Support Institution</span>
          </button>
        </div>

      </div>
    </div>
  );
}
