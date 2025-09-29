"use client"

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import {
  mapClienteItemToCliente,
  mapCompaniaItemToCompania,
  mapSeccionItemToSeccion
} from '@/lib/mappers';
import type {
  Cliente,
  ClienteItem,
  Compania,
  CompaniaItem,
  Seccion,
  SeccionItem,
  MasterDataItem,
  ApiResponse,
  PaginatedResponse
} from '@/types/master-data';

export function useMasterData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchClientes = useCallback(async (query: string, limit: number = 10): Promise<Cliente[]> => {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      setLoading(true);
      setError(null);

      const response = await apiClient.get<ApiResponse<ClienteItem[]>>(
        `/api/MasterData/clientes/search?query=${encodeURIComponent(query)}&limit=${limit}`
      );

      let clientes: ClienteItem[] = [];
      if (response && Array.isArray(response)) {
        clientes = response;
      } else if (response && response.data) {
        clientes = response.data;
      } else if (response && response.success && response.data) {
        clientes = response.data;
      } else {
        return [];
      }

      const clientesMapeados = clientes.map(mapClienteItemToCliente);
      return clientesMapeados;

    } catch (error: any) {
      let errorMessage = 'Error desconocido buscando clientes';
      
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint de búsqueda de clientes no encontrado';
      } else if (error.response?.status === 401) {
        errorMessage = 'Sin autorización para buscar clientes';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getClientes = useCallback(async (page: number = 1, pageSize: number = 50, search?: string): Promise<PaginatedResponse<Cliente>> => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      if (search && search.trim()) {
        params.append('search', search.trim());
      }

      const response = await apiClient.get<any>(
        `/api/MasterData/clientes?${params.toString()}`
      );

      const items = response.items || response.data || response || [];
      const mappedItems = items.map(mapClienteItemToCliente);

      const result: PaginatedResponse<Cliente> = {
        items: mappedItems,
        totalCount: response.totalCount || mappedItems.length,
        currentPage: response.currentPage || page,
        pageNumber: response.pageNumber || page,
        pageSize: response.pageSize || pageSize,
        totalPages: response.totalPages || Math.ceil((response.totalCount || mappedItems.length) / pageSize),
        hasNextPage: response.hasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || false,
        startItem: response.startItem,
        endItem: response.endItem
      };
      return result;

    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido obteniendo clientes';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getClienteById = useCallback(async (id: number): Promise<Cliente | null> => {
    try {
      if (id <= 0) {
        throw new Error('ID de cliente debe ser mayor a 0');
      }

      setLoading(true);
      setError(null);

      const response = await apiClient.get<any>(
        `/api/MasterData/clientes/${id}`
      );

      let clienteItem: ClienteItem | null = null;
      
      if (response && response.data) {
        clienteItem = response.data;
      } else if (response && response.id) {
        clienteItem = response;
      }

      if (!clienteItem) {
        return null;
      }

      const cliente = mapClienteItemToCliente(clienteItem);
      return cliente;

    } catch (error: any) {
      if (error.response?.status === 404 || error.message?.includes('404') || error.message?.includes('no encontrado')) {
        return null;
      }
      
      const errorMessage = error.message || 'Error desconocido obteniendo cliente';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCompanias = useCallback(async (): Promise<Compania[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<any>('/api/MasterData/companias');
      let companias: CompaniaItem[] = [];
      
      if (response && Array.isArray(response)) {
        companias = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        companias = response.data;
      } else if (response && response.success && response.data) {
        companias = response.data;
      } else {
        return [];
      }

      const companiasMapeadas = companias
        .filter((c: CompaniaItem) => c.isActive)
        .map(mapCompaniaItemToCompania);

      return companiasMapeadas;

    } catch (error: any) {
      let errorMessage = 'Error desconocido obteniendo compañías';
      
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint de compañías no encontrado';
      } else if (error.response?.status === 401) {
        errorMessage = 'Sin autorización para obtener compañías';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getCompaniaById = useCallback(async (id: number): Promise<Compania | null> => {
    try {
      const companias = await getCompanias();
      return companias.find(c => c.id === id) || null;
    } catch (error) {
      return null;
    }
  }, [getCompanias]);

  const getSecciones = useCallback(async (): Promise<Seccion[]> => {
    try {
      setLoading(true);
      setError(null);

      const url = '/api/MasterData/secciones';
      const response = await apiClient.get<any>(url);
      let secciones: SeccionItem[] = [];

      if (response && Array.isArray(response)) {
        secciones = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        secciones = response.data;
      } else if (response && response.success && response.data) {
        secciones = response.data;
      } else {
        console.warn('Formato de respuesta inesperado para secciones:', response);
        return [];
      }

      const seccionesMapeadas = secciones
        .filter((s: SeccionItem) => s.isActive)
        .map(mapSeccionItemToSeccion);
      return seccionesMapeadas;

    } catch (error: any) {
      let errorMessage = 'Error desconocido obteniendo secciones';
      
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint de secciones no encontrado';
      } else if (error.response?.status === 401) {
        errorMessage = 'Sin autorización para obtener secciones';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getSeccionById = useCallback(async (id: number): Promise<Seccion | null> => {
    try {
      const secciones = await getSecciones();
      return secciones.find(s => s.id === id) || null;
    } catch (error) {
      return null;
    }
  }, [getSecciones]);

  const getMasterDataByType = useCallback(async (type: string, companiaId?: number): Promise<MasterDataItem[]> => {
    try {
      setLoading(true);
      setError(null);

      const endpointMap: Record<string, string> = {
        'combustibles': '/api/MasterData/combustibles',
        'categorias': '/api/MasterData/categorias',
        'departamentos': '/api/MasterData/departamentos',
        'destinos': '/api/MasterData/destinos',
        'calidades': '/api/MasterData/calidades',
        'tarifas': '/api/MasterData/tarifas'
      };

      const endpoint = endpointMap[type];
      if (!endpoint) {
        return [];
      }

      let url = endpoint;
      if (type === 'tarifas' && companiaId) {
        url = `${endpoint}?companiaId=${companiaId}`;
      }

      const response = await apiClient.get<any>(url);
      let items: any[] = Array.isArray(response) ? response : response?.data || [];
      if (type === 'tarifas' && companiaId && items.length > 0) {
        const itemsBeforeFilter = items.length;
        items = items.filter((item: any) => item.companias === companiaId);
      }

      const mappedItems: MasterDataItem[] = items
        .filter((item: any) => {
          if (type === 'categorias') {
            return item.catdsc && item.catdsc.trim() !== '';
          }
          return true;
        })
        .map((item: any) => {
          let nombre = '';
          let codigo = '';
          let id = item.id;
          switch (type) {
            case 'combustibles':
              nombre = item.name || '';
              codigo = item.id || '';
              id = item.id; 
              break;
            
            case 'categorias':
              nombre = item.catdsc || '';
              codigo = item.catcod || '';
              break;
            
            case 'departamentos':
              nombre = item.dptnom || '';
              codigo = item.sc_cod || '';
              break;
            
            case 'destinos':
              nombre = item.desnom || '';
              codigo = item.descod || '';
              break;
            
            case 'calidades':
              nombre = item.caldsc || '';
              codigo = item.calcod || '';
              break;
            
            case 'tarifas':
              nombre = item.tarnom || '';
              codigo = item.tarcod || '';
              break;
            
            default:
              nombre = item.nombre || item.name || 'Sin nombre';
              codigo = item.codigo || item.code || '';
          }

          return {
            id: id,
            nombre: nombre,
            codigo: codigo,
            valor: item.valor || item.value,
            activo: true
          };
        });

      return mappedItems;

    } catch (error: any) {
      const errorMessage = error.message || `Error obteniendo master data '${type}'`;
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const preloadCommonData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.allSettled([
        getCompanias(),
        getSecciones(),
        getMasterDataByType('combustibles'),
        getMasterDataByType('categorias'),
        getMasterDataByType('departamentos')
      ]);    
    } catch (error: any) {
      setError(error.message || 'Error precargando datos');
    } finally {
      setLoading(false);
    }
  }, [getCompanias, getSecciones, getMasterDataByType]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    getClientes,
    searchClientes,
    getClienteById,

    getCompanias,
    getCompaniaById,

    getSecciones,
    getSeccionById,
    getMasterDataByType,

    preloadCommonData,
    clearError,
    setError,
  };
}