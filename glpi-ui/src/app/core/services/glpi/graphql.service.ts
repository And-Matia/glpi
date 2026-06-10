import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environment';

interface GqlResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class GlpiGraphqlService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.glpi.graphqlUrl;

  async getIds(queryName: string): Promise<number[]> {
    const query = `query { ${queryName} { edges { node { id } } } }`;
    const response = await firstValueFrom(
      this.http.post<GqlResponse<Record<string, { edges: { node: { id: number } }[] }>>>(this.url, { query })
    );
    return response.data[queryName].edges.map(e => e.node.id);
  }
}
