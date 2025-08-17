export type AppConfig = {
  nodeEnv: string;
  name: string;
  workingDirectory: string;
  frontendDomain?: string;
  backendDomain: string;
  port: number;
  apiPrefix: string;
  fallbackLanguage: string;
  headerLanguage: string;
  otpExpiryMinutes: number;
  otpResendLimit: number;
  otpResendInterval: number;
  otpResendCooldownMinutes: number;
  otpResendCooldownMaxMinutes: number;
  otpMaxCooldownMinutes: number;
};
