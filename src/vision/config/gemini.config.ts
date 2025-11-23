import { registerAs } from '@nestjs/config';
import { GeminiConfig } from './gemini-config.type';
import { IsString } from 'class-validator';
import validateConfig from '../../utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  GEMINI_API_KEY: string;
}

export default registerAs<GeminiConfig>('gemini', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    apiKey: process.env.GEMINI_API_KEY!,
  };
});
