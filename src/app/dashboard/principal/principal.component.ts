import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Notificacion, NotificacionesService } from '@app/core/services/notificaciones.service';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LocalStorageService } from '@shared/services/local-storage.service';

@Component({
  selector: 'app-principal',
    imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss'
})
export class PrincipalComponent implements OnInit {

  localStorage = inject(LocalStorageService);
  notificacionesService = inject(NotificacionesService);

  notificaciones = this.notificacionesService.notificaciones;
  pendientes = this.notificacionesService.pendientes;
  noLeidas = this.notificacionesService.noLeidas;
  puedeVerNotificaciones = (this.localStorage.getProfiles() ?? []).some((profile) =>
    profile.module?.ruta?.split(/[?#]/)[0].split('/').filter(Boolean).at(-1) === 'notificaciones' && profile.canRead
  );

  ngOnInit() {
    if (this.puedeVerNotificaciones) this.notificacionesService.cargar();
  }

  marcarComoLeida(notificacion: Notificacion) {
    this.notificacionesService.marcarComoLeida(notificacion);
  }
}
