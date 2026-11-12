'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, ExternalLink, Compass } from 'lucide-react';

interface LocationPickerProps {
  coordinates: [number, number]; // [lng, lat]
  onChange: (coords: [number, number]) => void;
  addressText?: string;
  onAddressChange?: (address: string) => void;
  label?: string;
}

const UNIVERSITY_PRESETS = [
  { name: 'Delhi North Campus (DU)', coords: [77.2090, 28.6923] as [number, number] },
  { name: 'Kota Coaching Hub', coords: [75.8450, 25.1388] as [number, number] },
  { name: 'Pune University (Viman Nagar)', coords: [73.9143, 18.5679] as [number, number] },
  { name: 'Bangalore Student Hub (Koramangala)', coords: [77.6245, 12.9352] as [number, number] },
];

export function LocationPicker({
  coordinates,
  onChange,
  addressText,
  onAddressChange,
  label = 'Property Location Coordinates',
}: LocationPickerProps) {
  const [lng, setLng] = useState<number>(coordinates?.[0] ?? 77.209);
  const [lat, setLat] = useState<number>(coordinates?.[1] ?? 28.6139);
  const hasGoogleMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    if (coordinates && coordinates.length === 2) {
      setLng(coordinates[0]);
      setLat(coordinates[1]);
    }
  }, [coordinates]);

  const handleLatChange = (newLat: number) => {
    setLat(newLat);
    onChange([lng, newLat]);
  };

  const handleLngChange = (newLng: number) => {
    setLng(newLng);
    onChange([newLng, lat]);
  };

  const applyPreset = (presetCoords: [number, number]) => {
    setLng(presetCoords[0]);
    setLat(presetCoords[1]);
    onChange(presetCoords);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#102B50] flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#F5A623]" />
          {label}
        </label>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#102B50] hover:text-[#F5A623] transition"
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {onAddressChange && (
        <div>
          <label className="block text-[11px] font-semibold text-[#687586] mb-1">
            Search or Enter Address
          </label>
          <input
            type="text"
            value={addressText || ''}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="e.g. 123 North Campus Road, Near Metro Gate 3"
            className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E5DE] focus:outline-none focus:ring-1 focus:ring-[#102B50]"
          />
        </div>
      )}

      {/* Coordinate Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-[#687586] mb-1">
            Latitude (-90° to 90°)
          </label>
          <input
            type="number"
            step="0.0001"
            min="-90"
            max="90"
            value={lat}
            onChange={(e) => handleLatChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E5DE] focus:outline-none focus:ring-1 focus:ring-[#102B50]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#687586] mb-1">
            Longitude (-180° to 180°)
          </label>
          <input
            type="number"
            step="0.0001"
            min="-180"
            max="180"
            value={lng}
            onChange={(e) => handleLngChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E5DE] focus:outline-none focus:ring-1 focus:ring-[#102B50]"
          />
        </div>
      </div>

      {/* University Hub Quick Presets */}
      <div className="space-y-1.5 pt-2 border-t border-[#E8E5DE]">
        <span className="text-[10px] font-bold text-[#687586] uppercase tracking-wider block flex items-center gap-1">
          <Compass className="w-3 h-3 text-[#F5A623]" />
          Student Hub Presets:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {UNIVERSITY_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset.coords)}
              className="text-[10px] font-medium px-2 py-1 rounded-lg bg-white hover:bg-[#E8E5DE] text-[#102B50] border border-[#E8E5DE] transition"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {!hasGoogleMapsKey && (
        <p className="text-[10px] text-[#687586] italic">
          Google Maps API key not set. Running in resilient manual coordinates mode with direct Google Maps verification links.
        </p>
      )}
    </div>
  );
}
