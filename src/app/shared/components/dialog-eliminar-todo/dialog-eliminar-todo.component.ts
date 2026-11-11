import { Component, output} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-dialog-eliminar-todo',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    NgTemplateOutlet,
  ],
  templateUrl: './eliminar.component.html',
  styleUrl: './eliminar.component.scss',
})
export class DialogEliminarTodoComponent {
  display = false;
  reject = output<void>();
  accept = output<void>();
  total: number = 0;
  constructor() {
  }
  handleAccept() {
    this.accept.emit();
    this.handleHide();
  }
  onDisplay(total = 0){
    this.display = true;
    this.total = total;
  }
  handleReject() {
    this.reject.emit();
    this.handleHide();
  }
  handleHide() {
    this.display = false;
    this.total = 0;
  }
}
