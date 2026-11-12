'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Clock,
  ArrowRight,
  Eye,
  Plus,
  Bed as BedIcon,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useAuthStore } from '@/features/auth/auth-store';
import { apiClient } from '@/lib/api-client';
import { LocationPicker } from '@/components/common/location-picker';
import { MediaUploader } from '@/components/common/media-uploader';
import {
  UserRole,
  PropertyType,
  GenderPreference,
  FurnishingType,
  SharingType,
  BookingStatus,
} from '@apna-ghar/shared-types';

interface OwnerOverview {
  totalProperties: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  occupancyRate: number;
  totalBookings: number;
  confirmedBookings: number;
}

interface OwnerProperty {
  id: string;
  name: string;
  slug: string;
  propertyType: string;
  city: string;
  totalRooms: number;
  totalBeds: number;
  availableBeds: number;
  status: string;
  approvalStatus?: string;
  isPhysicallyVerified?: boolean;
}

interface BookingRequest {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  moveInDate: string;
  rentAmount: number;
  depositAmount: number;
  cancelledReason?: string;
  propertyId: { id: string; name: string };
  roomTypeId: { name: string; sharingType: string };
  roomId: { roomNumber: string };
  bedId: { bedLabel: string };
  studentId: { name: string; email: string; phone: string };
  createdAt: string;
}

export default function OwnerDashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'properties' | 'bookings' | 'add-property' | 'profile'>('properties');

  // Form states for adding property
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>(PropertyType.HOSTEL);
  const [description, setDescription] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [pincode, setPincode] = useState('110007');
  const [landmark, setLandmark] = useState('');
  const [coords, setCoords] = useState<[number, number]>([77.209, 28.6923]);
  const [gender, setGender] = useState<GenderPreference>(GenderPreference.BOYS);
  const [furnishing, setFurnishing] = useState<FurnishingType>(FurnishingType.FULLY_FURNISHED);
  const [roomTypeName, setRoomTypeName] = useState('Double Sharing AC');
  const [sharingType, setSharingType] = useState<SharingType>(SharingType.DOUBLE);
  const [baseRent, setBaseRent] = useState(8500);
  const [deposit, setDeposit] = useState(8500);
  const [amenities] = useState<string[]>(['WiFi', 'Power Backup', 'CCTV', 'RO Water']);
  const [rules] = useState<string[]>(['No Smoking', 'Curfew 10:30 PM']);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [propertySuccessMsg, setPropertySuccessMsg] = useState<string | null>(null);

  // Profile states
  const [companyName, setCompanyName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Selected property for inventory management
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newFloorNumber, setNewFloorNumber] = useState(1);
  const [newBedLabel, setNewBedLabel] = useState('');

  // 1. Fetch Overview Metrics
  const { data: overview, isLoading: isOverviewLoading } = useQuery<OwnerOverview>({
    queryKey: ['owner-overview'],
    queryFn: () => apiClient<OwnerOverview>('/owner/overview'),
    enabled: !!user,
  });

  // 2. Fetch Properties
  const { data: properties = [], isLoading: isPropertiesLoading } = useQuery<OwnerProperty[]>({
    queryKey: ['owner-properties'],
    queryFn: () => apiClient<OwnerProperty[]>('/owner/properties'),
    enabled: !!user,
  });

  // 3. Fetch Booking Requests
  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery<BookingRequest[]>({
    queryKey: ['owner-bookings'],
    queryFn: () => apiClient<BookingRequest[]>('/owner/bookings'),
    enabled: !!user,
  });

  // 4. Fetch Owner Profile
  const { data: profile } = useQuery({
    queryKey: ['owner-profile'],
    queryFn: () => apiClient<any>('/owner/profile'),
    enabled: !!user,
  });

  React.useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName || '');
      setPanNumber(profile.panNumber || '');
      setBusinessAddress(profile.businessAddress || '');
    }
  }, [profile]);

  // 5. Fetch selected property inventory
  const { data: inventoryData, refetch: refetchInventory } = useQuery({
    queryKey: ['property-inventory', selectedPropId],
    queryFn: () => apiClient<any>(`/owner/properties/${selectedPropId}/inventory`),
    enabled: !!selectedPropId,
  });

  // Mutation: Create Property
  const createPropertyMutation = useMutation({
    mutationFn: () => {
      return apiClient('/owner/properties', {
        method: 'POST',
        body: JSON.stringify({
          name,
          propertyType,
          description,
          address: { street, city, state, pincode, landmark },
          location: { type: 'Point', coordinates: coords },
          genderPreference: gender,
          furnishing,
          amenities,
          rules,
          images: uploadedPhotos,
          roomTypes: [
            {
              name: roomTypeName,
              sharingType,
              baseRent,
              deposit,
              attachedBathroom: true,
              ac: true,
            },
          ],
        }),
      });
    },
    onSuccess: () => {
      setPropertySuccessMsg('Property successfully listed! Submitted for Admin verification.');
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
      setTimeout(() => {
        setPropertySuccessMsg(null);
        setActiveTab('properties');
      }, 2500);
    },
  });

  // Mutation: Update Profile
  const updateProfileMutation = useMutation({
    mutationFn: () => {
      return apiClient('/owner/profile', {
        method: 'PATCH',
        body: JSON.stringify({ companyName, panNumber, businessAddress }),
      });
    },
    onSuccess: () => {
      setProfileSuccessMsg('Profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['owner-profile'] });
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    },
  });

  // Mutation: Booking Decision (Accept or Reject)
  const decideBookingMutation = useMutation({
    mutationFn: ({ bookingId, decision, reason }: { bookingId: string; decision: 'ACCEPT' | 'REJECT'; reason?: string }) => {
      return apiClient(`/owner/bookings/${bookingId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
    },
  });

  // Mutation: Toggle Bed Status
  const toggleBedMutation = useMutation({
    mutationFn: ({ bedId, newStatus }: { bedId: string; newStatus: 'AVAILABLE' | 'MAINTENANCE' }) => {
      return apiClient(`/owner/beds/${bedId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ permanentStatus: newStatus }),
      });
    },
    onSuccess: () => {
      refetchInventory();
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
    },
  });

  // Mutation: Add Room
  const addRoomMutation = useMutation({
    mutationFn: () => {
      const roomTypes = inventoryData?.rooms?.[0]?.roomType?.id
        ? [inventoryData.rooms[0].roomType.id]
        : [];
      const roomTypeId = roomTypes[0];
      if (!roomTypeId) throw new Error('No RoomType found to associate with this room.');

      return apiClient(`/owner/properties/${selectedPropId}/rooms`, {
        method: 'POST',
        body: JSON.stringify({
          roomTypeId,
          floorNumber: newFloorNumber,
          roomNumber: newRoomNumber,
          status: 'ACTIVE',
        }),
      });
    },
    onSuccess: () => {
      setNewRoomNumber('');
      refetchInventory();
    },
  });

  // Mutation: Add Bed
  const addBedMutation = useMutation({
    mutationFn: (roomId: string) => {
      const targetRoom = inventoryData?.rooms?.find((r: any) => r.id === roomId);
      return apiClient(`/owner/rooms/${roomId}/beds`, {
        method: 'POST',
        body: JSON.stringify({
          roomTypeId: targetRoom?.roomType?.id,
          bedLabel: newBedLabel || 'Bed X',
          position: 'STANDARD',
          permanentStatus: 'AVAILABLE',
        }),
      });
    },
    onSuccess: () => {
      setNewBedLabel('');
      refetchInventory();
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
    },
  });

  return (
    <AuthGuard allowedRoles={[UserRole.OWNER, UserRole.ADMIN]}>
      <div className="min-h-screen bg-[#FAF8F3] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#102B50] text-[#F5A623] flex items-center justify-center text-2xl font-black shadow-md">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#102B50] tracking-tight">
                    Owner Portal — {user?.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAEBDE] text-[#E06D3B] border border-[#E06D3B]/20">
                    Property Owner
                  </span>
                </div>
                <p className="text-xs text-[#687586] mt-1">
                  Manage your student properties, room & bed inventory, media verification, and booking requests.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (user?.roleApprovalStatus && user.roleApprovalStatus !== 'APPROVED') {
                    alert('Your owner account is pending administrative verification. You will be able to list properties once approved.');
                    return;
                  }
                  setActiveTab('add-property');
                }}
                disabled={user?.roleApprovalStatus !== undefined && user.roleApprovalStatus !== 'APPROVED'}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#1A3E6D] transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                List New Property
              </button>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#102B50] bg-[#FAF8F3] hover:bg-[#E8E5DE] border border-[#E8E5DE] transition"
              >
                <Eye className="w-4 h-4" />
                Marketplace
              </Link>
            </div>
          </div>

          {/* Pending Approval Banner */}
          {user?.roleApprovalStatus && user.roleApprovalStatus !== 'APPROVED' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-extrabold block text-sm">
                  Partner Account Under Review ({user.roleApprovalStatus})
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Namaste {user.name}, your property owner account is pending administrative verification. You may inspect your dashboard and review current listings, but publishing new properties or accepting student booking requests will be activated as soon as our verification team reviews your documents.
                </p>
              </div>
            </div>
          )}

          {/* Operational Metrics (Strictly non-financial) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Properties Listed</span>
              <p className="text-2xl font-black text-[#102B50] mt-1">
                {isOverviewLoading ? '—' : overview?.totalProperties ?? properties.length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Total Beds</span>
              <p className="text-2xl font-black text-[#102B50] mt-1">
                {isOverviewLoading ? '—' : overview?.totalBeds ?? 0}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Available Beds</span>
              <p className="text-2xl font-black text-[#21865B] mt-1">
                {isOverviewLoading ? '—' : overview?.availableBeds ?? 0}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E5DE] shadow-sm">
              <span className="text-xs font-semibold text-[#687586]">Bed Occupancy</span>
              <p className="text-2xl font-black text-[#102B50] mt-1">
                {isOverviewLoading ? '—' : `${overview?.occupancyRate ?? 0}%`}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#E8E5DE] gap-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('properties')}
              className={`pb-3 transition ${
                activeTab === 'properties'
                  ? 'border-b-2 border-[#102B50] text-[#102B50]'
                  : 'text-[#687586] hover:text-[#102B50]'
              }`}
            >
              Managed Properties & Inventory ({properties.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-3 transition flex items-center gap-1.5 ${
                activeTab === 'bookings'
                  ? 'border-b-2 border-[#102B50] text-[#102B50]'
                  : 'text-[#687586] hover:text-[#102B50]'
              }`}
            >
              <span>Booking Requests</span>
              {bookings.filter((b) => b.status === BookingStatus.REQUESTED).length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#E06D3B] text-white">
                  {bookings.filter((b) => b.status === BookingStatus.REQUESTED).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('add-property')}
              className={`pb-3 transition ${
                activeTab === 'add-property'
                  ? 'border-b-2 border-[#102B50] text-[#102B50]'
                  : 'text-[#687586] hover:text-[#102B50]'
              }`}
            >
              + List New Property
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 transition ${
                activeTab === 'profile'
                  ? 'border-b-2 border-[#102B50] text-[#102B50]'
                  : 'text-[#687586] hover:text-[#102B50]'
              }`}
            >
              Owner Profile & KYC
            </button>
          </div>

          {/* TAB 1: Managed Properties & Room/Bed Inventory */}
          {activeTab === 'properties' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-[#102B50]">Your Accommodations</h2>
                    <p className="text-xs text-[#687586]">Click a property to inspect room and bed allocation.</p>
                  </div>
                </div>

                {isPropertiesLoading ? (
                  <div className="py-12 text-center text-xs text-[#687586] flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" /> Loading properties...
                  </div>
                ) : properties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {properties.map((prop) => (
                      <div
                        key={prop.id}
                        onClick={() => setSelectedPropId(selectedPropId === prop.id ? null : prop.id)}
                        className={`p-5 rounded-2xl border cursor-pointer transition ${
                          selectedPropId === prop.id
                            ? 'bg-[#F0F5F2] border-[#102B50] ring-1 ring-[#102B50]'
                            : 'bg-[#FAF8F3] border-[#E8E5DE] hover:bg-[#F2EFE8]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-[#102B50]">{prop.name}</h3>
                            <p className="text-[11px] text-[#687586] mt-0.5">{prop.city}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {prop.status === 'ACTIVE' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#21865B]/10 text-[#21865B]">
                                Active
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5A623]/20 text-[#B87A14]">
                                Under Verification
                              </span>
                            )}
                            {prop.isPhysicallyVerified && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#102B50]/10 text-[#102B50] flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-[#21865B]" /> Verified
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-[#E8E5DE]">
                          <span className="text-[#687586]">
                            Available: <strong className="text-[#21865B]">{prop.availableBeds}</strong> / {prop.totalBeds} beds
                          </span>
                          <span className="text-[11px] font-bold text-[#102B50] hover:underline flex items-center gap-1">
                            {selectedPropId === prop.id ? 'Close Inventory' : 'Manage Inventory'}
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-[#FAF8F3] border border-dashed border-[#E8E5DE] text-center space-y-3">
                    <Building2 className="w-10 h-10 text-[#687586] mx-auto opacity-40" />
                    <p className="text-xs text-[#687586]">No properties listed yet.</p>
                    <button
                      onClick={() => setActiveTab('add-property')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#102B50]"
                    >
                      Create First Property
                    </button>
                  </div>
                )}
              </div>

              {/* Physical Inventory Explorer for Selected Property */}
              {selectedPropId && inventoryData && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E8E5DE]">
                    <div>
                      <h3 className="text-sm font-bold text-[#102B50]">
                        Inventory: {inventoryData.property?.name}
                      </h3>
                      <p className="text-xs text-[#687586]">
                        {inventoryData.property?.address?.street}, {inventoryData.property?.address?.city}
                      </p>
                    </div>

                    {/* Add Room Inline Form */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Room #"
                        value={newRoomNumber}
                        onChange={(e) => setNewRoomNumber(e.target.value)}
                        className="w-24 px-3 py-1.5 text-xs rounded-xl border border-[#E8E5DE] bg-[#FAF8F3]"
                      />
                      <input
                        type="number"
                        placeholder="Floor"
                        value={newFloorNumber}
                        onChange={(e) => setNewFloorNumber(parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1.5 text-xs rounded-xl border border-[#E8E5DE] bg-[#FAF8F3]"
                      />
                      <button
                        type="button"
                        onClick={() => addRoomMutation.mutate()}
                        disabled={!newRoomNumber || addRoomMutation.isPending}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#102B50] disabled:opacity-50"
                      >
                        + Add Room
                      </button>
                    </div>
                  </div>

                  {/* Rooms and Beds Grid */}
                  <div className="space-y-4">
                    {inventoryData.rooms?.map((room: any) => (
                      <div key={room.id} className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#102B50]">
                              Room {room.roomNumber} (Floor {room.floorNumber})
                            </span>
                            {room.roomType && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#102B50]/10 text-[#102B50] font-semibold">
                                {room.roomType.name}
                              </span>
                            )}
                          </div>

                          {/* Add Bed to this room */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Bed Label (e.g. Bed A)"
                              value={newBedLabel}
                              onChange={(e) => setNewBedLabel(e.target.value)}
                              className="w-32 px-2 py-1 text-[11px] rounded-lg border border-[#E8E5DE] bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => addBedMutation.mutate(room.id)}
                              disabled={!newBedLabel || addBedMutation.isPending}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-[#21865B] disabled:opacity-50"
                            >
                              + Bed
                            </button>
                          </div>
                        </div>

                        {/* Beds List */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {room.beds?.map((bed: any) => (
                            <div
                              key={bed.id}
                              className="p-2.5 rounded-xl bg-white border border-[#E8E5DE] space-y-1.5 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#102B50] flex items-center gap-1">
                                  <BedIcon className="w-3 h-3 text-[#F5A623]" />
                                  {bed.bedLabel}
                                </span>
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                    bed.permanentStatus === 'AVAILABLE'
                                      ? 'bg-[#21865B]/10 text-[#21865B]'
                                      : bed.permanentStatus === 'BOOKED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }`}
                                >
                                  {bed.permanentStatus}
                                </span>
                              </div>

                              {bed.permanentStatus !== 'BOOKED' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleBedMutation.mutate({
                                      bedId: bed.id,
                                      newStatus: bed.permanentStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE',
                                    })
                                  }
                                  className="w-full text-[10px] font-semibold py-1 rounded bg-[#FAF8F3] hover:bg-[#E8E5DE] text-[#687586] transition"
                                >
                                  Toggle {bed.permanentStatus === 'AVAILABLE' ? 'Maintenance' : 'Available'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Property Photos & Media Upload */}
                  <div className="pt-4 border-t border-[#E8E5DE] space-y-3">
                    <h4 className="text-xs font-bold text-[#102B50]">Property Photos & Verification Media</h4>
                    <p className="text-[11px] text-[#687586]">
                      Upload multiple high-resolution photos of rooms, bathrooms, kitchens, and common areas.
                    </p>
                    <MediaUploader
                      relatedEntityType="PROPERTY"
                      relatedEntityId={selectedPropId}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Booking Requests (No payment processing) */}
          {activeTab === 'bookings' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DE]">
                <div>
                  <h2 className="text-base font-black text-[#102B50]">Student Booking Requests</h2>
                  <p className="text-xs text-[#687586]">
                    Review and accept student accommodation reservation requests. (Financial payment is deferred).
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-[#687586] bg-[#FAF8F3] px-3 py-1.5 rounded-xl border border-[#E8E5DE]">
                  Double-Booking Collision Protection: Active
                </div>
              </div>

              {isBookingsLoading ? (
                <div className="py-12 text-center text-xs text-[#687586] flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" /> Loading requests...
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#102B50]">
                            {booking.bookingReference}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              booking.status === BookingStatus.REQUESTED
                                ? 'bg-[#E06D3B]/20 text-[#E06D3B]'
                                : booking.status === BookingStatus.ACCEPTED || booking.status === BookingStatus.CONFIRMED
                                ? 'bg-[#21865B]/10 text-[#21865B]'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {booking.status === BookingStatus.REQUESTED
                              ? 'Request Pending'
                              : booking.status === BookingStatus.ACCEPTED
                              ? 'Accepted by Owner'
                              : booking.status}
                          </span>
                        </div>

                        <div className="text-xs text-[#687586] space-y-0.5">
                          <p className="font-semibold text-[#102B50]">
                            {booking.studentId?.name} • Room {booking.roomId?.roomNumber || '—'}, Bed {booking.bedId?.bedLabel || '—'}
                          </p>
                          <p className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {booking.studentId?.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {booking.studentId?.phone}
                            </span>
                          </p>
                          <p className="flex items-center gap-1 text-[11px] text-[#687586]">
                            <Calendar className="w-3 h-3 text-[#F5A623]" />
                            Move-in: {new Date(booking.moveInDate).toLocaleDateString()} • Rent: ₹{booking.rentAmount}/mo (Listing info)
                          </p>
                        </div>
                      </div>

                      {/* Action buttons if still pending */}
                      {booking.status === BookingStatus.REQUESTED && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              decideBookingMutation.mutate({
                                bookingId: booking.id,
                                decision: 'ACCEPT',
                              })
                            }
                            disabled={decideBookingMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#21865B] hover:bg-[#1A6C49] transition shadow-xs disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Accept Request
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const reason = prompt('Please enter rejection reason:');
                              if (reason !== null) {
                                decideBookingMutation.mutate({
                                  bookingId: booking.id,
                                  decision: 'REJECT',
                                  reason,
                                });
                              }
                            }}
                            disabled={decideBookingMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#FAF8F3] border border-dashed border-[#E8E5DE] text-center text-xs text-[#687586]">
                  No student booking requests received yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: List New Property */}
          {activeTab === 'add-property' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-black text-[#102B50]">List New Student Property</h2>
                <p className="text-xs text-[#687586]">
                  Add verified hostel or PG details, GeoJSON map location, room types, and pricing.
                </p>
              </div>

              {propertySuccessMsg && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{propertySuccessMsg}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createPropertyMutation.mutate();
                }}
                className="space-y-6"
              >
                {/* Basic info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#102B50] mb-1">Property Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Greenwood Student Living"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE] focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102B50] mb-1">Accommodation Type</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE] focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                    >
                      <option value={PropertyType.HOSTEL}>Student Hostel</option>
                      <option value={PropertyType.PG}>Paying Guest (PG)</option>
                      <option value={PropertyType.STUDENT_FLAT}>Student Shared Flat</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe amenities, study environment, and security..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE] focus:outline-none focus:ring-1 focus:ring-[#102B50]"
                  />
                </div>

                {/* Location Picker */}
                <LocationPicker
                  coordinates={coords}
                  onChange={(newCoords) => setCoords(newCoords)}
                  label="Pinpoint Property Coordinates (Authoritative 2dsphere)"
                />

                {/* Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#102B50] mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. Plot 42, North Campus Road"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#102B50] mb-1">Landmark</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Metro Gate 3"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#102B50] mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#102B50] mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#102B50] mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE]"
                    />
                  </div>
                </div>

                {/* Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#102B50] mb-1">Gender Occupancy</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as GenderPreference)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE]"
                    >
                      <option value={GenderPreference.BOYS}>Boys Accommodation Only</option>
                      <option value={GenderPreference.GIRLS}>Girls Accommodation Only</option>
                      <option value={GenderPreference.CO_ED}>Co-Ed / Mixed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102B50] mb-1">Furnishing Level</label>
                    <select
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE]"
                    >
                      <option value={FurnishingType.FULLY_FURNISHED}>Fully Furnished</option>
                      <option value={FurnishingType.SEMI_FURNISHED}>Semi Furnished</option>
                      <option value={FurnishingType.UNFURNISHED}>Unfurnished</option>
                    </select>
                  </div>
                </div>

                {/* Initial Room Type and Pricing (Listing info only) */}
                <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E8E5DE] space-y-4">
                  <h3 className="text-xs font-bold text-[#102B50]">Initial Room Type Configuration</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#687586] mb-1">Room Type Name</label>
                      <input
                        type="text"
                        value={roomTypeName}
                        onChange={(e) => setRoomTypeName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E5DE]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#687586] mb-1">Sharing</label>
                      <select
                        value={sharingType}
                        onChange={(e) => setSharingType(e.target.value as SharingType)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E5DE]"
                      >
                        <option value={SharingType.SINGLE}>Single Room</option>
                        <option value={SharingType.DOUBLE}>Double Sharing</option>
                        <option value={SharingType.TRIPLE}>Triple Sharing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#687586] mb-1">Base Rent (₹/mo)</label>
                      <input
                        type="number"
                        value={baseRent}
                        onChange={(e) => setBaseRent(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E5DE]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#687586] mb-1">Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={deposit}
                        onChange={(e) => setDeposit(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E5DE]"
                      />
                    </div>
                  </div>
                </div>

                {/* Media Uploader */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#102B50]">Property Photographs</label>
                  <MediaUploader
                    relatedEntityType="PROPERTY"
                    onMediaUploaded={(media) => setUploadedPhotos((prev) => [...prev, media.url])}
                  />
                </div>

                <button
                  type="submit"
                  disabled={createPropertyMutation.isPending}
                  className="w-full py-3 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#1A3E6D] transition shadow-xs disabled:opacity-50"
                >
                  {createPropertyMutation.isPending ? 'Submitting Property...' : 'Submit Property for Listing'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: Owner Profile & KYC */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DE] shadow-sm space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-black text-[#102B50]">Owner Business Profile</h2>
                <p className="text-xs text-[#687586]">Manage your verified company and legal details.</p>
              </div>

              {profileSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfileMutation.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">Company / Trading Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Accommodations Ltd"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">Registered Business Address</label>
                  <textarea
                    rows={2}
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="Official address for agreements"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF8F3] border border-[#E8E5DE]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#102B50] hover:bg-[#1A3E6D] transition disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
