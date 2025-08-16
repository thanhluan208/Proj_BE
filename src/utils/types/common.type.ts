export interface PaginationOptions {
  skip?: number;
  take?: number;
}

export interface CommonResponse<T> {
  status: number;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}
