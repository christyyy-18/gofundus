'use client';

import React, { useEffect, useState } from 'react';
import { Institution, MatchResult } from '../types';

interface KumasiMapProps {
  institutions?: Institution[];
  matches?: MatchResult[];
  onSelectInstitution?: (inst: Institution) => void;
  height?: string;
}

export default function KumasiMap({
  institutions = [],
  matches = [],
  onSelectInstitution,
  height = '480px'
}: KumasiMapProps) {
  const [mounted, setMounted] = useState(false);
  const [LeafletComponents, setLeafletComponents] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Dynamically load Leaflet for SSR compatibility
    Promise.all([
      import('leaflet'),
      import('react-leaflet')
    ]).then(([L, ReactLeaflet]) => {
      setLeafletComponents({ L, ...ReactLeaflet });
    });
  }, []);

  if (!mounted || !LeafletComponents) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center p-6 text-slate-400 animate-pulse"
      >
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading Interactive Kumasi Map...</p>
      </div>
    );
  }

  const { L, MapContainer, TileLayer, Marker, Popup, CircleMarker } = LeafletComponents;

  // Center on Kumasi Metropolitan Area
  const KUMASI_CENTER: [number, number] = [6.6885, -1.6244];

  // Helper to create custom SVG cluster icons
  const createClusterIcon = (rank?: number, daysSinceDonation?: number) => {
    let color = '#3b82f6'; // Blue default
    if (daysSinceDonation && daysSinceDonation > 90) {
      color = '#ef4444'; // Red high urgency
    } else if (daysSinceDonation && daysSinceDonation > 45) {
      color = '#f59e0b'; // Amber medium urgency
    } else if (rank && rank <= 3) {
      color = '#10b981'; // Green top match
    }

    const html = `
      <div style="
        background-color: ${color};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">
        ${rank ? `#${rank}` : '•'}
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-leaflet-marker',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  };

  // Combine items to render
  const itemsToRender = matches.length > 0 
    ? matches.map(m => ({ inst: m.institution, rank: m.rank, matchScore: m.final_score }))
    : institutions.map(i => ({ inst: i, rank: undefined, matchScore: undefined }));

  return (
    <div style={{ height }} className="w-full relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={KUMASI_CENTER}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {itemsToRender.map(({ inst, rank, matchScore }) => {
          const lat = parseFloat(String(inst.gps_lat));
          const lng = parseFloat(String(inst.gps_lng));
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <React.Fragment key={inst.id}>
              {/* Proximity pulse circle */}
              <CircleMarker
                center={[lat, lng]}
                radius={24}
                pathOptions={{
                  color: rank && rank <= 3 ? '#10b981' : '#3b82f6',
                  fillColor: rank && rank <= 3 ? '#10b981' : '#3b82f6',
                  fillOpacity: 0.15,
                  weight: 1
                }}
              />

              <Marker
                position={[lat, lng]}
                icon={createClusterIcon(rank, inst.urgency_days_since_donation)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 max-w-xs text-slate-900">
                    {rank && (
                      <div className="inline-block px-2 py-0.5 mb-1 text-[11px] font-bold uppercase rounded bg-emerald-100 text-emerald-800">
                        Rank #{rank} Match ({Math.round((matchScore || 0) * 100)}%)
                      </div>
                    )}
                    <h3 className="font-bold text-base text-slate-900 leading-tight mb-1">{inst.name}</h3>
                    <p className="text-xs text-slate-600 mb-2 font-medium">District: {inst.district}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-100 p-2 rounded-lg mb-3">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Children in Care</span>
                        <span className="font-bold text-slate-800">{inst.children_count} Kids</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Funding Gap</span>
                        <span className="font-bold text-red-600">GHS {Number(inst.funding_gap).toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-2 mb-3">
                      {inst.cause_description}
                    </p>

                    <button
                      onClick={() => onSelectInstitution && onSelectInstitution(inst)}
                      className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow transition-colors"
                    >
                      View Full Need Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl text-xs text-slate-300 max-w-xs">
        <h4 className="font-semibold text-slate-100 mb-1.5 text-[11px] uppercase tracking-wider">Map Clusters & Urgency</h4>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Top AI Semantic Match</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span>High Urgency (&gt; 90 Days Without Donation)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Medium Urgency (45–90 Days)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span>Active Orphanage Facility</span>
          </div>
        </div>
      </div>
    </div>
  );
}
