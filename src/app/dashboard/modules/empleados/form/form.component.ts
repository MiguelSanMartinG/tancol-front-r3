import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, Input, OnInit, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { requiereVigencia, TIPOS_CONTRATACION } from '../services/dtos/empleado.create.dto';
import { OBSERVACIONES_MAX } from './datos-laborales';
import {
  BANCOS,
  CampoDocumento,
  configDocumento,
  CONTACTOS_EMERGENCIA_MAX,
  contactoEmergenciaGrupo,
  ContactoEmergenciaGrupo,
  DOCUMENTO_ACCEPT,
  DOCUMENTO_ACCEPT_LABEL,
  DOCUMENTO_MAX_MB,
  documentoSinArchivo,
  documentoTieneArchivo,
  DocumentoConfig,
  DocumentoGrupo,
  ESTADOS_CIVILES,
  NACIONALIDADES,
  NIVELES_ESTUDIOS,
  SEXOS,
  TIPOS_SANGRE,
} from './datos-rh';
import { FileDropComponent } from '@shared/components/file-drop/file-drop.component';
import { environment } from '../../../../../environments/environment';
import { SelectModel } from '@core/common/select.model';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { TipoEmpleadoApiService } from '../../tipo-empleado/services/tipo-empleado.api.service';
import { DepartamentoApiService } from '../../departamento/services/departamento.api.service';
import { RolApiService } from '../../rol/services/rol.api.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  imports:[
    MessageErrorComponent,
    ReactiveFormsModule,
    CommonModule,
    AppSharedModule,
    AppPrimengModule,
    FileDropComponent,
  ]
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class FormComponent implements OnInit {

  @Input() formulario!:FormGroup;
  tipoEmpleadoApiService = inject(TipoEmpleadoApiService)
  departamentoApiService = inject(DepartamentoApiService)
  rolApiService = inject(RolApiService)

  listaTipoEmpleadoSelecccionar: Signal<SelectModel[]> = computed(() => {
      if (this.tipoEmpleadoApiService.listAll().length > 0) {
        return this.tipoEmpleadoApiService.listAll().map((row) => ({
          label: row.nombre,
          value: row.idTipoEmpleado,
        }));
      } else {
        return [];
      }
    });

    listaDepartamentoSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.departamentoApiService.listDepartamento().length > 0) {
        return this.departamentoApiService.listDepartamento().map((row) => ({
          label: row.nombre,
          value: row.idDepartamento,
        }));
      } else {
        return [];
      }
    });

    listaRolSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.rolApiService.listAll().length > 0) {
        return this.rolApiService.listAll().map((row) => ({
          label: row.name,
          value: row.id,
        }));
      } else {
        return [];
      }
    });


    
    // Datos laborales
    private readonly destroyRef = inject(DestroyRef);
    readonly tiposContratacion = TIPOS_CONTRATACION;
    readonly observacionesMax = OBSERVACIONES_MAX;

    ngOnInit(): void {
      this.tipoEmpleadoApiService.getAll().subscribe();
      this.departamentoApiService.getAll().subscribe();
      this.rolApiService.getAll().subscribe();
      this.vincularDatosLaborales();
    }

    /** Muestra la vigencia solo para Temporal / Practicante. */
    requiereVigencia(): boolean {
      return requiereVigencia(this.formulario?.get('tipoContratacion')?.value);
    }

    /** Convierte a mayúsculas (y sin espacios) NSS / RFC / CURP mientras se captura. */
    aMayusculas(nombre: 'nss' | 'rfc' | 'curp'): void {
      const control = this.formulario?.get(nombre);
      if (!control || typeof control.value !== 'string') return;
      const valor = control.value.toUpperCase().replace(/\s+/g, '');
      if (valor !== control.value) control.setValue(valor);
    }

    // ===================== Datos de RH =====================
    readonly nacionalidades = NACIONALIDADES;
    readonly sexos = SEXOS;
    readonly estadosCiviles = ESTADOS_CIVILES;
    readonly tiposSangre = TIPOS_SANGRE;
    readonly nivelesEstudios = NIVELES_ESTUDIOS;
    readonly bancos = BANCOS;
    readonly contactosMax = CONTACTOS_EMERGENCIA_MAX;
    readonly documentoAccept = DOCUMENTO_ACCEPT;
    readonly documentoAcceptLabel = DOCUMENTO_ACCEPT_LABEL;
    readonly documentoMaxMb = DOCUMENTO_MAX_MB;
    /** Base para ver/descargar un documento ya guardado (el file-drop lo descarga con la sesión). */
    private readonly urlArchivos = environment.apiUrl + 'empleados/documentos/archivo/';

    get contactos(): FormArray<ContactoEmergenciaGrupo> | null {
      return (this.formulario?.get('contactosEmergencia') as FormArray<ContactoEmergenciaGrupo>) ?? null;
    }

    get documentos(): FormArray<DocumentoGrupo> | null {
      return (this.formulario?.get('documentos') as FormArray<DocumentoGrupo>) ?? null;
    }

    agregarContacto(): void {
      const contactos = this.contactos;
      if (!contactos || contactos.length >= this.contactosMax) return;
      contactos.push(contactoEmergenciaGrupo());
      contactos.markAsDirty();
    }

    quitarContacto(indice: number): void {
      const contactos = this.contactos;
      if (!contactos) return;
      contactos.removeAt(indice);
      contactos.markAsDirty();
    }

    configDocumento(grupo: DocumentoGrupo): DocumentoConfig | undefined {
      return configDocumento(grupo.controls.tipo.value);
    }

    usaCampo(grupo: DocumentoGrupo, campo: CampoDocumento): boolean {
      return !!this.configDocumento(grupo)?.campos.includes(campo);
    }

    urlArchivo(grupo: DocumentoGrupo): string | null {
      const archivo = grupo.controls.archivo.value;
      return archivo ? this.urlArchivos + encodeURIComponent(archivo) : null;
    }

    /** Capturó datos sin adjuntar archivo: se avisa en la fila y ese documento no se envía. */
    sinArchivo(grupo: DocumentoGrupo): boolean {
      return documentoSinArchivo(grupo.getRawValue());
    }

    tieneArchivo(grupo: DocumentoGrupo): boolean {
      return documentoTieneArchivo(grupo.getRawValue());
    }

    alElegirArchivo(grupo: DocumentoGrupo, archivo: File | null): void {
      grupo.controls.archivoNuevo.setValue(archivo);
      grupo.markAsDirty();
    }

    alQuitarArchivoGuardado(grupo: DocumentoGrupo): void {
      grupo.controls.archivo.setValue(null);
      grupo.markAsDirty();
    }

    /** Deja solo dígitos en la CLABE mientras se captura. */
    soloDigitosClabe(grupo: DocumentoGrupo): void {
      const control = grupo.controls.clabe;
      if (typeof control.value !== 'string') return;
      const valor = control.value.replace(/\D+/g, '');
      if (valor !== control.value) control.setValue(valor);
    }

    private vincularDatosLaborales(): void {
      const tipo = this.formulario?.get('tipoContratacion');
      const vigencia = this.formulario?.get('fechaVigencia');
      const ingreso = this.formulario?.get('fechaIngreso');
      const egreso = this.formulario?.get('fechaEgreso');

      if (tipo && vigencia) {
        tipo.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((valor) => {
          if (!requiereVigencia(valor) && vigencia.value !== null) {
            vigencia.setValue(null);
          }
          vigencia.updateValueAndValidity();
        });
      }

      if (ingreso && egreso) {
        ingreso.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          egreso.updateValueAndValidity();
          if (ingreso.dirty) egreso.markAsTouched();
        });
      }
    }
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  // constructor() {}
}
