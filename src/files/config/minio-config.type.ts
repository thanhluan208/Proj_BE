export type MinioConfig = {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  region?: string;
  pathStyle?: boolean;
  connectTimeout?: number;
  readTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
};
