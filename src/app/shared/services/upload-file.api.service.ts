import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UploadFileApiService {
  constructor(private http: HttpClient) {}

  create(file: any) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ fileName: string }>('upload', formData);
  }

  get(fileId: string) {
    return this.http.get(`images/${fileId}`, { responseType: 'blob' });
  }
}
