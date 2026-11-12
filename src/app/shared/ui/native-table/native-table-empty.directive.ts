import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[tcNativeTableEmpty]',
  standalone: true,
})
export class TcNativeTableEmptyDirective {
  constructor(readonly template: TemplateRef<unknown>) {}
}
