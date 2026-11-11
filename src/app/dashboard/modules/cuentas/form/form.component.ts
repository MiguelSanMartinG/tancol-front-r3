import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { TablaDescuentosRequestDto, TablaDescuentosService } from '@shared/services/tabla-descuentos.service';
import { parse } from 'uuid';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    MessageErrorComponent,
    AppPrimengModule
  ],
})
export class FormCuentasComponent implements OnInit {
    fb = inject(FormBuilder);
    tablaDescuentosService = inject(TablaDescuentosService);
    @Input() edit: boolean = true;
    @Output() editchange = new EventEmitter<boolean>();
    @Output() totalChange = new EventEmitter<number>();

    formulario = this.fb.group({
    cuenta1: ['', [Validators.required]],
    cuenta2: ['', [Validators.required]],
    cuenta3: ['', [Validators.required]],


  });
  constructor() { }

  ngOnInit() {
    this.tablaDescuentosService.getUltimoDescuento().subscribe({
      next: (response) => {
        console.log(response);
        this.formulario.patchValue({
          cuenta1: response.a1.toString(),
          cuenta2: response.a2.toString(),
          cuenta3: response.a3.toString(),
        }, { emitEvent: false });
        // Emitimos el total inicial
        this.totalChange.emit(this.total);
      },
      error: (error) => {
        console.log(error);
      }
    });

    // Emitir actualizaciones del total en tiempo real cuando cambian las cuentas
    this.formulario.valueChanges.subscribe(() => {
      this.totalChange.emit(this.total);
    });
  }

    ngOnChanges(changes: SimpleChanges): void {
    if (changes['edit']) {
      this.setEditMode(this.edit);
    }
  }

  private setEditMode(edit: boolean) {
    if (edit) {
      this.formulario.enable({ emitEvent: false });
    } else {
      this.formulario.disable({ emitEvent: false });
    }
  }

  guardar(){
    console.log(this.formulario.getRawValue());
    const request: TablaDescuentosRequestDto = {
      cuentaA: parseFloat(this.formulario.get('cuenta1')?.value as string) || 0,
      cuentaB: parseFloat(this.formulario.get('cuenta2')?.value as string) || 0,
      cuentaC: parseFloat(this.formulario.get('cuenta3')?.value as string) || 0,
    };
    this.tablaDescuentosService.create(request).subscribe({
      next: (response) => {
        console.log(response);
        this.editchange.emit(false);
        // Emitimos el total actualizado después de guardar
        this.totalChange.emit(this.total);
      },
      error: (error) => {
        console.log(error);
      }
    });
    // Lógica para enviar el request al servicio correspondiente
  }

  get total(): number {
  const c1 = Number(this.formulario.get('cuenta1')?.value) || 0;
  const c2 = Number(this.formulario.get('cuenta2')?.value) || 0;
  const c3 = Number(this.formulario.get('cuenta3')?.value) || 0;

  return c1 + c2 + c3;
}


}
