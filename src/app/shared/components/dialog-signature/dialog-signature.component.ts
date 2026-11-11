import { CommonModule } from "@angular/common";
import { Component, Input, ViewChild, Output, EventEmitter } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AppPrimengModule } from "@shared/app-primeng/app-primeng.module";
import { SignatureCanvasComponent } from "../signature-canvas/signature-canvas.component";
import { PartidaVenta } from "@app/dashboard/modules/venta-ruta/form/form.component";

@Component({
  selector: 'app-dialog-signature',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppPrimengModule,
    SignatureCanvasComponent
  ],
  templateUrl: './dialog-signature.component.html',
  styleUrl: './dialog-signature.component.scss'
})
export class DialogSignatureComponent {
  @ViewChild(SignatureCanvasComponent)
  signaturePad!: SignatureCanvasComponent;

  display = false;
  base64:any = '';
  canvas:boolean = false;
  chofer:string = 'PABLO'
  desactivar:boolean = false;
  @Input() partida!:PartidaVenta;
  @Input() showLiquidacionOption = true;
  @Input() showSignerLabel = true;
  @Output() confirmSignature = new EventEmitter<{archivo: File, desactivar: boolean}>();

  clear() {
    this.signaturePad.clear();
  }

  confirm() {
    if (this.signaturePad.isEmpty()) {
      // alert('Firma vacía');
      return;
    }

    this.base64 = this.signaturePad.getBase64();
    console.log('Firma base64:', this.base64);
    if (this.partida?.firma && this.partida.firma.startsWith('blob:')) {
      URL.revokeObjectURL(this.partida.firma);
    }
    this.partida.firma = this.base64;
    const file = this.base64ToFile(this.base64, `firma-${Date.now()}.png`);
    this.confirmSignature.emit({archivo:file,desactivar:this.desactivar});
    this.clear();
    this.display = false;
  }
  private base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  onSigned(base64: string) {
    this.base64 = base64;
    // this.clear();
  }

  open(chofer:string){
    this.display = true;
    this.chofer = chofer
    this.desactivar = false;
    setTimeout(() => {
          console.log(this.partida);
            if (this.partida.firma) {
                console.log('si tiene');
                this.canvas = false
            }else{
                            this.canvas = true;
              console.log('no tiene');
            }


    }, 100);
  }

//   open() {
//   this.display = true;
//   setTimeout(() => {
//     this.base64 = this.partida?.firma;
//     // No necesitas this.canvas
//   }, 100);
// }
}




