"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const common_1 = require("@nestjs/common");
const tickets_service_1 = require("./tickets.service");
const ticket_schema_1 = require("./schemas/ticket.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const shared_types_1 = require("@apna-ghar/shared-types");
describe('TicketsService', () => {
    let service;
    const mockStudentId = new mongoose_2.Types.ObjectId().toString();
    const mockPropertyId = new mongoose_2.Types.ObjectId();
    const mockTicketId = new mongoose_2.Types.ObjectId();
    const mockPropertyDoc = {
        _id: mockPropertyId,
        name: 'Apna Ghar Residency',
    };
    const mockTicketDoc = {
        _id: mockTicketId,
        studentId: new mongoose_2.Types.ObjectId(mockStudentId),
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
        find: jest.fn(),
    };
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                tickets_service_1.TicketsService,
                {
                    provide: (0, mongoose_1.getModelToken)(ticket_schema_1.Ticket.name),
                    useValue: mockTicketModel,
                },
                {
                    provide: (0, mongoose_1.getModelToken)(property_schema_1.Property.name),
                    useValue: mockPropertyModel,
                },
            ],
        }).compile();
        service = module.get(tickets_service_1.TicketsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('createTicket', () => {
        it('should throw BadRequestException if propertyId is invalid', async () => {
            await expect(service.createTicket(mockStudentId, {
                propertyId: 'invalid-id',
                category: 'PLUMBING',
                title: 'Leaking tap',
                description: 'Tap dripping',
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException if property does not exist', async () => {
            mockPropertyModel.findById.mockResolvedValue(null);
            await expect(service.createTicket(mockStudentId, {
                propertyId: mockPropertyId.toString(),
                category: 'PLUMBING',
                title: 'Leaking tap',
                description: 'Tap dripping',
            })).rejects.toThrow(common_1.NotFoundException);
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
            expect(mockTicketModel.create).toHaveBeenCalledWith(expect.objectContaining({
                category: 'PLUMBING',
                title: 'Leaking tap',
                status: 'OPEN',
            }));
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
                studentId: new mongoose_2.Types.ObjectId(mockStudentId),
            });
        });
    });
    describe('getPropertyTickets', () => {
        it('should throw BadRequestException on invalid propertyId format', async () => {
            await expect(service.getPropertyTickets('not-an-oid')).rejects.toThrow(common_1.BadRequestException);
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
    describe('getOwnerTickets', () => {
        it('should return list of tickets for properties owned by owner', async () => {
            mockPropertyModel.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([{ _id: mockPropertyId }]),
                }),
            });
            mockTicketModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            exec: jest.fn().mockResolvedValue([mockTicketDoc]),
                        }),
                    }),
                }),
            });
            const tickets = await service.getOwnerTickets(mockStudentId);
            expect(tickets).toHaveLength(1);
        });
    });
    describe('updateTicketStatus', () => {
        it('should throw BadRequestException on invalid ticketId', async () => {
            await expect(service.updateTicketStatus('bad-id', shared_types_1.UserRole.OWNER, { status: 'IN_PROGRESS' })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw ForbiddenException if student tries to set status to IN_PROGRESS', async () => {
            await expect(service.updateTicketStatus(mockTicketId.toString(), shared_types_1.UserRole.STUDENT, { status: 'IN_PROGRESS' })).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should throw NotFoundException if ticket does not exist', async () => {
            mockTicketModel.findById.mockResolvedValue(null);
            await expect(service.updateTicketStatus(mockTicketId.toString(), shared_types_1.UserRole.OWNER, { status: 'IN_PROGRESS' })).rejects.toThrow(common_1.NotFoundException);
        });
        it('should update ticket status to IN_PROGRESS by OWNER', async () => {
            const ticketToUpdate = {
                ...mockTicketDoc,
                status: 'OPEN',
                save: jest.fn().mockResolvedValue(true),
            };
            mockTicketModel.findById.mockResolvedValue(ticketToUpdate);
            const result = await service.updateTicketStatus(mockTicketId.toString(), shared_types_1.UserRole.OWNER, { status: 'IN_PROGRESS' });
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
            const result = await service.updateTicketStatus(mockTicketId.toString(), shared_types_1.UserRole.STUDENT, { status: 'CLOSED', resolutionNotes: 'Confirmed fixed' });
            expect(result.status).toBe('CLOSED');
            expect(ticketToUpdate.save).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=tickets.service.spec.js.map