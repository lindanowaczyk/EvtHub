import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';

@Module({
  imports: [AuthModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}