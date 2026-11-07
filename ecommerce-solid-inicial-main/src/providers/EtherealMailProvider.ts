import { injectable } from 'inversify';
import nodemailer, { Transporter } from 'nodemailer';
import logger from '../lib/logger';
import { IMailProvider, Mail } from './IMailProvider';

@injectable()
export class EtherealMailProvider implements IMailProvider {
  private transporter: Transporter | null = null;

  async sendMail(mail: Mail): Promise<string | null> {
    const transporter = await this.getTransporter();
    const info = await transporter.sendMail({ from: '"DevStore" <noreply@devstore.com>', ...mail });
    return nodemailer.getTestMessageUrl(info) || null;
  }

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) return this.transporter;

    const account = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    logger.info(`Ethereal Mail configurado: ${account.user}`);
    return this.transporter;
  }
}
