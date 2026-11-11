import { trigger, transition, animate, style } from '@angular/animations';
import {Component, computed, effect, inject} from '@angular/core';
import { LoadingService } from '@shared/components/loading/loading-service.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':leave', [ // Animación al salir (cuando @if es false)
        animate('300ms ease-out', style({ 
          opacity: 0,
        }))
      ])
    ])
  ]
})
export class LoadingComponent {
  loadingService = inject(LoadingService);
}
