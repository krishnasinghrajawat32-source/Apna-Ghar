import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollegesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllColleges(city?: string) {
    return this.prisma.college.findMany({
      where: city ? { city: { contains: city, mode: 'insensitive' } } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async getCollegeById(id: string) {
    const college = await this.prisma.college.findUnique({
      where: { id },
    });

    if (!college) {
      throw new NotFoundException(`College with ID '${id}' not found.`);
    }

    return college;
  }

  async getCollegeBySlug(slug: string) {
    const college = await this.prisma.college.findUnique({
      where: { slug },
    });

    if (!college) {
      throw new NotFoundException(`College with slug '${slug}' not found.`);
    }

    return college;
  }
}
