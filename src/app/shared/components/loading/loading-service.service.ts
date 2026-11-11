import {Injectable, input, signal} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
   loading = signal<boolean>(false);
  private requestCount = 0;

  show() {
    this.requestCount++;
    this.loading.set(true);
  }

  hide() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      setTimeout(() => {
        this.loading.set(false);
      }, 1000);

    }
  }

}
