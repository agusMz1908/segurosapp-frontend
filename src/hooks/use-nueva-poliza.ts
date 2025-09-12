"use client"

import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

export interface ContextData {
  clienteId: number | null;
  companiaId: number | null;  
  seccionId: number | null;
  clienteInfo?: { id: number; nombre: string; documento: string };
  companiaInfo?: { id: number; nombre: string };
  seccionInfo?: { id: number; nombre: string };
}

export interface FileData {
  selected: File | null;
  uploaded: boolean;
  scanId: number | null;
  uploadProgress: number;
}

export interface ScanData {
  status: 'idle' | 'scanning' | 'completed' | 'error';
  extractedData: any;
  mappedData: any;
  completionPercentage: number;
  requiresAttention: any[];
  errorMessage?: string;
}

export interface VelneoData {
  status: 'idle' | 'sending' | 'completed' | 'error'; 
  polizaNumber: string | null;
  errorMessage?: string;
}

export interface NuevaPolizaState {
  context: ContextData;
  file: FileData;
  scan: ScanData;
  velneo: VelneoData;
  currentStep: 1 | 2 | 3;
  isLoading: boolean;
}

const initialState: NuevaPolizaState = {
  context: {
    clienteId: null,
    companiaId: null,
    seccionId: null,
  },
  file: {
    selected: null,
    uploaded: false,
    scanId: null,
    uploadProgress: 0,
  },
  scan: {
    status: 'idle',
    extractedData: null,
    mappedData: null,
    completionPercentage: 0,
    requiresAttention: [],
  },
  velneo: {
    status: 'idle',
    polizaNumber: null,
  },
  currentStep: 1,
  isLoading: false,
};

export function useNuevaPoliza() {
  const [state, setState] = useState<NuevaPolizaState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateState = useCallback((updates: Partial<NuevaPolizaState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Función para obtener el token de autorización
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token') || '';
  }, []);

  // Validaciones
  const isContextValid = useCallback(() => {
    return !!(state.context.clienteId && state.context.companiaId && state.context.seccionId);
  }, [state.context]);

  const canProceedToStep2 = useCallback(() => {
    // Sin validaciones - siempre true si hay escaneo completado
    return state.scan.status === 'completed';
  }, [state.scan.status]);

  const canProceedToStep3 = useCallback(() => {
    return state.currentStep === 2 && state.scan.completionPercentage >= 70;
  }, [state.currentStep, state.scan.completionPercentage]);

const uploadWithContext = useCallback(async (file: File) => {
  if (!isContextValid()) {
    toast.error('Selecciona cliente, compañía y sección primero');
    return false;
  }

  // Cancel previous request if exists
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

  abortControllerRef.current = new AbortController();

  try {
    updateState({
      file: { ...state.file, selected: file, uploadProgress: 0 },
      scan: { ...state.scan, status: 'scanning' },
      isLoading: true
    });

    // Simular progreso de upload
    const progressInterval = setInterval(() => {
      setState(prev => ({
        ...prev,
        file: {
          ...prev.file,
          uploadProgress: Math.min(prev.file.uploadProgress + 15, 90)
        }
      }));
    }, 300);

    await new Promise(resolve => setTimeout(resolve, 2500));
    clearInterval(progressInterval);

    // Datos mock de respuesta exitosa
    const mockResult = {
      data: {
        scanId: 12345,
        extractedData: {
          polizaNumber: "POL-2024-001",
          vigenciaDesde: "2024-01-15",
          vigenciaHasta: "2024-12-15",
          prima: "45000",
          vehiculoMarca: "Toyota",
          vehiculoModelo: "Corolla",
          vehiculoAno: "2020",
          vehiculoChasis: "JTDBR32E400123456",
          vehiculoPatente: "ABC1234",
          aseguradoNombre: state.context.clienteInfo?.nombre || "Cliente Mock",
          aseguradoDocumento: state.context.clienteInfo?.documento || "12345678-9",
          companiaSeleccionada: state.context.companiaInfo?.nombre,
          seccionSeleccionada: state.context.seccionInfo?.nombre
        },
        mappedData: {},
        completionPercentage: 85,
        requiresAttention: [
          { fieldName: 'vehiculoChasis', reason: 'Confianza baja en OCR', severity: 'warning' },
          { fieldName: 'prima', reason: 'Valor fuera del rango esperado', severity: 'info' }
        ]
      }
    };

    console.log('=== ANTES DEL setState FINAL ===');
    console.log('mockResult.data.scanId:', mockResult.data.scanId);

    // Usar updateState en lugar de setState directo para evitar conflictos
    updateState({
      file: {
        selected: file,
        uploaded: true,
        scanId: mockResult.data.scanId,
        uploadProgress: 100,
      },
      scan: {
        status: 'completed',
        extractedData: mockResult.data.extractedData,
        mappedData: mockResult.data.mappedData,
        completionPercentage: mockResult.data.completionPercentage,
        requiresAttention: mockResult.data.requiresAttention,
        errorMessage: undefined,
      },
      isLoading: false,
    });

    console.log('=== setState FINAL COMPLETADO ===');

    toast.success(`Documento procesado exitosamente (${mockResult.data.completionPercentage}% de confianza)`);
    return true;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return false;
    }

    console.error('Error uploading document:', error);
    
    setState(prev => ({
      ...prev,
      scan: {
        ...prev.scan,
        status: 'error',
        errorMessage: error.message || 'Error procesando documento'
      },
      file: {
        ...prev.file,
        uploadProgress: 0,
      },
      isLoading: false,
    }));

    toast.error('Error procesando documento: ' + (error.message || 'Error desconocido'));
    return false;
  }
}, [isContextValid, state.context, state.file, state.scan, updateState, getAuthToken]);

  // Navegación entre pasos
  const nextStep = useCallback(() => {
    if (state.currentStep === 1) {
      updateState({ currentStep: 2 });
      toast.success('Avanzando a validación de datos');
      return true;
    } else if (state.currentStep === 2) {
      updateState({ currentStep: 3 });
      toast.success('Avanzando a confirmación final');
      return true;
    }
    return false;
  }, [state.currentStep, updateState]);

  const prevStep = useCallback(() => {
    if (state.currentStep > 1) {
      updateState({ currentStep: (state.currentStep - 1) as 1 | 2 | 3 });
      return true;
    }
    return false;
  }, [state.currentStep, updateState]);

  // Selección de contexto
  const updateContext = useCallback((contextUpdates: Partial<ContextData>) => {
    const newContext = { ...state.context, ...contextUpdates };
    
    updateState({
      context: newContext
    });

    // Limpiar archivo si se cambia el contexto después de haber subido
    if (state.file.uploaded && 
        (contextUpdates.clienteId !== undefined || 
         contextUpdates.companiaId !== undefined || 
         contextUpdates.seccionId !== undefined)) {
      updateState({
        file: {
          selected: null,
          uploaded: false,
          scanId: null,
          uploadProgress: 0,
        },
        scan: {
          status: 'idle',
          extractedData: null,
          mappedData: null,
          completionPercentage: 0,
          requiresAttention: [],
        }
      });
      toast('Contexto actualizado. Vuelve a cargar el archivo PDF.', {
        icon: 'ℹ️',
      });
    }
  }, [state.context, state.file.uploaded, updateState]);

const sendToVelneo = useCallback(async (overrides?: any) => {
  const scanId = overrides?.scanId || state.file.scanId;
  
  if (!scanId) {
    toast.error('No hay documento para enviar');
    return false;
  }

  try {
    console.log('=== ANTES DE setState SENDING ===');
    
    setState(prev => {
  console.log('=== DENTRO DE setState SENDING ===');
  console.log('prev.velneo.status:', prev.velneo.status);
  const newState = {
    ...prev,
    velneo: { 
      ...prev.velneo, 
      status: 'sending' as const  // ← AGREGAR "as const"
    },
    isLoading: true
  };
  console.log('newState.velneo.status:', newState.velneo.status);
  return newState;
});

    console.log('=== SIMULANDO ENVÍO A VELNEO ===');
    console.log('scanId:', scanId);

    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular respuesta exitosa
    const mockResult = {
      success: true,
      data: {
        polizaNumber: `POL-${Date.now()}`,
        message: 'Póliza creada exitosamente en Velneo'
      }
    };

    console.log('=== ANTES DE setState COMPLETED ===');
    
setState(prev => {
  const newState = {
    ...prev,
    velneo: {
      status: 'completed' as const,  // ← AGREGAR "as const"
      polizaNumber: mockResult.data.polizaNumber,
      errorMessage: undefined,
    },
    isLoading: false,
  };
  return newState;
});

    toast.success(`¡Póliza creada exitosamente! Número: ${mockResult.data.polizaNumber}`);
    return true;

  } catch (error: any) {
    // ... resto del código igual
  }
}, [state.file.scanId]);

  // Reset completo
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(initialState);
    toast.success('Proceso reiniciado correctamente');
  }, []);

  // Cancel current operation
  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    updateState({
      scan: { ...state.scan, status: 'idle' },
      velneo: { ...state.velneo, status: 'idle' },
      isLoading: false,
    });
    
    toast('Operación cancelada', {
      icon: '🔄',
    });
  }, [state.scan, state.velneo, updateState]);

  // Reescanear documento
  const rescanDocument = useCallback(async () => {
    if (!state.file.scanId) {
      toast.error('No hay documento para reescanear');
      return false;
    }

    try {
      updateState({
        scan: { ...state.scan, status: 'scanning' },
        isLoading: true
      });

      const response = await fetch(`/api/Document/reprocess/${state.file.scanId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceReprocess: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      updateState({
        scan: {
          status: 'completed',
          extractedData: result.data?.extractedData || result.extractedData,
          mappedData: result.data?.mappedData || result.mappedData,
          completionPercentage: result.data?.completionPercentage || result.completionPercentage || 0,
          requiresAttention: result.data?.requiresAttention || result.requiresAttention || [],
        },
        isLoading: false,
      });

      toast.success('Documento reescanado exitosamente');
      return true;

    } catch (error: any) {
      console.error('Error rescanning document:', error);
      
      updateState({
        scan: {
          ...state.scan,
          status: 'error',
          errorMessage: error.message || 'Error reescaneando documento'
        },
        isLoading: false,
      });

      toast.error('Error reescaneando documento: ' + (error.message || 'Error desconocido'));
      return false;
    }
  }, [state.file.scanId, state.scan, updateState, getAuthToken]);

  return {
    // Estado
    state,
    
    // Validaciones
    isContextValid: isContextValid(),
    canProceedToStep2: canProceedToStep2(),
    canProceedToStep3: canProceedToStep3(),
    
    // Navegación
    nextStep,
    prevStep,
    
    // Acciones principales
    updateContext,
    uploadWithContext,
    rescanDocument,
    sendToVelneo,
    reset,
    cancelOperation,
    
    // Utils
    updateState,
  };
}