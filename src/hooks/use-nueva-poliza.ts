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
  status: 'idle' | 'uploading' | 'scanning' | 'completed' | 'error';
  extractedData: any;
  mappedData: any;
  completionPercentage: number;
  requiresAttention: any[];
  errorMessage?: string;
}

export interface MasterData {
  combustibleId: string;
  categoriaId: string;
  destinoId: string;
  departamentoId: string;
  corredorId: string;
  calidadId: string;
  tarifaId: string;
  medioPagoId: string;
  cantidadCuotas: number;
  observaciones: string;
}

export interface Step3Data {
  status: 'idle' | 'creating' | 'completed' | 'error';
  velneoPolizaId: number | null;
  polizaNumber: string | null;
  createdAt: string | null;
  velneoUrl: string | null;
  warnings: string[];
  validation: any;
  errorMessage?: string;
}

export interface NuevaPolizaState {
  context: ContextData;
  file: FileData;
  scan: ScanData;
  masterData: MasterData;
  step3: Step3Data;
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
    extractedData: {},
    mappedData: {},
    completionPercentage: 0,
    requiresAttention: [],
  },
  masterData: {
    combustibleId: '',
    categoriaId: '',
    destinoId: '',
    departamentoId: '',
    corredorId: '',
    calidadId: '',
    tarifaId: '',
    medioPagoId: '',
    cantidadCuotas: 1,
    observaciones: ''
  },
  step3: {
    status: 'idle',
    velneoPolizaId: null,
    polizaNumber: null,
    createdAt: null,
    velneoUrl: null,
    warnings: [],
    validation: { isValid: true, errors: [], warnings: [] }
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
    return state.scan.status === 'completed';
  }, [state.scan.status]);

  const canProceedToStep3 = useCallback(() => {
    const hasRequiredContext = state.context.clienteId && 
                              state.context.companiaId && 
                              state.context.seccionId;
    
    const hasExtractedData = state.scan.extractedData && 
                            Object.keys(state.scan.extractedData).length > 0;
    
    const hasRequiredPolicyData = state.scan.extractedData?.polizaNumber &&
                                 state.scan.extractedData?.vigenciaDesde &&
                                 state.scan.extractedData?.vigenciaHasta;
    
    const hasRequiredMasterData = state.masterData.combustibleId &&
                                 state.masterData.categoriaId &&
                                 state.masterData.destinoId;
    
    return hasRequiredContext && hasExtractedData && hasRequiredPolicyData && hasRequiredMasterData;
  }, [state]);

  // Función auxiliar para mapear datos del backend al frontend
  const mapBackendDataToFrontend = (backendData: any) => {
    return {
      polizaNumber: backendData.NumeroPoliza || backendData.numeroPoliza || "",
      vigenciaDesde: backendData.FechaDesde || backendData.fechaDesde || "",
      vigenciaHasta: backendData.FechaHasta || backendData.fechaHasta || "",
      prima: backendData.Premio?.toString() || backendData.premio?.toString() || "0",
      vehiculoMarca: backendData.VehiculoMarca || backendData.vehiculoMarca || "",
      vehiculoModelo: backendData.VehiculoModelo || backendData.vehiculoModelo || "",
      vehiculoAno: backendData.VehiculoAño?.toString() || backendData.vehiculoAño?.toString() || "",
      vehiculoChasis: backendData.VehiculoChasis || backendData.vehiculoChasis || "",
      vehiculoPatente: backendData.VehiculoMatricula || backendData.vehiculoMatricula || "",
      vehiculoMotor: backendData.VehiculoMotor || backendData.vehiculoMotor || "",
      aseguradoNombre: backendData.AseguradoNombre || backendData.aseguradoNombre || "",
      aseguradoDocumento: backendData.AseguradoDocumento || backendData.aseguradoDocumento || "",
    };
  };

  // Función auxiliar para calcular porcentaje de completitud
  const calculateCompletionPercentage = (polizaMapping: any) => {
    if (polizaMapping.metrics?.completionPercentage) {
      return polizaMapping.metrics.completionPercentage;
    }
    
    // Fallback: calcular basado en campos completados
    const mappedData = polizaMapping.mappedData || {};
    const requiredFields = ['NumeroPoliza', 'FechaDesde', 'FechaHasta', 'Premio'];
    const completedFields = requiredFields.filter(field => 
      mappedData[field] && mappedData[field] !== '' && mappedData[field] !== 0
    );
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  // Función auxiliar para mapear issues del backend
  const mapFieldIssues = (backendIssues: any[]) => {
    return backendIssues.map(issue => ({
      fieldName: mapBackendFieldToFrontend(issue.fieldName),
      reason: issue.description || issue.issueType || 'Requiere verificación',
      severity: issue.severity?.toLowerCase() || 'warning'
    }));
  };

  // Mapear nombres de campos del backend al frontend
  const mapBackendFieldToFrontend = (backendField: string) => {
    const fieldMap: { [key: string]: string } = {
      'NumeroPoliza': 'polizaNumber',
      'FechaDesde': 'vigenciaDesde', 
      'FechaHasta': 'vigenciaHasta',
      'Premio': 'prima',
      'VehiculoMarca': 'vehiculoMarca',
      'VehiculoModelo': 'vehiculoModelo',
      'VehiculoAño': 'vehiculoAno',
      'VehiculoChasis': 'vehiculoChasis',
      'VehiculoMotor': 'vehiculoMotor',
      'AseguradoNombre': 'aseguradoNombre',
      'AseguradoDocumento': 'aseguradoDocumento',
    };
    
    return fieldMap[backendField] || backendField;
  };

  // FUNCIÓN UPLOAD REAL
const uploadWithContext = useCallback(async (file: File): Promise<boolean> => {
  if (!isContextValid()) {
    toast.error('Contexto incompleto. Selecciona cliente, compañía y sección.');
    return false;
  }

  console.log('=== INICIANDO UPLOAD REAL ===');
  console.log('Context:', state.context);

  // Cancel previous request if exists
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

  abortControllerRef.current = new AbortController();

  updateState({
    file: {
      selected: file,
      uploaded: false,
      scanId: null,
      uploadProgress: 0,
    },
    scan: {
      status: 'uploading',
      extractedData: {},
      mappedData: {},
      completionPercentage: 0,
      requiresAttention: [],
      errorMessage: undefined,
    },
    isLoading: true,
  });

  try {
    // 1. Obtener token usando el mismo método que api.ts
    const getAuthToken = (): string => {
      // Buscar en localStorage con los nombres correctos
      const authToken = localStorage.getItem('auth-token') || 
                       localStorage.getItem('auth_token') || 
                       localStorage.getItem('token') || '';
      
      console.log('🔑 Token encontrado:', authToken ? authToken.substring(0, 20) + '...' : 'NONE');
      return authToken;
    };

    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
    }

    // 2. Crear FormData para envío al backend
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clienteId', state.context.clienteId?.toString() || '');
    formData.append('companiaId', state.context.companiaId?.toString() || '');
    formData.append('seccionId', state.context.seccionId?.toString() || '');
    formData.append('notes', ''); // Opcional

    // 3. Actualizar estado a scanning antes de la llamada
    updateState({
      file: {
        selected: file,
        uploaded: false,
        scanId: null,
        uploadProgress: 50,
      },
      scan: {
        status: 'scanning',
        extractedData: {},
        mappedData: {},
        completionPercentage: 0,
        requiresAttention: [],
        errorMessage: undefined,
      },
      isLoading: true,
    });

    // 4. Llamada real al backend con URL completa
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
    const response = await fetch(`${API_URL}/api/Document/upload-with-context`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO incluir Content-Type para FormData - el browser lo maneja automáticamente
      },
      body: formData,
      signal: abortControllerRef.current.signal,
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.Message || errorMessage;
        console.error('❌ Error del servidor:', errorData);
      } catch {
        // Si no se puede parsear como JSON, usar el texto
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      // Manejo específico para 401
      if (response.status === 401) {
        // Limpiar tokens y redirigir a login
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        // Opcional: redirigir a login
        window.location.href = '/login';
        return false;
      }
      
      throw new Error(errorMessage);
    }

    // 5. Procesar respuesta del backend
    const result = await response.json();
    console.log('=== RESPUESTA DEL BACKEND ===', result);

    // 6. Extraer datos de la respuesta según estructura del backend
    const scanResult = result.scanResult || {};
    const polizaMapping = result.polizaMapping || {};
    
    // Mapear los datos extraídos a formato del frontend
    const extractedData = mapBackendDataToFrontend(scanResult.extractedData || {});
    
    // 7. Actualizar estado con datos reales
    updateState({
      file: {
        selected: file,
        uploaded: true,
        scanId: scanResult.scanId || scanResult.id || null,
        uploadProgress: 100,
      },
      scan: {
        status: 'completed',
        extractedData: extractedData,
        mappedData: polizaMapping.mappedData || {},
        completionPercentage: calculateCompletionPercentage(polizaMapping),
        requiresAttention: mapFieldIssues(polizaMapping.mappingIssues || []),
        errorMessage: undefined,
      },
      isLoading: false,
    });

    toast.success(`Documento procesado exitosamente (${calculateCompletionPercentage(polizaMapping)}% de confianza)`);
    return true;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return false;
    }

    console.error('❌ Error uploading document:', error);
    
    updateState({
      file: {
        selected: file,
        uploaded: false,
        scanId: null,
        uploadProgress: 0,
      },
      scan: {
        status: 'error',
        extractedData: {},
        mappedData: {},
        completionPercentage: 0,
        requiresAttention: [],
        errorMessage: error.message || 'Error procesando documento'
      },
      isLoading: false,
    });

    toast.error('Error procesando documento: ' + (error.message || 'Error desconocido'));
    return false;
  }
}, [state.context, isContextValid, updateState, mapBackendDataToFrontend, calculateCompletionPercentage, mapFieldIssues]);

  // NUEVA FUNCIÓN SEND TO VELNEO
  const sendToVelneo = useCallback(async (): Promise<boolean> => {
    if (!canProceedToStep3()) {
      toast.error('Faltan datos requeridos para crear la póliza');
      return false;
    }

    if (!state.file.scanId) {
      toast.error('No hay documento escaneado para procesar');
      return false;
    }

    updateState({
      isLoading: true,
      step3: {
        ...state.step3,
        status: 'creating'
      }
    });

    try {
      // Construir request con todos los datos necesarios
      const createRequest = {
        scanId: state.file.scanId,
        clientId: state.context.clienteId,
        brokerId: parseInt(state.masterData.corredorId) || 0,
        companyId: state.context.companiaId,
        sectionId: state.context.seccionId,
        departmentId: parseInt(state.masterData.departamentoId) || 0,
        fuelId: state.masterData.combustibleId || "",
        destinationId: parseInt(state.masterData.destinoId) || 0,
        categoryId: parseInt(state.masterData.categoriaId) || 0,
        qualityId: parseInt(state.masterData.calidadId) || 0,
        tariffId: parseInt(state.masterData.tarifaId) || 0,
        
        // Datos de la póliza desde el formulario
        policyNumber: state.scan.extractedData?.polizaNumber || "",
        startDate: state.scan.extractedData?.vigenciaDesde || "",
        endDate: state.scan.extractedData?.vigenciaHasta || "",
        premium: parseFloat(state.scan.extractedData?.prima || "0"),
        
        // Datos del vehículo
        vehicleBrand: state.scan.extractedData?.vehiculoMarca || "",
        vehicleModel: state.scan.extractedData?.vehiculoModelo || "",
        vehicleYear: parseInt(state.scan.extractedData?.vehiculoAno || "0"),
        motorNumber: state.scan.extractedData?.vehiculoMotor || "",
        chassisNumber: state.scan.extractedData?.vehiculoChasis || "",
        
        // Forma de pago
        paymentMethod: state.masterData.medioPagoId || "",
        installmentCount: state.masterData.cantidadCuotas || 1,
        
        // Observaciones
        notes: state.masterData.observaciones || "",
        
        // Campos que fueron corregidos manualmente
        correctedFields: [] // Se podría trackear qué campos editó el usuario
      };

      console.log('=== ENVIANDO A VELNEO ===', createRequest);

      const response = await fetch('/api/Velneo/create-poliza', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('=== RESPUESTA DE VELNEO ===', result);

      if (result.success) {
        updateState({
          step3: {
            status: 'completed',
            velneoPolizaId: result.velneoPolizaId,
            polizaNumber: result.polizaNumber,
            createdAt: result.createdAt,
            velneoUrl: result.velneoUrl,
            warnings: result.warnings || [],
            validation: result.validation || { isValid: true, errors: [], warnings: [] }
          },
          isLoading: false,
        });

        toast.success(`Póliza creada exitosamente: ${result.polizaNumber}`);
        
        // Opcional: Navegar automáticamente o mostrar opciones
        if (result.velneoUrl) {
          // Se podría abrir Velneo automáticamente o mostrar un botón
          console.log('URL de Velneo disponible:', result.velneoUrl);
        }
        
        return true;
      } else {
        throw new Error(result.message || 'Error creando póliza en Velneo');
      }

    } catch (error: any) {
      console.error('Error sending to Velneo:', error);
      
      updateState({
        step3: {
          ...state.step3,
          status: 'error',
          errorMessage: error.message || 'Error creando póliza'
        },
        isLoading: false,
      });

      toast.error('Error creando póliza: ' + (error.message || 'Error desconocido'));
      return false;
    }
  }, [state, canProceedToStep3, updateState, getAuthToken]);

  // Reescannear documento
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

      const response = await fetch(`/api/Document/${state.file.scanId}/reprocess`, {
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

      // Mapear los datos según la estructura real
      const extractedData = mapBackendDataToFrontend(result.extractedData || {});

      updateState({
        scan: {
          status: 'completed',
          extractedData: extractedData,
          mappedData: result.mappedData || {},
          completionPercentage: result.successRate || result.completionPercentage || 0,
          requiresAttention: mapFieldIssues(result.requiresAttention || []),
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
  }, [state.file.scanId, state.scan, updateState, getAuthToken, mapBackendDataToFrontend, mapFieldIssues]);

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
          extractedData: {},
          mappedData: {},
          completionPercentage: 0,
          requiresAttention: [],
        }
      });
      toast('Contexto actualizado. Vuelve a cargar el archivo PDF.', {
        icon: 'ℹ️',
      });
    }
  }, [state.context, state.file.uploaded, updateState]);

  // Reset completo
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(initialState);
    toast.success('Proceso reiniciado');
  }, []);

  // Cancelar operación
  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    updateState({ isLoading: false });
    toast('Operación cancelada', { icon: '⏹️' });
  }, [updateState]);

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