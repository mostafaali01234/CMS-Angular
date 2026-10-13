// shared/models/api-response.model.ts
export interface ApiResponse<T> {
  status: string;
  data: T;
  errors: string[];
  succeeded: boolean;
}