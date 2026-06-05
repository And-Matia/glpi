import { Injectable } from '@angular/core';

export interface AppConfig {
  production: boolean;
  prestashop: {
    apiUrl: string;
    apiKey: string;
  };
  admin: {
    username: string;
    password: string;
  };
}

@Injectable({ providedIn: 'root' })
export class PsConfigService {
  private config: AppConfig | null = null;

  async loadConfig(): Promise<void> {
    const res = await fetch('/config.json');
    if (!res.ok) {
      throw new Error(`Impossible de charger config.json (${res.status} ${res.statusText})`);
    }
    try {
      this.config = await res.json();
    } catch {
      throw new Error('config.json est invalide ou mal formé.');
    }
  }

  get appConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Config not loaded');
    }
    return this.config;
  }

  get apiUrl(): string {
    return this.appConfig.prestashop.apiUrl;
  }
  
  get apiKey(): string {
    return this.appConfig.prestashop.apiKey;
  }
}
