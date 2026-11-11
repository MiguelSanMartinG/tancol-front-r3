import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-badge-prioridad-orden',
  imports: [TranslateModule],
  templateUrl: './badge-prioridad-orden.component.html',
  styleUrl: './badge-prioridad-orden.component.scss'
})
export class BadgePrioridadOrdenComponent {
  value = input<string>('')
}
