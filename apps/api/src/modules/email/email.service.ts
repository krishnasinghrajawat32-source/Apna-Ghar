import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { UserRole } from '@apna-ghar/shared-types';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') || process.env.SMTP_HOST;
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || process.env.SMTP_PORT || '587', 10);
    const user = this.configService.get<string>('SMTP_USER') || process.env.SMTP_USER;
    const pass = this.configService.get<string>('SMTP_PASS') || process.env.SMTP_PASS;
    this.fromAddress =
      this.configService.get<string>('EMAIL_FROM') ||
      process.env.EMAIL_FROM ||
      'Apna Ghar Security <no-reply@apnaghar.in>';

    const isPlaceholder =
      !user ||
      !pass ||
      user.includes('your-address') ||
      user.includes('example.com') ||
      user.includes('placeholder') ||
      pass.includes('your-gmail') ||
      pass.includes('placeholder') ||
      pass === 'your-gmail-app-password';

    if (host && user && pass && !isPlaceholder) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          connectionTimeout: 4000,
          greetingTimeout: 4000,
          socketTimeout: 5000,
        });
        this.logger.log(`SMTP transporter initialized with host: ${host}:${port}`);
      } catch (err: unknown) {
        this.logger.warn(`Failed to initialize SMTP transporter: ${(err as Error).message}. Dev console fallback active.`);
        this.transporter = null;
      }
    } else {
      this.logger.log('SMTP not configured or placeholder detected; operating in fast Development Console Fallback mode.');
    }
  }

  /**
   * Dispatches or simulates an email with a strict timeout to prevent hanging the request.
   */
  async sendMail(to: string, subject: string, html: string, textFallback: string): Promise<EmailDispatchResult> {
    if (this.transporter) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SMTP connection timed out after 4000ms')), 4000),
        );
        const info = await Promise.race([
          this.transporter.sendMail({
            from: this.fromAddress,
            to,
            subject,
            text: textFallback,
            html,
          }),
          timeoutPromise,
        ]);
        this.logger.log(`Email dispatched to ${to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId, simulated: false };
      } catch (error: unknown) {
        this.logger.error(`SMTP delivery failed to ${to}: ${(error as Error).message}. Falling back to dev logger.`);
      }
    }

    // Dev / Test fallback simulation
    this.logger.warn(
      `\n======================================================\n` +
      `[DEV ONLY - EMAIL NOTIFICATION]\n` +
      `To: ${to}\n` +
      `Subject: ${subject}\n` +
      `Body:\n${textFallback}\n` +
      `======================================================\n`
    );

    return { success: true, simulated: true };
  }

  /**
   * Dispatches Email Verification OTP
   */
  async sendVerificationOtp(email: string, name: string, otp: string, expiresInMinutes = 5): Promise<EmailDispatchResult> {
    const subject = `Apna Ghar — Your Verification Code: ${otp}`;
    const textFallback = `Hello ${name},\n\nYour Apna Ghar email verification code is: ${otp}\nThis code will expire in ${expiresInMinutes} minutes.\n\nIf you did not create an account, please disregard this email.`;

    const html = this.renderEmailLayout(`
      <h2 style="color: #173327; font-size: 20px; font-weight: 700; margin-bottom: 8px;">Verify Your Email Address</h2>
      <p style="color: #3D3A33; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        Namaste <strong>${name}</strong>, thank you for joining Apna Ghar. Enter the 6-digit verification code below to activate your account:
      </p>
      <div style="background-color: #F0F5F2; border: 1.5px dashed #173327; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #173327;">${otp}</span>
      </div>
      <p style="color: #716D64; font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
        ⏱️ This code is valid for <strong>${expiresInMinutes} minutes</strong>. For security reasons, never share this code with anyone.
      </p>
      <p style="color: #716D64; font-size: 12px; line-height: 1.5;">
        If you did not request this registration, no further action is required.
      </p>
    `);

    // Log OTP explicitly for developer convenience in terminal
    // eslint-disable-next-line no-console
    console.info(`\x1b[32m[DEV ONLY - EMAIL OTP]\x1b[0m Verification code for ${email}: \x1b[1m\x1b[33m${otp}\x1b[0m (valid ${expiresInMinutes}m)`);

    return this.sendMail(email, subject, html, textFallback);
  }

  /**
   * Dispatches Account Verification Success
   */
  async sendVerificationSuccess(email: string, name: string, role: UserRole): Promise<EmailDispatchResult> {
    const subject = 'Welcome to Apna Ghar — Email Verified';
    const isOwnerOrVendor = role === UserRole.OWNER || role === UserRole.MESS_PARTNER;

    const roleNotice = isOwnerOrVendor
      ? `<div style="background-color: #FFF8E6; border-left: 4px solid #E06D3B; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
           <p style="color: #8C4A00; font-size: 13px; margin: 0; font-weight: 600;">Account Under Platform Review</p>
           <p style="color: #8C4A00; font-size: 12px; margin: 4px 0 0 0;">As a partner on Apna Ghar, your listing and identity documents will be reviewed by our compliance team before your properties or services go live.</p>
         </div>`
      : `<p style="color: #3D3A33; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
           Your student profile is active. You can now explore verified student accommodations, schedule visits, and send booking requests.
         </p>`;

    const textFallback = `Namaste ${name},\n\nYour email address has been successfully verified on Apna Ghar!\n\n${
      isOwnerOrVendor
        ? 'Your partner account is now pending administrative approval before management features unlock.'
        : 'You can now browse verified listings and submit booking requests.'
    }\n\nHar Sahar Apna Ghar.`;

    const html = this.renderEmailLayout(`
      <h2 style="color: #173327; font-size: 20px; font-weight: 700; margin-bottom: 8px;">Email Verified Successfully</h2>
      <p style="color: #3D3A33; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        Namaste <strong>${name}</strong>, your email address (<code>${email}</code>) has been confirmed.
      </p>
      ${roleNotice}
      <p style="color: #716D64; font-size: 12px; margin-top: 24px;">
        Thank you for being part of India's trust-first student housing community.
      </p>
    `);

    return this.sendMail(email, subject, html, textFallback);
  }

  /**
   * Dispatches Password Reset OTP
   */
  async sendPasswordResetOtp(email: string, name: string, otp: string, expiresInMinutes = 5): Promise<EmailDispatchResult> {
    const subject = `Apna Ghar — Password Reset Code: ${otp}`;
    const textFallback = `Hello ${name},\n\nA password reset was requested for your Apna Ghar account.\nYour 6-digit reset code is: ${otp}\nThis code will expire in ${expiresInMinutes} minutes.\n\nIf you did not request a password reset, please secure your account immediately.`;

    const html = this.renderEmailLayout(`
      <h2 style="color: #173327; font-size: 20px; font-weight: 700; margin-bottom: 8px;">Password Reset Request</h2>
      <p style="color: #3D3A33; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        Namaste <strong>${name}</strong>, we received a request to reset the password associated with your account. Use the one-time code below to proceed:
      </p>
      <div style="background-color: #FFF2EB; border: 1.5px dashed #E06D3B; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #E06D3B;">${otp}</span>
      </div>
      <p style="color: #716D64; font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
        ⏱️ This code is valid for <strong>${expiresInMinutes} minutes</strong>. If you did not initiate this request, ignore this email and your password will remain unchanged.
      </p>
    `);

    // eslint-disable-next-line no-console
    console.info(`\x1b[32m[DEV ONLY - EMAIL OTP]\x1b[0m Password reset code for ${email}: \x1b[1m\x1b[31m${otp}\x1b[0m (valid ${expiresInMinutes}m)`);

    return this.sendMail(email, subject, html, textFallback);
  }

  /**
   * Dispatches Password Reset Confirmation
   */
  async sendPasswordResetConfirmation(email: string, name: string): Promise<EmailDispatchResult> {
    const subject = 'Apna Ghar — Security Alert: Password Updated';
    const textFallback = `Hello ${name},\n\nThe password for your Apna Ghar account was successfully changed.\nAll active sessions across your devices have been logged out.\n\nIf you did not perform this change, please contact support immediately.`;

    const html = this.renderEmailLayout(`
      <h2 style="color: #173327; font-size: 20px; font-weight: 700; margin-bottom: 8px;">Password Changed Successfully</h2>
      <p style="color: #3D3A33; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        Namaste <strong>${name}</strong>, this is an automated confirmation that your Apna Ghar password was updated.
      </p>
      <div style="background-color: #F0F5F2; border-left: 4px solid #173327; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <p style="color: #173327; font-size: 12px; margin: 0; font-weight: 600;">Active Sessions Revoked</p>
        <p style="color: #3D3A33; font-size: 12px; margin: 4px 0 0 0;">For your security, all active sessions on other browsers and devices have been automatically invalidated.</p>
      </div>
      <p style="color: #C0392B; font-size: 12px; line-height: 1.5; margin-top: 20px;">
        ⚠️ If you did not authorize this change, please contact our support team immediately at security@apnaghar.in.
      </p>
    `);

    return this.sendMail(email, subject, html, textFallback);
  }

  /**
   * Renders consistent, responsive Apna Ghar email wrapper
   */
  private renderEmailLayout(content: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apna Ghar</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FCFBF7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #173327;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FCFBF7; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border: 1px solid #ECE8DD; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(23, 51, 39, 0.04);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #173327; padding: 28px 32px; text-align: left;">
              <div style="display: inline-block; vertical-align: middle;">
                <span style="display: inline-block; width: 36px; height: 36px; line-height: 36px; background-color: #E06D3B; color: #FFFFFF; font-weight: 800; font-size: 16px; text-align: center; border-radius: 8px; margin-right: 12px;">AG</span>
                <span style="color: #FCFBF7; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; vertical-align: middle;">Apna Ghar</span>
              </div>
              <div style="color: #B4C6BE; font-size: 11px; margin-top: 6px; letter-spacing: 0.5px; text-transform: uppercase;">Har Sahar Apna Ghar</div>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF9F5; border-top: 1px solid #ECE8DD; padding: 24px 32px; text-align: center;">
              <p style="color: #716D64; font-size: 11px; margin: 0 0 6px 0;">
                Apna Ghar — India's Verified Student Accommodation & Mess Network
              </p>
              <p style="color: #9C988D; font-size: 10px; margin: 0;">
                This is an automated system email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
