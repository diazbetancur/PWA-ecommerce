/**
 * Popup admin models
 */

export interface PopupListParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

export interface PopupListItem {
  id: string;
  imageUrl?: string | null;
  targetUrl?: string | null;
  buttonText?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface PopupListResponse {
  items: PopupListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PopupResponse {
  id: string;
  imageUrl?: string | null;
  targetUrl?: string | null;
  buttonText?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface CreatePopupRequest {
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  targetUrl?: string;
  buttonText?: string;
  image: File;
}

export interface UpdatePopupRequest {
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  targetUrl?: string;
  buttonText?: string;
  image: File;
}
