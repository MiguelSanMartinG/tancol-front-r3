import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NuestrosProductosResponse } from '../service/nuestros-productos.response';
import { NuestrosProductosService } from '../service/nuestros-productos.service';
import { TablaComision, TablaComisionRequest, TablaComisionesService } from '../service/tabla-comisiones.service';

@Component({
  selector: 'app-producto-comisiones',
  imports: [CommonModule, FormsModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent],
  templateUrl: './comisiones.component.html',
  styleUrl: './comisiones.component.scss',
})
export class ComisionesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productosApi = inject(NuestrosProductosService);
  private readonly comisionesApi = inject(TablaComisionesService);

  loading = false;
  saving = false;
  selectedProduct: NuestrosProductosResponse | null = null;
  private productId = '';
  commission: TablaComision | null = null;
  editingId: string | null = null;
  editing = false;
  errorMessage = '';
  successMessage = '';
  draft = this.emptyDraft();

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.productId) {
      this.errorMessage = 'No se indicó el producto para consultar sus comisiones.';
      return;
    }

    this.loading = true;
    this.productosApi.getOne(this.productId).subscribe({
      next: (product) => {
        this.selectedProduct = product;
        this.load();
      },
      error: (error) => {
        this.errorMessage = this.readError(error, 'No se pudo cargar el producto.');
        this.loading = false;
      },
    });
  }

  load(): void {
    if (!this.productId) return;
    this.loading = true;
    this.errorMessage = '';
    this.comisionesApi.getAll().subscribe({
      next: (items) => {
        this.commission = (items ?? [])
          .filter((item) => item.productoId === this.productId)
          .sort((a, b) => a.cantidadDesde - b.cantidadDesde)[0] ?? null;
        this.editing = !this.commission;
        this.editingId = this.commission?.id ?? null;
        this.draft = this.commission ? this.toDraft(this.commission) : this.emptyDraft();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = this.readError(error, 'No se pudieron cargar las comisiones.');
        this.loading = false;
      },
    });
  }

  edit(): void {
    this.editing = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  save(): void {
    const request: TablaComisionRequest = {
      ...this.draft,
      idProducto: this.productId,
    };
    const validationMessage = this.validate(request);
    if (validationMessage) {
      this.errorMessage = validationMessage;
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const action = this.editingId
      ? this.comisionesApi.update(this.editingId, request)
      : this.comisionesApi.create(request);

    action.subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = this.editingId ? 'Comisión actualizada.' : 'Comisión agregada.';
        this.load();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = this.readError(error, 'No se pudo guardar la comisión.');
      },
    });
  }

  private toDraft(item: TablaComision): Omit<TablaComisionRequest, 'idProducto'> {
    return {
      cantidadDesde: item.cantidadDesde,
      cantidadHasta: item.cantidadHasta,
      ventaMinima: item.ventaMinima,
      comision: item.comision,
    };
  }

  private emptyDraft(): Omit<TablaComisionRequest, 'idProducto'> {
    return { cantidadDesde: 1, cantidadHasta: 1, ventaMinima: 1, comision: 0 };
  }

  private validate(request: TablaComisionRequest): string {
    if (!request.idProducto) return 'No se encontró el producto seleccionado.';
    if (!Number.isInteger(request.cantidadDesde) || request.cantidadDesde < 1) return 'Cantidad desde debe ser un entero mayor que 0.';
    if (!Number.isInteger(request.cantidadHasta) || request.cantidadHasta < request.cantidadDesde) return 'Cantidad hasta debe ser igual o mayor que cantidad desde.';
    if (!Number.isInteger(request.ventaMinima) || request.ventaMinima < 1) return 'Venta mínima debe ser un entero mayor que 0.';
    if (!Number.isFinite(request.comision) || request.comision < 0) return 'La comisión debe ser un número igual o mayor que 0.';
    return '';
  }

  private readError(error: any, fallback: string): string {
    return error?.error?.message ?? error?.error?.error ?? fallback;
  }
}
