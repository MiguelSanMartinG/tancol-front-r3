import { Component, computed, effect, EventEmitter, inject, OnInit, Output, Signal, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { RegistrarCategoriaProductoComponent } from "../../categoria-producto/registrar/registrar.component";
import { SelectModel } from '@core/common/select.model';
import { CategoriaProductoApiService } from '../../categoria-producto/services/categoria-producto.api.service';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';
import { NuestrosProductosService } from '../service/nuestros-productos.service';
import { NuestrosProductosResponse } from '../service/nuestros-productos.response';
import { CategoriaNuestrosProductosApiService } from '../../categoria-nuestros-productos/service/categoria-nuestros-productos-api.service';
import { NuestrosProductosDTO } from '../service/nuestros-productos.DTO';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';

@Component({
  selector: 'app-editar',
    imports: [AppPrimengModule, ReactiveFormsModule, MessageErrorComponent, NgTemplateOutlet, 
      RegistrarCategoriaProductoComponent,
    StatusBinaryReadOnlyComponent,
    CommonModule
    ],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss'
})
export class EditarComponent implements OnInit  {
  @Output() saved = new EventEmitter<void>();
  display = false;
  isUpload = false;
  productoApiService = inject(NuestrosProductosService);
      unidadMedidaApiService = inject (UnidadMedidaService)
  
    categoriaProductoApiService = inject(CategoriaNuestrosProductosApiService);
  itemDto = signal<NuestrosProductosResponse | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    id:['',Validators.required],
    nombre: ['', Validators.required],
    sku: [''],
    alias: [''],
    precio:[0],
    descripcion: [''],
    categoriaProducto: ['', [Validators.required]],
    unidadMedida:['',[Validators.required]],
    presentacion: [0],
    image: [
      {
        file: <any> null,
        url: <any> null,
      },
    ],
    enabled:[false,Validators.required]
  });
    uploadFileApi = inject(UploadFileApiService);
  
  listaCategoriaProductoSelecccionar: Signal<SelectModel[]> = computed(() => {
      if(this.categoriaProductoApiService.listAll().length > 0){
        return this.categoriaProductoApiService.listAll().map((row) => ({
          label: row.nombre,
          value: row.idCategoriaComercial,
        }));
      }else{
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
  messageService = inject(MessageService);
  constructor(){
    effect( ()=> {
      if(this.itemDto() !== null){
        untracked(() => {

          console.log(this.itemDto());
          console.log(this.listaCategoriaProductoSelecccionar());
          let cat = []
          let categoria = this.listaCategoriaProductoSelecccionar().find(value => {
            return value.label === this.itemDto()?.categoriaProductoComercial.nombre;
          });

          console.log(categoria);

          this.formulario.patchValue({
            id:this.itemDto()!.idProductoComercial,
            nombre:this.itemDto()!.nombre,
            sku: this.itemDto()!.sku,
            alias: this.itemDto()!.alias,
            categoriaProducto:categoria?.value ?? '',
            descripcion: this.itemDto()!.descripcion,
            precio:this.itemDto()!.precio,
            enabled:this.itemDto()!.enabled,
                unidadMedida:this.itemDto()!.unidadMedidaDefault.idUnidadDeMedida,
            presentacion: this.itemDto()!.presentacion ?? 0,

            image: {
              file: null,
              url: <any> 'https://tancol-backend-production.up.railway.app/api/v1/images/'+this.itemDto()!.idImagen
            },
          })

          if (this.itemDto()!.idImagen) {
            this.isUpload = true;
          }

          // this.formulario.patchValue({
          //   nombre: this.itemDto()!.nombre,
          //   sku: this.itemDto()!.sku,
          //   alias: this.itemDto()!.alias,
          //   categoriaProducto: categoria?.value,
          //   descripcion: this.itemDto()!.descripcion,
          //   image: {
          //     file: this.itemDto()!.idImagen as string,
          //     url: 'https://tancol-backend-production.up.railway.app/api/v1/images/'+this.itemDto()!.idImagen
          //   },
          // });
        });
      }
    })
  }
  ngOnInit(): void {
    // this.categoriaProductoApiService.getAll().subscribe();
        this.categoriaProductoApiService.getAllFilter('?enabled=true').subscribe();

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
    if (this.isUpload && formValue.image?.file) {
      this.uploadFileApi.create(formValue.image?.file).subscribe({
        next: (resp) => {
          console.log(resp);
          this.saveProduct(resp.fileName);
        },
      });
    } else {
      this.saveProduct(this.itemDto()!.idImagen);
    }
  }


  saveProduct(fileName:string|null) {
    console.log(this.formulario.getRawValue());
    
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

    let request:NuestrosProductosDTO = {
        nombre: this.formulario.getRawValue().nombre ?? '',
        alias: this.formulario.getRawValue().alias ?? '',
        descripcion: this.formulario.getRawValue().descripcion ?? '',
        sku: this.formulario.getRawValue().sku ?? '',
        idImagen: fileName ?? '',
        idCategoriaComercial:this.formulario.getRawValue().categoriaProducto!,
        precio:this.formulario.getRawValue().precio ?? 0,
        enabled:this.formulario.getRawValue().enabled!,
      unidadMedidaDefault:this.formulario.getRawValue().unidadMedida!,
      presentacion: this.formulario.getRawValue().presentacion ?? 0
    }

    this.productoApiService.update(request, this.itemDto()!.idProductoComercial)
      .subscribe((resp) => {
        this.display = false;
        this.saved.emit();
        this.formulario.reset();
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Actualización exitosa!',
          detail: 'Se ha actualizado el producto',
        });
      });
  }
  handleHide(){
    this.formulario.reset();
  }
  uploadFile($event: any){
    const file = $event.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        this.formulario.get('image')?.setValue({
          file: file,
          url: event.target?.result as any
        });
        this.isUpload = true;
      }
    }
  }
}
