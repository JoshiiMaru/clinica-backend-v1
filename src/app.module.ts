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
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: {
          rejectUnauthorized: false
        },
      }),
    }),
    AuthModule,
    AtencionesModule,
    GastosModule,
    ResumenModule,
    PacientesModule,
  ],
})
export class AppModule {}