import { PsLang } from './ps-shared.model';

export interface AttachmentWritable {
  file: string;
  file_name: string;
  file_size: number;
  mime: string;
  name: PsLang[];
  description: PsLang[];
  associations: {
    products: { id: number }[];
  };
}

export interface Attachment extends AttachmentWritable {
  readonly id: number;
}

export interface AttachmentListItem {
  id: number;
  href: string;
}
