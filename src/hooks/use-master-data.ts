// hooks/use-master-data.ts
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

  // =================== CLIENTES ===================

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

      // Verificar si es el formato ApiResponse o directo
      let clientes: ClienteItem[] = [];
      if (response && Array.isArray(response)) {
        // Si viene directo como array
        clientes = response;
      } else if (response && response.data) {
        // Si viene como ApiResponse<T>
        clientes = response.data;
      } else if (response && response.success && response.data) {
        // Si viene como ApiResponse con success flag
        clientes = response.data;
      } else {
        console.warn('Formato de respuesta inesperado:', response);
        return [];
      }

      // Mapear ClienteItem[] a Cliente[]
      const clientesMapeados = clientes.map(mapClienteItemToCliente);
      
      console.log(`✅ Búsqueda clientes: ${clientesMapeados.length} resultados para "${query}"`);
      return clientesMapeados;

    } catch (error: any) {
      console.error('❌ Error searching clientes:', error);
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

      // ✅ RUTA CORREGIDA: /api/MasterData/clientes para lista paginada
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

      // El backend podría devolver formato diferente, adaptarse
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

      console.log(`✅ Lista clientes: ${result.items.length}/${result.totalCount} (página ${page})`);
      return result;

    } catch (error: any) {
      console.error('❌ Error getting clientes:', error);
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

      // ✅ RUTA CORREGIDA: /api/MasterData/clientes/{id}
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
      
      console.log(`✅ Cliente obtenido: ${cliente.displayName} (ID: ${id})`);
      return cliente;

    } catch (error: any) {
      console.error(`❌ Error getting cliente ${id}:`, error);
      
      // Si es 404, devolver null sin error
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

  // =================== COMPAÑÍAS ===================

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
        console.warn('Formato de respuesta inesperado para compañías:', response);
        return [];
      }

      const companiasMapeadas = companias
        .filter((c: CompaniaItem) => c.isActive)
        .map(mapCompaniaItemToCompania);

      console.log(`✅ Compañías obtenidas: ${companiasMapeadas.length}`);
      return companiasMapeadas;

    } catch (error: any) {
      console.error('❌ Error getting companias:', error);
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
      console.error(`❌ Error getting compania ${id}:`, error);
      return null;
    }
  }, [getCompanias]);

  // =================== SECCIONES ===================

  const getSecciones = useCallback(async (): Promise<Seccion[]> => {
    try {
      setLoading(true);
      setError(null);

      const url = '/api/MasterData/secciones';
      const response = await apiClient.get<any>(url);
      let secciones: SeccionItem[] = [];
      
      // Adaptarse a diferentes formatos de respuesta
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

      // Filtrar solo activas y mapear
      const seccionesMapeadas = secciones
        .filter((s: SeccionItem) => s.isActive)
        .map(mapSeccionItemToSeccion);
      return seccionesMapeadas;

    } catch (error: any) {
      console.error('❌ Error getting secciones:', error);
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
      console.error(`❌ Error getting seccion ${id}:`, error);
      return null;
    }
  }, [getSecciones]);

  // =================== DATOS MAESTROS ESPECÍFICOS ===================

  // ✅ MODIFICADO: Agregar parámetro opcional companiaId
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
        console.warn(`Tipo de master data '${type}' no soportado`);
        return [];
      }

      // ✅ NUEVO: Agregar filtro por compañía para tarifas
      let url = endpoint;
      if (type === 'tarifas' && companiaId) {
        url = `${endpoint}?companiaId=${companiaId}`;
        console.log(`🏢 Cargando tarifas filtradas por compañía: ${companiaId}`);
      }

      const response = await apiClient.get<any>(url);
      let items: any[] = Array.isArray(response) ? response : response?.data || [];
      
      // ✅ NUEVO: Filtro adicional en frontend para tarifas
      if (type === 'tarifas' && companiaId && items.length > 0) {
        // Filtrar por companias (campo del JSON)
        const itemsBeforeFilter = items.length;
        items = items.filter((item: any) => item.companias === companiaId);
        console.log(`🔍 Tarifas filtradas para compañía ${companiaId}: ${items.length}/${itemsBeforeFilter} encontradas`);
      }
      
      // Mapeo específico por tipo de dato maestro
      const mappedItems: MasterDataItem[] = items
        .filter((item: any) => {
          // Filtrar items vacíos o inactivos
          if (type === 'categorias') {
            return item.catdsc && item.catdsc.trim() !== '';
          }
          return true;
        })
        .map((item: any) => {
          let nombre = '';
          let codigo = '';
          let id = item.id;

          // Mapeo específico según el tipo
          switch (type) {
            case 'combustibles':
              nombre = item.name || '';
              codigo = item.id || ''; // En combustibles, el id es el código
              id = item.id; // Mantener el id como string para combustibles
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

      console.log(`✅ Master data '${type}': ${mappedItems.length} items mapeados correctamente`);
      return mappedItems;

    } catch (error: any) {
      console.error(`❌ Error getting master data '${type}':`, error);
      const errorMessage = error.message || `Error obteniendo master data '${type}'`;
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // =================== UTILIDADES ===================

  const preloadCommonData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Precargando datos maestros comunes...');
      
      // ✅ Usar endpoints específicos en paralelo
      await Promise.allSettled([
        getCompanias(),
        getSecciones(),
        getMasterDataByType('combustibles'),
        getMasterDataByType('categorias'),
        getMasterDataByType('departamentos')
      ]);
      
      console.log('✅ Datos maestros precargados exitosamente');
      
    } catch (error: any) {
      console.error('❌ Error precargando datos maestros:', error);
      setError(error.message || 'Error precargando datos');
    } finally {
      setLoading(false);
    }
  }, [getCompanias, getSecciones, getMasterDataByType]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // =================== CREAR CLIENTE (FUTURO) ===================

  const createCliente = useCallback(async (clienteData: Partial<Cliente>): Promise<Cliente | null> => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar cuando esté disponible el endpoint de creación
      // const response = await apiClient.post<ApiResponse<ClienteItem>>('/MasterData/clientes', clienteData);
      // return mapClienteItemToCliente(response.data);
      
      console.warn('⚠️ Creación de clientes aún no implementada en el backend');
      throw new Error('Creación de clientes no disponible aún');

    } catch (error: any) {
      console.error('❌ Error creating cliente:', error);
      const errorMessage = error.message || 'Error creando cliente';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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
    
    // Datos maestros - ✅ ACTUALIZADO con parámetro companiaId
    getMasterDataByType,
    
    // Utilidades
    preloadCommonData,
    clearError,
    setError,
  };
}