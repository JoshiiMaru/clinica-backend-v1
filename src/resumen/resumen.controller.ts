import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ResumenService } from './resumen.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

@Controller('resumen')
@UseGuards(AccessTokenGuard)
export class ResumenController {
  constructor(private readonly resumenService: ResumenService) {}

  // Cambiamos 'hoy' por 'filtrar'
  @Get('filtrar')
  obtenerResumenFiltrado(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string
  ) {
    return this.resumenService.obtenerResumen(inicio, fin);
  }
}