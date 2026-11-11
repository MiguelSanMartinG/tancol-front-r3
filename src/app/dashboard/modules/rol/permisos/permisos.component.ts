import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ModuloApiService, ModuloDto } from '../services/modulo.api.service';
import { ProfileApiService } from '../services/profile.api.service';
import { NotificacionesService, TipoNotificacion } from '@app/core/services/notificaciones.service';
import { forkJoin } from 'rxjs';

interface ModuloPermiso extends ModuloDto {
  idPerfil?: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  parentName?: string;
}

interface ModuloGroup {
  parentName: string;
  modules: ModuloPermiso[];
  _masterSet?: boolean; // si el usuario interactuó con el master
  _masterChecked?: boolean; // último valor elegido por el usuario
}

@Component({
  selector: 'app-rol-permisos',
  templateUrl: './permisos.component.html',
  styleUrl: './permisos.component.scss',
  imports: [CommonModule, AppPrimengModule, HeaderComponent, FormsModule],
})
export class PermisosRolComponent implements OnInit {
  moduloApiService = inject(ModuloApiService);
  profileApiService = inject(ProfileApiService);
  notificacionesService = inject(NotificacionesService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  modulos: ModuloPermiso[] = [];
  groupedModules: ModuloGroup[] = [];
  idRol = 0;
  tiposNotificacion: TipoNotificacion[] = [];
  tiposSeleccionados = new Set<string>();

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      const id = p.get('id');
      this.idRol = id ? +id : 0;
    });

    this.moduloApiService.getAll().subscribe((resp) => {
      const findParentName = (id: string | undefined): string | undefined => {
        if (!id) return undefined;
        const parent = resp.find((r) => r.idModulo === id);
        return parent?.name;
      };

      const mapped = resp.map((m) => ({
        ...m,
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        parentName: typeof m.parent === 'string' ? findParentName(m.parent) : (m.parent as any)?.name,
      }));

      this.modulos = mapped.filter((m) => {
        const route = m.ruta.split(/[?#]/)[0].split('/').filter(Boolean).at(-1);
        return !!m.parent || route === 'notificaciones';
      });

      this.groupedModules = [];
      this.modulos.forEach((m) => {
        const parentName = m.parentName ?? 'Módulos principales';
        const found = this.groupedModules.find(
          (g) => g.parentName === parentName
        );
        if (found) {
          found.modules.push(m);
        } else {
          this.groupedModules.push({ parentName, modules: [m] });
        }
      });

      if (this.idRol) {
        this.profileApiService.getByRole(this.idRol).subscribe((profiles) => {
          profiles.forEach((p) => {
            const modulo = this.modulos.find((m) => m.idModulo === p.module.idModulo);
            if (modulo) {
              modulo.idPerfil = p.idPerfil;
              modulo.canCreate = p.canWrite;
              modulo.canDelete = p.canDelete;
              modulo.canRead = p.canRead;
              modulo.canUpdate = p.canUpdate;
            }
          });
        });
        this.notificacionesService.listarTipos().subscribe((tipos) => this.tiposNotificacion = tipos);
        this.notificacionesService.listarTiposPorRol(this.idRol).subscribe((tipos) => {
          this.tiposSeleccionados = new Set(tipos.map((tipo) => tipo.codigo));
        });
      }
    });
  }

  guardar() {
    const requests = this.modulos.map((m) => {
      const body = {
        canCreate: m.canCreate,
        canDelete: m.canDelete,
        canRead: m.canRead,
        canUpdate: m.canUpdate,
        idModulo: m.idModulo,
        idRol: this.idRol,
      };

      return m.idPerfil
        ? this.profileApiService.update(m.idPerfil, body)
        : this.profileApiService.create(body);
    });
    requests.push(this.notificacionesService.reemplazarTiposPorRol(this.idRol, Array.from(this.tiposSeleccionados)));
    forkJoin(requests).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
  }

  toggleTipo(codigo: string, checked: boolean) {
    if (checked) this.tiposSeleccionados.add(codigo);
    else this.tiposSeleccionados.delete(codigo);
  }

  actualizarTipo(tipo: TipoNotificacion) {
    this.notificacionesService.actualizarTipo(tipo.codigo, tipo.nombre, tipo.descripcion ?? '').subscribe((actualizado) => {
      Object.assign(tipo, actualizado);
    });
  }

  regresar() {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  toggleGroup(group: ModuloGroup, checked: boolean) {
    group.modules.forEach((m) => {
      m.canCreate = checked;
      m.canRead = checked;
      m.canUpdate = checked;
      m.canDelete = checked;
    });
  }

  areAllPermissionsChecked(group: ModuloGroup): boolean {
    if (!group?.modules?.length) return false;
    return group.modules.every(
      (m) => m.canCreate && m.canRead && m.canUpdate && m.canDelete
    );
  }

  isGroupIndeterminate(group: ModuloGroup): boolean {
    if (!group?.modules?.length) return false;
    const total = group.modules.length * 4;
    const checked = group.modules.reduce((sum, m) => {
      return (
        sum +
        (m.canCreate ? 1 : 0) +
        (m.canRead ? 1 : 0) +
        (m.canUpdate ? 1 : 0) +
        (m.canDelete ? 1 : 0)
      );
    }, 0);
    return checked > 0 && checked < total;
  }

  toggleRow(group: ModuloGroup, item: ModuloPermiso, checked: boolean) {
    item.canCreate = checked;
    item.canRead = checked;
    item.canUpdate = checked;
    item.canDelete = checked;
    this.resetGroupMasterAuto(group);
  }

  areAllModulePermissionsChecked(item: ModuloPermiso): boolean {
    return item.canCreate && item.canRead && item.canUpdate && item.canDelete;
  }

  isModuleIndeterminate(item: ModuloPermiso): boolean {
    const total = (item.canCreate ? 1 : 0) + (item.canRead ? 1 : 0) + (item.canUpdate ? 1 : 0) + (item.canDelete ? 1 : 0);
    return total > 0 && total < 4;
  }

  onPermissionChange(group: ModuloGroup) {
    this.resetGroupMasterAuto(group);
  }

  groupHasAnySelection(group: ModuloGroup): boolean {
    if (!group?.modules?.length) return false;
    return group.modules.some(
      (m) => m.canCreate || m.canRead || m.canUpdate || m.canDelete
    );
  }

  onGroupMasterChange(group: ModuloGroup, checked: boolean) {
    group._masterSet = true;
    group._masterChecked = checked;
    this.toggleGroup(group, checked);
  }

  private resetGroupMasterAuto(group: ModuloGroup) {
    group._masterSet = false;
    group._masterChecked = undefined;
  }
}
