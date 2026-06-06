import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {firstValueFrom} from "rxjs";
import {environment} from '../../../environment';

@Injectable({providedIn: 'root'})
export class GlpiSessionService {
  private readonly http = inject(HttpClient)

  private sessionToken: string | null = null;
  private accessToken: string | null = null;

  async initAll(): Promise<void> {
    try {
      await Promise.all([
        this.initV1Session(),
        this.initV2Token()
      ]);
    }catch (error) {
      console.error('Failed to initialize GLPI session:', error);
    }
  }

  private async initV1Session(): Promise<void> {
    const res = await firstValueFrom(
      this.http.get<{ session_token: string }>(
        `${environment.glpi.v1ApiUrl}/initSession`,
        {
          headers: new HttpHeaders({
            'Authorization': `user_token ${environment.glpi.userToken}`,
          })
        }
      )
    )
    this.sessionToken = res.session_token;
  }

  private async initV2Token(): Promise<void> {
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: environment.glpi.oauth.clientId,
      client_secret: environment.glpi.oauth.clientSecret,
      username: environment.glpi.oauth.username,
      password: environment.glpi.oauth.password,
      scope: 'api graphql'
    });

    const res = await firstValueFrom(
      this.http.post<{ access_token: string }>(
        `${environment.glpi.tokenUrl}`,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
    );
    this.accessToken = res.access_token;
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}
