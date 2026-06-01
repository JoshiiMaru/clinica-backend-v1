import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumenService } from './resumen.service';
import { ResumenController } from './resumen.controller';
import { Atencion } from '../atenciones/entities/atencion.entity';
import { Gasto } from '../gastos/entities/gasto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Atencion, Gasto])],
  controllers: [ResumenController],
  providers: [ResumenService],
})
export class ResumenModule {}