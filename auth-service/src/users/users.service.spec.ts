import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks(); // limpa o histórico de chamadas entre testes
  });

  describe('findById', () => {
    it('deve retornar o usuário quando encontrado', async () => {
      const fakeUser = { id: '1', name: 'Linda', email: 'linda@teste.com', role: 'PARTICIPANT' };
      mockPrismaService.user.findUnique.mockResolvedValue(fakeUser);

      const result = await service.findById('1');

      expect(result).toEqual(fakeUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.any(Object),
      });
    });

    it('deve lançar NotFoundException quando o usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('id-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve remover o usuário quando ele existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', role: 'PARTICIPANT' });
      mockPrismaService.user.delete.mockResolvedValue({ id: '1' });

      const result = await service.remove('1', 'organizer-id');

      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual({ message: 'Usuário removido com sucesso' });
    });

    it('deve lançar NotFoundException se o usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('id-inexistente', 'organizer-id')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.delete).not.toHaveBeenCalled();
    });
  });
});