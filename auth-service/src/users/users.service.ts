import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async remove(id: string, requesterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (user.role === Role.ORGANIZER && user.id !== requesterId) {
      throw new ForbiddenException('Organizadores não podem remover outros organizadores');
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: 'Usuário removido com sucesso' };
  }
}