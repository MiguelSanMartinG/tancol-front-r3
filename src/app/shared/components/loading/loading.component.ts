import { trigger, transition, animate, style } from '@angular/animations';
import { Component, inject } from '@angular/core';
import { LoadingService } from '@shared/components/loading/loading-service.service';

/** Indicador global: barra superior y bloqueo de clics al guardar. Las pantallas muestran esqueletos (skeleton). */
@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':leave', [animate('200ms ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class LoadingComponent {
  loadingService = inject(LoadingService);
}
