import { formatCurrency, formatNumber } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formartNumber'
})
export class FormartNumberPipe implements PipeTransform {

  transform(value: any, ...args: unknown[]): unknown {
    return formatCurrency(value,'en','$');
  }

}
