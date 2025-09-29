import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getAuthToken, getAuthHeadersForFormData, handle401Error } from '@/utils/auth-utils';
import { Cliente } from '@/types/master-data';

interface RenovacionContext {
  clienteId?: number;
  seccionId?: number;
  companiaId?: number;
  polizaOriginalId?: number;
  clienteInfo?: {
    id: number;
    nombre: string;
    documento: string;
    email?: string;
    telefono?: string;
    activo?: boolean;
  };
  seccionInfo?: {
    id: number;
    nombre: string;
  };
  companiaInfo?: {
    id: number;
    nombre: string;
    codigo: string;
  };
  polizaOriginal?: {
    id: number;
    numero: string;
    vencimiento: string;
    compania: string;
  };
}

interface FileData {
  selected: File | null;
  uploaded: boolean;
  scanId: string | null;
  uploadProgress: number;
}

interface RenovacionScan {
  status: 'idle' | 'uploading' | 'scanning' | 'completed' | 'error';
  extractedData: Record<string, any>;
  mappedData: Record<string, any>;
  normalizedData: Record<string, any>;
  completionPercentage: number;
  confidence: number;
  requiresAttention: any[];
  errorMessage?: string;
  fileName?: string;
  scanId?: string;
}

interface MasterDataFormData {
  combustibleId: string;
  destinoId: string;
  departamentoId: string;
  calidadId: string;
  categoriaId: string;
  tarifaId: string;
  observaciones: string;
}

interface RenovacionState {
  currentStep: number;
  
  cliente: {
    selectedId: number | null;
    polizas: any[];
    selectedPoliza: any | null;
  };
  
  context: RenovacionContext;
  file: FileData;
  scan: RenovacionScan;
  masterData: MasterDataFormData;
  isLoading: boolean;

  processCompleted: boolean;
  processResult?: {
    success: boolean;
    message: string;
    velneoPolizaId?: number;
    polizaNumber?: string;
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
  
  context: {},
  
  file: {
    selected: null,
    uploaded: false,
    scanId: null,
    uploadProgress: 0,
  },
  
  scan: {
    status: 'idle',
    extractedData: {},
    mappedData: {},
    normalizedData: {},
    completionPercentage: 0,
    confidence: 0,
    requiresAttention: [],
  },
  masterData: {
    combustibleId: '',
    destinoId: '',
    departamentoId: '',
    calidadId: '',
    categoriaId: '',
    tarifaId: '',
    observaciones: '',
  },
  isLoading: false,
  
  processCompleted: false,
  processResult: undefined,
};

export function useRenovaciones() {
  const [state, setState] = useState<RenovacionState>(initialState);

  const updateState = useCallback((updates: Partial<RenovacionState> | ((prev: RenovacionState) => RenovacionState)) => {
    setState(prevState => {
      const newState = typeof updates === 'function' ? updates(prevState) : { ...prevState, ...updates };
      return newState;
    });
  }, []);

  const markProcessCompleted = useCallback((result: any) => {
    updateState({
      processCompleted: true,
      processResult: result,
      isLoading: false,
    });
  }, [updateState]);

  const resetProcessCompleted = useCallback(() => {
    updateState({
      processCompleted: false,
      processResult: undefined,
    });
  }, [updateState]);

const loadPolizasByCliente = useCallback(async (clienteId: number) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No se encontró token de autenticación');
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
    const [polizasResponse, companiasResponse] = await Promise.all([
      fetch(`${API_URL}/api/MasterData/clientes/${clienteId}/polizas?soloActivos=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
      fetch(`${API_URL}/api/MasterData/companias`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    ]);

    if (!polizasResponse.ok || !companiasResponse.ok) {
      if (polizasResponse.status === 401 || companiasResponse.status === 401) {
        handle401Error();
        throw new Error('Error de autenticación');
      }
      throw new Error('Error al cargar datos');
    }

    const polizasData = await polizasResponse.json();
    const companiasData = await companiasResponse.json();

    let companiasList: any[] = [];

    if (Array.isArray(companiasData)) {
      companiasList = companiasData;
    } else if (companiasData && companiasData.data && Array.isArray(companiasData.data)) {
      companiasList = companiasData.data;
    } else if (companiasData && companiasData.companias && Array.isArray(companiasData.companias)) {
      companiasList = companiasData.companias;
    } else {
      console.warn('⚠️ Formato de compañías inesperado, usando array vacío');
      companiasList = [];
    }

    const mapeoCompanias: Record<number, string> = {};
    companiasList.forEach((compania: any) => {
      mapeoCompanias[compania.id] = compania.comnom || compania.displayName || `Compañía ${compania.id}`;
    });

    let polizasList: any[] = [];
    if (Array.isArray(polizasData)) {
      polizasList = polizasData;
    } else if (polizasData && polizasData.data && Array.isArray(polizasData.data)) {
      polizasList = polizasData.data;
    } else if (polizasData && polizasData.polizas && Array.isArray(polizasData.polizas)) {
      polizasList = polizasData.polizas;
    } else {
      throw new Error('El API no devolvió un array de pólizas válido');
    }

    const now = new Date();
    const polizasRenovables = polizasList.filter((poliza: any) => {
      if (poliza.seccod !== 4) {
        console.log(`❌ Rechazada - Sección ${poliza.seccod} (no automotor)`);
        return false;
      }
      
      let diasHastaVencimiento = 0;
      try {
        const fechaVencimiento = new Date(poliza.confchhas);
        diasHastaVencimiento = Math.ceil((fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } catch (error) {
        return false;
      }
      
      const enRangoRenovacion = diasHastaVencimiento >= -30 && diasHastaVencimiento <= 60;
      
      if (enRangoRenovacion) {
        if (!poliza.comnom || poliza.comnom.trim() === '') {
          poliza.comnom = mapeoCompanias[poliza.comcod] || `Compañía ${poliza.comcod}`;
        }
      }
      
      return enRangoRenovacion;
    });

    updateState(prevState => ({
      ...prevState,
      cliente: {
        ...prevState.cliente,
        selectedId: clienteId,
        polizas: polizasRenovables
      }
    }));

    if (polizasRenovables.length === 0) {
      toast('Este cliente no tiene pólizas de automotor renovables en este momento', {
        icon: 'ℹ️',
        duration: 4000,
      });
    } else {
      toast.success(`Se encontraron ${polizasRenovables.length} pólizas renovables`);
    }

    return polizasRenovables;
  } catch (error: any) {
    toast.error('Error cargando pólizas del cliente: ' + (error.message || 'Error desconocido'));
    updateState(prevState => ({
      ...prevState,
      cliente: {
        ...prevState.cliente,
        selectedId: clienteId,
        polizas: []
      }
    }));
    
    return [];
  }
}, [updateState]);

  const setClienteData = useCallback((cliente: Cliente) => {
    updateState(prevState => ({
      ...prevState,
      context: {
        ...prevState.context,
        clienteId: cliente.id,
        clienteInfo: {
          id: cliente.id,
          nombre: cliente.nombre,
          documento: cliente.documento,
          email: cliente.email || undefined,
          telefono: cliente.telefono || undefined,
          activo: cliente.activo
        }
      }
    }));
  }, [updateState]);

  const selectPolizaToRenew = useCallback((poliza: any) => {
    updateState(prevState => ({
      ...prevState,
      cliente: {
        ...prevState.cliente,
        selectedPoliza: poliza
      },
      context: {
        ...prevState.context,
        polizaOriginalId: poliza.id || poliza.Id,
        seccionId: poliza.seccod,
        clienteInfo: prevState.context.clienteInfo || {
          id: prevState.cliente.selectedId!,
          nombre: poliza.cliente_nombre || `Cliente ${prevState.cliente.selectedId}`,
          documento: poliza.cliente_documento || 'No especificado'
        },
        seccionInfo: {
          id: poliza.seccod,
          nombre: poliza.seccion_nombre || 'Automotor'
        },
        polizaOriginal: {
          id: poliza.id || poliza.Id,
          numero: poliza.conpol,
          vencimiento: poliza.confchhas,
          compania: poliza.compania_nombre || poliza.comnom || 'Sin especificar'
        }
      }
    }));

    toast.success(`Póliza ${poliza.conpol} seleccionada para renovación`);
  }, [updateState]);

  const isPolizaRenovable = useCallback((poliza: any) => {
    const dias = getDiasParaVencimiento(poliza);
    return dias >= -30 && dias <= 60;
  }, []);

  const getDiasParaVencimiento = useCallback((poliza: any) => {
    try {
      const fechaVencimiento = new Date(poliza.confchhas);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaVencimiento.setHours(0, 0, 0, 0);
      
      const diferencia = fechaVencimiento.getTime() - hoy.getTime();
      return Math.ceil(diferencia / (1000 * 3600 * 24));
    } catch (error) {
      console.error('❌ Error calculando días de vencimiento:', error, poliza);
      return 0;
    }
  }, []);

  const uploadDocumentForRenovacion = useCallback(async (file: File): Promise<boolean> => {
    const currentState = state;
    
    if (!currentState.context.clienteId || !currentState.context.seccionId) {
      toast.error('Contexto incompleto. Selecciona cliente y póliza.');
      return false;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación.');
      }

      updateState(prevState => ({
        ...prevState,
        file: {
          selected: file,
          uploaded: false,
          scanId: null,
          uploadProgress: 0,
        },
        scan: {
          ...prevState.scan,
          status: 'uploading',
          fileName: file.name,
          errorMessage: undefined,
        },
        isLoading: true,
      }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('clienteId', currentState.context.clienteId.toString());
      formData.append('companiaId', currentState.context.companiaId?.toString() || '1');
      formData.append('seccionId', currentState.context.seccionId.toString());
      formData.append('notes', 'Renovación automática');

      updateState(prevState => ({
        ...prevState,
        file: {
          selected: file,
          uploaded: false,
          scanId: null,
          uploadProgress: 50,
        },
        scan: {
          ...prevState.scan,
          status: 'scanning',
        }
      }));

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      const response = await fetch(`${API_URL}/api/Document/upload-with-context`, {
        method: 'POST',
        headers: getAuthHeadersForFormData(),
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.Message || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
        
        if (response.status === 401) {
          handle401Error();
          return false;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const scanResult = result.scanResult || {};
      const polizaMapping = result.polizaMapping || {};
      
      const originalExtractedData = scanResult.extractedData || {};
      const normalizedData = polizaMapping.normalizedData || {};
      const mappedData = polizaMapping.mappedData || {};

      let companiaDetectada = currentState.context.companiaInfo;
      let companiaIdDetectada = currentState.context.companiaId;

      if (result.preSelection?.compania && result.preSelection.compania.id) {
        companiaIdDetectada = result.preSelection.compania.id;
        companiaDetectada = {
          id: result.preSelection.compania.id,
          nombre: result.preSelection.compania.displayName || result.preSelection.compania.comnom || 'Detectada',
          codigo: result.preSelection.compania.shortCode || result.preSelection.compania.comalias || 'DET'
        };
      }

      updateState(prevState => ({
        ...prevState,
        context: {
          ...prevState.context,
          companiaId: companiaIdDetectada,
          companiaInfo: companiaDetectada,
        },
        file: {
          selected: file,
          uploaded: true,
          scanId: scanResult.scanId,
          uploadProgress: 100,
        },
        scan: {
          status: 'completed' as const,
          extractedData: originalExtractedData,
          normalizedData: normalizedData,
          mappedData: mappedData,
          completionPercentage: polizaMapping.metrics?.completionPercentage || 85,
          confidence: polizaMapping.metrics?.confidence || 85,
          requiresAttention: polizaMapping.issues?.map((issue: any) => ({
            fieldName: issue.fieldName || 'unknown',
            reason: issue.description || issue.issueType || 'Requiere verificación',
            severity: issue.severity?.toLowerCase() || 'warning'
          })) || [],
          fileName: file.name,
          scanId: scanResult.scanId,
          errorMessage: undefined,
        },
        isLoading: false,
      }));

      toast.success(`Documento procesado exitosamente (${polizaMapping.metrics?.completionPercentage || 85}% confianza)`);
      return true;

    } catch (error: any) {
      updateState(prevState => ({
        ...prevState,
        file: {
          selected: file,
          uploaded: false,
          scanId: null,
          uploadProgress: 0,
        },
        scan: {
          ...prevState.scan,
          status: 'error',
          errorMessage: error.message || 'Error procesando documento'
        },
        isLoading: false,
      }));

      toast.error('Error procesando documento: ' + (error.message || 'Error desconocido'));
      return false;
    }
  }, [state, updateState]);

  const updateExtractedData = useCallback((updates: Record<string, any>) => {
    updateState(prevState => ({
      ...prevState,
      scan: {
        ...prevState.scan,
        extractedData: {
          ...prevState.scan.extractedData,
          ...updates
        }
      }
    }));
  }, [updateState]);

  const updateMasterData = useCallback((updates: Partial<MasterDataFormData>) => {
    updateState(prevState => ({
      ...prevState,
      masterData: {
        ...prevState.masterData,
        ...updates
      }
    }));
  }, [updateState]);

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, 4) }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 1) }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    toast.success('Proceso de renovación reiniciado');
  }, []);

  const canProceedToStep2 = Boolean(
    state.cliente.selectedId && 
    state.cliente.selectedPoliza
  );

  const canProceedToStep3 = canProceedToStep2 && state.scan.status === 'completed';

  const canProceedToStep4 = canProceedToStep3 && 
    Boolean(state.masterData.combustibleId || state.masterData.categoriaId);

  return {
    state,
    updateState,
    loadPolizasByCliente,
    selectPolizaToRenew,
    isPolizaRenovable,
    getDiasParaVencimiento,
    setClienteData,
    uploadDocumentForRenovacion,
    updateExtractedData,
    updateMasterData,
    nextStep,
    prevStep,
    reset,
    markProcessCompleted,
    resetProcessCompleted,
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
  };
}