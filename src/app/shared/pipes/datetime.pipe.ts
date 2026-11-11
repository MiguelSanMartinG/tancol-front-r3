import { Pipe, PipeTransform, inject } from '@angular/core';
import { DateTimeFormatService } from '../services/date-time-format.service';

@Pipe({
  name: 'datetime'
})
export class DatetimePipe implements PipeTransform {
  private readonly dateTimeFormatService = inject(DateTimeFormatService);

  transform(value: unknown): string {
    return this.dateTimeFormatService.format(value as Date | string | number | null | undefined);
  }

}
