import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [ConfigModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
