import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { AtencionesService } from './atenciones.service';

@Controller('atenciones')
export class AtencionesController {
  constructor(private readonly atencionesService: AtencionesService) {}

  @Post()
  registrar(@Body() datos: any) {
    return this.atencionesService.registrar(datos);
  }

  @Get('hoy')
  obtenerHoy() {
    return this.atencionesService.obtenerAtencionesHoy();
  }

  @Get('deudas')
  obtenerDeudas(@Query('dni') dni?: string) {
    return this.atencionesService.obtenerDeudas(dni);
  }

  // NUEVA RUTA: Permite actualizar todo el procedimiento (nombre, montos, citas)
  @Patch('procedimiento/:id')
  actualizarProcedimiento(@Param('id') id: string, @Body() datos: any) {
    return this.atencionesService.actualizarProcedimiento(id, datos);
  }

  // NUEVA RUTA: Permite abonar específicamente a la deuda de un procedimiento
  @Patch('procedimiento/:id/abonar')
  abonarDeuda(@Param('id') id: string, @Body('abono') abono: number) {
    return this.atencionesService.abonarDeudaProcedimiento(id, abono);
  }

  // NUEVA RUTA: Buscar Citas
  @Get('agenda/filtrar')
  obtenerAgenda(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string
  ) {
    return this.atencionesService.obtenerAgenda(inicio, fin);
  }

  // NUEVA RUTA: Convertir cita en atención nueva
  @Post('atender-cita/:id')
  atenderCita(@Param('id') idProcedimientoPrevio: string, @Body() datos: any) {
    return this.atencionesService.atenderCita(idProcedimientoPrevio, datos);
  }

  // NUEVA RUTA: PATCH /atenciones/procedimiento/:id/reprogramar
  @Patch('procedimiento/:id/reprogramar')
  reprogramarCita(
    @Param('id') id: string, 
    @Body() datos: { fecha: string; hora: string }
  ) {
    return this.atencionesService.reprogramarCita(id, datos.fecha, datos.hora);
  }
}