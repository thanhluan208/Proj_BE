import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseExpensesController } from './house-expenses.controller';
import { HouseExpensesService } from './house-expenses.service';
import { HouseExpenseEntity } from './house-expense.entity';
import { HouseExpenseRepository } from './house-expense.repository';
import { HousesModule } from 'src/houses/house.module';

@Module({
  imports: [HousesModule, TypeOrmModule.forFeature([HouseExpenseEntity])],
  controllers: [HouseExpensesController],
  providers: [HouseExpensesService, HouseExpenseRepository],
  exports: [HouseExpensesService],
})
export class HouseExpensesModule {}
