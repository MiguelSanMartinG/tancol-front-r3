import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateUtilService {
  private pad(value: number, size = 2): string {
    return value.toString().padStart(size, '0');
  }

  toLocalISOString(date: Date): string {
    return [
      `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`,
      `${this.pad(date.getHours())}:${this.pad(date.getMinutes())}:${this.pad(date.getSeconds())}.${this.pad(date.getMilliseconds(), 3)}`,
    ].join('T');
  }

  fromApiDateTime(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
      return new Date(value);
    }

    const [datePart, timePart = '00:00:00'] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [timeMain, fraction = '0'] = timePart.split('.');
    const [hours, minutes, seconds] = timeMain.split(':').map(Number);
    const milliseconds = Number((fraction + '000').slice(0, 3));

    return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, seconds || 0, milliseconds);
  }

  toUTCStartOfDay(date: Date): string {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)).toISOString();
  }

  toUTCEndOfDay(date: Date): string {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)).toISOString();
  }

}
