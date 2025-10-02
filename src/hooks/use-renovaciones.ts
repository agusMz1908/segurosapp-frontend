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

// 🔧 FUNCIONES DE MAPEO DE DATOS (iguales que el fix de Cambios)
const cleanText = (str: string) => {
  if (!str) return "";
  return str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
};

const cleanVehicleField = (str: string) => {
  if (!str) return "";
  
  let cleaned = str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
  
  const prefixes = [
    'MARCA: ', 'MODELO: ', 'MOTOR: ', 'CHASIS: ', 'AÑO: ',
    'MARCA ', 'MODELO ', 'MOTOR ', 'CHASIS ', 'AÑO ',
    'Marca: ', 'Modelo: ', 'Motor: ', 'Chasis: ', 'Año: ',
    'Marca ', 'Modelo ', 'Motor ', 'Chasis ', 'Año '
  ];
  
  for (const prefix of prefixes) {
    if (cleaned.toUpperCase().startsWith(prefix.toUpperCase())) {
      cleaned = cleaned.substring(prefix.length).trim();
      break;
    }
  }
  
  cleaned = cleaned.replace(/^:\s*/, '').trim();
  return cleaned;
};

const cleanPatenteField = (str: string) => {
  if (!str) return "";
  
  let cleaned = str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();

  const patentesPrefixes = [
    'MATRÍCULA: ', 'MATRÍCULA ', 'PATENTE: ', 'PATENTE ',
    'Matrícula: ', 'Matrícula ', 'Patente: ', 'Patente '
  ];
  
  for (const prefix of patentesPrefixes) {
    if (cleaned.toUpperCase().startsWith(prefix.toUpperCase())) {
      cleaned = cleaned.substring(prefix.length).trim();
      break;
    }
  }
  
  return cleaned.toUpperCase();
};

const extractPolizaNumber = (str: string) => {
  if (!str) return "";
  
  const cleanStr = cleanText(str);
  const cleanedNumber = cleanStr
    .replace(/^(Póliza|Numero|Number)[\s:]*\s*/i, '')
    .replace(/^(nro\.\s*|nro\s*|número\s*|numero\s*)/i, '')
    .replace(/^:\s*/, '')
    .replace(/^\s*:\s*/, '')
    .trim();
  
  return cleanedNumber || cleanStr;
};

const extractYear = (str: string) => {
  if (!str) return "";
  
  const cleanStr = cleanText(str);
  let cleaned = cleanStr.replace(/^(AÑO|Año|YEAR|Year)[\s:]*\s*/i, '').trim();
  
  const yearMatch = cleaned.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  if (yearMatch) {
    return yearMatch[0];
  }
  
  if (/^\d{4}$/.test(cleaned)) {
    const year = parseInt(cleaned);
    if (year >= 1950 && year <= new Date().getFullYear() + 1) {
      return cleaned;
    }
  }
  
  return "";
};

// 🔧 FUNCIÓN DE MAPEO UNIFICADA (igual que Cambios después del fix)
const mapBackendDataToFrontend = (backendData: any, extractedData: any) => {
  console.log('🔄 RENOVACIONES - Usando función de mapeo unificada');
  
  const findFieldValue = (keys: string[]) => {
    for (const key of keys) {
      if (extractedData[key] && extractedData[key].toString().trim()) {
        return extractedData[key];
      }
    }
    return null;
  };

  const result = {
    // 📋 Información de la póliza  
    polizaNumber: extractPolizaNumber(
      findFieldValue([
        "poliza.numero", "poliza.numero_poliza", "poliza_numero", "numeroPoliza"
      ]) || ""
    ) || backendData.numeroPoliza || "",

    vigenciaDesde: (() => {
      if (backendData.fechaDesde && backendData.fechaDesde !== "2025-09-17") {
        return backendData.fechaDesde;
      }
      return cleanText(findFieldValue([
        "poliza.vigencia.desde", "poliza.fecha-desde", "poliza.fecha_desde"
      ]) || "") || "";
    })(),
    
    vigenciaHasta: (() => {
      if (backendData.fechaHasta && backendData.fechaHasta !== "2025-09-17") {
        return backendData.fechaHasta;
      }
      return cleanText(findFieldValue([
        "poliza.vigencia.hasta", "poliza.fecha-hasta", "poliza.fecha_hasta"
      ]) || "") || "";
    })(),

    // 💰 Información financiera
    prima: backendData.premio?.toString() || 
           cleanText(findFieldValue([
             "poliza.prima_comercial", "costo.costo", "premio.premio", "prima"
           ]) || "") || "",
    
    premioTotal: backendData.premioTotal?.toString() || 
                 cleanText(findFieldValue([
                   "financiero.premio_total", "costo.premio_total", "premio.total"
                 ]) || "") || "",

    cantidadCuotas: backendData.cantidadCuotas?.toString() || 
                    cleanText(findFieldValue([
                      "pago.cantidad_cuotas", "cantidad_cuotas"
                    ]) || "") || "",

    valorPorCuota: backendData.valorCuota?.toString() || 
                   cleanText(findFieldValue([
                     "pago.cuota_monto[1]", "pago.primera_cuota", "valor_cuota"
                   ]) || "") || "",

    // 🚗 Información del vehículo
    vehiculoMarca: (() => {
      if (backendData.vehiculoMarca) {
        return cleanVehicleField(backendData.vehiculoMarca);
      }
      
      const rawValue = findFieldValue([
        "vehiculo.marca", "vehiculoMarca", "vehiculo_marca"
      ]);
      
      return rawValue ? cleanVehicleField(rawValue) : "";
    })(),

    vehiculoModelo: (() => {
      if (backendData.vehiculoModelo) {
        return cleanVehicleField(backendData.vehiculoModelo);
      }
      
      const rawValue = findFieldValue([
        "vehiculo.modelo", "vehiculoModelo", "vehiculo_modelo"
      ]);
      
      return rawValue ? cleanVehicleField(rawValue) : "";
    })(),

    vehiculoAno: (() => {
      if (backendData.vehiculoAño?.toString()) {
        return backendData.vehiculoAño.toString();
      }
      
      const rawValue = findFieldValue([
        "vehiculo.anio", "vehiculo.año", "vehiculoAno", "vehiculo_anio"
      ]);
      
      return rawValue ? extractYear(rawValue) : "";
    })(),

    vehiculoChasis: (() => {
      if (backendData.vehiculoChasis) return backendData.vehiculoChasis;
      
      const rawValue = findFieldValue([
        "vehiculo.chasis", "vehiculoChasis", "vehiculo_chasis"
      ]);
      
      return rawValue ? cleanVehicleField(rawValue) : "";
    })(),

    vehiculoMotor: (() => {
      if (backendData.vehiculoMotor) return backendData.vehiculoMotor;
      
      const rawValue = findFieldValue([
        "vehiculo.motor", "vehiculoMotor", "vehiculo_motor"
      ]);
      
      return rawValue ? cleanVehicleField(rawValue) : "";
    })(),

    vehiculoPatente: (() => {
      if (backendData.vehiculoPatente) return backendData.vehiculoPatente;

      const rawValue = findFieldValue([
        "vehiculo.matricula", "vehiculoPatente", "vehiculo_matricula", "matricula", "patente"
      ]);

      return rawValue ? cleanPatenteField(rawValue) : "";
    })(),

    // 👤 Información del asegurado
    aseguradoNombre: backendData.aseguradoNombre || 
                     cleanText(findFieldValue([
                       "asegurado.nombre"
                     ]) || "") || "",
    
    aseguradoDocumento: backendData.aseguradoDocumento || 
                        cleanText(findFieldValue([
                          "conductor.cedula", "asegurado.documento", "asegurado.ci"
                        ]) || "") || "",
    
    modalidad: cleanText(findFieldValue([
      "poliza.modalidad"
    ]) || "") || "",
    
    tipoMovimiento: cleanText(findFieldValue([
      "poliza.tipo_de_movimiento", "poliza.tipo_movimiento"
    ]) || "") || ""
  };

  console.log('✅ RENOVACIONES - mapBackendDataToFrontend resultado:', {
    polizaNumber: result.polizaNumber,
    vehiculoPatente: result.vehiculoPatente,
    vehiculoAno: result.vehiculoAno,
    vehiculoMarca: result.vehiculoMarca
  });
  
  return result;
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

  // 🔧 FUNCIÓN ACTUALIZADA: Usar mapeo unificado (igual que Cambios)
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

      // 🔧 CAMBIO PRINCIPAL: Usar la misma lógica de mapeo que Cambios (después del fix)
      const dataForDisplay = Object.keys(normalizedData).length > 0
        ? normalizedData 
        : originalExtractedData;

      console.log('🔄 RENOVACIONES - Usando función de mapeo unificada');
      
      const displayData = mapBackendDataToFrontend(
        mappedData, 
        dataForDisplay || {}
      );

      console.log('✅ RENOVACIONES - Datos mapeados:', {
        polizaNumber: displayData.polizaNumber,
        vehiculoPatente: displayData.vehiculoPatente,
        vehiculoAno: displayData.vehiculoAno,
        vehiculoMarca: displayData.vehiculoMarca
      });

      // ✅ USAR EL MISMO MÉTODO QUE CAMBIOS DESPUÉS DEL FIX
      const combinedExtractedData = {
        ...dataForDisplay,
        ...displayData
      };

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
          extractedData: combinedExtractedData, // ✅ USAR DATOS UNIFICADOS
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