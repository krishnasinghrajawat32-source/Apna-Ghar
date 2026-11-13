import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { CollegesService } from '../colleges/colleges.service';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { BedStatus, AvailabilityFreshness, PropertyType } from '@apna-ghar/shared-types';
import { FRESHNESS_THRESHOLDS } from '@apna-ghar/shared-constants';

export interface PropertySearchResult {
  id: string;
  name: string;
  slug: string;
  propertyType: string;
  address: {
    street: string;
    city: string;
    state: string;
  };
  location: {
    type: string;
    coordinates: [number, number];
  };
  genderPreference: string;
  furnishing: string;
  isFullyVerified: boolean;
  distanceMeters?: number;
  startingRent: number;
  availableBedsCount: number;
  totalBedsCount: number;
  hasAc: boolean;
  hasFood: boolean;
  sharingTypes: string[];
  images: string[];
  freshness: AvailabilityFreshness;
  lastAvailabilityUpdatedAt: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    private readonly collegesService: CollegesService,
  ) {}

  async search(dto: SearchPropertiesDto) {
    // Determine city filter
    let searchCity: string | null = null;
    if (dto.city) {
      searchCity = dto.city.trim();
    } else if (dto.college) {
      const c = dto.college.toLowerCase().trim();
      if (['bhopal', 'indore', 'gwalior'].includes(c)) {
        searchCity = dto.college.trim();
      }
    } else if (dto.q) {
      const q = dto.q.toLowerCase().trim();
      if (['bhopal', 'indore', 'gwalior'].includes(q)) {
        searchCity = dto.q.trim();
      } else if (q.includes('bhopal')) {
        searchCity = 'Bhopal';
      } else if (q.includes('indore')) {
        searchCity = 'Indore';
      } else if (q.includes('gwalior')) {
        searchCity = 'Gwalior';
      }
    }

    let collegeAnchorName: string | null = null;
    if (searchCity) {
      searchCity = searchCity.charAt(0).toUpperCase() + searchCity.slice(1).toLowerCase();
      collegeAnchorName = searchCity;
    }

    // Determine property type filter
    let propertyTypeFilter = dto.propertyType;
    if (!propertyTypeFilter && dto.q) {
      const qLower = dto.q.toLowerCase();
      if (qLower.includes('hostel')) {
        propertyTypeFilter = PropertyType.HOSTEL;
      } else if (qLower.includes('pg') || qLower.includes('paying guest')) {
        propertyTypeFilter = PropertyType.PG;
      } else if (qLower.includes('flat') || qLower.includes('apartment')) {
        propertyTypeFilter = PropertyType.STUDENT_FLAT;
      }
    }

    const page = dto.page || 1;
    const limit = dto.limit && dto.limit !== 12 ? dto.limit : (searchCity ? 50 : 12);
    const skip = (page - 1) * limit;

    let centerCoordinates: [number, number] | null = null;

    if (dto.college && !['bhopal', 'indore', 'gwalior'].includes(dto.college.toLowerCase().trim())) {
      try {
        let collegeDoc;
        if (Types.ObjectId.isValid(dto.college)) {
          collegeDoc = await this.collegesService.findById(dto.college);
        } else {
          collegeDoc = await this.collegesService.findBySlug(dto.college);
        }

        if (collegeDoc && collegeDoc.location?.coordinates) {
          centerCoordinates = collegeDoc.location.coordinates;
          collegeAnchorName = collegeDoc.name;
        }
      } catch (err) {
        this.logger.warn(`College anchor lookup '${dto.college}' did not resolve: ${err}`);
      }
    }

    const pipeline: PipelineStage[] = [];

    const baseMatch: Record<string, any> = {
      status: 'ACTIVE',
      ...(dto.gender ? { genderPreference: dto.gender } : {}),
      ...(dto.verifiedOnly ? { isFullyVerified: true } : {}),
    };

    if (searchCity) {
      baseMatch['address.city'] = new RegExp(`^${searchCity}$`, 'i');
    }

    if (propertyTypeFilter) {
      if ((propertyTypeFilter as string) === 'FLAT' || propertyTypeFilter === PropertyType.STUDENT_FLAT) {
        baseMatch['propertyType'] = { $in: ['STUDENT_FLAT', 'FLAT'] };
      } else {
        baseMatch['propertyType'] = propertyTypeFilter;
      }
    }

    if (dto.q && !searchCity) {
      const escapedQ = dto.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      baseMatch['$or'] = [
        { name: new RegExp(escapedQ, 'i') },
        { 'address.city': new RegExp(escapedQ, 'i') },
        { 'address.street': new RegExp(escapedQ, 'i') },
        { 'address.landmark': new RegExp(escapedQ, 'i') },
      ];
    } else if (dto.q && searchCity) {
      const qRemaining = dto.q
        .replace(new RegExp(searchCity, 'gi'), '')
        .replace(/hostel|pg|flat|in|for|boys|girls/gi, '')
        .trim();
      if (qRemaining.length > 2) {
        const escapedQ = qRemaining.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        baseMatch['$or'] = [
          { name: new RegExp(escapedQ, 'i') },
          { 'address.street': new RegExp(escapedQ, 'i') },
          { 'address.landmark': new RegExp(escapedQ, 'i') },
        ];
      }
    }

    // Stage 1: Geospatial $geoNear if college coordinates are resolved AND no explicit city was given
    if (centerCoordinates && !searchCity) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: centerCoordinates,
          },
          distanceField: 'distanceMeters',
          maxDistance: dto.radius || 5000,
          spherical: true,
          query: baseMatch,
        },
      } as PipelineStage);
    } else {
      pipeline.push({
        $match: baseMatch,
      });
    }

    // Stage 2: Join roomTypes to compute starting rent, AC, and sharing
    pipeline.push(
      {
        $lookup: {
          from: 'roomTypes',
          localField: '_id',
          foreignField: 'propertyId',
          as: 'roomTypes',
        },
      },
      {
        $lookup: {
          from: 'beds',
          localField: '_id',
          foreignField: 'propertyId',
          as: 'beds',
        },
      },
      {
        $addFields: {
          startingRent: { $min: '$roomTypes.baseRent' },
          hasAc: {
            $in: [true, '$roomTypes.ac'],
          },
          hasFood: {
            $in: [true, '$roomTypes.foodIncluded'],
          },
          sharingTypes: '$roomTypes.sharingType',
          totalBedsCount: { $size: '$beds' },
          availableBedsCount: {
            $size: {
              $filter: {
                input: '$beds',
                as: 'b',
                cond: { $eq: ['$$b.permanentStatus', BedStatus.AVAILABLE] },
              },
            },
          },
        },
      },
    );

    // Stage 3: Dynamic filters on joined room fields
    const joinedMatch: Record<string, unknown> = {};

    if (dto.minPrice !== undefined) {
      joinedMatch['startingRent'] = { ...(joinedMatch['startingRent'] || {}), $gte: dto.minPrice };
    }
    if (dto.maxPrice !== undefined) {
      joinedMatch['startingRent'] = { ...(joinedMatch['startingRent'] || {}), $lte: dto.maxPrice };
    }
    if (dto.ac !== undefined) {
      joinedMatch['hasAc'] = dto.ac;
    }
    if (dto.food !== undefined) {
      joinedMatch['hasFood'] = dto.food;
    }
    if (dto.sharing) {
      joinedMatch['sharingTypes'] = dto.sharing;
    }

    if (Object.keys(joinedMatch).length > 0) {
      pipeline.push({ $match: joinedMatch });
    }

    // Count facet for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];

    // Sorting Stage
    let sortStage: Record<string, 1 | -1> = { isFullyVerified: -1, createdAt: -1 };
    if (dto.sort === 'nearest' && centerCoordinates) {
      sortStage = { distanceMeters: 1 };
    } else if (dto.sort === 'lowest_rent') {
      sortStage = { startingRent: 1 };
    } else if (dto.sort === 'recently_updated') {
      sortStage = { lastAvailabilityUpdatedAt: -1 };
    }

    pipeline.push(
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
    );

    const [results, countResult] = await Promise.all([
      this.propertyModel.aggregate(pipeline).exec(),
      this.propertyModel.aggregate(countPipeline).exec(),
    ]);

    const total = countResult[0]?.total || 0;
    const hasNext = skip + results.length < total;

    const formattedData: PropertySearchResult[] = results.map((item) => {
      const updatedAt = item.lastAvailabilityUpdatedAt
        ? new Date(item.lastAvailabilityUpdatedAt)
        : new Date(item.updatedAt);
      const diffHours = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);

      let freshness = AvailabilityFreshness.FRESH;
      if (diffHours > FRESHNESS_THRESHOLDS.NEEDS_CONFIRMATION_HOURS) {
        freshness = AvailabilityFreshness.STALE;
      } else if (diffHours > FRESHNESS_THRESHOLDS.FRESH_HOURS) {
        freshness = AvailabilityFreshness.NEEDS_CONFIRMATION;
      }

      return {
        id: item._id.toString(),
        name: item.name,
        slug: item.slug,
        propertyType: item.propertyType,
        address: {
          street: item.address?.street || '',
          city: item.address?.city || '',
          state: item.address?.state || '',
        },
        location: item.location,
        genderPreference: item.genderPreference,
        furnishing: item.furnishing,
        isFullyVerified: !!item.isFullyVerified,
        distanceMeters: item.distanceMeters !== undefined ? Math.round(item.distanceMeters) : undefined,
        startingRent: item.startingRent || 0,
        availableBedsCount: item.availableBedsCount || 0,
        totalBedsCount: item.totalBedsCount || 0,
        hasAc: !!item.hasAc,
        hasFood: !!item.hasFood,
        sharingTypes: Array.from(new Set(item.sharingTypes || [])),
        images: item.images || [],
        freshness,
        lastAvailabilityUpdatedAt: updatedAt.toISOString(),
      };
    });

    return {
      collegeAnchor: collegeAnchorName || 'Madhya Pradesh',
      data: formattedData,
      meta: {
        page,
        limit,
        total,
        hasNext,
      },
    };
  }
}
