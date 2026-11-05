'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, IndianRupee, Home, Loader2, Sparkles } from 'lucide-react';
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
        setColleges(Array.isArray(data) ? data : (data as any)?.data || []);
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
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-[#E8E5DE] shadow-brand-lg p-5 sm:p-8 space-y-6">
      <div className="text-center sm:text-left space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F5A623] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Campus-Anchored Accommodation Finder</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-[#102B50] tracking-tight">
          Which college or university are you studying at?
        </h2>
        <p className="text-xs text-[#687586]">
          Search verified hostels, PGs, and student flats within walking or short commute distance.
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        {/* College Search Autocomplete Input */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-[#102B50] absolute left-4 pointer-events-none" />
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
              placeholder="Type university name (e.g. Amity University Noida, IIT Delhi, DU North Campus...)"
              className="w-full pl-12 pr-10 py-4 text-xs sm:text-sm rounded-2xl border border-[#E8E5DE] focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623] transition-all bg-[#FAF8F3]/60 text-[#263445] placeholder:text-[#687586] font-medium shadow-inner"
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 text-[#F5A623] animate-spin absolute right-4" />
            )}
          </div>

          {/* Autocomplete Results Dropdown */}
          {isOpen && colleges.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E8E5DE] rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-[#E8E5DE] max-h-64 overflow-y-auto">
              {colleges.map((college) => (
                <button
                  key={college.id}
                  type="button"
                  onClick={() => handleSelectCollege(college)}
                  className="w-full text-left px-4 py-3.5 hover:bg-[#FAF8F3] transition-colors flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#102B50]/10 text-[#102B50] flex items-center justify-center shrink-0 group-hover:bg-[#102B50] group-hover:text-white transition-colors">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#102B50] group-hover:text-[#F5A623] transition-colors">
                        {college.name}
                      </p>
                      <p className="text-[11px] text-[#687586]">
                        {college.city}, {college.state}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#21865B] bg-[#21865B]/10 border border-[#21865B]/20 px-2.5 py-0.5 rounded-full">
                    Verified Campus
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Filter Row: Move-in, Budget, Accommodation Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Move-in Date */}
          <div className="flex items-center gap-2.5 px-3.5 py-3 border border-[#E8E5DE] rounded-2xl bg-[#FAF8F3]">
            <Calendar className="w-4 h-4 text-[#102B50] shrink-0" />
            <div className="flex flex-col text-left w-full">
              <span className="text-[10px] font-bold text-[#687586] uppercase tracking-wider">
                Move-In
              </span>
              <select className="bg-transparent text-xs font-bold text-[#263445] focus:outline-none cursor-pointer">
                <option value="immediate">Immediately</option>
                <option value="next_month">Next Month</option>
                <option value="next_semester">Next Semester</option>
              </select>
            </div>
          </div>

          {/* Budget Selector */}
          <div className="flex items-center gap-2.5 px-3.5 py-3 border border-[#E8E5DE] rounded-2xl bg-[#FAF8F3]">
            <IndianRupee className="w-4 h-4 text-[#102B50] shrink-0" />
            <div className="flex flex-col text-left w-full">
              <span className="text-[10px] font-bold text-[#687586] uppercase tracking-wider">
                Max Budget
              </span>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#263445] focus:outline-none cursor-pointer"
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
          <div className="flex items-center gap-2.5 px-3.5 py-3 border border-[#E8E5DE] rounded-2xl bg-[#FAF8F3]">
            <Home className="w-4 h-4 text-[#102B50] shrink-0" />
            <div className="flex flex-col text-left w-full">
              <span className="text-[10px] font-bold text-[#687586] uppercase tracking-wider">
                Type
              </span>
              <select
                value={accommodationType}
                onChange={(e) => setAccommodationType(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#263445] focus:outline-none cursor-pointer"
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
          className="w-full py-4 px-6 rounded-2xl text-xs sm:text-sm font-extrabold text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.99]"
        >
          <Search className="w-4 h-4" />
          <span>Find Verified Accommodations</span>
        </button>
      </form>
    </div>
  );
}
