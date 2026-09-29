import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateEventDto, @Req() req: AuthenticatedRequest) {
    return this.eventsService.create(dto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.eventsService.update(id, dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.eventsService.remove(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  register(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.eventsService.registerUser(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/registrations')
  findRegistrations(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.eventsService.findRegistrations(id, req.user.userId);
  }
}