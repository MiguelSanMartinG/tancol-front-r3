import { NgModule } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { AutoFocusModule } from 'primeng/autofocus';
import { FocusTrapModule } from 'primeng/focustrap';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { SpanRequiredComponent } from '@shared/components/span-required/span-required.component';
import { FileUploadModule } from 'primeng/fileupload';
import { Menu } from 'primeng/menu';
import { DatePickerModule } from 'primeng/datepicker';
import { TabsModule } from 'primeng/tabs';
import { ProgressBarModule } from 'primeng/progressbar';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { PopoverModule } from 'primeng/popover';

@NgModule({
  imports: [
    SpanRequiredComponent,
    Menu,
    AccordionModule,
    PopoverModule
  ],
  exports: [
    FileUploadModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    ToggleSwitchModule,
    AutoCompleteModule,
    TooltipModule,
    ToastModule,
    DialogModule,
    AutoFocusModule,
    FocusTrapModule,
    InputIconModule,
    IconFieldModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    Menu,
    SpanRequiredComponent,
    DatePickerModule,
    TabsModule,
    ProgressBarModule,
    AccordionModule,
    CheckboxModule,
    PopoverModule

  ]
})
export class AppPrimengModule { }
