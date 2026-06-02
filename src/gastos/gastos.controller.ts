import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { GastosService } from './gastos.service';

@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Post()
  registrar(@Body() datos: any) {
    return this.gastosService.registrar(datos);
  }

  @Get()
  obtenerGastos() {
    return this.gastosService.obtenerGastos();
  }

  // NUEVA RUTA: Buscar Gastos por Fechas
  @Get('filtrar')
  obtenerGastosFiltrados(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string
  ) {
    return this.gastosService.obtenerGastosFiltrados(inicio, fin);
  }

  @Get('hoy')
  obtenerHoy() {
    return this.gastosService.obtenerGastosHoy();
  }
}