"use client"
export const AUTH_TOKEN_KEY = 'auth-token';

export function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  const primaryToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (primaryToken) {
    return primaryToken;
  }
  
  const legacyTokens = [
    localStorage.getItem('auth_token'),
    localStorage.getItem('token'),
    document.cookie
      .split('; ')
      .find(row => row.startsWith('seguros_token='))
      ?.split('=')[1]
  ].filter(Boolean);
  
  const token = legacyTokens[0] || '';
  if (token && !primaryToken) {
    console.log('🔄 Migrando token legacy al formato estándar');
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
  }
  
  if (token) {
    console.log('🔑 Token encontrado');
  } else {
    console.warn('⚠️ No se encontró token de autenticación');
  }
  
  return token;
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  console.log('Token guardado exitosamente');
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return !!token;
}

export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user_data');
  
  document.cookie = 'seguros_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  
  console.log('🧹 Datos de autenticación limpiados');
}

export function handle401Error(): void {
  console.error('Error 401: Token inválido o expirado');
  
  clearAuthData();

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

export function getAuthHeadersForFormData(): HeadersInit {
  const token = getAuthToken();
  
  return {
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}