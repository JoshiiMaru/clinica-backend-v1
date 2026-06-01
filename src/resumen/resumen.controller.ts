import { Controller, Get, Query } from '@nestjs/common';
import { ResumenService } from './resumen.service';

@Controller('resumen')
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