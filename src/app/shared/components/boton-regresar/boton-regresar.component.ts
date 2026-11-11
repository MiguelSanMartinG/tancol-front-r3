import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
@Component({
  selector: 'app-boton-regresar',
  imports: [ButtonModule, RouterLink],
  templateUrl: './boton-regresar.component.html',
  styleUrl: './boton-regresar.component.scss'
})
export class BotonRegresarComponent {
  router = input.required();
}
