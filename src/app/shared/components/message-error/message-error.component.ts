import {Component, ContentChildren, Input, QueryList} from '@angular/core';
import {HasErrorDirective} from './has-error.directive';
import { FieldValidControlService } from '@shared/services/field-valid-control.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message-error',
  standalone: true,
  imports: [ProgressSpinnerModule, CommonModule],
  templateUrl: './message-error.component.html',
  styleUrls: ['./message-error.component.scss']
})
export class MessageErrorComponent {
  @Input() control: any;
  @Input() messageRequired = 'Este campo es requerido.';
  @ContentChildren(HasErrorDirective) listHasErrorDirectiveContent!: QueryList<HasErrorDirective>;
  private listHasErrorDirectiveInput!: QueryList<HasErrorDirective>;
  constructor(
    public fieldValidControlService: FieldValidControlService,
  ) {}
  findCustomError(hasError: string) {
    return this.listHasErrorDirective?.find((row) => row.key === hasError);
  }
  @Input()
  get listHasErrorDirective():  QueryList<HasErrorDirective>{
    return this.listHasErrorDirectiveContent.length > 0 ? this.listHasErrorDirectiveContent : this.listHasErrorDirectiveInput;
  }
  set listHasErrorDirective(value){
    this.listHasErrorDirectiveInput = value;
  }
}
