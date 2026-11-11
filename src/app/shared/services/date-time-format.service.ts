import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';

@Injectable({ providedIn: 'root' })
export class DateTimeFormatService {
  format(value: Date | string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    let dt: DateTime;
    if (value instanceof Date) {
      dt = DateTime.fromJSDate(value);
    } else if (typeof value === 'number') {
      dt = DateTime.fromMillis(value);
    } else {
      dt = DateTime.fromISO(value);
      if (!dt.isValid) {
        dt = DateTime.fromSQL(value);
      }
      if (!dt.isValid) {
        dt = DateTime.fromRFC2822(value);
      }
    }

    if (!dt.isValid) {
      return '';
    }

    return dt.toFormat('dd-MM-yyyy HH:mm:ss');
  }
}
