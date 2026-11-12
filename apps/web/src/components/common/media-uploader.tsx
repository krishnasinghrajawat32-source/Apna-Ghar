'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, Clock, AlertCircle, ShieldCheck, Film } from 'lucide-react';
import { MediaType, MediaArea, MediaItem, MediaReviewStatus } from '@apna-ghar/shared-types';
import { useAuthStore } from '@/features/auth/auth-store';

interface MediaUploaderProps {
  relatedEntityType: 'PROPERTY' | 'ROOM' | 'MESS' | 'USER_KYC' | 'OTHER';
  relatedEntityId?: string;
  area?: MediaArea;
  category?: string;
  mediaType?: MediaType;
  maxFiles?: number;
  allowedTypes?: string[];
  onMediaUploaded?: (media: MediaItem) => void;
  onMediaRemoved?: (mediaId: string) => void;
  initialMedia?: MediaItem[];
}

export function MediaUploader({
  relatedEntityType,
  relatedEntityId,
  area = MediaArea.PROPERTY,
  mediaType = MediaType.IMAGE,
  onMediaUploaded,
  onMediaRemoved,
  initialMedia = [],
}: MediaUploaderProps) {
  const { accessToken } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    setIsUploading(true);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        // Client-side quick check
        if (mediaType === MediaType.IMAGE && file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 10 MB limit for images.`);
        }
        if (mediaType === MediaType.VIDEO && file.size > 50 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 50 MB limit for videos.`);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mediaType', mediaType);
        formData.append('area', area);
        formData.append('relatedEntityType', relatedEntityType);
        if (relatedEntityId) {
          formData.append('relatedEntityId', relatedEntityId);
        }

        const response = await fetch(`${apiBase}/media/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });

        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || json.error?.message || 'Upload failed');
        }

        const uploadedItem: MediaItem = json.data;
        setMediaList((prev) => [uploadedItem, ...prev]);
        if (onMediaUploaded) {
          onMediaUploaded(uploadedItem);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    try {
      const res = await fetch(`${apiBase}/media/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        setMediaList((prev) => prev.filter((item) => item.id !== id));
        if (onMediaRemoved) {
          onMediaRemoved(id);
        }
      }
    } catch (err) {
      console.error('Delete media error:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Trigger Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-6 border-2 border-dashed border-[#E8E5DE] rounded-2xl bg-[#FAF8F3] hover:bg-[#F2EFE8] cursor-pointer text-center transition flex flex-col items-center justify-center gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={mediaType === MediaType.VIDEO ? 'video/mp4,video/webm' : 'image/*'}
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-[#E8E5DE] flex items-center justify-center text-[#102B50]">
          {mediaType === MediaType.VIDEO ? <Film className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
        </div>
        <div>
          <span className="text-xs font-bold text-[#102B50]">
            {isUploading ? 'Uploading to secure storage...' : `Click to upload ${mediaType.toLowerCase()}s`}
          </span>
          <p className="text-[10px] text-[#687586] mt-0.5">
            {mediaType === MediaType.VIDEO ? 'MP4 or WebM (up to 50 MB)' : 'JPEG, PNG, WebP (up to 10 MB each)'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Media Gallery / Previews */}
      {mediaList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="relative group rounded-xl overflow-hidden border border-[#E8E5DE] bg-white shadow-xs"
            >
              {item.mediaType === MediaType.VIDEO ? (
                <div className="w-full h-28 bg-black flex items-center justify-center text-white text-xs">
                  <Film className="w-6 h-6 opacity-80" />
                </div>
              ) : (
                <img
                  src={item.url}
                  alt="Uploaded media"
                  className="w-full h-28 object-cover"
                />
              )}

              {/* Status Badge */}
              <div className="p-2 space-y-1 bg-white">
                <div className="flex items-center gap-1">
                  {item.reviewStatus === MediaReviewStatus.APPROVED ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#21865B] px-1.5 py-0.5 rounded bg-[#21865B]/10">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Admin Approved
                    </span>
                  ) : item.reviewStatus === MediaReviewStatus.REJECTED ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-700 px-1.5 py-0.5 rounded bg-red-100">
                      <AlertCircle className="w-2.5 h-2.5" /> Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#F5A623] px-1.5 py-0.5 rounded bg-[#F5A623]/10">
                      <Clock className="w-2.5 h-2.5" /> Review Pending
                    </span>
                  )}
                </div>

                {item.isPhysicallyVerified && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-[#102B50] px-1.5 py-0.5 rounded bg-[#102B50]/10">
                    <ShieldCheck className="w-2.5 h-2.5 text-[#21865B]" /> Physically Verified
                  </span>
                )}
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
