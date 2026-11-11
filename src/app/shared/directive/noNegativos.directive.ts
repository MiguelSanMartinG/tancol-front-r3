import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[noNegativos]'
})
export class NoNegativosDirective {
  // Bloquea "-", "+", "e" y "E"
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (['-', '+', 'e', 'E'].includes(event.key)) {
      event.preventDefault();
    }
  }

  // Bloquea pegar valores que empiecen con signo o tengan "e"/"E"
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') || '';
    if (/^[-+]/.test(pasted) || /[eE]/.test(pasted)) {
      event.preventDefault();
    }
  }

  // Corrige si por spinner o input manual el valor es negativo
  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input && Number(input.value) < 0) {
      input.value = '0'; // o '' si prefieres limpiar
      const native = new Event('input', { bubbles: true });
      input.dispatchEvent(native);
    }
  }
}
