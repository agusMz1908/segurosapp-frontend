// hooks/use-master-data.ts
"use client"

import { useState, useCallback } from 'react';

export interface Cliente {
  id: number;
  nombre: string;
  documento: string;
  email?: string;
  telefono?: string;
  activo: boolean;
}

export interface Compania {
  id: number;
  nombre: string;
  codigo?: string;
  activa: boolean;
}

export interface Seccion {
  id: number;
  nombre: string;
  codigo?: string;
  companiaId?: number;
  activa: boolean;
}

export interface MasterDataItem {
  id: number;
  nombre: string;
  codigo?: string;
  valor?: string;
  activo: boolean;
}

// Mock data - Replace with real API calls
const mockClientes: Cliente[] = [
  { id: 1, nombre: "Juan Pérez", documento: "12345678-9", email: "juan@email.com", activo: true },
  { id: 2, nombre: "María González", documento: "87654321-0", email: "maria@email.com", activo: true },
  { id: 3, nombre: "Carlos Ruiz", documento: "11223344-5", email: "carlos@email.com", activo: true },
  { id: 4, nombre: "Ana López", documento: "99887766-4", email: "ana@email.com", activo: true },
  { id: 5, nombre: "Roberto Silva", documento: "55443322-1", email: "roberto@email.com", activo: true },
];

const mockCompanias: Compania[] = [
  { id: 1, nombre: "Sura Seguros", codigo: "SURA", activa: true },
  { id: 2, nombre: "Mapfre Uruguay", codigo: "MAPFRE", activa: true },
  { id: 3, nombre: "BSE - Banco de Seguros del Estado", codigo: "BSE", activa: true },
  { id: 4, nombre: "Berkley International", codigo: "BERKLEY", activa: true },
];

const mockSecciones: Seccion[] = [
  { id: 1, nombre: "Automotor", codigo: "AUTO", activa: true },
  { id: 2, nombre: "Hogar", codigo: "HOGAR", activa: true },
  { id: 3, nombre: "Vida", codigo: "VIDA", activa: true },
  { id: 4, nombre: "Accidentes Personales", codigo: "AP", activa: true },
  { id: 5, nombre: "Responsabilidad Civil", codigo: "RC", activa: true },
];

const mockMasterData = {
  combustibles: [
    { id: 1, nombre: "Nafta", codigo: "NAFTA", activo: true },
    { id: 2, nombre: "Gasoil", codigo: "GASOIL", activo: true },
    { id: 3, nombre: "GNC", codigo: "GNC", activo: true },
    { id: 4, nombre: "Eléctrico", codigo: "ELEC", activo: true },
  ],
  categorias: [
    { id: 1, nombre: "Particular", codigo: "PART", activo: true },
    { id: 2, nombre: "Comercial", codigo: "COMER", activo: true },
    { id: 3, nombre: "Transporte", codigo: "TRANS", activo: true },
  ],
  "usos-vehiculo": [
    { id: 1, nombre: "Particular", codigo: "PART", activo: true },
    { id: 2, nombre: "Comercial liviano", codigo: "COMER_LIV", activo: true },
    { id: 3, nombre: "Taxi/Remise", codigo: "TAXI", activo: true },
    { id: 4, nombre: "Carga", codigo: "CARGA", activo: true },
  ],
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useMasterData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener el token de autorización
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token') || '';
  }, []);

  // Función genérica para hacer requests
  const makeRequest = useCallback(async <T>(
    url: string,
    options?: RequestInit
  ): Promise<T> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;

    } catch (error: any) {
      console.error(`Error fetching data from ${url}:`, error);
      setError(error.message || 'Error desconocido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  // Clientes
  const getClientes = useCallback(async (): Promise<Cliente[]> => {
    try {
      // Simular llamada a la API real - reemplazar con makeRequest cuando esté listo
      await delay(500);
      return mockClientes.filter(c => c.activo);
    } catch (error) {
      console.error('Error getting clientes:', error);
      return [];
    }
  }, []);

  const searchClientes = useCallback(async (query: string): Promise<Cliente[]> => {
    try {
      await delay(300);
      
      if (!query.trim()) return [];
      
      const normalizedQuery = query.toLowerCase();
      return mockClientes.filter(cliente => 
        cliente.activo && (
          cliente.nombre.toLowerCase().includes(normalizedQuery) ||
          cliente.documento.includes(normalizedQuery) ||
          (cliente.email && cliente.email.toLowerCase().includes(normalizedQuery))
        )
      );
    } catch (error) {
      console.error('Error searching clientes:', error);
      return [];
    }
  }, []);

  const getClienteById = useCallback(async (id: number): Promise<Cliente | null> => {
    try {
      await delay(200);
      return mockClientes.find(c => c.id === id && c.activo) || null;
    } catch (error) {
      console.error('Error getting cliente by id:', error);
      return null;
    }
  }, []);

  // Compañías
  const getCompanias = useCallback(async (): Promise<Compania[]> => {
    try {
      // En producción, usar: return await makeRequest<Compania[]>('/api/master-data/companias');
      await delay(400);
      return mockCompanias.filter(c => c.activa);
    } catch (error) {
      console.error('Error getting companias:', error);
      return [];
    }
  }, []);

  const getCompaniaById = useCallback(async (id: number): Promise<Compania | null> => {
    try {
      await delay(200);
      return mockCompanias.find(c => c.id === id && c.activa) || null;
    } catch (error) {
      console.error('Error getting compania by id:', error);
      return null;
    }
  }, []);

  // Secciones
  const getSecciones = useCallback(async (companiaId?: number): Promise<Seccion[]> => {
    try {
      // En producción, usar: 
      // const url = companiaId ? `/api/master-data/secciones?companiaId=${companiaId}` : '/api/master-data/secciones';
      // return await makeRequest<Seccion[]>(url);
      
      await delay(400);
      
      // Por ahora devolvemos todas las secciones activas
      // En el futuro se pueden filtrar por compañía si es necesario
      return mockSecciones.filter(s => s.activa);
    } catch (error) {
      console.error('Error getting secciones:', error);
      return [];
    }
  }, []);

  const getSeccionById = useCallback(async (id: number): Promise<Seccion | null> => {
    try {
      await delay(200);
      return mockSecciones.find(s => s.id === id && s.activa) || null;
    } catch (error) {
      console.error('Error getting seccion by id:', error);
      return null;
    }
  }, []);

  // Datos maestros específicos (combustibles, categorías, etc.)
  const getMasterDataByType = useCallback(async (type: string): Promise<MasterDataItem[]> => {
    try {
      // En producción, usar: return await makeRequest<MasterDataItem[]>(`/api/master-data/${type}`);
      await delay(300);
      
      const data = mockMasterData[type as keyof typeof mockMasterData];
      if (!data) {
        throw new Error(`Tipo de dato maestro '${type}' no encontrado`);
      }
      
      return data.filter(item => item.activo);
    } catch (error) {
      console.error(`Error getting master data for type ${type}:`, error);
      return [];
    }
  }, []);

  // Función para crear nuevo cliente (si es necesario en el futuro)
  const createCliente = useCallback(async (clienteData: Partial<Cliente>): Promise<Cliente | null> => {
    try {
      setLoading(true);
      setError(null);

      // En producción, usar makeRequest
      await delay(800);
      
      // Mock creation
      const newCliente: Cliente = {
        id: Math.max(...mockClientes.map(c => c.id)) + 1,
        nombre: clienteData.nombre || '',
        documento: clienteData.documento || '',
        email: clienteData.email,
        telefono: clienteData.telefono,
        activo: true,
      };

      mockClientes.push(newCliente);
      return newCliente;

    } catch (error: any) {
      console.error('Error creating cliente:', error);
      setError(error.message || 'Error creando cliente');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Hook para precargar datos comunes
  const preloadCommonData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Precargar datos que se usan frecuentemente
      await Promise.all([
        getCompanias(),
        getSecciones(),
        getMasterDataByType('combustibles'),
        getMasterDataByType('categorias'),
        getMasterDataByType('usos-vehiculo'),
      ]);
      
    } catch (error) {
      console.error('Error preloading data:', error);
    } finally {
      setLoading(false);
    }
  }, [getCompanias, getSecciones, getMasterDataByType]);

  return {
    // Estado
    loading,
    error,
    
    // Clientes
    getClientes,
    searchClientes,
    getClienteById,
    createCliente,
    
    // Compañías
    getCompanias,
    getCompaniaById,
    
    // Secciones
    getSecciones,
    getSeccionById,
    
    // Datos maestros
    getMasterDataByType,
    
    // Utils
    preloadCommonData,
    setError,
  };
}