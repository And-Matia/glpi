import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dropzone',
  templateUrl: './dropzone.component.html',
  styleUrl: './dropzone.component.css',
  imports: [ButtonComponent],
  standalone: true
})
export class DropzoneComponent {
  /** Accept attribute, e.g. ".csv" or "image/*". */
  accept   = input<string>('');
  multiple = input<boolean>(false);
  disabled = input<boolean>(false);
  label    = input<string>('Glissez un fichier ici ou');
  hint     = input<string>('');
  icon     = input<string>('fa-solid fa-cloud-arrow-up');

  /** Emitted whenever the user drops or picks file(s). */
  filesSelected = output<File[]>();

  readonly isDragOver = signal(false);

  onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.isDragOver.set(false);
    this.emit(event.dataTransfer?.files ?? null);
  }

  onFileChange(event: Event): void {
    this.emit((event.target as HTMLInputElement).files);
  }

  private emit(list: FileList | null): void {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    this.filesSelected.emit(this.multiple() ? files : [files[0]]);
  }
}
