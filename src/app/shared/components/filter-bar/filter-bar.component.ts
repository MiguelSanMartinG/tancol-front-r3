import { Component } from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';

@Component({
  selector: 'app-filter-bar',
  templateUrl: './filter-bar.component.html',
  standalone:true,
  imports:[
    AppPrimengModule
  ]

  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class FilterBarComponent {
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  // constructor() {}
  findRazonSocial(){}
}
