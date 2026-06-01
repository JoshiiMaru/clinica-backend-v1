import { Controller, Get, Post, Body } from '@nestjs/common';
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

  @Get('hoy')
  obtenerHoy() {
    return this.gastosService.obtenerGastosHoy();
  }
}