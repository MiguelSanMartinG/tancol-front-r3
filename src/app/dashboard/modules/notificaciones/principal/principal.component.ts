import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Notificacion, NotificacionesService } from '@app/core/services/notificaciones.service';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-notificaciones',
  imports: [CommonModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent, RouterLink],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent implements OnInit {
  private notificacionesService = inject(NotificacionesService);
  notificaciones = this.notificacionesService.notificaciones;

  ngOnInit() {
    this.notificacionesService.cargar();
  }

  marcarComoLeida(notificacion: Notificacion) {
    this.notificacionesService.marcarComoLeida(notificacion);
  }
}
