import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

@Controller('pacientes')
@UseGuards(AccessTokenGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get('dni/:dni')
  buscarPorDni(@Param('dni') dni: string) {
    return this.pacientesService.buscarPorDni(dni);
  }
}