import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageErrorComponent } from './components/message-error/message-error.component';
import { DatetimePipe } from './pipes/datetime.pipe';
import { ValueEmptyPipe } from './pipes/value-empty.pipe';
import { FormartNumberPipe } from './pipes/formart-number.pipe';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [
    MessageErrorComponent,
    DatetimePipe,
    ValueEmptyPipe,
    FormartNumberPipe,
    // SignaturePadModule 
  ],
  exports: [
    MessageErrorComponent,
    ReactiveFormsModule,
    DatetimePipe,
    FormsModule,
    ValueEmptyPipe,
    FormartNumberPipe,
    RouterModule,
    // SignaturePadModule 
    
  ],
})
export class AppSharedModule {}
