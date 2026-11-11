import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'valueEmpty',
})
export class ValueEmptyPipe implements PipeTransform {
  transform(value: any, ...args: unknown[]): unknown {
    return value != 'null' ? value : '--';
  }
}
