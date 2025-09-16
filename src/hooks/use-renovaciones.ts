// hooks/use-renovaciones.ts
"use client"

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { getAuthToken, getAuthHeaders, handle401Error } from '@/utils/auth-utils';

export interface RenovacionState {
  currentStep: 1 | 2 | 3 | 4;
  
  // Step 1: Búsqueda y selección
  cliente: {
    selectedId: number | null;
    polizas: any[];
    selectedPoliza: any | null;
  };
  
  // Step 2-3: Reutilizar contexto de Nueva Póliza
  context: {
    clienteId: number | null;
    companiaId: number | null;
    seccionId: number | null;
    clienteInfo?: any;
    companiaInfo?: any;
    seccionInfo?: any;
  };
  
  // Step 4: Confirmación de renovación
  renovacion: {
    status: 'idle' | 'processing' | 'completed' | 'error';
    result?: any;
    observaciones: string;
    errorMessage?: string;
  };
}

const initialState: RenovacionState = {
  currentStep: 1,
  cliente: {
    selectedId: null,
    polizas: [],
    selectedPoliza: null,
  },
  context: {
    clienteId: null,
    companiaId: null,
    seccionId: null,
  },
  renovacion: {
    status: 'idle',
    observaciones: '',
  },
};

export function useRenovaciones() {
  const [state, setState] = useState<RenovacionState>(initialState);

  const updateState = useCallback((updates: Partial<RenovacionState> | ((prev: RenovacionState) => Partial<RenovacionState>)) => {
    setState(prev => {
      const newUpdates = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...newUpdates };
    });
  }, []);

  // Step 1: Buscar pólizas por cliente
  const loadPolizasByCliente = useCallback(async (clienteId: number) => {
    try {
      console.log('🔍 Cargando pólizas para cliente:', clienteId);
      
      const response = await apiClient.get<any>(`/api/MasterData/clientes/${clienteId}/polizas?soloActivos=true`);
      
      // Filtrar solo pólizas de automotor y cerca de vencer
      const now = new Date();
      const polizasRenovables = response.data.filter((poliza: any) => {
        const fechaVencimiento = new Date(poliza.confchhas);
        const diasHastaVencimiento = Math.ceil((fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Solo pólizas de automotor y en rango de renovación (-30 a +60 días)
        return poliza.seccod === 4 && diasHastaVencimiento >= -30 && diasHastaVencimiento <= 60;
      });

      updateState({
        cliente: {
          selectedId: clienteId,
          polizas: polizasRenovables,
          selectedPoliza: null,
        }
      });

      return polizasRenovables;
    } catch (error: any) {
      console.error('❌ Error cargando pólizas:', error);
      toast.error('Error cargando pólizas del cliente');
      throw error;
    }
  }, [updateState]);

  // Step 1: Seleccionar póliza a renovar
  const selectPolizaToRenew = useCallback((poliza: any) => {
    // Heredar contexto PARCIAL: solo cliente y sección, NO compañía
    const context = {
      clienteId: poliza.clinro,
      companiaId: null, // ✅ NO heredar compañía - se detectará del documento escaneado
      seccionId: poliza.seccod,
      clienteInfo: {
        id: poliza.clinro,
        nombre: poliza.cliente_nombre || `Cliente ${poliza.clinro}`,
        documento: poliza.cliente_documento || '',
      },
      companiaInfo: undefined, // ✅ NO heredar compañía
      seccionInfo: {
        id: poliza.seccod,
        nombre: poliza.seccion_nombre || 'Automotor',
      },
    };

    updateState({
      cliente: {
        ...state.cliente,
        selectedPoliza: poliza,
      },
      context,
      currentStep: 2,
    });

    console.log('✅ Póliza seleccionada para renovación:', poliza.conpol);
    console.log('✅ Contexto heredado (solo cliente y sección):', context);
    
    toast.success(`Póliza ${poliza.conpol} seleccionada para renovación`);
  }, [state.cliente, updateState]);

  // Step 4: Procesar renovación en Velneo - USANDO CONTEXTO DE NUEVA POLIZA
  const processRenovacionWithNuevaPolizaContext = useCallback(async (scanId: number, nuevaPolizaContext: any) => {
    if (!state.cliente.selectedPoliza) {
      toast.error('No hay póliza seleccionada para renovar');
      return false;
    }

    try {
      updateState({
        renovacion: {
          ...state.renovacion,
          status: 'processing',
        }
      });

      // ✅ USAR EL CONTEXTO DE NUEVA POLIZA que tiene la compañía detectada correctamente
      const request = {
        polizaAnteriorId: state.cliente.selectedPoliza.id,
        clienteId: nuevaPolizaContext.clienteId || state.context.clienteId,
        companiaId: nuevaPolizaContext.companiaId || state.context.companiaId,
        seccionId: nuevaPolizaContext.seccionId || state.context.seccionId,
        observaciones: state.renovacion.observaciones || `Renovación automática de póliza ${state.cliente.selectedPoliza.conpol}`,
        validarVencimiento: true,
      };

      console.log('🔄 Procesando renovación con contexto de nueva póliza:', {
        polizaAnteriorId: request.polizaAnteriorId,
        clienteId: request.clienteId,
        companiaOriginal: state.cliente.selectedPoliza.comcod,
        companiaNueva: request.companiaId,
        companiaInfo: nuevaPolizaContext.companiaInfo,
        seccionId: request.seccionId,
      });

      // Usar fetch directo para mantener consistencia con nueva-poliza
      const token = getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      const response = await fetch(`${API_URL}/api/Document/${scanId}/renew-in-velneo`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handle401Error();
          return false;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        updateState({
          renovacion: {
            ...state.renovacion,
            status: 'completed',
            result: result,
          }
        });

        console.log('✅ Renovación exitosa:', {
          polizaAnterior: state.cliente.selectedPoliza.conpol,
          polizaNueva: result.polizaNumber,
          companiaFinal: nuevaPolizaContext.companiaInfo?.nombre
        });

        toast.success(`Renovación procesada exitosamente: ${result.polizaNumber || 'Nueva póliza creada'}`);
        return true;
      } else {
        throw new Error(result.message || 'Error en renovación');
      }
    } catch (error: any) {
      console.error('❌ Error procesando renovación:', error);
      
      updateState({
        renovacion: {
          ...state.renovacion,
          status: 'error',
          errorMessage: error.message || 'Error procesando renovación',
        }
      });

      toast.error('Error procesando renovación: ' + (error.message || 'Error desconocido'));
      return false;
    }
  }, [state.cliente.selectedPoliza, state.context, state.renovacion.observaciones, updateState]);

  // Navegación
  const nextStep = useCallback(() => {
    if (state.currentStep < 4) {
      updateState({ currentStep: (state.currentStep + 1) as 1 | 2 | 3 | 4 });
    }
  }, [state.currentStep, updateState]);

  const prevStep = useCallback(() => {
    if (state.currentStep > 1) {
      updateState({ currentStep: (state.currentStep - 1) as 1 | 2 | 3 | 4 });
    }
  }, [state.currentStep, updateState]);

  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    updateState({ currentStep: step });
  }, [updateState]);

  // Validaciones
  const canProceedToStep2 = useCallback(() => {
    return !!state.cliente.selectedPoliza;
  }, [state.cliente.selectedPoliza]);

  const canProceedToStep3 = useCallback(() => {
    // Ya no necesitamos validar companiaId aquí porque se obtendrá del escaneo
    return canProceedToStep2() && !!state.context.clienteId && !!state.context.seccionId;
  }, [canProceedToStep2, state.context.clienteId, state.context.seccionId]);

  const canProceedToStep4 = useCallback(() => {
    // Se puede proceder al paso 4 cuando se haya completado el escaneo
    // y se haya detectado la compañía automáticamente
    return canProceedToStep3();
  }, [canProceedToStep3]);

  // Helpers
  const isPolizaRenovable = useCallback((poliza: any) => {
    const fechaVencimiento = new Date(poliza.confchhas);
    const now = new Date();
    const diasHastaVencimiento = Math.ceil((fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return diasHastaVencimiento >= -30 && diasHastaVencimiento <= 60;
  }, []);

  const getDiasParaVencimiento = useCallback((poliza: any) => {
    const fechaVencimiento = new Date(poliza.confchhas);
    const now = new Date();
    return Math.ceil((fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  // Reset
  const reset = useCallback(() => {
    setState(initialState);
    toast.success('Proceso de renovación reiniciado');
  }, []);

  // Actualizar observaciones
  const updateObservaciones = useCallback((observaciones: string) => {
    updateState({
      renovacion: {
        ...state.renovacion,
        observaciones,
      }
    });
  }, [state.renovacion, updateState]);

  return {
    // Estado
    state,
    
    // Validaciones
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    isPolizaRenovable,
    getDiasParaVencimiento,
    
    // Navegación
    nextStep,
    prevStep,
    goToStep,
    
    // Acciones principales
    loadPolizasByCliente,
    selectPolizaToRenew,
    processRenovacion: processRenovacionWithNuevaPolizaContext, // ✅ EXPONER LA NUEVA FUNCIÓN
    updateObservaciones,
    reset,
    
    // Utils
    updateState,
  };
}