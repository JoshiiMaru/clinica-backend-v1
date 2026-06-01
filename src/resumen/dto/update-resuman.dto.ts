import { PartialType } from '@nestjs/mapped-types';
import { CreateResumanDto } from './create-resuman.dto';

export class UpdateResumanDto extends PartialType(CreateResumanDto) {}
