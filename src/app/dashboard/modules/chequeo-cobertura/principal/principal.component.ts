import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { EquipoAsignacionService, RevisionCobertura } from '../../cliente/services/equipo-asignacion.service';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';

@Component({
  selector: 'app-chequeo-cobertura',
  imports: [CommonModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent {
  private equipoAsignacionService = inject(EquipoAsignacionService);
  resultado = signal<RevisionCobertura | null>(null);

  ejecutar() {
    this.equipoAsignacionService.revisarCobertura().subscribe((resultado) => this.resultado.set(resultado));
  }
}
