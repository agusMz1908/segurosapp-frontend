import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { getAuthToken, getAuthHeadersForFormData, getAuthHeaders, handle401Error } from '@/utils/auth-utils';
import { apiClient } from '@/lib/api';

interface PolizaAnterior {
  id: number;
  numero: string;
  cliente: {
    id: number;
    nombre: string;
    documento: string;
    email?: string;
  };
  compania: {
    id: number;
    nombre: string;
    codigo: string;
  };
  seccion: {
    id: number;
    nombre: string;
    ramo: string;
  };
  fechaDesde: string;
  fechaHasta: string;
  estado: string;
  premio: number;
  montoTotal: number;
  vehiculo?: {
    marca: string;
    modelo: string;
    anio: number;
    patente: string;
  };
}

interface RenovacionState {
  currentStep: number;
  polizaAnterior: PolizaAnterior | null;
  context: {
    clienteId?: number;
    companiaId?: number;
    seccionId?: number;
    clienteInfo?: any;
    companiaInfo?: any;
    seccionInfo?: any;
  };
  scan: {
    status: 'idle' | 'uploading' | 'scanning' | 'processing' | 'completed' | 'error';
    scanId?: number;
    extractedData: any;
    confidence?: number;
    requiresAttention?: any[];
    errors?: string[];
    fileName?: string;
  };
  renovacion: {
    status: 'idle' | 'processing' | 'completed' | 'error';
    result?: any;
    observaciones?: string;
    validarVencimiento: boolean;
  };
  masterData: {  // ← CAMBIAR de opcional a requerido
    combustibleId: string;
    categoriaId: string;
    destinoId: string;
    departamentoId: string;
    calidadId: string;
    tarifaId: string;
    cantidadCuotas: number;
    medioPagoId: string;
    corredorId: string;
    observaciones: string;
  };
}

export function useRenovaciones() {
  const [state, setState] = useState<RenovacionState>({
    currentStep: 1,
    polizaAnterior: null,
    context: {},
    scan: {
      status: 'idle',
      extractedData: {},
      requiresAttention: [],
      errors: []
    },
    renovacion: {
      status: 'idle',
      validarVencimiento: true
    },
    // ✅ AGREGAR ESTADO INICIAL PARA MASTER DATA
    masterData: {
      combustibleId: '',
      categoriaId: '',
      destinoId: '',
      departamentoId: '',
      calidadId: '',
      tarifaId: '',
      cantidadCuotas: 1,
      medioPagoId: '',
      corredorId: '',
      observaciones: ''
    }
  });


  const abortControllerRef = useRef<AbortController>(new AbortController());

  // Funciones de navegación
  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 4)
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1)
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step
    }));
  }, []);

const selectPolizaAnterior = useCallback(async (numeroPoliza: string) => {
  try {
    // Limpiar estado anterior
    setState(prev => ({
      ...prev,
      polizaAnterior: null,
      context: {} // Limpiar contexto
    }));

    console.log('🔍 Obteniendo póliza con número:', numeroPoliza);

    // ✅ USAR apiClient en lugar de fetch directo
    const response = await apiClient.get<any>(`/api/MasterData/polizas/search?numeroPoliza=${numeroPoliza}&limit=1`);
    
    console.log('📡 Respuesta selectPolizaAnterior:', response);
    
    // ✅ CONSISTENTE: apiClient ya extrae los datos del wrapper
    if (!Array.isArray(response) || response.length === 0) {
      throw new Error('Póliza no encontrada');
    }
    
    const poliza = response[0];

    // Mapear datos de la API a nuestro formato interno
    const polizaAnterior: PolizaAnterior = {
      id: poliza.id,
      numero: poliza.conpol,
      cliente: {
        id: poliza.clinro,
        nombre: poliza.cliente_nombre || `Cliente ID: ${poliza.clinro}`,
        documento: poliza.cliente_documento || '',
        email: ''
      },
      compania: {
        id: poliza.comcod,
        nombre: poliza.compania_nombre || `Compañía ID: ${poliza.comcod}`,
        codigo: poliza.comcod.toString()
      },
      seccion: {
        id: poliza.seccod,
        nombre: poliza.seccion_nombre || `Sección ID: ${poliza.seccod}`,
        ramo: poliza.seccion_nombre || 'Ramo no especificado'
      },
      fechaDesde: poliza.confchdes,
      fechaHasta: poliza.confchhas,
      estado: poliza.activo ? 'Activa' : 'Inactiva',
      premio: poliza.conpremio || 0,
      montoTotal: poliza.conpremio || 0,
      vehiculo: {
        marca: poliza.vehiculo_marca || '',
        modelo: poliza.vehiculo_modelo || '',
        anio: poliza.vehiculo_anio || 0,
        patente: poliza.vehiculo_matricula || ''
      }
    };

    // Actualizar estado de una sola vez
    setState(prev => ({
      ...prev,
      polizaAnterior,
      // Heredar contexto automáticamente
      context: {
        clienteId: polizaAnterior.cliente.id,
        companiaId: polizaAnterior.compania.id,
        seccionId: polizaAnterior.seccion.id,
        clienteInfo: polizaAnterior.cliente,
        companiaInfo: polizaAnterior.compania,
        seccionInfo: polizaAnterior.seccion
      },
      // ✅ AVANZAR automáticamente al siguiente paso
      currentStep: 2
    }));

    console.log('✅ Póliza seleccionada y contexto configurado:', polizaAnterior);
    
    // NO hacer toast aquí, dejarlo para el componente
    return polizaAnterior;

  } catch (error: any) {
    console.error('❌ Error obteniendo póliza:', error);
    
    // Limpiar estado en caso de error
    setState(prev => ({
      ...prev,
      polizaAnterior: null,
      context: {}
    }));
    
    // Re-lanzar el error para que el componente lo maneje
    throw error;
  }
}, []);

  // Upload usando el patrón exacto de nueva-poliza
  const uploadDocument = useCallback(async (file: File): Promise<boolean> => {
    if (!state.context.clienteId || !state.context.companiaId || !state.context.seccionId) {
      toast.error('Error: Contexto no válido para la renovación');
      return false;
    }

    try {
      // Abortar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      console.log('🔍 Iniciando upload para renovación:', {
        file: file.name,
        clienteId: state.context.clienteId,
        companiaId: state.context.companiaId,
        seccionId: state.context.seccionId,
        polizaAnterior: state.polizaAnterior?.numero
      });

      setState(prev => ({
        ...prev,
        scan: {
          ...prev.scan,
          status: 'uploading',
          fileName: file.name,
          errors: []
        }
      }));

      // ← USAR LA MISMA LÓGICA QUE NUEVA-POLIZA
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('clienteId', state.context.clienteId.toString());
      formData.append('companiaId', state.context.companiaId.toString());
      formData.append('seccionId', state.context.seccionId.toString());
      formData.append('notes', `Renovación de póliza ${state.polizaAnterior?.numero}`);

      setState(prev => ({
        ...prev,
        scan: {
          ...prev.scan,
          status: 'scanning'
        }
      }));

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      const response = await fetch(`${API_URL}/api/Document/upload-with-context`, {
        method: 'POST',
        headers: getAuthHeadersForFormData(), // ← USAR LA MISMA FUNCIÓN
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.Message || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        if (response.status === 401) {
          handle401Error(); // ← USAR LA MISMA FUNCIÓN
          return false;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      console.log('🔍 Resultado upload renovación:', result);
      
      const scanResult = result.scanResult || {};
      const polizaMapping = result.polizaMapping || {};

      if (result.success) {
        setState(prev => ({
          ...prev,
          scan: {
            ...prev.scan,
            status: 'completed',
            scanId: scanResult.scanId,
extractedData: {
  // Conservar todos los datos existentes
  ...polizaMapping.mappedData,
  ...scanResult.extractedData,
  
  // Mapeo mejorado para campos financieros
  valorPorCuota: polizaMapping.mappedData?.valorPorCuota || 
                polizaMapping.mappedData?.valorCuota ||
                scanResult.extractedData?.valorPorCuota ||
                scanResult.extractedData?.valorCuota ||
                (polizaMapping.mappedData?.prima && polizaMapping.mappedData?.cantidadCuotas ? 
                  (parseFloat(polizaMapping.mappedData.prima) / parseFloat(polizaMapping.mappedData.cantidadCuotas)).toString() : '') ||
                '',
                
  premioTotal: polizaMapping.mappedData?.premioTotal ||
               polizaMapping.mappedData?.montoTotal ||
               polizaMapping.mappedData?.premio ||
               scanResult.extractedData?.premioTotal ||
               scanResult.extractedData?.montoTotal ||
               polizaMapping.mappedData?.prima || '',
               
  // Asegurar que la prima se mapee correctamente
  prima: polizaMapping.mappedData?.prima || 
         polizaMapping.mappedData?.premio ||
         scanResult.extractedData?.prima || 
         scanResult.extractedData?.premio || '',
         
  // Campos básicos con fallbacks
  numeroPoliza: polizaMapping.mappedData?.numeroPoliza ||
                scanResult.extractedData?.numeroPoliza ||
                scanResult.extractedData?.polizaNumber || '',
},
            confidence: polizaMapping.completionPercentage || 0,
            requiresAttention: polizaMapping.requiresAttention || []
          }
        }));

        toast.success('Documento de renovación procesado exitosamente');
        return true;
      } else {
        throw new Error(result.errorMessage || 'Error procesando documento');
      }
    } catch (error: any) {
      console.error('Error uploading document for renewal:', error);
      
      // No mostrar error si fue abortado intencionalmente
      if (error.name === 'AbortError') {
        return false;
      }

      setState(prev => ({
        ...prev,
        scan: {
          ...prev.scan,
          status: 'error',
          errors: [error.message || 'Error desconocido']
        }
      }));
      
      toast.error(error.message || 'Error procesando documento de renovación');
      return false;
    }
  }, [state.context, state.polizaAnterior]);

  // Validaciones de paso
  const canProceedToStep2 = useCallback(() => {
    return !!state.polizaAnterior?.id;
  }, [state.polizaAnterior]);

  const canProceedToStep3 = useCallback(() => {
    return canProceedToStep2() && isPolizaRenovable();
  }, [state.polizaAnterior]);

  const canProceedToStep4 = useCallback(() => {
    return state.scan.status === 'completed' && 
           state.scan.extractedData && 
           Object.keys(state.scan.extractedData).length > 0;
  }, [state.scan]);

  // Validación de renovación
  const isPolizaRenovable = useCallback(() => {
    if (!state.polizaAnterior) return false;

    const fechaVencimiento = new Date(state.polizaAnterior.fechaHasta);
    const hoy = new Date();
    const diasHastaVencimiento = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    // Validar que esté en el rango permitido (60 días antes a 30 días después)
    return diasHastaVencimiento >= -30 && diasHastaVencimiento <= 60;
  }, [state.polizaAnterior]);

  const getDiasParaVencimiento = useCallback(() => {
    if (!state.polizaAnterior) return 0;
    
    const fechaVencimiento = new Date(state.polizaAnterior.fechaHasta);
    const hoy = new Date();
    return Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }, [state.polizaAnterior]);

  // Enviar renovación usando fetch directo
  const submitRenovacion = useCallback(async () => {
    if (!state.scan.scanId || !state.polizaAnterior) {
      toast.error('Faltan datos para procesar la renovación');
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        renovacion: {
          ...prev.renovacion,
          status: 'processing'
        }
      }));

      const request = {
        polizaAnteriorId: state.polizaAnterior.id,
        observaciones: state.renovacion.observaciones || `Renovación automática de póliza ${state.polizaAnterior.numero}`,
        validarVencimiento: state.renovacion.validarVencimiento
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      const response = await fetch(`${API_URL}/api/document/${state.scan.scanId}/renew-in-velneo`, {
        method: 'POST',
        headers: getAuthHeaders(), // ← USAR LA MISMA FUNCIÓN
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handle401Error();
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          renovacion: {
            ...prev.renovacion,
            status: 'completed',
            result: result
          }
        }));

        toast.success('Renovación procesada exitosamente en Velneo');
      } else {
        throw new Error(result.message || 'Error en renovación');
      }
    } catch (error: any) {
      console.error('Error en renovación:', error);
      setState(prev => ({
        ...prev,
        renovacion: {
          ...prev.renovacion,
          status: 'error'
        }
      }));
      toast.error(error.message || 'Error procesando renovación');
    }
  }, [state.scan.scanId, state.polizaAnterior, state.renovacion.observaciones, state.renovacion.validarVencimiento]);

  // Actualizar observaciones
  const updateObservaciones = useCallback((observaciones: string) => {
    setState(prev => ({
      ...prev,
      renovacion: {
        ...prev.renovacion,
        observaciones
      }
    }));
  }, []);

  const updateValidarVencimiento = useCallback((validar: boolean) => {
    setState(prev => ({
      ...prev,
      renovacion: {
        ...prev.renovacion,
        validarVencimiento: validar
      }
    }));
  }, []);

  // Actualizar datos extraídos
  const updateExtractedData = useCallback((updates: any) => {
    setState(prev => ({
      ...prev,
      scan: {
        ...prev.scan,
        extractedData: {
          ...prev.scan.extractedData,
          ...updates
        }
      }
    }));
  }, []);

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

  // Función para actualizar master data específicamente
  const updateMasterData = useCallback((updates: any) => {
    setState(prev => ({
      ...prev,
      masterData: {
        ...prev.masterData,
        ...updates
      }
    }));
  }, []);

const reset = useCallback(() => {
  abortControllerRef.current.abort();
  abortControllerRef.current = new AbortController();
  
  setState({
    currentStep: 1,
    polizaAnterior: null,
    context: {},
    scan: {
      status: 'idle',
      extractedData: {},
      requiresAttention: [],
      errors: []
    },
    renovacion: {
      status: 'idle',
      validarVencimiento: true
    },
    // ✅ AGREGAR masterData al reset
    masterData: {
      combustibleId: '',
      categoriaId: '',
      destinoId: '',
      departamentoId: '',
      calidadId: '',
      tarifaId: '',
      cantidadCuotas: 1,
      medioPagoId: '',
      corredorId: '',
      observaciones: ''
    }
  });
}, []);

return {
    state,
    // Navegación
    nextStep,
    prevStep,
    goToStep,
    
    // Validaciones
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    isPolizaRenovable,
    getDiasParaVencimiento,
    
    // Acciones
    selectPolizaAnterior,
    uploadDocument,
    submitRenovacion,
    updateObservaciones,
    updateValidarVencimiento,
    updateExtractedData,  // ✅ NUEVA
    updateMasterData,     // ✅ NUEVA  
    updateState,          // ✅ NUEVA
    reset
  };
}