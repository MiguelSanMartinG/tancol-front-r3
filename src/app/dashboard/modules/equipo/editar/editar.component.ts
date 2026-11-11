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
import { EquipoResponse } from '../services/equipo.response';

@Component({ selector: 'app-equipo-editar', templateUrl: './editar.component.html', styleUrl: './editar.component.scss', imports: [AppPrimengModule, ReactiveFormsModule, AppSharedModule, HeaderComponent, MessageErrorComponent] })
export class EquipoEditarComponent implements OnInit {
  api = inject(EquipoApiService); tipoApi = inject(TipoEquipoApiService); uploadApi = inject(UploadFileApiService); fb = inject(FormBuilder); router = inject(Router); route = inject(ActivatedRoute); messageService = inject(MessageService);
  tipos: any[] = []; archivo: File | null = null; id = '';
  clienteAsignado: EquipoResponse['clienteAsignado'] = null;
  formulario = this.fb.group({ nombre: ['', Validators.required], sku: [''], idTipoEquipo: ['', Validators.required], descripcion: [''], marca: [''], modelo: [''], idImagen: [''] });
  ngOnInit() { this.tipoApi.getAll().subscribe(items => this.tipos = items.filter(item => item.enabled !== false).map(item => ({ label: item.nombre, value: item.id }))); const id = this.route.snapshot.paramMap.get('id'); if (id) { this.id = id; this.api.getOne(id).subscribe(item => { this.clienteAsignado = item.clienteAsignado; this.formulario.patchValue({ ...item, idTipoEquipo: item.tipoEquipo?.id }); }); } }
  seleccionarArchivo(event: Event) { this.archivo = ((event.target as HTMLInputElement).files || [])[0] || null; }
  guardar() { if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; } if (this.archivo) this.uploadApi.create(this.archivo).subscribe(resp => this.enviar(resp.fileName)); else this.enviar(this.formulario.value.idImagen || ''); }
  private enviar(idImagen: string) { this.api.update({ ...this.formulario.getRawValue(), idImagen } as EquipoDto, this.id).subscribe(() => { this.messageService.add({ severity: 'success', summary: 'Actualización exitosa', detail: 'Se actualizó el equipo.' }); this.router.navigate(['../../'], { relativeTo: this.route }); }); }
}
