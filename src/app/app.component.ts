import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { LoadingComponent } from "./shared/components/loading/loading.component";
import { ErrorModalComponent } from "./shared/components/error-modal/error-modal.component";
import { PrimeNG } from 'primeng/config';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, LoadingComponent, ErrorModalComponent],
  templateUrl: './app.component.html',
  providers: [MessageService]
})
export class AppComponent implements OnInit {
  constructor(
    private config: PrimeNG,
    private translateService: TranslateService
  ){

  }
  ngOnInit() {
    this.translate('es');
}

translate(lang: string) {
    this.translateService.setDefaultLang(lang);
    this.translateService.use(lang);
    this.translateService.get('primeng').subscribe(res => this.config.setTranslation(res));
}
}
