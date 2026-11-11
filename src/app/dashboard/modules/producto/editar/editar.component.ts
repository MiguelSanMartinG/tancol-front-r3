import { Component, computed, effect, inject, OnInit, Signal, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { ProductoApiService } from '../services/producto.api.service';
import { ProductoResponseDto } from '../services/dtos/producto.response.dto';
import { ProductoUpdateDto } from '../services/dtos/producto.update.dto';
import { RegistrarCategoriaProductoComponent } from "../../categoria-producto/registrar/registrar.component";
import { SelectModel } from '@core/common/select.model';
import { CategoriaProductoApiService } from '../../categoria-producto/services/categoria-producto.api.service';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';
import { environment } from '../../../../../environments/environment';
import { productoStockValido } from '../services/producto-stock.validator';

@Component({
  selector: 'app-editar',
    imports: [AppPrimengModule, ReactiveFormsModule, MessageErrorComponent, RegistrarCategoriaProductoComponent],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss'
})
export class EditarComponent implements OnInit  {
  display = false;
  isUpload = false;
  productoApiService = inject(ProductoApiService);
    categoriaProductoApiService = inject(CategoriaProductoApiService);
      unidadMedidaApiService = inject (UnidadMedidaService)
    
  itemDto = signal<ProductoResponseDto | null>(null);
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: ['', Validators.required],
    sku: [''],
    alias: [''],
    categoriaProducto: ['',[Validators.required]],
    descripcion: [''],
    unidadMedida:['',[Validators.required]],
    tieneVigencia: [false],
    fechaVigencia: [''],
    marca: [''],
    modelo: [''],
    stockMinimo: [null as number | null],
    stockMaximo: [null as number | null],
    notificarStockMinimo: [false],
    status: [true],
    image: [{
      file: '',
      url: ''
    },],
  });
    uploadFileApi = inject(UploadFileApiService);
  
  listaCategoriaProductoSelecccionar: Signal<SelectModel[]> = computed(() => {
      const categorias = this.categoriaProductoApiService.listAll();
      const padres = new Set(categorias.map((row) => row.idCategoriaPadre).filter(Boolean));
      if(categorias.length > 0){
        return categorias.filter((row) => row.enabled && !padres.has(row.idCategoria)).map((row) => ({
          label: row.nombre,
          value: row.idCategoria,
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
            console.log(value.label);
            console.log(this.itemDto()?.nombreCategoria);
            return value.label === this.itemDto()?.nombreCategoria;
          });

          console.log(categoria);

          this.formulario.patchValue({
            nombre: this.itemDto()!.nombre,
            sku: this.itemDto()!.sku,
            alias: this.itemDto()!.alias,
            categoriaProducto: categoria?.value,
            descripcion: this.itemDto()!.descripcion,
            unidadMedida: this.itemDto()!?.unidadMedidaDefault?.idUnidadDeMedida,
            tieneVigencia: this.itemDto()!.tieneVigencia ?? false,
            fechaVigencia: this.itemDto()!.fechaVigencia ?? '',
            marca: this.itemDto()!.marca ?? '',
            modelo: this.itemDto()!.modelo ?? '',
            stockMinimo: this.itemDto()!.stockMinimo ?? null,
            stockMaximo: this.itemDto()!.stockMaximo ?? null,
            notificarStockMinimo: this.itemDto()!.notificarStockMinimo ?? false,
            status: this.itemDto()!.enabled,
            image: {
              file: this.itemDto()!.idImagen as string,
              url: this.itemDto()!.idImagen ? `${environment.apiUrl}images/${this.itemDto()!.idImagen}` : ''
            },
          });
        });
      }
    })
  }
  ngOnInit(): void {
    this.categoriaProductoApiService.getAll().subscribe();
        this.unidadMedidaApiService.getAll().subscribe();

  }

  get puedeGuardar(): boolean {
    const value = this.formulario.getRawValue();
    return this.formulario.valid && (!value.tieneVigencia || !!value.fechaVigencia) &&
      productoStockValido(value);
  }
  get stockMaximoInvalido(): boolean {
    const { stockMinimo, stockMaximo } = this.formulario.getRawValue();
    return stockMinimo != null && stockMaximo != null && stockMaximo < stockMinimo;
  }

  submit() {
    if (!this.puedeGuardar) {
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
      this.saveProduct(this.formulario?.getRawValue()?.image?.file as string);
    }
  }


  saveProduct(fileName:string|null) {
    if (!this.puedeGuardar) return;
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

    const request: Partial<ProductoUpdateDto> = {
        nombre: this.formulario.getRawValue().nombre ?? '',
        alias: this.formulario.getRawValue().alias ?? '',
        descripcion: this.formulario.getRawValue().descripcion ?? '',
        sku: this.formulario.getRawValue().sku ?? '',
        idImagen: fileName,
        categoriaProductoId:  this.formulario.getRawValue().categoriaProducto!,
                unidadMedidaDefault:this.formulario.getRawValue().unidadMedida!,
                ...(this.formulario.getRawValue().tieneVigencia ? {
                  tieneVigencia: true,
                  fechaVigencia: this.formulario.getRawValue().fechaVigencia!,
                } : { tieneVigencia: false }),
                marca: this.formulario.getRawValue().marca ?? '',
                modelo: this.formulario.getRawValue().modelo ?? '',
                stockMinimo: this.formulario.getRawValue().stockMinimo,
                stockMaximo: this.formulario.getRawValue().stockMaximo,
                notificarStockMinimo: this.formulario.getRawValue().notificarStockMinimo ?? false,
                status: this.formulario.getRawValue().status ?? true,
      };
    this.productoApiService.update(request, this.itemDto()!.idProducto)
      .subscribe({
        next: () => {
          this.display = false;
          this.formulario.reset();
          this.messageService.clear();
          this.messageService.add({
            key: 'top-right',
            severity: 'success',
            summary: '¡Actualización exitosa!',
            detail: 'Se ha actualizado el insumo correctamente.',
          });
        },
        error: (error) => {
          const body = error?.error;
          const detail = error?.message || (typeof body === 'string' ? body : null) || body?.message || Object.values(body || {}).find((value) => typeof value === 'string') || 'No se pudo actualizar el insumo.';
          this.messageService.add({ key: 'center', severity: error?.status === 409 ? 'warn' : 'error', summary: 'No se pudo actualizar', detail: String(detail) });
        },
      });
  }
  handleHide(){
    this.formulario.reset();
    this.isUpload = false;
  }
  uploadFile(event: Event){
    const file = (event.target as HTMLInputElement).files?.[0];
    if(file){
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        this.formulario.get('image')?.setValue({
          file: file,
          url: event.target?.result as any
        } as any);
        this.isUpload = true;
      }
    }
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setImage(file);
  }

  private setImage(file: File) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      this.formulario.get('image')?.setValue({ file, url: event.target?.result as string } as any);
      this.isUpload = true;
    };
  }
}
