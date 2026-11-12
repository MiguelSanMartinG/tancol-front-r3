import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[tcNativeTableCell]',
  standalone: true,
})
export class TcNativeTableCellDirective {
  @Input('tcNativeTableCell') columnId = '';

  constructor(readonly template: TemplateRef<any>) {}
}
