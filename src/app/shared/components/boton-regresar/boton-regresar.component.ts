import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-boton-regresar',
  imports: [RouterLink, TooltipModule],
  templateUrl: './boton-regresar.component.html',
  styleUrl: './boton-regresar.component.scss'
})
export class BotonRegresarComponent {
  router = input.required();
  tooltip = input('Regresar');
}
