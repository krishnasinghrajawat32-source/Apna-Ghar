import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { College } from './schemas/college.schema';

describe('CollegesService', () => {
  let service: CollegesService;
  let mockCollegeModel: any;

  const mockCollege = {
    _id: '651a1a2b3c4d5e6f7a8b9c11',
    name: 'Amity University Noida',
    slug: 'amity-university-noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    location: {
      type: 'Point',
      coordinates: [77.3331, 28.5434],
    },
    status: 'ACTIVE',
    toJSON: () => mockCollege,
  };

  beforeEach(async () => {
    mockCollegeModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockCollege]),
          }),
        }),
      }),
      findOne: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(4),
      insertMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollegesService,
        {
          provide: getModelToken(College.name),
          useValue: mockCollegeModel,
        },
      ],
    }).compile();

    service = module.get<CollegesService>(CollegesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should search colleges by name or city', async () => {
    const results = await service.search('Amity');
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Amity University Noida');
    expect(mockCollegeModel.find).toHaveBeenCalled();
  });

  it('should find college by slug', async () => {
    mockCollegeModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockCollege),
    });

    const result = await service.findBySlug('amity-university-noida');
    expect(result.name).toBe('Amity University Noida');
    expect(mockCollegeModel.findOne).toHaveBeenCalledWith({
      slug: 'amity-university-noida',
      status: 'ACTIVE',
    });
  });

  it('should throw NotFoundException if slug not found', async () => {
    mockCollegeModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.findBySlug('unknown-college')).rejects.toThrow(NotFoundException);
  });
});
