import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'signature-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border border-gray-400 rounded overflow-hidden relative">
      <canvas #canvas class="w-full h-full touch-none"></canvas>
    </div>

  `,
  styles: [`
    canvas {
      touch-action: none;
    }
  `]
})
export class SignatureCanvasComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signed = new EventEmitter<string>();

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.startDrawing(event.offsetX, event.offsetY);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.drawing) this.draw(event.offsetX, event.offsetY);
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  stopMouseDrawing() {
    this.stopDrawing();
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    const pos = this.getTouchPos(event);
    this.startDrawing(pos.x, pos.y);
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    const pos = this.getTouchPos(event);
    this.draw(pos.x, pos.y);
    event.preventDefault(); // prevent scroll
  }

  @HostListener('touchend')
  stopTouchDrawing() {
    this.stopDrawing();
  }

  private getTouchPos(event: TouchEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const touch = event.touches[0] || event.changedTouches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  private startDrawing(x: number, y: number) {
    this.drawing = true;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  private draw(x: number, y: number) {
    if (!this.drawing) return;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  private stopDrawing() {
    if (!this.drawing) return;
    this.drawing = false;
    this.ctx.closePath();
    this.emitBase64();
  }

  private emitBase64() {
    const base64 = this.canvasRef.nativeElement.toDataURL();
    this.signed.emit(base64);
  }

  clear() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  isEmpty(): boolean {
    const canvas = this.canvasRef.nativeElement;
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    return canvas.toDataURL() === blank.toDataURL();
  }

  getBase64(): string {
    return this.canvasRef.nativeElement.toDataURL();
  }
}
