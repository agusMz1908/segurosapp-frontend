// utils/auth-utils.ts
"use client"

/**
 * Nombre estándar para el token en localStorage
 * Usar SOLO este nombre en toda la aplicación
 */
export const AUTH_TOKEN_KEY = 'auth-token';

/**
 * Obtiene el token de autenticación de forma consistente
 * Prioriza auth-token pero también busca variantes por compatibilidad
 */
export function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  
  // 1. Prioridad: el nombre estándar actual
  const primaryToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (primaryToken) {
    return primaryToken;
  }
  
  // 2. Buscar variantes por compatibilidad (migración)
  const legacyTokens = [
    localStorage.getItem('auth_token'),
    localStorage.getItem('token'),
    // También buscar en cookies
    document.cookie
      .split('; ')
      .find(row => row.startsWith('seguros_token='))
      ?.split('=')[1]
  ].filter(Boolean);
  
  const token = legacyTokens[0] || '';
  
  // Si encontramos un token legacy, migrarlo al nombre estándar
  if (token && !primaryToken) {
    console.log('🔄 Migrando token legacy al formato estándar');
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    
    // Limpiar tokens legacy
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
  }
  
  if (token) {
    console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
  } else {
    console.warn('⚠️ No se encontró token de autenticación');
  }
  
  return token;
}

/**
 * Guarda el token de autenticación
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  console.log('💾 Token guardado exitosamente');
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return !!token;
}

/**
 * Limpia todos los tokens y datos de autenticación
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  // Limpiar localStorage
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user_data');
  
  // Limpiar cookies
  document.cookie = 'seguros_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  
  console.log('🧹 Datos de autenticación limpiados');
}

/**
 * Maneja errores 401 de forma consistente
 */
export function handle401Error(): void {
  console.error('🚫 Error 401: Token inválido o expirado');
  
  clearAuthData();
  
  // Redirigir a login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/**
 * Obtiene headers de autenticación para requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

/**
 * Obtiene headers de autenticación para FormData (sin Content-Type)
 */
export function getAuthHeadersForFormData(): HeadersInit {
  const token = getAuthToken();
  
  return {
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}