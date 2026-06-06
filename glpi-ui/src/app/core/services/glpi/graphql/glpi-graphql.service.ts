import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../../../environment';

interface GqlResponse<T> {
  data: T;
}

@Injectable({providedIn: 'root'})
export class GlpiGraphqlService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.glpi.graphqlUrl;

  getIds(queryName: string): Observable<number[]> {
    const query = `query { ${queryName} { edges { node { id } } } }`;
    return this.http.post<GqlResponse<Record<string, { edges: { node: { id: number } } [] }>>>(this.url, {query}).pipe(
      map(response => response.data[queryName].edges.map(e => e.node.id))
    );
  }
}
