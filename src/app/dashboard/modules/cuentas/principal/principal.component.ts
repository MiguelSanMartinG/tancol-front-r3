import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { EliminarRolComponent } from '../../rol/eliminar/eliminar.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { FormCuentasComponent } from '../form/form.component';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.scss'],
    imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    FormCuentasComponent
  ],
})
export class PrincipalComponent implements OnInit {


  constructor() { }

  ngOnInit() {
  }

}
