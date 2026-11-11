import {Injectable} from '@angular/core';
import {FormControl} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FieldValidControlService {
  isInvalid(form: FormControl){
    return form?.invalid && (form?.touched || form?.invalid && form?.dirty);
  }
  isRequired(form: FormControl){
    return form?.hasError('required');
  }
  hasRequired(form: FormControl): boolean{
    if (form?.validator) {
      const validators = form.validator({} as any);
      return !!validators?.['required'] || false;
    }
    return false;
  }
  hasError(form: FormControl,error: string){
    return form?.hasError(error);
  }
}
