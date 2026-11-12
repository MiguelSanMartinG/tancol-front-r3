import { Component, computed, EventEmitter, inject, OnInit, Output, Signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageService } from 'primeng/api';
import { MessageErrorComponent } from '../../../../shared/components/message-error/message-error.component';
import { NgTemplateOutlet } from '@angular/common';
import { SelectModel } from '@core/common/select.model';
import { RegistrarCategoriaProductoComponent } from '../../categoria-producto/registrar/registrar.component';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';
import { NuestrosProductosService } from '../service/nuestros-productos.service';
import { CategoriaNuestrosProductosApiService } from '../../categoria-nuestros-productos/service/categoria-nuestros-productos-api.service';
import { FormComponent } from '../../categoria-nuestros-productos/form/form.component';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';

@Component({
  selector: 'app-registrar-producto',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    NgTemplateOutlet,
    RegistrarCategoriaProductoComponent,
    FormComponent
  ],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarProductoComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();
  display = false;
  isUpload = false;
  nuestroProducto = inject(NuestrosProductosService);
  uploadFileApi = inject(UploadFileApiService);
  categoriaNuestroProductoApiService = inject(CategoriaNuestrosProductosApiService);
    unidadMedidaApiService = inject (UnidadMedidaService)
  
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: ['', Validators.required],
    sku: [''],
    alias: [''],
    precio:[''],
    descripcion: [''],
    categoriaProducto: ['', [Validators.required]],
    unidadMedida:['',[Validators.required]],
    presentacion: [''],
    image: [
      {
        file: null,
        url: null,
      },
    ],
  });
  messageService = inject(MessageService);
  listaCategoriaProductoSelecccionar: Signal<SelectModel[]> = computed(() => {
    if (this.categoriaNuestroProductoApiService.listAll().length > 0) {
      return this.categoriaNuestroProductoApiService.listAll().map((row) => ({
        label: row.nombre,
        value: row.idCategoriaComercial,
      }));
    } else {
      return [];
    }
  });
          listaUnidadMedidaSeleccionar: Signal<SelectModel[]> = computed(() => {
    if (this.unidadMedidaApiService.listAll().length > 0) {
      return this.unidadMedidaApiService.listAll().map((row) => ({
        label: row.nombre,
        value: row.idUnidadDeMedida,
      }));
    } else {
      return [];
    }
  });

  ngOnInit(): void {
    this.categoriaNuestroProductoApiService.getAllFilter('?enabled=true').subscribe();
          this.unidadMedidaApiService.getAll().subscribe();

  }
  submit() {
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '!Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar.',
      });
      return;
    }
    const formValue = this.formulario.getRawValue();
    if (this.isUpload) {
      this.uploadFileApi.create(formValue.image?.file).subscribe({
        next: (resp) => {
          console.log(resp);
          this.saveProduct(resp.fileName);
        },
      });
    } else {
      this.saveProduct(null);
    }
  }
  saveProduct(idUpladFile: null | string) {
    this.nuestroProducto
      .create({
        nombre: this.formulario.getRawValue().nombre ?? '',
        alias: this.formulario.getRawValue().alias ?? '',
        descripcion: this.formulario.getRawValue().descripcion ?? '',
        sku: this.formulario.getRawValue().sku ?? '',
        idImagen: idUpladFile ?? '',
        precio: parseFloat(this.formulario.getRawValue().precio!) ?? 0, // Asumiendo que el precio es 0 por defecto, ajustar según sea necesario
        idCategoriaComercial: this.formulario.getRawValue().categoriaProducto!,
                unidadMedidaDefault:this.formulario.getRawValue().unidadMedida!,
        presentacion: parseFloat(this.formulario.getRawValue().presentacion!) ?? 0

      })
      .subscribe((resp) => {
        this.display = false;
        this.saved.emit();
        this.formulario.reset();
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado nuestro producto',
        });
      });
  }
  handleHide() {
    this.formulario.reset();
  }
  uploadFile($event: any) {
    const file = $event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        this.formulario.get('image')?.setValue({
          file: file,
          url: event.target?.result as any,
        });
        this.isUpload = true;
      };
    }
  }
}
