import { Component, computed, EventEmitter, inject, OnInit, Output, Signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageService } from 'primeng/api';
import { ProductoApiService } from '../services/producto.api.service';
import { MessageErrorComponent } from '../../../../shared/components/message-error/message-error.component';
import { CategoriaProductoApiService } from '../../categoria-producto/services/categoria-producto.api.service';
import { SelectModel } from '@core/common/select.model';
import { RegistrarCategoriaProductoComponent } from '../../categoria-producto/registrar/registrar.component';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';
import { productoStockValido } from '../services/producto-stock.validator';

@Component({
  selector: 'app-registrar-producto',
  imports: [
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    RegistrarCategoriaProductoComponent,
  ],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarProductoComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();
  display = false;
  isUpload = false;
  productoApiService = inject(ProductoApiService);
  uploadFileApi = inject(UploadFileApiService);
  categoriaProductoApiService = inject(CategoriaProductoApiService);
  unidadMedidaApiService = inject (UnidadMedidaService)
  fb = inject(FormBuilder);
  formulario = this.fb.group({
    nombre: ['', Validators.required],
    sku: [''],
    alias: [''],
    descripcion: [''],
    categoriaProducto: [, [Validators.required]],
    unidadMedida:[,[Validators.required]],
    tieneVigencia: [false],
    fechaVigencia: [''],
    marca: [''],
    modelo: [''],
    stockMinimo: [null as number | null],
    stockMaximo: [null as number | null],
    notificarStockMinimo: [false],
    image: [
      {
        file: null,
        url: null,
      },
    ],
  });
  messageService = inject(MessageService);
  listaCategoriaProductoSelecccionar: Signal<SelectModel[]> = computed(() => {
    const categorias = this.categoriaProductoApiService.listAll();
    const padres = new Set(categorias.map((row) => row.idCategoriaPadre).filter(Boolean));
    if (categorias.length > 0) {
      return categorias.filter((row) => row.enabled && !padres.has(row.idCategoria)).map((row) => ({
        label: row.nombre,
        value: row.idCategoria,
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
        error: (error) => this.showSaveError(error),
      });
    } else {
      this.saveProduct(null);
    }
  }
  saveProduct(idUpladFile: null | string) {
    if (!this.puedeGuardar) return;
    const request = {
        nombre: this.formulario.getRawValue().nombre ?? '',
        alias: this.formulario.getRawValue().alias ?? '',
        descripcion: this.formulario.getRawValue().descripcion ?? '',
        sku: this.formulario.getRawValue().sku ?? '',
        idImagen: idUpladFile,
        categoriaProductoId: this.formulario.getRawValue().categoriaProducto!,
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
      };
    this.productoApiService.create(request)
      .subscribe({
        next: (resp) => {
        this.display = false;
        this.saved.emit();
        this.formulario.reset();
        this.isUpload = false;
        this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado el insumo correctamente.',
        });
        },
        error: (error) => this.showSaveError(error),
      });
  }

  private showSaveError(error: any) {
    const details = error?.error?.message || Object.values(error?.error || {}).find((value) => typeof value === 'string') || 'No se pudo registrar el insumo.';
    this.messageService.add({ key: 'center', severity: 'error', summary: 'No se pudo crear', detail: String(details) });
  }
  handleHide() {
    this.formulario.reset();
    this.isUpload = false;
  }
  uploadFile(event: Event) {
    this.setImage((event.target as HTMLInputElement).files?.[0]);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.setImage(event.dataTransfer?.files?.[0]);
  }

  private setImage(file?: File) {
    if (!file || !['image/png', 'image/jpeg'].includes(file.type)) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      this.formulario.get('image')?.setValue({ file, url: event.target?.result as string } as any);
      this.isUpload = true;
    };
  }
}
