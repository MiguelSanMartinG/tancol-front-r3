import { Injectable } from '@angular/core';
import { AuthResponse } from '@app/auth/login/service/auth.service';
import { ProfileResponse } from '@app/dashboard/modules/rol/services/profile.api.service';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  // constructor() {}


  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setUserInfo(userInfo: AuthResponse | null) {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  }

  getUserInfo(): AuthResponse | null { 
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  setActiveTab(tab:number){
    localStorage.setItem('activeTab',tab.toString())
  }
  getActiveTab(){
    const tab = localStorage.getItem('activeTab');
    return tab ? parseFloat(tab):null;
  }

  setLiquidacionColumnWidths(widths: number[]) {
    localStorage.setItem('liquidacionColumnWidths', JSON.stringify(widths));
  }

  getLiquidacionColumnWidths(): number[] | null {
    const data = localStorage.getItem('liquidacionColumnWidths');
    return data ? (JSON.parse(data) as number[]) : null;
  }

  setBitacoraVentaColumnWidths(widths: number[]) {
    localStorage.setItem('bitacoraColumnWidths', JSON.stringify(widths));
  }

  getBitacoraVentaColumnWidths(): number[] | null {
    const data = localStorage.getItem('bitacoraColumnWidths');
    return data ? (JSON.parse(data) as number[]) : null;
  }

  // Permissions caching
  setProfiles(profiles: ProfileResponse[]) {
    localStorage.setItem('profiles', JSON.stringify(profiles));
  }

  getProfiles(): ProfileResponse[] | null {
    const data = localStorage.getItem('profiles');
    return data ? (JSON.parse(data) as ProfileResponse[]) : null;
  }

  setAllowedParents(parents: string[]) {
    localStorage.setItem('allowedParents', JSON.stringify(parents));
  }

  getAllowedParents(): string[] | null {
    const data = localStorage.getItem('allowedParents');
    return data ? (JSON.parse(data) as string[]) : null;
  }

  // Auth helpers
  clearToken() {
    localStorage.removeItem('token');
  }

  clearUserInfo() {
    localStorage.removeItem('userInfo');
  }

  clearProfiles() {
    localStorage.removeItem('profiles');
  }

  clearAllowedParents() {
    localStorage.removeItem('allowedParents');
  }

  logout() {
    this.clearToken();
    this.clearUserInfo();
    this.clearProfiles();
    this.clearAllowedParents();
  }

  // Logout reason utilities
  setLogoutReason(reason: string) {
    localStorage.setItem('logoutReason', reason);
  }
  getLogoutReason(): string | null {
    return localStorage.getItem('logoutReason');
  }
  clearLogoutReason() {
    localStorage.removeItem('logoutReason');
  }

}
