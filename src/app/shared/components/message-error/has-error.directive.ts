import {Directive, Input} from '@angular/core';

@Directive({
  selector: '[appHasError]',
  standalone: true,
})
export class HasErrorDirective {
  @Input() appHasError!: string;
  @Input() message!: string;
  get key(): string {
    return this.appHasError;
  }
}
