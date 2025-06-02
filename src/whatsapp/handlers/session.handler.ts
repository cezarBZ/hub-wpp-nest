import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionHandlerService {
  async handleCredsUpdate(saveCreds: () => Promise<void>) {
    await saveCreds();
  }
}
