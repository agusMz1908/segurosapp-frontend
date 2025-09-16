import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
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
    status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
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
    }
  });

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

  // Selección de póliza anterior
  const selectPolizaAnterior = useCallback(async (numeroPoliza: string) => {
    try {
      setState(prev => ({
        ...prev,
        polizaAnterior: null
      }));

      console.log('🔍 Obteniendo póliza con número:', numeroPoliza);

      const response = await apiClient.get<any>(`/api/MasterData/polizas/search?numeroPoliza=${numeroPoliza}&limit=1`);
      
      console.log('📡 Respuesta selectPolizaAnterior:', response);
      
      // CORRECCIÓN: El apiClient devuelve directamente el array de datos
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
        montoTotal: poliza.conpremio || 0, // En este caso usamos el premio como total
        vehiculo: {
          marca: poliza.vehiculo_marca || '',
          modelo: poliza.vehiculo_modelo || '',
          anio: poliza.vehiculo_anio || 0,
          patente: poliza.vehiculo_matricula || ''
        }
      };

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
        }
      }));

      toast.success(`Póliza ${poliza.conpol} seleccionada`);
    } catch (error: any) {
      console.error('Error obteniendo póliza:', error);
      toast.error(error.response?.data?.message || 'Error obteniendo información de la póliza');
    }
  }, []);

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

  // Manejo de escaneo (reutilizar lógica de nueva póliza)
  const uploadDocument = useCallback(async (file: File) => {
    if (!state.context.clienteId || !state.context.companiaId || !state.context.seccionId) {
      toast.error('Error: Contexto no válido');
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        scan: {
          ...prev.scan,
          status: 'uploading',
          fileName: file.name
        }
      }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('clienteId', state.context.clienteId.toString());
      formData.append('companiaId', state.context.companiaId.toString());
      formData.append('seccionId', state.context.seccionId.toString());
      formData.append('notes', `Renovación de póliza ${state.polizaAnterior?.numero}`);

      const response = await apiClient.request<any>('/api/document/upload-with-context', {
        method: 'POST',
        body: formData,
        headers: {} // No establecer Content-Type para que el browser lo haga automáticamente con multipart
      });

      const result = response;

      if (result.success) {
        setState(prev => ({
          ...prev,
          scan: {
            ...prev.scan,
            status: 'completed',
            scanId: result.scanResult.scanId,
            extractedData: result.polizaMapping.mappedData || {},
            confidence: result.polizaMapping.completionPercentage || 0,
            requiresAttention: result.polizaMapping.requiresAttention || []
          }
        }));

        toast.success('Documento procesado exitosamente');
      } else {
        throw new Error(result.errorMessage || 'Error procesando documento');
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setState(prev => ({
        ...prev,
        scan: {
          ...prev.scan,
          status: 'error',
          errors: [error.response?.data?.message || error.message || 'Error desconocido']
        }
      }));
      toast.error(error.response?.data?.message || 'Error procesando documento');
    }
  }, [state.context, state.polizaAnterior]);

  // Enviar renovación
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

      const response = await apiClient.post<any>(`/api/document/${state.scan.scanId}/renew-in-velneo`, request);

      if (response.success) {
        setState(prev => ({
          ...prev,
          renovacion: {
            ...prev.renovacion,
            status: 'completed',
            result: response
          }
        }));

        toast.success('Renovación procesada exitosamente en Velneo');
      } else {
        throw new Error(response.message || 'Error en renovación');
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
      toast.error(error.response?.data?.message || 'Error procesando renovación');
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

  // Reset
  const reset = useCallback(() => {
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
    updateExtractedData,
    reset
  };
}