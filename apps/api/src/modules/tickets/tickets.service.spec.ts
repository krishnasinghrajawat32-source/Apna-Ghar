import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { Ticket } from './schemas/ticket.schema';
import { Property } from '../properties/schemas/property.schema';
import { UserRole } from '@apna-ghar/shared-types';

describe('TicketsService', () => {
  let service: TicketsService;

  const mockStudentId = new Types.ObjectId().toString();
  const mockPropertyId = new Types.ObjectId();
  const mockTicketId = new Types.ObjectId();

  const mockPropertyDoc = {
    _id: mockPropertyId,
    name: 'Apna Ghar Residency',
  };

  const mockTicketDoc = {
    _id: mockTicketId,
    studentId: new Types.ObjectId(mockStudentId),
    propertyId: mockPropertyId,
    category: 'PLUMBING',
    title: 'Leaking tap in bathroom',
    description: 'Bathroom sink tap dripping constantly',
    priority: 'MEDIUM',
    status: 'OPEN',
    save: jest.fn().mockResolvedValue(true),
  };

  const mockTicketModel = {
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
  };

  const mockPropertyModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getModelToken(Ticket.name),
          useValue: mockTicketModel,
        },
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTicket', () => {
    it('should throw BadRequestException if propertyId is invalid', async () => {
      await expect(
        service.createTicket(mockStudentId, {
          propertyId: 'invalid-id',
          category: 'PLUMBING',
          title: 'Leaking tap',
          description: 'Tap dripping',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if property does not exist', async () => {
      mockPropertyModel.findById.mockResolvedValue(null);

      await expect(
        service.createTicket(mockStudentId, {
          propertyId: mockPropertyId.toString(),
          category: 'PLUMBING',
          title: 'Leaking tap',
          description: 'Tap dripping',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and return ticket successfully', async () => {
      mockPropertyModel.findById.mockResolvedValue(mockPropertyDoc);
      mockTicketModel.create.mockResolvedValue(mockTicketDoc);
      mockTicketModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockTicketDoc),
        }),
      });

      const result = await service.createTicket(mockStudentId, {
        propertyId: mockPropertyId.toString(),
        category: 'PLUMBING',
        title: 'Leaking tap',
        description: 'Tap dripping',
      });

      expect(result).toBeDefined();
      expect(mockTicketModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'PLUMBING',
          title: 'Leaking tap',
          status: 'OPEN',
        }),
      );
    });
  });

  describe('getStudentTickets', () => {
    it('should return list of tickets for student', async () => {
      mockTicketModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockTicketDoc]),
          }),
        }),
      });

      const tickets = await service.getStudentTickets(mockStudentId);
      expect(tickets).toHaveLength(1);
      expect(mockTicketModel.find).toHaveBeenCalledWith({
        studentId: new Types.ObjectId(mockStudentId),
      });
    });
  });

  describe('getPropertyTickets', () => {
    it('should throw BadRequestException on invalid propertyId format', async () => {
      await expect(service.getPropertyTickets('not-an-oid')).rejects.toThrow(BadRequestException);
    });

    it('should return list of tickets for property', async () => {
      mockTicketModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockTicketDoc]),
          }),
        }),
      });

      const tickets = await service.getPropertyTickets(mockPropertyId.toString());
      expect(tickets).toHaveLength(1);
    });
  });

  describe('updateTicketStatus', () => {
    it('should throw BadRequestException on invalid ticketId', async () => {
      await expect(
        service.updateTicketStatus('bad-id', UserRole.OWNER, { status: 'IN_PROGRESS' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if student tries to set status to IN_PROGRESS', async () => {
      await expect(
        service.updateTicketStatus(mockTicketId.toString(), UserRole.STUDENT, { status: 'IN_PROGRESS' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockTicketModel.findById.mockResolvedValue(null);

      await expect(
        service.updateTicketStatus(mockTicketId.toString(), UserRole.OWNER, { status: 'IN_PROGRESS' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update ticket status to IN_PROGRESS by OWNER', async () => {
      const ticketToUpdate = {
        ...mockTicketDoc,
        status: 'OPEN',
        save: jest.fn().mockResolvedValue(true),
      };
      mockTicketModel.findById.mockResolvedValue(ticketToUpdate);

      const result = await service.updateTicketStatus(
        mockTicketId.toString(),
        UserRole.OWNER,
        { status: 'IN_PROGRESS' },
      );

      expect(result.status).toBe('IN_PROGRESS');
      expect(ticketToUpdate.save).toHaveBeenCalled();
    });

    it('should allow student to CLOSE a resolved ticket', async () => {
      const ticketToUpdate = {
        ...mockTicketDoc,
        status: 'RESOLVED',
        save: jest.fn().mockResolvedValue(true),
      };
      mockTicketModel.findById.mockResolvedValue(ticketToUpdate);

      const result = await service.updateTicketStatus(
        mockTicketId.toString(),
        UserRole.STUDENT,
        { status: 'CLOSED', resolutionNotes: 'Confirmed fixed' },
      );

      expect(result.status).toBe('CLOSED');
      expect(ticketToUpdate.save).toHaveBeenCalled();
    });
  });
});
