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
  
  // Estructura requerida por ClientePolizasSearchForm
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
  
  // 🔥 NUEVO: Estado para controlar cuando la renovación está completada
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
  
  // 🔥 NUEVO: Inicializar estado de proceso completado
  processCompleted: false,
  processResult: undefined,
};

export function useRenovaciones() {
  const [state, setState] = useState<RenovacionState>(initialState);

  const updateState = useCallback((updates: Partial<RenovacionState> | ((prev: RenovacionState) => RenovacionState)) => {
    setState(prevState => {
      const newState = typeof updates === 'function' ? updates(prevState) : { ...prevState, ...updates };
      console.log('🔧 RENOVACIONES - State updated:', newState);
      return newState;
    });
  }, []);

  // 🔥 NUEVO: Función para marcar el proceso como completado
  const markProcessCompleted = useCallback((result: any) => {
    updateState({
      processCompleted: true,
      processResult: result,
      isLoading: false,
    });
  }, [updateState]);

  // 🔥 NUEVO: Función para resetear el estado de proceso completado
  const resetProcessCompleted = useCallback(() => {
    updateState({
      processCompleted: false,
      processResult: undefined,
    });
  }, [updateState]);

  // Cargar pólizas de un cliente
  const loadPolizasByCliente = useCallback(async (clienteId: number) => {
    try {
      console.log('🔄 Cargando pólizas para cliente:', clienteId);
      
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
      console.log('📋 Respuesta del API:', polizasData);

      // Manejar diferentes formatos de respuesta del API
      let polizasList: any[] = [];
      
      if (Array.isArray(polizasData)) {
        polizasList = polizasData;
      } else if (polizasData && polizasData.data && Array.isArray(polizasData.data)) {
        polizasList = polizasData.data;
      } else if (polizasData && polizasData.polizas && Array.isArray(polizasData.polizas)) {
        polizasList = polizasData.polizas;
      } else {
        console.error('❌ Formato de respuesta inesperado:', polizasData);
        throw new Error('El API no devolvió un array de pólizas válido');
      }

      console.log('📋 Lista de pólizas extraída:', polizasList.length);

      // Filtrar solo pólizas de AUTOMOTOR y en rango de renovación
      const now = new Date();
      const polizasRenovables = polizasList.filter((poliza: any) => {
        console.log('🔍 Evaluando póliza:', {
          numero: poliza.conpol,
          seccion: poliza.seccod,
          fechaVencimiento: poliza.confchhas,
        });

        // Verificar que sea de automotor (sección 4)
        if (poliza.seccod !== 4) {
          console.log(`❌ Póliza ${poliza.conpol} EXCLUIDA - No es de automotor (sección: ${poliza.seccod})`);
          return false;
        }
        
        // Calcular días hasta vencimiento
        let diasHastaVencimiento = 0;
        try {
          const fechaVencimiento = new Date(poliza.confchhas);
          diasHastaVencimiento = Math.ceil((fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          console.log(`📅 Póliza ${poliza.conpol} - Días hasta vencimiento: ${diasHastaVencimiento}`);
        } catch (error) {
          console.error(`❌ Error parseando fecha para póliza ${poliza.conpol}:`, error);
          return false;
        }
        
        // Solo pólizas en rango de renovación (próximos 60 días hasta 30 días vencidas)
        const enRangoRenovacion = diasHastaVencimiento >= -30 && diasHastaVencimiento <= 60;
        
        if (!enRangoRenovacion) {
          console.log(`❌ Póliza ${poliza.conpol} EXCLUIDA - Fuera del rango de renovación (días: ${diasHastaVencimiento})`);
        } else {
          console.log(`✅ Póliza ${poliza.conpol} INCLUIDA - En rango de renovación`);
        }
        
        return enRangoRenovacion;
      });

      console.log(`✅ Pólizas renovables: ${polizasRenovables.length}/${polizasList.length}`);
      
      updateState({
        cliente: {
          ...state.cliente,
          selectedId: clienteId,
          polizas: polizasRenovables
        }
      });

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
      console.error('❌ Error cargando pólizas:', error);
      toast.error('Error cargando pólizas del cliente: ' + (error.message || 'Error desconocido'));
      
      updateState({
        cliente: {
          ...state.cliente,
          selectedId: clienteId,
          polizas: []
        }
      });
      
      return [];
    }
  }, [state.cliente, updateState]);

  const setClienteData = useCallback((cliente: Cliente) => {
    console.log('📝 Estableciendo datos completos del cliente:', cliente);
    
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
    console.log('🔄 Seleccionando póliza para renovar:', poliza);
    
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

  // Verificar si una póliza es renovable
  const isPolizaRenovable = useCallback((poliza: any) => {
    const dias = getDiasParaVencimiento(poliza);
    return dias >= -30 && dias <= 60;
  }, []);

  // Calcular días para vencimiento
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

  // Upload de documento para renovación
  const uploadDocumentForRenovacion = useCallback(async (file: File): Promise<boolean> => {
    console.log('🔄 RENOVACIONES - Iniciando upload específico');
    
    // Validar contexto
    if (!state.context.clienteId || !state.context.seccionId) {
      toast.error('Contexto incompleto. Selecciona cliente y póliza.');
      return false;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación.');
      }

      // Actualizar estado con archivo guardado
      updateState({
        file: {
          selected: file,
          uploaded: false,
          scanId: null,
          uploadProgress: 0,
        },
        scan: {
          ...state.scan,
          status: 'uploading',
          fileName: file.name,
          errorMessage: undefined,
        },
        isLoading: true,
      });

      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clienteId', state.context.clienteId.toString());
      formData.append('companiaId', state.context.companiaId?.toString() || '1');
      formData.append('seccionId', state.context.seccionId.toString());
      formData.append('notes', 'Renovación automática');

      console.log('🔄 RENOVACIONES - Enviando FormData:', {
        fileName: file.name,
        clienteId: state.context.clienteId,
        companiaId: state.context.companiaId || 1,
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
      console.log('✅ RENOVACIONES - Respuesta del servidor:', result);

      // Procesar respuesta
      const scanResult = result.scanResult || {};
      const polizaMapping = result.polizaMapping || {};
      
      const originalExtractedData = scanResult.extractedData || {};
      const normalizedData = polizaMapping.normalizedData || {};
      const mappedData = polizaMapping.mappedData || {};

      console.log('🔍 RENOVACIONES - Datos extraídos:', {
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
        console.log('🏢 RENOVACIONES - Compañía detectada automáticamente:', companiaDetectada);
      } else {
        console.log('⚠️ RENOVACIONES - No se detectó compañía válida en preSelection:', result.preSelection);
      }

      // Actualizar estado final manteniendo archivo
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
      console.error('❌ RENOVACIONES - Error en upload:', error);
      
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

  // Actualizar datos extraídos
  const updateExtractedData = useCallback((updates: Record<string, any>) => {
    updateState({
      scan: {
        ...state.scan,
        extractedData: {
          ...state.scan.extractedData,
          ...updates
        }
      }
    });
  }, [state.scan, updateState]);

  // Actualizar datos maestros
  const updateMasterData = useCallback((updates: Partial<MasterDataFormData>) => {
    updateState({
      masterData: {
        ...state.masterData,
        ...updates
      }
    });
  }, [state.masterData, updateState]);

  // Navegación entre pasos
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

  // Validaciones para navegación
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
    
    // 🔥 NUEVO: Exportar funciones para manejar el proceso completado
    markProcessCompleted,
    resetProcessCompleted,

    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
  };
}