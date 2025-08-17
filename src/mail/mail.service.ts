import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';

import { MailerService } from '../mailer/mailer.service';
import path from 'path';
import { AllConfigType } from '../config/config.type';
import { MailData } from './mail.type';
import { MaybeType } from 'src/utils/types/maybe.type';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AllConfigType>,
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
    const i18n = I18nContext.current();
    let title: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let actionTitle: MaybeType<string>;

    if (i18n) {
      [title, text1, text2, text3, actionTitle] = await Promise.all([
        i18n.t('auth.title'),
        i18n.t('auth.text1'),
        i18n.t('auth.text2'),
        i18n.t('auth.text3'),
        i18n.t('auth.actionTitle'),
      ]);
    }

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
        app_name: this.configService.get('app.name', { infer: true }),
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
    const i18n = I18nContext.current();
    let title: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let actionTitle: MaybeType<string>;

    if (i18n) {
      [title, text1, text2, text3, actionTitle] = await Promise.all([
        i18n.t('otp.resendTitle'),
        i18n.t('otp.resendText1'),
        i18n.t('otp.resendText2'),
        i18n.t('otp.resendText3'),
        i18n.t('otp.actionTitle'),
      ]);
    }

    // Fallback values if i18n is not available
    const emailTitle = title || 'Your New Verification Code';
    const emailText1 = text1 || 'You requested a new verification code.';
    const emailText2 =
      text2 || 'Please use the code below to verify your email address:';
    const emailText3 =
      text3 ||
      'If you continue to have trouble, please contact our support team.';
    const emailActionTitle = actionTitle || 'Verify Email';

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
        app_name: this.configService.get('app.name', { infer: true }),
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
    const i18n = I18nContext.current();
    let resetPasswordTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let text4: MaybeType<string>;

    if (i18n) {
      [resetPasswordTitle, text1, text2, text3, text4] = await Promise.all([
        i18n.t('common.resetPassword'),
        i18n.t('reset-password.text1'),
        i18n.t('reset-password.text2'),
        i18n.t('reset-password.text3'),
        i18n.t('reset-password.text4'),
      ]);
    }

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
        app_name: this.configService.get('app.name', {
          infer: true,
        }),
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
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-new-email.text1'),
        i18n.t('confirm-new-email.text2'),
        i18n.t('confirm-new-email.text3'),
      ]);
    }

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
        app_name: this.configService.get('app.name', { infer: true }),
        text1,
        text2,
        text3,
      },
    });
    this.logger.log(`Confirm new email sent to: ${mailData.to}`);
  }
}
