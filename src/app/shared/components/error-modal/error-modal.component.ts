import { Component, effect, inject } from '@angular/core';
import { DialogErrorService } from './dialog-error.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HttpClient } from '@angular/common/http';
import { filter, Subscription } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss'],
  imports: [AppPrimengModule],
  animations: [
    trigger('fadeInOut', [
      transition(':leave', [
        // Animación al salir (cuando @if es false)
        animate(
          '300ms ease-out',
          style({
            opacity: 0,
          })
        ),
      ]),
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
      ]),
    ]),
  ],
})
export class ErrorModalComponent {
  dialogError = inject(DialogErrorService);
  http = inject(HttpClient);
  sugerenciaError: string = '';
  private routeSub!: Subscription;
  private router = inject(Router);

  constructor() {
    effect(()=> {
      this.sugerenciaError = '';
      const error = this.dialogError.dataError();
      const status = error?.status?.toString() ?? '-1';
      switch(status){
        case '0':
          this.sugerenciaError = 'No se pudo conectar con el servidor. Verifica tu conexión y vuelve a intentarlo.'
          break;
        default:
          this.sugerenciaError = 'Vuelve a intentarlo. Si el problema continúa, contacta al administrador.';
      }
    });

        // Suscripción a cambios de ruta
        this.routeSub = this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd)
        )
        .subscribe((data) => {
          console.log(data);
          // Cierra el modal cuando la ruta cambia
          this.dialogError.display.set(false);
          
          // Opcional: Reiniciar el estado de error si es necesario
          // this.dialogError.resetErrorState();
        });


  }
  handleRetry(){
    this.dialogError.display.set(false);
    window.location.reload();
  }

}
