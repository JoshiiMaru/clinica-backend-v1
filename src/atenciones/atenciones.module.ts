import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtencionesService } from './atenciones.service';
import { AtencionesController } from './atenciones.controller';
import { Atencion } from './entities/atencion.entity';
import { DetalleProcedimiento } from './entities/detalle-procedimiento.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { AuthModule } from '../auth/auth.module';
import { DetalleProducto } from './entities/detalle-producto.entity';

@Module({
  imports: [AuthModule,TypeOrmModule.forFeature([Atencion, DetalleProcedimiento, Paciente, DetalleProducto])],
  controllers: [AtencionesController],
  providers: [AtencionesService],
})
export class AtencionesModule {}