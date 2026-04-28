import { HttpContextToken } from '@angular/common/http';

export const SILENT_HTTP_CONTEXT = new HttpContextToken<boolean>(() => false);

export const SHOW_HTTP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
