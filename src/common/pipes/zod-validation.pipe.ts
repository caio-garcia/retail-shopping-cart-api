import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      const zodError = error as { errors?: unknown };
      throw new BadRequestException({
        message: 'Validation failed',
        errors: zodError.errors,
      });
    }
  }
}
