// ==========================================
// ROLE & USER ENUMS
// ==========================================

export enum UserRole {
  STUDENT = 'STUDENT',
  OWNER = 'OWNER',
  FOOD_PARTNER = 'FOOD_PARTNER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum GenderPreference {
  MALE_ONLY = 'MALE_ONLY',
  FEMALE_ONLY = 'FEMALE_ONLY',
  CO_ED = 'CO_ED',
  ANY = 'ANY',
}

export enum PropertyType {
  PG = 'PG',
  HOSTEL = 'HOSTEL',
  PRIVATE_ROOM = 'PRIVATE_ROOM',
  FLAT = 'FLAT',
  HOUSE = 'HOUSE',
  SHARED_ACCOMMODATION = 'SHARED_ACCOMMODATION',
}

export enum FurnishingStatus {
  FULLY_FURNISHED = 'FULLY_FURNISHED',
  SEMI_FURNISHED = 'SEMI_FURNISHED',
  UNFURNISHED = 'UNFURNISHED',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum BedStatus {
  AVAILABLE = 'AVAILABLE',
  TEMPORARILY_HELD = 'TEMPORARILY_HELD',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

export enum VisitStatus {
  REQUESTED = 'REQUESTED',
  CONFIRMED = 'CONFIRMED',
  RESCHEDULED = 'RESCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum BookingStatus {
  REQUESTED = 'REQUESTED',
  OWNER_APPROVED = 'OWNER_APPROVED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentProvider {
  RAZORPAY = 'RAZORPAY',
  CASHFREE = 'CASHFREE',
  SYSTEM_MOCK = 'SYSTEM_MOCK',
}

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  ELIGIBILITY_CHECK = 'ELIGIBILITY_CHECK',
  APPROVED = 'APPROVED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  REJECTED = 'REJECTED',
}

export enum CancellationReason {
  STUDENT_CANCELLATION = 'STUDENT_CANCELLATION',
  OWNER_CANCELLATION = 'OWNER_CANCELLATION',
  PROPERTY_MISREPRESENTATION = 'PROPERTY_MISREPRESENTATION',
  PLATFORM_FAILURE = 'PLATFORM_FAILURE',
  VALID_DISPUTE = 'VALID_DISPUTE',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED_STUDENT = 'RESOLVED_STUDENT',
  RESOLVED_OWNER = 'RESOLVED_OWNER',
  PARTIAL_RESOLUTION = 'PARTIAL_RESOLUTION',
  CLOSED = 'CLOSED',
}

export enum FoodOrderStatus {
  PLACED = 'PLACED',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum DietaryType {
  VEG = 'VEG',
  NON_VEG = 'NON_VEG',
  EGG_ONLY = 'EGG_ONLY',
  JAIN = 'JAIN',
}

export enum MealPlanFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

// ==========================================
// STANDARD API RESPONSE CONTRACTS
// ==========================================

export interface ApiResponseMeta {
  timestamp: string;
  requestId?: string;
}

export interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: ApiResponseMeta;
}

export interface ApiErrorDetail {
  field?: string;
  issue: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  meta?: ApiResponseMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedApiResponse<T = any> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  meta?: ApiResponseMeta;
}

// ==========================================
// AUTH & USER INTERFACES
// ==========================================

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
}

export interface AuthSessionResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

// ==========================================
// PROPERTY & INVENTORY CONTRACTS
// ==========================================

export interface AddressDto {
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface BedSummaryDto {
  id: string;
  bedIdentifier: string;
  status: BedStatus;
  holdExpiresAt?: string;
}

export interface RoomSummaryDto {
  id: string;
  roomNumber: string;
  floor: number;
  isUnderMaint: boolean;
  totalBeds: number;
  availableBeds: number;
  beds: BedSummaryDto[];
}

export interface RoomTypeSummaryDto {
  id: string;
  name: string;
  sharingCount: number;
  baseRent: number;
  hasAttachedBath: boolean;
  hasBalcony: boolean;
  hasAirCondition: boolean;
  totalBeds: number;
  availableBeds: number;
  rooms?: RoomSummaryDto[];
}

export interface PropertySummaryDto {
  id: string;
  name: string;
  slug: string;
  propertyType: PropertyType;
  genderPreference: GenderPreference;
  furnishing: FurnishingStatus;
  status: ListingStatus;
  isVerified: boolean;
  securityDeposit: number;
  minRent: number;
  totalBeds: number;
  availableBeds: number;
  city?: string;
  averageRating: number;
  reviewCount: number;
  primaryImageUrl?: string;
}

export interface PropertyDetailDto {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  propertyType: PropertyType;
  genderPreference: GenderPreference;
  furnishing: FurnishingStatus;
  status: ListingStatus;
  isVerified: boolean;
  verificationScore: number;
  securityDeposit: number;
  maintenanceCharges: number;
  estimatedElectricity?: number;
  waterCharges?: number;
  foodAvailability: boolean;
  foodIncludedInRent: boolean;
  noticePeriodDays: number;
  gateClosingTime?: string;
  smokingAllowed: boolean;
  alcoholAllowed: boolean;
  visitorsAllowed: boolean;
  averageRating: number;
  reviewCount: number;
  address?: AddressDto;
  amenities: Array<{ id: string; name: string; icon: string; category: string }>;
  roomTypes: RoomTypeSummaryDto[];
  media: Array<{ id: string; type: string; cdnUrl: string; isPrimary: boolean; caption?: string }>;
  totalBeds: number;
  availableBeds: number;
}

// ==========================================
// PHASE 3: CAMPUS, SEARCH & COMPARISON
// ==========================================

export interface CollegeDto {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface PropertySearchResultDto extends PropertySummaryDto {
  distanceKm: number;
  collegeName?: string;
}

export interface PropertyComparisonItemDto {
  property: PropertySummaryDto;
  monthlyCostEstimate: number;
  distanceKm?: number;
  amenityNames: string[];
  rules: {
    gateClosingTime?: string;
    smokingAllowed: boolean;
    alcoholAllowed: boolean;
    visitorsAllowed: boolean;
    noticePeriodDays: number;
  };
  costs: {
    rent: number;
    deposit: number;
    maintenance: number;
    estimatedElectricity?: number;
    waterCharges?: number;
  };
  features: {
    hasAirCondition: boolean;
    hasAttachedBath: boolean;
    foodAvailability: boolean;
    foodIncludedInRent: boolean;
  };
}

export interface ComparisonMatrixDto {
  properties: PropertyComparisonItemDto[];
  comparisonFields: Array<{ key: string; label: string; category: string }>;
}

export interface FavoriteDto {
  id: string;
  studentId: string;
  propertyId: string;
  property: PropertySummaryDto;
  createdAt: string;
}

// ==========================================
// PHASE 4: VISITS, LOCKS & BOOKINGS
// ==========================================

export interface VisitDto {
  id: string;
  studentId: string;
  propertyId: string;
  ownerId: string;
  requestedDate: string;
  requestedSlot: string;
  confirmedSlot?: string | null;
  status: VisitStatus;
  cancellationReason?: string | null;
  createdAt: string;
  property?: {
    name: string;
    city?: string;
  };
}

export interface CreateVisitDto {
  propertyId: string;
  requestedDate: string;
  requestedSlot: string;
}

export interface UpdateVisitDto {
  status: VisitStatus;
  confirmedSlot?: string;
  cancellationReason?: string;
}

export interface BookingStatusHistoryDto {
  id: string;
  bookingId: string;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  actorId: string;
  reason?: string | null;
  timestamp: string;
}

export interface BookingDto {
  id: string;
  bookingCode: string;
  studentId: string;
  bedId: string;
  status: BookingStatus;
  monthlyRent: number;
  securityDeposit: number;
  bookingAmount: number;
  platformFee: number;
  startDate: string;
  endDate?: string | null;
  actualCheckIn?: string | null;
  actualCheckOut?: string | null;
  createdAt: string;
  bed?: BedSummaryDto;
  statusHistory?: BookingStatusHistoryDto[];
}

export interface CreateBookingDto {
  bedId: string;
  startDate: string;
  endDate?: string;
}

export interface HoldBedResponseDto {
  bookingId: string;
  bedId: string;
  holdExpiresAt: string;
  expiresInSeconds: number;
}

// ==========================================
// PHASE 5: PAYMENTS, REFUNDS & DISPUTES
// ==========================================

export interface CreatePaymentOrderDto {
  bookingId: string;
  provider?: PaymentProvider;
}

export interface PaymentOrderResponseDto {
  paymentId: string;
  provider: PaymentProvider;
  providerOrderId: string;
  amount: number;
  currency: string;
  keyId?: string;
}

export interface PaymentDto {
  id: string;
  bookingId: string;
  userId: string;
  provider: PaymentProvider;
  providerOrderId: string;
  providerPaymentId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface CancellationCalculationDto {
  bookingId: string;
  bookingAmount: number;
  startDate: string;
  daysBeforeCheckIn: number;
  refundPercentage: number;
  eligibleRefundAmount: number;
  cancellationFee: number;
}

export interface RefundDto {
  id: string;
  bookingId: string;
  paymentId: string;
  providerRefundId?: string | null;
  amount: number;
  reason: CancellationReason;
  status: RefundStatus;
  notes?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export interface DisputeEvidenceDto {
  id: string;
  disputeId: string;
  uploadedBy: string;
  storageKey: string;
  mimeType: string;
  description?: string | null;
  createdAt: string;
}

export interface DisputeDto {
  id: string;
  bookingId: string;
  studentId: string;
  ownerId: string;
  raisedByRole: UserRole;
  reason: string;
  description: string;
  status: DisputeStatus;
  adminDecision?: string | null;
  refundAmount?: number | null;
  evidence?: DisputeEvidenceDto[];
  closedAt?: string | null;
  createdAt: string;
}

export interface CreateDisputeDto {
  bookingId: string;
  reason: string;
  description: string;
}

export interface AddDisputeEvidenceDto {
  storageKey: string;
  mimeType: string;
  description?: string;
}

export interface ResolveDisputeDto {
  status: DisputeStatus;
  adminDecision: string;
  refundAmount?: number;
}

// ==========================================
// PHASE 6: FOOD MARKETPLACE & SUBSCRIPTIONS
// ==========================================

export interface MenuItemDto {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  dietaryType: DietaryType;
  isAvailable: boolean;
  imageUrl?: string | null;
}

export interface MenuCategoryDto {
  id: string;
  menuId: string;
  name: string;
  displayOrder: number;
  items: MenuItemDto[];
}

export interface MenuDto {
  id: string;
  foodPartnerId: string;
  title: string;
  isActive: boolean;
  categories: MenuCategoryDto[];
}

export interface MealPlanDto {
  id: string;
  foodPartnerId: string;
  title: string;
  description: string;
  frequency: MealPlanFrequency;
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
  price: number;
  dietaryType: DietaryType;
  isActive: boolean;
}

export interface FoodOrderItemDto {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  menuItem?: {
    name: string;
    dietaryType: DietaryType;
  };
}

export interface FoodOrderDto {
  id: string;
  orderCode: string;
  studentId: string;
  foodPartnerId: string;
  status: FoodOrderStatus;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  deliveryAddress: string;
  deliveryNotes?: string | null;
  createdAt: string;
  items: FoodOrderItemDto[];
  foodPartner?: {
    businessName: string;
    phone: string;
  };
}

export interface FoodSubscriptionDto {
  id: string;
  studentId: string;
  foodPartnerId: string;
  mealPlanId: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  priceSnapshot: number;
  deliveryAddress: string;
  pausedAt?: string | null;
  resumedAt?: string | null;
  createdAt: string;
  mealPlan?: MealPlanDto;
}

// ==========================================
// PHASE 7: REVIEWS, RECOMMENDATIONS & MESSAGING
// ==========================================

export enum ReviewCategory {
  CLEANLINESS = 'CLEANLINESS',
  FOOD_QUALITY = 'FOOD_QUALITY',
  SAFETY = 'SAFETY',
  AMENITIES = 'AMENITIES',
  LANDLORD_RESPONSIVENESS = 'LANDLORD_RESPONSIVENESS',
}

export interface CreateReviewCategoryRatingDto {
  category: string;
  rating: number;
}

export interface CreateReviewDto {
  bookingId: string;
  overallRating: number;
  comment: string;
  categoryRatings?: CreateReviewCategoryRatingDto[];
}

export interface ReviewCategoryRatingDto {
  id: string;
  reviewId: string;
  category: string;
  rating: number;
}

export interface ReviewDto {
  id: string;
  studentId: string;
  propertyId: string;
  bookingId: string;
  overallRating: number;
  comment: string;
  isVerifiedStay: boolean;
  isApproved: boolean;
  createdAt: string;
  categoryRatings?: ReviewCategoryRatingDto[];
  student?: {
    firstName: string;
    lastName: string;
  };
}

export interface PropertyReviewSummaryDto {
  averageRating: number;
  totalReviews: number;
  categoryAverages: Record<string, number>;
  starDistribution: Record<number, number>;
}

export interface ReportReviewDto {
  reason: string;
  details: string;
}

export interface RecommendationQueryDto {
  campusSlug?: string;
  latitude?: number;
  longitude?: number;
  maxBudget?: number;
  genderPreference?: GenderPreference;
  amenities?: string[];
  limit?: number;
}

export interface RecommendedPropertyDto {
  property: any;
  matchScore: number;
  reasons: string[];
  distanceKm?: number;
}

export interface ConversationParticipantDto {
  id: string;
  userId: string;
  lastReadAt?: string | null;
  user?: {
    email: string;
    role: UserRole;
  };
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    email: string;
    role: UserRole;
  };
}

export interface ConversationDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipantDto[];
  lastMessage?: MessageDto | null;
  unreadCount?: number;
}

export interface CreateConversationDto {
  recipientUserId: string;
  initialMessage?: string;
}

export interface SendMessageDto {
  content: string;
}

export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  VISIT_SCHEDULED = 'VISIT_SCHEDULED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  DISPUTE_UPDATED = 'DISPUTE_UPDATED',
  SYSTEM = 'SYSTEM',
}

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

// ==========================================
// PHASE 8: ADMIN GOVERNANCE & PLATFORM METRICS
// ==========================================

export interface AdminPlatformMetricsDto {
  totalUsers: {
    total: number;
    students: number;
    owners: number;
    foodPartners: number;
    admins: number;
  };
  inventory: {
    totalProperties: number;
    verifiedProperties: number;
    totalBeds: number;
    availableBeds: number;
    reservedBeds: number;
    occupiedBeds: number;
    occupancyRate: number; // percentage, e.g. 75.5%
  };
  financials: {
    platformGmv: number;
    platformRevenue: number;
    totalBookings: number;
    totalFoodOrders: number;
  };
}

export interface UpdateUserStatusDto {
  status: UserStatus;
  reason?: string;
}

export interface ResolveReportDto {
  isResolved: boolean;
  actionTaken?: string;
  resolutionNotes?: string;
}

export interface CreateCommissionRuleDto {
  role: UserRole;
  percentage: number;
  flatFee?: number;
  appliesTo: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface CommissionRuleDto {
  id: string;
  role: UserRole;
  percentage: number;
  flatFee: number;
  appliesTo: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
}


