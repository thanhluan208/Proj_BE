import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  @Get('i18n')
  checkI18n() {
    const text = this.i18n.t('auth.title', {
      lang: I18nContext.current()?.lang,
    });
    return {
      message: text,
      lang: I18nContext.current()?.lang,
    };
  }

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
