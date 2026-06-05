import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PsXmlClient } from './ps-xml.client';

/**
 * Abstract base class for PrestaShop API resources
 * Provides common CRUD operations for all resource types
 */
export abstract class PsBaseApi {
  protected client = inject(PsXmlClient);

  /**
   * Resource name in the PrestaShop API (e.g., 'products', 'categories', 'taxes')
   * Must be defined by subclasses
   */
  protected abstract resource: string;

  /**
   * Optional custom API origin (e.g., '/ps-module' for module endpoints)
   * If not set, uses the default from PsConfigService ('/ps-api')
   */
  protected apiOrigin?: string;

  /**
   * Get all resources with optional filters
   * @param filters Optional query filters
   * @returns Observable of XML response as string
   */
  getAll(filters?: Record<string, string | number>): Observable<string> {
    return this.client.getList(this.resource, filters, this.apiOrigin);
  }

  /**
   * Get a single resource by ID
   * @param id Resource ID
   * @returns Observable of XML response as string
   */
  getOne(id: string | number): Observable<string> {
    return this.client.get(this.resource, id, this.apiOrigin);
  }

  /**
   * Create a new resource
   * @param xmlBody XML body of the resource
   * @returns Observable of XML response as string
   */
  create(xmlBody: string): Observable<string> {
    return this.client.post(this.resource, xmlBody, this.apiOrigin);
  }

  /**
   * Update an existing resource
   * @param id Resource ID
   * @param xmlBody XML body with updated data
   * @returns Observable of XML response as string
   */
  update(id: string | number, xmlBody: string): Observable<string> {
    return this.client.put(this.resource, id, xmlBody, this.apiOrigin);
  }

  /**
   * Delete a resource
   * @param id Resource ID
   * @returns Observable<void>
   */
  delete(id: string | number): Observable<void> {
    return this.client.delete(this.resource, id, this.apiOrigin);
  }
}
