// src/hooks/use-cambios.ts
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders, getAuthHeadersForFormData, getAuthToken, handle401Error } from '../utils/auth-utils';

interface CambiosState {
  currentStep: number;
  isLoading: boolean;
  
  context: {
    clienteId?: number;
    seccionId?: number;
    clienteInfo?: any;
    polizaOriginal?: any;
    companiaId?: number;
    companiaInfo?: any;
  };
  
  cliente: {
    selectedId?: number;
    polizas: any[];
    selectedPoliza?: any;
  };
  
  file: {
    selected: File | null;
    uploaded: boolean;
    scanId: number | null;
    uploadProgress: number;
  };
  
  scan: {
    status: 'idle' | 'uploading' | 'scanning' | 'completed' | 'error';
    scanId?: number;
    extractedData: any;
    mappedData: any;
    normalizedData: any;
    completionPercentage: number;
    confidence: number;
    requiresAttention: any[];
    errorMessage?: string;
    fileName?: string;
    file?: File;
  };
  
  masterData: {
    combustibleId: string;
    categoriaId: string;
    destinoId: string;
    departamentoId: string;
    calidadId: string;
    tarifaId: string;
    cantidadCuotas: number;
    observaciones: string;
    [key: string]: any;
  };
  
  processCompleted: boolean;
  processResult?: any;
}

const initialState: CambiosState = {
  currentStep: 1,
  isLoading: false,
  context: {},
  cliente: {
    polizas: []
  },
  file: {
    selected: null,
    uploaded: false,
    scanId: null,
    uploadProgress: 0
  },
  scan: {
    status: 'idle',
    extractedData: {},
    mappedData: {},
    normalizedData: {},
    completionPercentage: 0,
    confidence: 0,
    requiresAttention: []
  },
  masterData: {
    combustibleId: '',
    categoriaId: '',
    destinoId: '',
    departamentoId: '',
    calidadId: '',
    tarifaId: '',
    cantidadCuotas: 1,
    observaciones: ''
  },
  processCompleted: false
};

export function useCambios() {
  const [state, setState] = useState<CambiosState>(initialState);

  const updateState = useCallback((updates: any) => {
    if (typeof updates === 'function') {
      setState(updates);
    } else {
      setState(prev => ({
        ...prev,
        ...updates
      }));
    }
  }, []);

const loadPolizasByCliente = useCallback(async (clienteId: number) => {
  setState(prev => ({ ...prev, isLoading: true }));
  
  try {
    console.log('Cargando pólizas vigentes para cambios - cliente:', clienteId);
    
    const token = getAuthToken();
    if (!token) {
      throw new Error('No se encontró token de autenticación');
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
    const response = await fetch(`${API_URL}/api/MasterData/clientes/${clienteId}/polizas?soloActivos=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        handle401Error();
        throw new Error('Error de autenticación');
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const polizasData = await response.json();
    console.log('Respuesta del API:', polizasData);

    // Manejar diferentes formatos de respuesta del API (igual que renovaciones)
    let polizasList: any[] = [];
    
    if (Array.isArray(polizasData)) {
      polizasList = polizasData;
    } else if (polizasData && polizasData.data && Array.isArray(polizasData.data)) {
      polizasList = polizasData.data;
    } else if (polizasData && polizasData.polizas && Array.isArray(polizasData.polizas)) {
      polizasList = polizasData.polizas;
    } else {
      console.error('Formato de respuesta inesperado:', polizasData);
      throw new Error('El API no devolvió un array de pólizas válido');
    }

    console.log('Lista de pólizas extraída:', polizasList.length);

    // DIFERENCIA CLAVE: Filtrar para CAMBIOS (vigentes, sin restricción de fechas estricta)
    const now = new Date();
    const polizasVigentes = polizasList.filter((poliza: any) => {
      console.log('Evaluando póliza para cambios:', {
        numero: poliza.conpol,
        seccion: poliza.seccod,
        fechaVencimiento: poliza.confchhas,
      });

      // Verificar que sea de automotor (sección 4)
      if (poliza.seccod !== 4) {
        console.log(`Póliza ${poliza.conpol} EXCLUIDA - No es de automotor (sección: ${poliza.seccod})`);
        return false;
      }
      
      // Calcular días hasta vencimiento
      let diasHastaVencimiento = 0;
      try {
        const fechaVencimiento = new Date(poliza.confchhas);
        diasHastaVencimiento = Math.ceil((fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`Póliza ${poliza.conpol} - Días hasta vencimiento: ${diasHastaVencimiento}`);
      } catch (error) {
        console.error(`Error parseando fecha para póliza ${poliza.conpol}:`, error);
        return false;
      }
      
      // Para CAMBIOS: criterio más amplio - pólizas vigentes o recién vencidas
      // Permitir hasta 30 días vencidas (más flexible que renovaciones)
      const esVigenteParaCambios = diasHastaVencimiento >= -30;
      
      if (!esVigenteParaCambios) {
        console.log(`Póliza ${poliza.conpol} EXCLUIDA - Vencida hace más de 30 días (días: ${diasHastaVencimiento})`);
      } else {
        console.log(`Póliza ${poliza.conpol} INCLUIDA - Vigente para cambios`);
      }
      
      return esVigenteParaCambios;
    });

    console.log(`Pólizas vigentes para cambios: ${polizasVigentes.length}/${polizasList.length}`);
    
    setState(prev => ({
      ...prev,
      cliente: {
        ...prev.cliente,
        selectedId: clienteId,
        polizas: polizasVigentes
      },
      isLoading: false
    }));

    if (polizasVigentes.length === 0) {
      toast('Este cliente no tiene pólizas de automotor vigentes disponibles para cambios', {
        icon: 'ℹ️',
        duration: 4000,
      });
    } else {
      toast.success(`Se encontraron ${polizasVigentes.length} pólizas vigentes`);
    }

    return polizasVigentes;
  } catch (error: any) {
    console.error('Error cargando pólizas vigentes:', error);
    toast.error('Error cargando pólizas vigentes: ' + (error.message || 'Error desconocido'));
    
    setState(prev => ({ 
      ...prev, 
      cliente: {
        ...prev.cliente,
        selectedId: clienteId,
        polizas: []
      },
      isLoading: false 
    }));
    
    return [];
  }
}, []);

const selectPolizaForChange = useCallback((poliza: any) => {
  console.log('🔧 Seleccionando póliza para cambio:', {
    numero: poliza.conpol,
    seccod: poliza.seccod,
    comcod: poliza.comcod || poliza.companiaId
  });

  updateState((prevState: CambiosState) => ({
    ...prevState,
    cliente: {
      ...prevState.cliente,
      selectedPoliza: poliza  
    },
    context: {
      ...prevState.context,
      polizaOriginalId: poliza.id || poliza.Id,
      seccionId: poliza.seccod,            
      companiaId: poliza.comcod || poliza.companiaId || 1,
      clienteInfo: prevState.context.clienteInfo || {
        id: prevState.cliente.selectedId!,
        nombre: poliza.cliente_nombre || `Cliente ${prevState.cliente.selectedId}`,
        documento: poliza.cliente_documento || 'No especificado'
      },
      companiaInfo: {                      
        id: poliza.comcod || poliza.companiaId || 1,
        nombre: poliza.compania_nombre || poliza.comnom || 'Compañía 1',
        codigo: poliza.comcod || poliza.companiaId || 1
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

  toast.success(`Póliza ${poliza.conpol} seleccionada para cambio`);
}, [updateState]);

  // Establecer datos del cliente
  const setClienteData = useCallback((cliente: any) => {
    setState(prev => ({
      ...prev,
      context: {
        ...prev.context,
        clienteId: cliente.id,
        clienteInfo: cliente
      }
    }));
  }, []);

  // Navegación entre pasos
  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, 4) }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 1) }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    toast.success('Sistema de cambios reiniciado');
  }, []);


const uploadDocumentForChange = useCallback(async (file: File): Promise<boolean> => {
  console.log('🔄 CAMBIOS - Iniciando upload específico');
  
  // Validar contexto
  if (!state.context.clienteId || !state.context.seccionId || !state.context.companiaId) {
    console.error('❌ Contexto incompleto:', {
      clienteId: state.context.clienteId,
      seccionId: state.context.seccionId,
      companiaId: state.context.companiaId
    });
    toast.error('Contexto incompleto. Selecciona cliente y póliza correctamente.');
    return false;
  }

  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Actualizar estado con archivo guardado
    updateState({
      isLoading: true,
      file: { 
        selected: file, 
        uploaded: false, 
        scanId: null, 
        uploadProgress: 0 
      },
      scan: { 
        ...state.scan, 
        status: 'uploading', 
        fileName: file.name, 
        errorMessage: undefined 
      }
    });

    // Preparar FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clienteId', state.context.clienteId.toString());
    formData.append('companiaId', state.context.companiaId.toString());
    formData.append('seccionId', state.context.seccionId.toString());
    formData.append('notes', 'Cambio de póliza');

    console.log('🔄 CAMBIOS - Enviando FormData:', {
      fileName: file.name,
      clienteId: state.context.clienteId,
      companiaId: state.context.companiaId,
      seccionId: state.context.seccionId,
    });

    // Cambiar estado a "scanning"
    updateState({
      file: {
        selected: file,
        uploaded: false,
        scanId: null,
        uploadProgress: 50,
      },
      scan: {
        ...state.scan,
        status: 'scanning',
      }
    });

    // Hacer llamada al API
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
    console.log('✅ CAMBIOS - Respuesta del servidor:', result);

    // ✅ MAPEO CORRECTO - IGUAL QUE RENOVACIONES:
    const scanResult = result.scanResult || {};
    const polizaMapping = result.polizaMapping || {};
    
    const originalExtractedData = scanResult.extractedData || {};
    const normalizedData = polizaMapping.normalizedData || {};
    const mappedData = polizaMapping.mappedData || {};

    console.log('🔍 CAMBIOS - Datos extraídos:', {
      original: Object.keys(originalExtractedData).length,
      normalized: Object.keys(normalizedData).length,
      mapped: Object.keys(mappedData).length,
    });

    // Detectar compañía automáticamente
    let companiaDetectada = state.context.companiaInfo;
    let companiaIdDetectada = state.context.companiaId;

    if (result.preSelection?.compania && result.preSelection.compania.id) {
      companiaIdDetectada = result.preSelection.compania.id;
      companiaDetectada = {
        id: result.preSelection.compania.id,
        nombre: result.preSelection.compania.displayName || result.preSelection.compania.comnom || 'Detectada',
        codigo: result.preSelection.compania.shortCode || result.preSelection.compania.comalias || 'DET'
      };
      console.log('🏢 CAMBIOS - Compañía detectada automáticamente:', companiaDetectada);
    }

    // ✅ ACTUALIZAR ESTADO FINAL - IGUAL QUE RENOVACIONES:
    updateState({
      context: {
        ...state.context,
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
    });

    toast.success(`Documento procesado exitosamente (${polizaMapping.metrics?.completionPercentage || 85}% confianza)`);
    return true;

  } catch (error: any) {
    console.error('❌ CAMBIOS - Error en upload:', error);
    
    updateState({
      file: {
        selected: file,
        uploaded: false,
        scanId: null,
        uploadProgress: 0,
      },
      scan: {
        ...state.scan,
        status: 'error',
        errorMessage: error.message || 'Error procesando documento'
      },
      isLoading: false,
    });

    toast.error('Error procesando documento: ' + (error.message || 'Error desconocido'));
    return false;
  }
}, [state.context, state.scan, updateState]);

const updateExtractedData = useCallback((updates: any) => {
  setState(prev => ({
    ...prev,
    scan: {
      ...prev.scan,
      extractedData: { ...prev.scan.extractedData, ...updates }
    }
  }));
}, []);

// Actualización de master data
const updateMasterData = useCallback((updates: any) => {
  setState(prev => ({
    ...prev,
    masterData: { ...prev.masterData, ...updates }
  }));
}, []);

// Marcar proceso como completado
const markProcessCompleted = useCallback((result: any) => {
  setState(prev => ({
    ...prev,
    processCompleted: true,
    processResult: result
  }));
}, []);

const canProceedToStep2 = useCallback(() => {
  return !!(state.context.clienteId && state.context.seccionId && state.cliente.selectedPoliza);
}, [state.context.clienteId, state.context.seccionId, state.cliente.selectedPoliza]);
const canProceedToStep3 = useCallback(() => {
  return !!(state.scan.status === 'completed' && state.file.uploaded);
}, [state.scan.status, state.file.uploaded]);
const canProceedToStep4 = useCallback(() => {
  const hasExtractedData = state.scan.extractedData && Object.keys(state.scan.extractedData).length > 0;
  const hasMasterData = state.masterData.combustibleId && state.masterData.categoriaId;
  return !!(hasExtractedData && hasMasterData);
}, [state.scan.extractedData, state.masterData.combustibleId, state.masterData.categoriaId]);

return {
  state,
  updateState,
  loadPolizasByCliente,
  selectPolizaForChange,
  setClienteData,
  uploadDocumentForChange,
  updateExtractedData, 
  updateMasterData,    
  markProcessCompleted,
  nextStep,
  prevStep,
  reset,
  canProceedToStep2,
  canProceedToStep3,
  canProceedToStep4
};
}