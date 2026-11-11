import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';
import { TipoEquipoApiService } from '../../tipo-equipo/services/tipo-equipo.api.service';
import { EquipoApiService } from '../services/equipo.api.service';
import { EquipoDto } from '../services/equipo.dto';

@Component({
  selector: 'app-equipo-registrar',
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
  imports: [AppPrimengModule, ReactiveFormsModule, AppSharedModule, HeaderComponent, MessageErrorComponent],
})
export class EquipoRegistrarComponent implements OnInit {
  api = inject(EquipoApiService); tipoApi = inject(TipoEquipoApiService); uploadApi = inject(UploadFileApiService);
  fb = inject(FormBuilder); router = inject(Router); route = inject(ActivatedRoute); messageService = inject(MessageService);
  tipos: any[] = []; archivo: File | null = null;
  formulario = this.fb.group({ nombre: ['', Validators.required], sku: [''], idTipoEquipo: ['', Validators.required], descripcion: [''], marca: [''], modelo: [''] });
  ngOnInit() { this.tipoApi.getAll().subscribe(items => this.tipos = items.filter(item => item.enabled !== false).map(item => ({ label: item.nombre, value: item.id }))); }
  seleccionarArchivo(event: Event) { this.archivo = ((event.target as HTMLInputElement).files || [])[0] || null; }
  guardar() {
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    if (this.archivo) { this.uploadApi.create(this.archivo).subscribe(resp => this.enviar(resp.fileName)); } else this.enviar('');
  }
  private enviar(idImagen: string) {
    this.api.create({ ...this.formulario.getRawValue(), idImagen } as EquipoDto).subscribe(() => { this.messageService.add({ severity: 'success', summary: 'Registro exitoso', detail: 'Se registró el equipo.' }); this.router.navigate(['../'], { relativeTo: this.route }); });
  }
}
