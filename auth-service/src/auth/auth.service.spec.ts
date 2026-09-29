import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// mocka o módulo bcrypt inteiro, pra controlar o resultado de hash no teste
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto = { name: 'Linda', email: 'linda@teste.com', password: 'senha123' };

    it('deve criar o usuário e retornar accessToken quando o e-mail é novo', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null); // e-mail ainda não existe
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash-fake');
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        name: dto.name,
        email: dto.email,
        role: 'PARTICIPANT',
      });

      const result = await service.register(dto);

      expect(result.accessToken).toBe('fake-jwt-token');
      expect(result.user.email).toBe(dto.email);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: { name: dto.name, email: dto.email, passwordHash: 'hash-fake' },
      });
    });

    it('deve lançar ConflictException se o e-mail já existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: dto.email });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = { email: 'linda@teste.com', password: 'senha123' };
    const fakeUser = {
      id: '1',
      name: 'Linda',
      email: dto.email,
      role: 'PARTICIPANT',
      passwordHash: 'hash-fake',
    };

    it('deve retornar accessToken quando as credenciais estão corretas', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result.accessToken).toBe('fake-jwt-token');
    });

    it('deve lançar UnauthorizedException se o usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se a senha está errada', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});