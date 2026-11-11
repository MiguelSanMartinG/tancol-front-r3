import { inject, Signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Observable, timer, switchMap, distinctUntilChanged, map, of } from 'rxjs';

export function alreadyTaken(apiService: any, query: string): AsyncValidatorFn {
  return (control: AbstractControl): Observable<any> => {
    const parent = control.parent;

    return timer(500).pipe(
      switchMap(() => {
        // Si no hay parent (aún no se ha creado el form), no validar
        if (!parent) return of(null);

        const currentId = parent.get('id')?.value;

        return apiService.getAllFilter(query + `${control.value}`, { hiddenLoading: 'true' }).pipe(
          map((response: any) => {
            if (response.length === 0) return null;

            // Si encuentra uno con el mismo nombre pero mismo ID, no hay problema
            const isSame = response.some((item: any) => {
              const idKey = Object.keys(item).find(key => key.startsWith('id'));
              return idKey ? item[idKey] === currentId : false;
            });
            console.log(isSame);
            console.log(currentId);
            if (isSame) return null;

            // Si hay otro con mismo nombre y diferente ID → ya está tomado
            return { alreadytaken: true };
          })
        );
      })
    );
  };
}



// export function alreadyTaken(apiService: any, query: string,  currentId: () => string | null): AsyncValidatorFn {
//   return (control: AbstractControl): Observable<any> => {
//     return timer(500).pipe(
//       switchMap((value) => {
//         return apiService
//           .getAllFilter(query + `${control.value}`, { hiddenLoading: 'true' })
//           .pipe(
//             distinctUntilChanged(),
//             map((response: any) => {
//               if (response.length > 0) {
//                 return {
//                   alreadytaken: true,
//                 };
//               }
//               return null;
//             })
//           );
//       })
//     );
//   };
// }
export function alreadyTakenUpdate(apiService: any, property: string, dto: Signal<any>, query: string): AsyncValidatorFn {
  return (control: AbstractControl): Observable<any> => {
    return timer(500).pipe(
      switchMap((value) => {
        if(control.value === dto()[property]){
          return of(null);
        }
        return apiService
          .getAllFilter(query + `${control.value}`, { hiddenLoading: 'true' })
          .pipe(
            distinctUntilChanged(),
            map((response: any) => {
              if (response.length > 0) {
                return {
                  alreadytaken: true,
                };
              }
              return null;
            })
          );
      })
    );
  };
}