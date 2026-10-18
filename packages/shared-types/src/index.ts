/**
 * Apna Ghar — Central Shared Domain Models & Contracts
 */

export enum UserRole {
  STUDENT = 'STUDENT',
  OWNER = 'OWNER',
  MESS_PARTNER = 'MESS_PARTNER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
}

export enum GenderPreference {
  BOYS = 'BOYS',
  GIRLS = 'GIRLS',
  CO_ED = 'CO_ED',
}

export enum FurnishingType {
  FULLY_FURNISHED = 'FULLY_FURNISHED',
  SEMI_FURNISHED = 'SEMI_FURNISHED',
  UNFURNISHED = 'UNFURNISHED',
}

export enum PropertyType {
  HOSTEL = 'HOSTEL',
  PG = 'PG',
  STUDENT_FLAT = 'STUDENT_FLAT',
}

export enum PropertyStatus {
  DRAFT = 'DRAFT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum SharingType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  TRIPLE = 'TRIPLE',
  FOUR_PLUS = 'FOUR_PLUS',
}

export enum BedStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum VerificationType {
  OWNER_IDENTITY = 'OWNER_IDENTITY',
  LOCATION = 'LOCATION',
  PHOTOS = 'PHOTOS',
  PRICING = 'PRICING',
  AMENITIES = 'AMENITIES',
  INVENTORY = 'INVENTORY',
  DOCUMENTS = 'DOCUMENTS',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum AvailabilityFreshness {
  FRESH = 'FRESH', // < 24 hrs
  NEEDS_CONFIRMATION = 'NEEDS_CONFIRMATION', // 24-72 hrs
  STALE = 'STALE', // > 72 hrs
}

export enum CostCategory {
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
  ESTIMATED = 'ESTIMATED',
}

export enum VisitStatus {
  REQUESTED = 'REQUESTED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  NOT_STARTED = 'NOT_STARTED',
  INITIATED = 'INITIATED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// GeoJSON Point format: [longitude, latitude]
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface Address {
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

// API Responses
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasNext?: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Core Entity Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface College {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  location: GeoPoint;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  propertyType: PropertyType;
  description: string;
  address: Address;
  location: GeoPoint;
  genderPreference: GenderPreference;
  furnishing: FurnishingType;
  status: PropertyStatus;
  amenities: string[];
  rules: string[];
  images: string[];
  distanceMeters?: number; // Calculated dynamically by $geoNear
  createdAt: string;
  updatedAt: string;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  sharingType: SharingType;
  baseRent: number;
  deposit: number;
  attachedBathroom: boolean;
  ac: boolean;
  furnishingDetails: string[];
}

export interface Room {
  id: string;
  propertyId: string;
  roomTypeId: string;
  floorNumber: number;
  roomNumber: string;
  status: 'ACTIVE' | 'MAINTENANCE';
}

export interface Bed {
  id: string;
  propertyId: string;
  roomId: string;
  roomTypeId: string;
  bedLabel: string;
  permanentStatus: BedStatus;
  expectedVacancyDate?: string;
}

export interface TrustCheckpoint {
  type: VerificationType;
  status: VerificationStatus;
  verifiedAt?: string;
  expiresAt?: string;
  notes?: string;
}

export interface TrustPassport {
  id?: string;
  propertyId: string;
  isFullyVerified: boolean;
  score?: number;
  lastVerifiedAt?: string;
  checkpoints: TrustCheckpoint[];
}

export interface AvailabilityFreshnessInfo {
  availableBedCount: number;
  lastAvailabilityUpdatedAt: string;
  freshness: AvailabilityFreshness;
}

export interface CostItem {
  name: string;
  amount: number;
  category: CostCategory;
  frequency: 'MONTHLY' | 'ONE_TIME' | 'ANNUAL';
  description?: string;
}

export interface TotalLivingCost {
  rent: number;
  foodEstimate: number;
  electricityEstimate: number;
  maintenance: number;
  laundry: number;
  internet: number;
  commuteEstimate: number;
  otherRecurring: number;
  estimatedMonthlyTotal: number;
  lineItems: CostItem[];
}

export interface BookingHoldPayload {
  holdId: string;
  bedId: string;
  userId: string;
  sessionId?: string;
  createdAt: number;
  expiresAt: number;
}

export interface HoldResponse {
  holdId: string;
  bedId: string;
  expiresAt: string; // ISO 8601 string
  ttlSecondsRemaining: number;
}

export interface Visit {
  id: string;
  studentId: string;
  propertyId: string;
  ownerId: string;
  scheduledAt: string;
  status: VisitStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  studentId: string;
  propertyId: string;
  roomId: string;
  bedId: string;
  roomTypeId: string;
  moveInDate: string;
  rentAmount: number;
  depositAmount: number;
  totalInitialPayment: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      type: 'mongodb';
    };
    cache: {
      status: 'connected' | 'mock_fallback' | 'error';
      type: 'redis';
    };
  };
}
