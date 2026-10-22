import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Root & Diagnostic Probes')
@Public()
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API Root info and navigation' })
  @ApiResponse({ status: 200, description: 'Basic API metadata and documentation links' })
  getRoot() {
    return {
      name: 'Apna Ghar API',
      status: 'online',
      tagline: 'Har Sahar Apna Ghar — Trust-First Student Accommodation Platform',
      version: '1.0.0',
      docs: '/api/v1/docs',
      health: '/api/v1/health',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Liveness check for root port-scanners and load balancers' })
  @ApiResponse({ status: 200, description: 'Quick liveness response' })
  getHealth() {
    return {
      status: 'ok',
      message: 'Apna Ghar Backend API is operational. For full database & cache health, visit /api/v1/health',
      timestamp: new Date().toISOString(),
    };
  }
}
