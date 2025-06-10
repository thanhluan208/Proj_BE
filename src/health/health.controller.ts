import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async checkHealth() {
    try {
      // Test database connection
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get('db')
  async checkDatabase() {
    try {
      const result = await this.dataSource.query(
        'SELECT NOW() as current_time',
      );
      return {
        status: 'connected',
        timestamp: new Date().toISOString(),
        database_time: result[0].current_time,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
