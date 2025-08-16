export type RedisConfigType = {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  tls?: boolean;
  retryStrategy?: (times: number) => number | null;
  maxRetriesPerRequest?: number;
  connectTimeout?: number;
  enableReadyCheck?: boolean;
};
