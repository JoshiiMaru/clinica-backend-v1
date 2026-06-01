import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AtencionesModule } from './atenciones/atenciones.module';
import { GastosModule } from './gastos/gastos.module';
import { ResumenModule } from './resumen/resumen.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { Usuario } from './auth/entities/usuario.entity';
import { Atencion } from './atenciones/entities/atencion.entity';
import { Gasto } from './gastos/entities/gasto.entity';
import { Paciente } from './pacientes/entities/paciente.entity';
import { DetalleProcedimiento } from './atenciones/entities/detalle-procedimiento.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', // Cambia esto por tus credenciales
      password: 'postgres', // Cambia esto por tus credenciales
      database: 'clinica_v1',
      entities: [Usuario, Atencion, Gasto, Paciente, DetalleProcedimiento],
      synchronize: true, // En true para desarrollo: creará las tablas automáticamente
    }),
    AuthModule,
    AtencionesModule,
    GastosModule,
    ResumenModule,
    PacientesModule,
  ],
})
export class AppModule {}