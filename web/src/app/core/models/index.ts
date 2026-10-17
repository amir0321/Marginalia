export interface User {
  sub: string;
  unique_name: string;
  exp: number;
}

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  publishedDate: string;
  description?: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  userId: string;
  text: string;
  author: string;
  createdAt: string;
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

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  autohide?: boolean;
}
