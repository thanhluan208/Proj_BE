import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { MailerService } from '../mailer/mailer.service';
import path from 'path';
import { AllConfigType } from '../config/config.type';
import { MailData } from './mail.type';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Send user sign up email with OTP code
   * Updated to include OTP code in the email template
   * @param mailData - Email data including OTP code
   */
  async userSignUp(
    mailData: MailData<{ hash: string; otpCode: string }>,
  ): Promise<void> {
    this.logger.log(`userSignUp called for: ${mailData.to}`);

    const title = this.i18n.t('auth.title', {
      lang: I18nContext.current()?.lang,
    });
    const text1 = this.i18n.t('auth.text1', {
      lang: I18nContext.current()?.lang,
    });
    const text2 = this.i18n.t('auth.text2', {
      lang: I18nContext.current()?.lang,
    });
    const text3 = this.i18n.t('auth.text3', {
      lang: I18nContext.current()?.lang,
    });
    const actionTitle = this.i18n.t('auth.actionTitle', {
      lang: I18nContext.current()?.lang,
    });

    // Construct URL for email confirmation page
    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/confirm-email',
    );
    url.searchParams.set('hash', mailData.data.hash);
    url.searchParams.set('email', mailData.to);

    this.logger.log(
      `Sending sign up email to: ${mailData.to} with OTP: ${mailData.data.otpCode.substring(0, 2)}****`,
    );

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: title,
      text: `${url.toString()} ${title} - OTP: ${mailData.data.otpCode}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'confirm-new-email.hbs',
      ),
      context: {
        title,
        url: url.toString(),
        actionTitle,
        app_name:
          this.configService.get('app.name', { infer: true }) ?? 'App Name',
        text1,
        text2,
        text3,
        otpCode: mailData.data.otpCode, // Include OTP code in template context
        currentYear: new Date().getFullYear(), // Add current year for footer
      },
    });
    this.logger.log(`Sign up email with OTP sent to: ${mailData.to}`);
  }

  /**
   * Send OTP resend email
   * New method for sending OTP when user requests resend
   * @param mailData - Email data with OTP code
   */
  async resendOtp(mailData: MailData<{ otpCode: string }>): Promise<void> {
    this.logger.log(`resendOtp called for: ${mailData.to}`);

    const emailTitle = this.i18n.t('otp.resendTitle', {
      lang: I18nContext.current()?.lang,
    });
    const emailText1 = this.i18n.t('otp.resendText1', {
      lang: I18nContext.current()?.lang,
    });
    const emailText2 = this.i18n.t('otp.resendText2', {
      lang: I18nContext.current()?.lang,
    });
    const emailText3 = this.i18n.t('otp.resendText3', {
      lang: I18nContext.current()?.lang,
    });
    const emailActionTitle = this.i18n.t('otp.actionTitle', {
      lang: I18nContext.current()?.lang,
    });

    // Construct URL for email confirmation page
    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/confirm-email',
    );
    url.searchParams.set('email', mailData.to);

    this.logger.log(
      `Sending resend OTP email to: ${mailData.to} with OTP: ${mailData.data.otpCode.substring(0, 2)}****`,
    );

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailTitle,
      text: `${emailTitle} - OTP: ${mailData.data.otpCode}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'confirm-new-email.hbs',
      ),
      context: {
        title: emailTitle,
        url: url.toString(),
        actionTitle: emailActionTitle,
        app_name:
          this.configService.get('app.name', { infer: true }) ?? 'App Name',
        text1: emailText1,
        text2: emailText2,
        text3: emailText3,
        otpCode: mailData.data.otpCode, // Include new OTP code
        currentYear: new Date().getFullYear(),
      },
    });
    this.logger.log(`Resend OTP email sent to: ${mailData.to}`);
  }

  async forgotPassword(
    mailData: MailData<{ hash: string; tokenExpires: number }>,
  ): Promise<void> {
    this.logger.log(`forgotPassword called for: ${mailData.to}`);

    const resetPasswordTitle = this.i18n.t('common.resetPassword', {
      lang: I18nContext.current()?.lang,
    });
    const text1 = this.i18n.t('reset-password.text1', {
      lang: I18nContext.current()?.lang,
    });
    const text2 = this.i18n.t('reset-password.text2', {
      lang: I18nContext.current()?.lang,
    });
    const text3 = this.i18n.t('reset-password.text3', {
      lang: I18nContext.current()?.lang,
    });
    const text4 = this.i18n.t('reset-password.text4', {
      lang: I18nContext.current()?.lang,
    });

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/password-change',
    );
    url.searchParams.set('hash', mailData.data.hash);
    url.searchParams.set('expires', mailData.data.tokenExpires.toString());

    this.logger.log(
      `Sending forgot password email to: ${mailData.to} with hash: ${mailData.data.hash}`,
    );
    await this.mailerService.sendMail({
      to: mailData.to,
      subject: resetPasswordTitle,
      text: `${url.toString()} ${resetPasswordTitle}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'reset-password.hbs',
      ),
      context: {
        title: resetPasswordTitle,
        url: url.toString(),
        actionTitle: resetPasswordTitle,
        app_name:
          this.configService.get('app.name', {
            infer: true,
          }) ?? 'App Name',
        text1,
        text2,
        text3,
        text4,
      },
    });
    this.logger.log(`Forgot password email sent to: ${mailData.to}`);
  }

  async confirmNewEmail(mailData: MailData<{ hash: string }>): Promise<void> {
    this.logger.log(`confirmNewEmail called for: ${mailData.to}`);

    const emailConfirmTitle = this.i18n.t('common.confirmEmail', {
      lang: I18nContext.current()?.lang,
    });
    const text1 = this.i18n.t('confirm-new-email.text1', {
      lang: I18nContext.current()?.lang,
    });
    const text2 = this.i18n.t('confirm-new-email.text2', {
      lang: I18nContext.current()?.lang,
    });
    const text3 = this.i18n.t('confirm-new-email.text3', {
      lang: I18nContext.current()?.lang,
    });

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/confirm-new-email',
    );
    url.searchParams.set('hash', mailData.data.hash);

    this.logger.log(
      `Sending confirm new email to: ${mailData.to} with hash: ${mailData.data.hash}`,
    );
    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'confirm-new-email.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        url: url.toString(),
        actionTitle: emailConfirmTitle,
        app_name:
          this.configService.get('app.name', { infer: true }) ?? 'App Name',
        text1,
        text2,
        text3,
      },
    });
    this.logger.log(`Confirm new email sent to: ${mailData.to}`);
  }
}
