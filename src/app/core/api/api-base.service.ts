import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BranchContextService } from '../branch/branch-context.service';

@Injectable({ providedIn: 'root' })
export class ApiBaseService {
  private readonly http = inject(HttpClient);
  private readonly branchContext = inject(BranchContextService);
  protected readonly baseUrl = environment.apiUrl;

  protected get<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
    return this.http.get<T>(`${this.baseUrl}${path}`, {
      headers: this.headers(),
      params: this.toParams(params),
    });
  }

  protected post<T>(path: string, body: unknown) {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() });
  }

  protected put<T>(path: string, body: unknown) {
    return this.http.put<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() });
  }

  protected patch<T>(path: string, body: unknown) {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() });
  }

  protected delete<T>(path: string) {
    return this.http.delete<T>(`${this.baseUrl}${path}`, { headers: this.headers() });
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {};
    const branchId = this.branchContext.selectedBranchId();
    if (branchId) {
      headers['X-Branch-Id'] = String(branchId);
    }
    return headers;
  }

  private toParams(params?: Record<string, string | number | boolean | undefined>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }
}
