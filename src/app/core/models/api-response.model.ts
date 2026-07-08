/** Mirrors the backend's ElctroWay.DTOs.Common.ApiResponse<T> shape exactly. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
