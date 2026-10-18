import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { College, CollegeDocument } from './schemas/college.schema';

@Injectable()
export class CollegesService implements OnModuleInit {
  private readonly logger = new Logger(CollegesService.name);

  constructor(
    @InjectModel(College.name) private readonly collegeModel: Model<CollegeDocument>,
  ) {}

  async onModuleInit() {
    await this.seedInitialColleges();
  }

  async search(query: string, limit = 10): Promise<CollegeDocument[]> {
    if (!query || query.trim().length === 0) {
      return this.collegeModel
        .find({ status: 'ACTIVE' })
        .sort({ name: 1 })
        .limit(limit)
        .exec();
    }

    const cleanQuery = query.trim();
    return this.collegeModel
      .find({
        status: 'ACTIVE',
        $or: [
          { name: { $regex: cleanQuery, $options: 'i' } },
          { city: { $regex: cleanQuery, $options: 'i' } },
        ],
      })
      .sort({ name: 1 })
      .limit(limit)
      .exec();
  }

  async findBySlug(slug: string): Promise<CollegeDocument> {
    const college = await this.collegeModel
      .findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' })
      .exec();
    if (!college) {
      throw new NotFoundException(`College with slug '${slug}' not found.`);
    }
    return college;
  }

  async findById(id: string | Types.ObjectId): Promise<CollegeDocument> {
    const college = await this.collegeModel.findById(id).exec();
    if (!college) {
      throw new NotFoundException(`College not found.`);
    }
    return college;
  }

  private async seedInitialColleges() {
    const count = await this.collegeModel.countDocuments();
    if (count > 0) return;

    this.logger.log('Seeding initial verified university coordinates for geo-search...');
    const initialColleges = [
      {
        name: 'Amity University Noida',
        slug: 'amity-university-noida',
        city: 'Noida',
        state: 'Uttar Pradesh',
        // [longitude, latitude]
        location: {
          type: 'Point',
          coordinates: [77.3331, 28.5434],
        },
        status: 'ACTIVE',
      },
      {
        name: 'IIT Delhi',
        slug: 'iit-delhi',
        city: 'New Delhi',
        state: 'Delhi',
        location: {
          type: 'Point',
          coordinates: [77.1926, 28.545],
        },
        status: 'ACTIVE',
      },
      {
        name: 'Delhi University (North Campus)',
        slug: 'delhi-university-north-campus',
        city: 'Delhi',
        state: 'Delhi',
        location: {
          type: 'Point',
          coordinates: [77.2076, 28.6892],
        },
        status: 'ACTIVE',
      },
      {
        name: 'BITS Pilani',
        slug: 'bits-pilani',
        city: 'Pilani',
        state: 'Rajasthan',
        location: {
          type: 'Point',
          coordinates: [75.5878, 28.3639],
        },
        status: 'ACTIVE',
      },
    ];

    await this.collegeModel.insertMany(initialColleges);
    this.logger.log(`Successfully seeded ${initialColleges.length} university anchors.`);
  }
}
