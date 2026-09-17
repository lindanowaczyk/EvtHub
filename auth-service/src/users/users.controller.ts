import { Controller, Get, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  removeSelf(@Req() req: AuthenticatedRequest) {
    return this.usersService.removeSelf(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.remove(id, req.user.userId);
  }
}