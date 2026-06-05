import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PsBaseApi } from './ps-base.api';
import { PsConfigService } from '../config/ps-config.service';
@Injectable({ providedIn: 'root' })
export class ImageApi extends PsBaseApi {
  protected resource = 'images';
  private readonly config = inject(PsConfigService);

  /**
   * Public URL of a product image, usable directly as an `<img>` source.
   * PrestaShop's webservice accepts the API key through the `ws_key` query
   * parameter, so the request carries its own auth — an `<img>` tag cannot
   * send the Authorization header the interceptor adds to XHR calls.
   */
  productImageUrl(idProduct: number, idImage: number): string {
    const base = this.config.apiUrl.replace(/\/+$/, '');
    return `${base}/images/products/${idProduct}/${idImage}?ws_key=${this.config.apiKey}`;
  }

  /**
   * Uploads an image for a product. PrestaShop expects a multipart/form-data
   * body with the file under the field name `image`. The first image uploaded
   * for a product automatically becomes its cover.
   */
  uploadProductImage(idProduct: number, file: Blob, filename: string): Observable<string> {
    const form = new FormData();
    form.append('image', file, filename);
    return this.client.postForm(`images/products/${idProduct}`, form);
  }
}
