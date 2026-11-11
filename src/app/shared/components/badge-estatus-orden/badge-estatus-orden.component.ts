import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-badge-status-orden',
    imports: [TranslateModule],
  templateUrl: './badge-estatus-orden.component.html',
  styleUrl: './badge-estatus-orden.component.scss'
})
export class BadgeEstatusOrdenComponent {
  value = input('')
}
