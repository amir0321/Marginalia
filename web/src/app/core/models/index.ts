export interface User {
  sub: string;
  unique_name: string;
  exp: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  publishedDate: string;
  description?: string | null;
}

export interface BookRequest {
  title: string;
  author: string;
  publishedDate: string;
  description?: string | null;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
}

export interface QuoteRequest {
  text: string;
  author: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  expiresAt: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  autohide?: boolean;
  action?: ToastAction;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}
