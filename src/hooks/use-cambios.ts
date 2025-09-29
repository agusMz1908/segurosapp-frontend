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

const cleanText = (str: string) => {
  if (!str) return "";
  return str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
};

const cleanVehicleField = (str: string) => {
  if (!str) return "";
  
  let cleaned = str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
  
  const prefixes = [
    'MARCA\n', 'MODELO\n', 'MOTOR\n', 'CHASIS\n', 'AÑO\n',
    'MARCA ', 'MODELO ', 'MOTOR ', 'CHASIS ', 'AÑO ',
    'Marca\n', 'Modelo\n', 'Motor\n', 'Chasis\n', 'Año\n',
    'Marca ', 'Modelo ', 'Motor ', 'Chasis ', 'Año ',
    'Color\n', 'Color ', 'Tipo\n', 'Tipo ',
    'Riesgo nro.\n', 'Riesgo nro. ',
    'Tipo de uso\n', 'Tipo de uso '
  ];
  
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
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
    'MATRÍCULA: ', 'MATRÍCULA. ', 'MATRÍCULA ',
    'PATENTE: ', 'PATENTE. ', 'PATENTE ',
    'Matrícula: ', 'Matrícula. ', 'Matrícula ',
    'Patente: ', 'Patente. ', 'Patente '
  ];
  
  for (const prefix of patentesPrefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length).trim();
      break;
    }
  }
  
  return cleaned;
};

const mapBackendDataToFrontend = (backendData: any, extractedData: any) => {
  const findFieldValue = (keys: string[]) => {
    for (const key of keys) {
      if (extractedData[key] && extractedData[key].toString().trim()) {
        return extractedData[key];
      }
    }
    return null;
  };

  const result = {
    vehiculoMarca: (() => {
      const conSalto = findFieldValue(["vehiculo.marca"]) || "";
      if (conSalto) {
        const cleaned = cleanVehicleField(conSalto.toString());
        if (cleaned) return cleaned;
      }
      
      const sinSalto = findFieldValue(["vehiculoMarca", "vehiculo_marca"]) || "";
      if (sinSalto) {
        const cleaned = cleanVehicleField(sinSalto.toString());
        if (cleaned) return cleaned;
      }
      
      if (backendData.vehiculoMarca) {
        return cleanVehicleField(backendData.vehiculoMarca.toString());
      }
      
      return "";
    })(),

    vehiculoModelo: (() => {
      const conSalto = findFieldValue(["vehiculo.modelo"]) || "";
      if (conSalto) {
        const cleaned = cleanVehicleField(conSalto.toString());
        if (cleaned) return cleaned;
      }
      
      const sinSalto = findFieldValue(["vehiculoModelo", "vehiculo_modelo"]) || "";
      if (sinSalto) {
        const cleaned = cleanVehicleField(sinSalto.toString());
        if (cleaned) return cleaned;
      }
      
      if (backendData.vehiculoModelo) {
        return cleanVehicleField(backendData.vehiculoModelo.toString());
      }
      
      return "";
    })(),

    vehiculoAno: (() => {
      if (backendData.vehiculoAño?.toString()) return backendData.vehiculoAño.toString();
      
      const conSalto = findFieldValue(["vehiculo.anio"]) || "";
      if (conSalto) return cleanVehicleField(conSalto.toString());
      
      const sinSalto = findFieldValue(["vehiculoAno", "vehiculo_anio"]) || "";
      return cleanVehicleField(sinSalto.toString());
    })(),

    vehiculoChasis: (() => {
      if (backendData.vehiculoChasis) return backendData.vehiculoChasis;
      
      const conSalto = findFieldValue(["vehiculo.chasis"]) || "";
      if (conSalto) return cleanVehicleField(conSalto.toString());
      
      const sinSalto = findFieldValue(["vehiculoChasis", "vehiculo_chasis"]) || "";
      return cleanVehicleField(sinSalto.toString());
    })(),

    vehiculoMotor: (() => {
      if (backendData.vehiculoMotor) return backendData.vehiculoMotor;
      
      const conSalto = findFieldValue(["vehiculo.motor"]) || "";
      if (conSalto) return cleanVehicleField(conSalto.toString());
      
      const sinSalto = findFieldValue(["vehiculoMotor", "vehiculo_motor"]) || "";
      return cleanVehicleField(sinSalto.toString());
    })(),

    vehiculoPatente: (() => {
      if (backendData.vehiculoPatente) return backendData.vehiculoPatente;
      
      const conSalto = findFieldValue(["vehiculo.matricula"]) || "";
      if (conSalto) return cleanPatenteField(conSalto.toString());
      
      const sinSalto = findFieldValue(["vehiculoPatente", "vehiculo_matricula", "matricula", "patente"]) || "";
      return cleanPatenteField(sinSalto.toString());
    })(),

    aseguradoNombre: backendData.aseguradoNombre || 
                     cleanText(findFieldValue(["asegurado.nombre"]) || "") || "",
    
    aseguradoDocumento: backendData.aseguradoDocumento || 
                        cleanText(findFieldValue(["conductor.cedula", "asegurado.documento", "asegurado.ci"]) || "") || "",
    
    aseguradoTelefono: cleanText(findFieldValue(["asegurado.telefono"]) || "") || "",
    
    aseguradoDireccion: cleanText(findFieldValue(["asegurado.direccion"]) || "") || "",
    
    aseguradoDepartamento: cleanText(findFieldValue(["asegurado.departamento"]) || "") || "",

    polizaNumero: backendData.polizaNumero || 
                  cleanText(findFieldValue(["poliza.numero", "numero_poliza"]) || "") || "",
    
    polizaVigenciaDesde: backendData.polizaVigenciaDesde || 
                         cleanText(findFieldValue(["poliza.vigencia_desde", "fecha_desde"]) || "") || "",
    
    polizaVigenciaHasta: backendData.polizaVigenciaHasta || 
                         cleanText(findFieldValue(["poliza.vigencia_hasta", "fecha_hasta"]) || "") || "",
    
    polizaPremio: backendData.polizaPremio || 
                  cleanText(findFieldValue(["poliza.premio", "premio_total"]) || "") || "",

    modalidad: cleanText(findFieldValue(["poliza.modalidad"]) || "") || "",
    tipoMovimiento: cleanText(findFieldValue(["poliza.tipo_movimiento"]) || "") || ""
  };

  console.log('✅ CAMBIOS - mapBackendDataToFrontend resultado:', result);
  return result;
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
      const polizasVigentes = polizasList.filter((poliza: any) => {
        if (poliza.seccod !== 4) {
          return false;
        }

        let diasHastaVencimiento = 0;
        try {
          const fechaVencimiento = new Date(poliza.confchhas);
          diasHastaVencimiento = Math.ceil((fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        } catch (error) {
          console.error(`Error parseando fecha para póliza ${poliza.conpol}:`, error);
          return false;
        }
        
        const esVigenteParaCambios = diasHastaVencimiento >= -30;       
        return esVigenteParaCambios;
      });

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
    setState(prevState => {
      const clienteInfoCompleta = prevState.context.clienteInfo || {
        id: prevState.cliente.selectedId!,
        nombre: `Cliente ${prevState.cliente.selectedId}`,
        documento: 'No especificado',
        activo: true
      };

      return {
        ...prevState,
        cliente: {
          ...prevState.cliente,
          selectedPoliza: poliza
        },
        context: {
          ...prevState.context,
          polizaOriginalId: poliza.id || poliza.Id,
          companiaId: poliza.comcod || poliza.companiaId,
          seccionId: poliza.seccod,
          clienteInfo: clienteInfoCompleta, 
          companiaInfo: {                      
            id: poliza.comcod || poliza.companiaId || 1,
            nombre: poliza.compania_nombre || poliza.comnom || 'Compañía no especificada',
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
      };
    });

    toast.success(`Póliza ${poliza.conpol} seleccionada para cambio`);
  }, []);

  const uploadDocumentForChange = useCallback(async (file: File): Promise<boolean> => {
    if (!state.context.clienteId || !state.context.seccionId || !state.context.companiaId) {
      toast.error('Contexto incompleto. Selecciona cliente y póliza correctamente.');
      return false;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

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

      const formData = new FormData();
      formData.append('file', file);
      formData.append('clienteId', state.context.clienteId.toString());
      formData.append('companiaId', state.context.companiaId.toString());
      formData.append('seccionId', state.context.seccionId.toString());
      formData.append('notes', 'Cambio de póliza');

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

      const dataForDisplay = Object.keys(normalizedData).length > 0
        ? normalizedData 
        : originalExtractedData;

      const displayData = mapBackendDataToFrontend(
        mappedData, 
        dataForDisplay || {}
      );

      if (displayData.vehiculoMarca) {
        console.log('🚗 CAMBIOS - Marca limpiada:', {
          antes: dataForDisplay['vehiculo.marca'],
          después: displayData.vehiculoMarca
        });
      }

      if (displayData.vehiculoModelo) {
        console.log('🚗 CAMBIOS - Modelo limpiado:', {
          antes: dataForDisplay['vehiculo.modelo'], 
          después: displayData.vehiculoModelo
        });
      }

      const combinedExtractedData = {
        ...dataForDisplay,
        ...displayData
      };

      let companiaDetectada = state.context.companiaInfo;
      let companiaIdDetectada = state.context.companiaId;

      if (result.preSelection?.compania && result.preSelection.compania.id) {
        companiaIdDetectada = result.preSelection.compania.id;
        companiaDetectada = {
          id: result.preSelection.compania.id,
          nombre: result.preSelection.compania.displayName || result.preSelection.compania.comnom || 'Detectada',
          codigo: result.preSelection.compania.shortCode || result.preSelection.compania.comalias || 'DET'
        };
      }

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
          extractedData: combinedExtractedData, 
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

  const setClienteData = useCallback((cliente: any) => {
    setState(prev => ({
      ...prev,
      context: {
        ...prev.context,
        clienteId: cliente.id,
        clienteInfo: {
          id: cliente.id,
          nombre: cliente.nombre || cliente.displayName || `Cliente ${cliente.id}`,
          documento: cliente.documento || 'No especificado',
          documentType: cliente.documentType,
          email: cliente.email,
          telefono: cliente.telefono,
          direccion: cliente.direccion,
          activo: cliente.activo !== undefined ? cliente.activo : true, 
          displayName: cliente.displayName,
          contactInfo: cliente.contactInfo
        }
      }
    }));
  }, []);

  const updateExtractedData = useCallback((updates: any) => {
    setState(prev => ({
      ...prev,
      scan: {
        ...prev.scan,
        extractedData: { ...prev.scan.extractedData, ...updates }
      }
    }));
  }, []);

  const updateMasterData = useCallback((updates: any) => {
    setState(prev => ({
      ...prev,
      masterData: { ...prev.masterData, ...updates }
    }));
  }, []);

  const markProcessCompleted = useCallback((result: any) => {
    setState(prev => ({
      ...prev,
      processCompleted: true,
      processResult: result
    }));
  }, []);

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