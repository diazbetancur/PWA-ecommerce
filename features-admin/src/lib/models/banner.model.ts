/**
 * Banner admin models
 */

export type BannerPosition =
  | 'Hero'
  | 'Secondary'
  | 'Sidebar'
  | 'Popup'
  | 'Footer';

export interface BannerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  position?: BannerPosition;
  isActive?: boolean;
}

export interface BannerListItem {
  id: string;
  title: string;
  imageUrl: string;
  position: string;
  displayOrder: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface BannerListResponse {
  items: BannerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BannerResponse {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  targetUrl?: string | null;
  buttonText?: string | null;
  position: string;
  startDate?: string | null;
  endDate?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateBannerRequest {
  title: string;
  subtitle?: string;
  targetUrl?: string;
  buttonText?: string;
  position?: BannerPosition;
  startDate?: string;
  endDate?: string;
  displayOrder?: number;
  isActive?: boolean;
  image: File;
}

export interface UpdateBannerRequest {
  title?: string;
  subtitle?: string;
  targetUrl?: string;
  buttonText?: string;
  position?: BannerPosition;
  startDate?: string;
  endDate?: string;
  displayOrder?: number;
  isActive?: boolean;
  image?: File;
}
