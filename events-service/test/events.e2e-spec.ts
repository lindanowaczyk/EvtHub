import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { EventsService } from '../src/events/events.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('EventsService', () => {
  let service: EventsService;

  const mockPrismaService = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    registration: {
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<EventsService>(EventsService);
    jest.clearAllMocks();
  });

  const fakeEvent = {
    id: 'event-1',
    title: 'Workshop de React',
    organizerId: 'organizer-1',
    capacity: 2,
  };

  describe('create', () => {
    it('deve criar o evento vinculado ao organizador', async () => {
      mockPrismaService.event.create.mockResolvedValue(fakeEvent);

      const dto = {
        title: 'Workshop de React',
        description: 'x',
        location: 'x',
        startDate: '2026-11-10T14:00:00.000Z',
        endDate: '2026-11-10T17:00:00.000Z',
        capacity: 2,
      };

      const result = await service.create(dto as any, 'organizer-1');

      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: { ...dto, organizerId: 'organizer-1' },
      });
      expect(result).toEqual(fakeEvent);
    });
  });

  describe('findOne', () => {
    it('deve retornar o evento quando encontrado', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(fakeEvent);
      const result = await service.findOne('event-1');
      expect(result).toEqual(fakeEvent);
    });

    it('deve lançar NotFoundException quando não existe', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.findOne('id-invalido')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar quando o requisitante é o dono', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(fakeEvent);
      mockPrismaService.event.update.mockResolvedValue({ ...fakeEvent, capacity: 5 });

      const result = await service.update('event-1', { capacity: 5 } as any, 'organizer-1');

      expect(result.capacity).toBe(5);
    });

    it('deve lançar ForbiddenException quando o requisitante não é o dono', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(fakeEvent);

      await expect(
        service.update('event-1', { capacity: 5 } as any, 'outro-organizador'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.event.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover quando o requisitante é o dono', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(fakeEvent);
      mockPrismaService.event.delete.mockResolvedValue(fakeEvent);

      const result = await service.remove('event-1', 'organizer-1');

      expect(mockPrismaService.event.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } });
      expect(result).toEqual({ message: 'Evento removido com sucesso' });
    });

    it('deve lançar ForbiddenException quando o requisitante não é o dono', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(fakeEvent);

      await expect(service.remove('event-1', 'outro-organizador')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrismaService.event.delete).not.toHaveBeenCalled();
    });
  });

  describe('registerUser', () => {
    it('deve inscrever com status CONFIRMED quando há vaga', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(fakeEvent); // capacity: 2
      mockPrismaService.registration.findUnique.mockResolvedValue(null);
      mockPrismaService.registration.count.mockResolvedValue(1); // já tem 1 confirmado
      mockPrismaService.registration.create.mockResolvedValue({ status: 'CONFIRMED' });

      const result = await service.registerUser('event-1', 'user-1');

      expect(mockPrismaService.registration.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', eventId: 'event-1', status: 'CONFIRMED' },
      });
      expect(result.status).toBe('CONFIRMED');
    });

    it('deve inscrever com status WAITLISTED quando não há mais vaga', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(fakeEvent); // capacity: 2
      mockPrismaService.registration.findUnique.mockResolvedValue(null);
      mockPrismaService.registration.count.mockResolvedValue(2); // já lotado
      mockPrismaService.registration.create.mockResolvedValue({ status: 'WAITLISTED' });

      const result = await service.registerUser('event-1', 'user-3');

      expect(mockPrismaService.registration.create).toHaveBeenCalledWith({
        data: { userId: 'user-3', eventId: 'event-1', status: 'WAITLISTED' },
      });
      expect(result.status).toBe('WAITLISTED');
    });

    it('deve lançar ConflictException se o usuário já está inscrito', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(fakeEvent);
      mockPrismaService.registration.findUnique.mockResolvedValue({ id: 'reg-1' });

      await expect(service.registerUser('event-1', 'user-1')).rejects.toThrow(ConflictException);
      expect(mockPrismaService.registration.create).not.toHaveBeenCalled();
    });
  });

  describe('findRegistrations', () => {
    it('deve retornar a lista quando o requisitante é o dono', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(fakeEvent);
      mockPrismaService.registration.findMany.mockResolvedValue([{ id: 'reg-1' }]);

      const result = await service.findRegistrations('event-1', 'organizer-1');

      expect(result).toHaveLength(1);
    });

    it('deve lançar ForbiddenException quando o requisitante não é o dono', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(fakeEvent);

      await expect(
        service.findRegistrations('event-1', 'outro-organizador'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});