import { Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
@Component({
  selector: 'app-status-binary-read-only',
  imports: [TagModule],
  templateUrl: './status-binary-read-only.component.html',
  styleUrl: './status-binary-read-only.component.scss'
})
export class StatusBinaryReadOnlyComponent {
  value = input.required<boolean>();
}
