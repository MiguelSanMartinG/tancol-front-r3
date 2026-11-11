import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DialogErrorService {
   display = signal<boolean>(false);
   dataError = signal<any>(null);
   request: any =  null;
  constructor() { }
}
