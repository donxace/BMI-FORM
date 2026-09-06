import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryPersonnelDto } from './create-inventory-personnel.dto';

export class UpdateInventoryPersonnelDto extends PartialType(CreateInventoryPersonnelDto) {}
