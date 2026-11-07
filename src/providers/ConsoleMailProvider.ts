import { injectable } from 'inversify';
import type { IMailProvider, Mail } from './IMailProvider';

@injectable()
export class ConsoleMailProvider implements IMailProvider {
  async sendMail(mail: Mail): Promise<null> {
    console.log('[ConsoleMailProvider]', mail);
    return null;
  }
}
