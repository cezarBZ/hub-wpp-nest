import { Injectable } from '@nestjs/common';

@Injectable()
export class QRStorageService {
  private qrMap = new Map<string, string>();

  setQR(clientId: string, qr: string) {
    this.qrMap.set(clientId, qr);
  }

  getQR(clientId: string): string | null {
    return this.qrMap.get(clientId) ?? null;
  }

  clearQR(clientId: string) {
    this.qrMap.delete(clientId);
  }
}
