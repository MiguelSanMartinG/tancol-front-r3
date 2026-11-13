import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { MyPreset } from './custom-primeng.config';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { authInterceptor } from './core/auth.interceptor';
import {
  provideTranslateService,
} from '@ngx-translate/core';
// 👇 Importa desde ngx-translate
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { PermissionsService } from './core/services/permissions.service';
import { lastValueFrom } from 'rxjs';
import { AppVersionService } from './core/version/app-version.service';
import { ChunkReloadService } from './core/version/chunk-reload.service';

// 👉 apunta a /i18n/ (carpeta public)
export function HttpLoaderFactory(http: HttpClient) {
  // Si despliegas bajo subruta, esto respeta el <base href>:
  const base = (document?.baseURI ?? '/').replace(/\/+$/, '/');
  return new TranslateHttpLoader(http, `${base}i18n/`, '.json');
}

// export function HttpLoaderFactory(http: HttpClient) {
//   return new TranslateHttpLoader(http, 'i18n/', '.json'); 
// }

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: false,
        },
      },
    }),
    // 👇 Esta es la parte clave: registra TranslateStore/Service globalmente
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'es',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (ps: PermissionsService) => () => lastValueFrom(ps.refreshOnStartup()),
      deps: [PermissionsService],
    },
    // Recarga silenciosa tras un deploy (assets/version.json) y un solo reload si falta un chunk.
    provideAppInitializer(() => {
      inject(AppVersionService).start();
      inject(ChunkReloadService).start();
    }),
    // provideTranslateService({
    //   loader: {
    //     provide: TranslateLoader,
    //     useFactory: HttpLoaderFactory,
    //     deps: [HttpClient],
    //   }
    // }),

  ],
};
