'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, IndianRupee, Home, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { College } from '@apna-ghar/shared-types';

export function CollegeSearchHero() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [budget, setBudget] = useState<string>('');
  const [accommodationType, setAccommodationType] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live autocomplete search against GET /colleges/search?q=
  useEffect(() => {
    if (query.trim().length === 0) {
      setColleges([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const data = await apiClient<College[]>(`/colleges/search?q=${encodeURIComponent(query)}&limit=6`);
        setColleges(data);
        setIsOpen(true);
      } catch {
        setColleges([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCollege = (college: College) => {
    setSelectedCollege(college);
    setQuery(college.name);
    setIsOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const collegeSlug = selectedCollege ? selectedCollege.slug : query.trim();
    if (!collegeSlug) return;

    const params = new URLSearchParams();
    params.set('college', collegeSlug);
    params.set('radius', '3000'); // Default 3 km
    if (budget) {
      params.set('maxPrice', budget);
    }
    if (accommodationType && accommodationType !== 'all') {
      params.set('propertyType', accommodationType);
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-[#ECE8DD] shadow-lg p-5 sm:p-7 space-y-5">
      <div className="text-center sm:text-left space-y-1">
        <label className="text-sm sm:text-base font-extrabold text-[#173327] tracking-tight">
          Which college or university are you studying at?
        </label>
        <p className="text-xs text-[#3D3A33]">
          Find verified hostels, PGs, and student flats within walking or short commute distance.
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        {/* College Search Autocomplete Input */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-[#173327] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedCollege(null);
              }}
              onFocus={() => {
                if (colleges.length > 0) setIsOpen(true);
              }}
              placeholder="e.g. Amity University Noida, IIT Delhi, DU North Campus..."
              className="w-full pl-11 pr-10 py-3.5 text-xs sm:text-sm rounded-xl border border-[#DDD7C7] focus:outline-none focus:ring-2 focus:ring-[#173327] focus:border-transparent transition-all shadow-inner text-[#173327] placeholder:text-gray-400 font-medium"
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 text-[#E06D3B] animate-spin absolute right-3.5" />
            )}
          </div>

          {/* Autocomplete Results Dropdown */}
          {isOpen && colleges.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#ECE8DD] rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[#ECE8DD] max-h-64 overflow-y-auto">
              {colleges.map((college) => (
                <button
                  key={college.id}
                  type="button"
                  onClick={() => handleSelectCollege(college)}
                  className="w-full text-left px-4 py-3 hover:bg-[#F7F5EE] transition-colors flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#DCE8E2] text-[#173327] flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#173327] group-hover:text-[#E06D3B] transition-colors">
                        {college.name}
                      </p>
                      <p className="text-[11px] text-[#3D3A33]">
                        {college.city}, {college.state}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#173327] bg-[#ECE8DD] px-2 py-0.5 rounded-full">
                    Verified Anchor
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Filter Row: Move-in, Budget, Accommodation Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Move-in Date */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border border-[#ECE8DD] rounded-xl bg-[#FCFBF7]">
            <Calendar className="w-4 h-4 text-[#173327] shrink-0" />
            <div className="flex flex-col text-left w-full">
              <span className="text-[10px] font-bold text-[#3D3A33] uppercase tracking-wider">
                Move-In
              </span>
              <select className="bg-transparent text-xs font-semibold text-[#173327] focus:outline-none cursor-pointer">
                <option value="immediate">Immediately</option>
                <option value="next_month">Next Month</option>
                <option value="next_semester">Next Semester</option>
              </select>
            </div>
          </div>

          {/* Budget Selector */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border border-[#ECE8DD] rounded-xl bg-[#FCFBF7]">
            <IndianRupee className="w-4 h-4 text-[#173327] shrink-0" />
            <div className="flex flex-col text-left w-full">
              <span className="text-[10px] font-bold text-[#3D3A33] uppercase tracking-wider">
                Max Budget
              </span>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#173327] focus:outline-none cursor-pointer"
              >
                <option value="">Any Budget</option>
                <option value="8000">Up to ₹8,000 / mo</option>
                <option value="12000">Up to ₹12,000 / mo</option>
                <option value="16000">Up to ₹16,000 / mo</option>
                <option value="25000">Up to ₹25,000 / mo</option>
              </select>
            </div>
          </div>

          {/* Accommodation Type */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border border-[#ECE8DD] rounded-xl bg-[#FCFBF7]">
            <Home className="w-4 h-4 text-[#173327] shrink-0" />
            <div className="flex flex-col text-left w-full">
              <span className="text-[10px] font-bold text-[#3D3A33] uppercase tracking-wider">
                Type
              </span>
              <select
                value={accommodationType}
                onChange={(e) => setAccommodationType(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#173327] focus:outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="PG">PG (Paying Guest)</option>
                <option value="HOSTEL">Student Hostel</option>
                <option value="STUDENT_FLAT">Student Flat</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Submit CTA */}
        <button
          type="submit"
          className="w-full py-3.5 px-6 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#173327] hover:bg-[#1F4333] transition-colors shadow-md flex items-center justify-center gap-2 mt-2"
        >
          <Search className="w-4 h-4" />
          Find Verified Accommodations
        </button>
      </form>
    </div>
  );
}
