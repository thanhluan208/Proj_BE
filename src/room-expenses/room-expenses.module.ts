import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomExpensesController } from './room-expenses.controller';
import { RoomExpensesService } from './room-expenses.service';
import { RoomExpenseRepository } from './room-expense.repository';
import { RoomExpenseEntity } from 'src/room-expenses/room-expense.entity';
import { RoomModule } from 'src/rooms/room.module';
import { RoomRepository } from 'src/rooms/room.repository';
import { RoomEntity } from 'src/rooms/room.entity';

@Module({
  imports: [
    RoomModule,
    TypeOrmModule.forFeature([RoomExpenseEntity, RoomEntity]),
  ],
  controllers: [RoomExpensesController],
  providers: [RoomExpensesService, RoomExpenseRepository, RoomRepository],
  exports: [RoomExpensesService],
})
export class RoomExpensesModule {}
