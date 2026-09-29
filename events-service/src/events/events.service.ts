import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  // crud do evento

  create(dto: CreateEventDto, organizerId: string) {
    return this.prisma.event.create({
      data: { ...dto, organizerId },
    });
  }

  findAll() {
    return this.prisma.event.findMany({
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }
    return event;
  }

  async update(id: string, dto: UpdateEventDto, requesterId: string) {
    const event = await this.findOne(id);

    if (event.organizerId !== requesterId) {
      throw new ForbiddenException('Você não é o organizador deste evento');
    }

    return this.prisma.event.update({ where: { id }, data: dto });
  }

  async remove(id: string, requesterId: string) {
    const event = await this.findOne(id);

    if (event.organizerId !== requesterId) {
      throw new ForbiddenException('Você não é o organizador deste evento');
    }

    await this.prisma.event.delete({ where: { id } });
    return { message: 'Evento removido com sucesso' };
  }

  // inscrições no evento

  async registerUser(eventId: string, userId: string) {
    const event = await this.findOne(eventId);

    const existing = await this.prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) {
      throw new ConflictException('Você já está inscrito neste evento');
    }

    const confirmedCount = await this.prisma.registration.count({
      where: { eventId, status: 'CONFIRMED' },
    });

    const status = confirmedCount >= event.capacity ? 'WAITLISTED' : 'CONFIRMED';

    return this.prisma.registration.create({
      data: { userId, eventId, status },
    });
  }

  async findRegistrations(eventId: string, requesterId: string) {
    const event = await this.findOne(eventId);

    if (event.organizerId !== requesterId) {
      throw new ForbiddenException('Só o organizador pode ver a lista de inscritos');
    }

    return this.prisma.registration.findMany({
      where: { eventId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}