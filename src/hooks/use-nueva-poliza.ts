"use client"

import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { getAuthToken, getAuthHeadersForFormData, getAuthHeaders, handle401Error } from '@/utils/auth-utils';

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
  extractedData: ExtractedData;  
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

  const updateState = useCallback((updates: Partial<NuevaPolizaState> | ((prev: NuevaPolizaState) => Partial<NuevaPolizaState>)) => {
    setState(prev => {
      const newUpdates = typeof updates === 'function' ? updates(prev) : updates;
      const newState = { ...prev, ...newUpdates };

      return newState;
    });
  }, []);

  const isContextValid = useCallback(() => {
    const valid = !!(state.context.clienteId && state.context.companiaId && state.context.seccionId);
    return valid;
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
    
    return hasRequiredContext && hasExtractedData && hasRequiredPolicyData;
  }, [state]);

  const mapBackendDataToFrontend = (backendData: any, rawData?: any) => {
    if (!rawData || Object.keys(rawData).length === 0) {
      return {};
    }

    const cleanText = (str: string) => {
      if (!str) return "";
      return str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
    };

const extractNumber = (str: string) => {
  if (!str) return "";
  
  const cleanStr = cleanText(str);

  const match = cleanStr.match(/\$?\s*([\d.,]+)/);
  if (!match) return "";
  
  let cleanNumber = match[1];

  if (cleanNumber.includes(',') && cleanNumber.includes('.')) {
    const comaIndex = cleanNumber.lastIndexOf(',');
    const puntoIndex = cleanNumber.lastIndexOf('.');
    
    if (puntoIndex > comaIndex) {
      cleanNumber = cleanNumber.replace(/,/g, '');
    } else {
      cleanNumber = cleanNumber.replace(/\./g, '').replace(',', '.');
    }
  } 
  else if (cleanNumber.includes(',') && !cleanNumber.includes('.')) {
    const parts = cleanNumber.split(',');
    if (parts[0].length > 3 || parts[1].length !== 2) {
      cleanNumber = cleanNumber.replace(',', '');
    } else {
      cleanNumber = cleanNumber.replace(',', '.');
    }
  }
  
  const number = parseFloat(cleanNumber);
  if (isNaN(number)) return "";

  return new Intl.NumberFormat('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
};

const extractPrimeraCuota = (data: any) => {
  if (!data) return "";

  const cuotaFields = [
    "pago.cuota_monto[1]",      
    "pago.cuotas[0].prima",   
    "pago.prima_cuota[1]",      
    "pago.primera_cuota",   
  ];

  for (const field of cuotaFields) {
    if (data[field]) {
      const valor = extractNumber(data[field]);
      return valor;
    }
  }
  
  return "";
};

const extractDate = (dateStr: string) => {
  if (!dateStr) return "";
  
  const cleanDateStr = cleanText(dateStr);
  const patterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,    
    /(\d{1,2})-(\d{1,2})-(\d{4})/,    
    /(\d{4})-(\d{1,2})-(\d{1,2})/,     
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/    
  ];

  for (const pattern of patterns) {
    const match = cleanDateStr.match(pattern);
    if (match) {
      let [, first, second, third] = match;
      if (pattern.toString().includes('\\d{4}')) {
        const formattedDate = `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
        return formattedDate;
      } 
      else {
        const formattedDate = `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
        return formattedDate;
      }
    }
  }

  return "";
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

    const extractPolizaNumber = (str: string) => {
      if (!str) return "";
      const cleanStr = cleanText(str);
      
      const patterns = [
        /0040\d+(?:-\d+)?/,      
        /\d{7,12}(?:-\d+)?/,    
        /AP\d{7,}/,              
        /\d{4,}-\d{1,}/        
      ];
      
      for (const pattern of patterns) {
        const match = cleanStr.match(pattern);
        if (match) {
          return match[0];
        }
      }
      
      return cleanStr.replace(/^Póliza\s+(nro\.?\s*|Número:\s*)?/i, '');
    };

    const countCuotas = (data: any) => {
      if (!data) return "";
      const cuotasCount = Object.keys(data)
        .filter(key => 
          key.startsWith("pago.vencimiento_cuota[") ||    
          key.startsWith("pago.cuotas[") ||               
          key.startsWith("pago.numero_cuota[")            
        )
        .length;

      return cuotasCount > 0 ? cuotasCount.toString() : "";
    };

    const findFieldValue = (possibleFields: string[]) => {
      for (const field of possibleFields) {
        if (rawData[field]) {
          return rawData[field];
        }
      }
      return null;
    };

    return {
      polizaNumber: extractPolizaNumber(
        findFieldValue([
          "poliza.numero",          
          "poliza.numero_poliza",   
          "poliza_numero"          
        ]) || ""
      ) || backendData.numeroPoliza || "",
      
 vigenciaDesde: (() => {
    if (backendData.fechaDesde && backendData.fechaDesde !== "2025-09-17") {
      return backendData.fechaDesde;
    }

    return extractDate(findFieldValue([
      "poliza.vigencia.desde",  
      "poliza.fecha-desde",        
      "poliza.fecha_desde",      
    ]) || "") || "";
  })(),
  
  vigenciaHasta: (() => {
    if (backendData.fechaHasta && backendData.fechaHasta !== "2025-09-17") {
      return backendData.fechaHasta;
    }

    return extractDate(findFieldValue([
      "poliza.vigencia.hasta",    
      "poliza.fecha-hasta",       
      "poliza.fecha_hasta",      
    ]) || "") || "";
  })(),

      fechaEmision: extractDate(findFieldValue([
        "poliza.fecha_emision",     
        "poliza.fecha_emision",    
        "poliza.fecha_emision"      
      ]) || "") || "",

      prima: backendData.premio?.toString() || 
             extractNumber(findFieldValue([
               "poliza.prima_comercial",    
               "costo.costo",              
               "premio.premio"          
             ]) || "") || "",
      
      premioTotal: backendData.premioTotal?.toString() || 
                   extractNumber(findFieldValue([
                     "financiero.premio_total",  
                     "costo.premio_total",       
                     "premio.total"          
                   ]) || "") || "",

      iva: extractNumber(findFieldValue([
        "costo.iva",               
        "poliza.iva",   
        "premio.iva"        
      ]) || "") || "",

      cantidadCuotas: backendData.cantidadCuotas?.toString() || 
                      countCuotas(rawData) || "",
      
  valorPorCuota: (() => {
    const valorEspecifico = extractPrimeraCuota(rawData);
    if (valorEspecifico) return valorEspecifico;

    if (backendData.valorCuota) return backendData.valorCuota.toString();

    const cuotas = parseInt(rawData.cantidadCuotas || backendData.cantidadCuotas?.toString() || "1");
    if (cuotas === 1) {
      const total = extractNumber(findFieldValue([
        "financiero.premio_total",   
        "premio.total"             
      ]) || "");
      if (total) return total;
    }

    if (backendData.montoTotal && backendData.cantidadCuotas && backendData.cantidadCuotas > 0) {
      const valorCalculado = backendData.montoTotal / backendData.cantidadCuotas;
      return new Intl.NumberFormat('es-UY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valorCalculado);
    }

    return "";
  })(),

      formaPago: backendData.formaPago || 
                 cleanText(findFieldValue([
                   "pago.forma_pago",      
                   "modo_de_pago",            
                   "pago.medio"             
                 ]) || "") || "",

      vehiculoMarca: (() => {
        const conSalto = findFieldValue(["vehiculo.marca"]) || "";
        if (conSalto) {
          const cleaned = cleanVehicleField(conSalto);
          if (cleaned) return cleaned;
        }
        
        const sinSalto = findFieldValue(["vehiculoMarca", "vehiculo_marca"]) || "";
        if (sinSalto) {
          const cleaned = cleanVehicleField(sinSalto);
          if (cleaned) return cleaned;
        }

        if (backendData.vehiculoMarca) {
          return cleanVehicleField(backendData.vehiculoMarca);
        }
        
        return "";
      })(),

      vehiculoModelo: (() => {
        const conSalto = findFieldValue(["vehiculo.modelo"]) || "";
        if (conSalto) {
          const cleaned = cleanVehicleField(conSalto);
          if (cleaned) return cleaned;
        }
        
        const sinSalto = findFieldValue(["vehiculoModelo", "vehiculo_modelo"]) || "";
        if (sinSalto) {
          const cleaned = cleanVehicleField(sinSalto);
          if (cleaned) return cleaned;
        }

        if (backendData.vehiculoModelo) {
          return cleanVehicleField(backendData.vehiculoModelo);
        }
        
        return "";
      })(),

      vehiculoAno: (() => {
        if (backendData.vehiculoAño?.toString()) return backendData.vehiculoAño.toString();
        const conSalto = findFieldValue(["vehiculo.anio"]) || "";
        if (conSalto) return cleanVehicleField(conSalto);

        const sinSalto = findFieldValue(["vehiculoAno", "vehiculo_anio"]) || "";
        return cleanVehicleField(sinSalto);
      })(),

      vehiculoChasis: (() => {
        if (backendData.vehiculoChasis) return backendData.vehiculoChasis;
        const conSalto = findFieldValue(["vehiculo.chasis"]) || "";
        if (conSalto) return cleanVehicleField(conSalto);
        const sinSalto = findFieldValue(["vehiculoChasis", "vehiculo_chasis"]) || "";
        return cleanVehicleField(sinSalto);
      })(),

      vehiculoMotor: (() => {
        if (backendData.vehiculoMotor) return backendData.vehiculoMotor;
        const conSalto = findFieldValue(["vehiculo.motor"]) || "";
        if (conSalto) return cleanVehicleField(conSalto);
        const sinSalto = findFieldValue(["vehiculoMotor", "vehiculo_motor"]) || "";
        return cleanVehicleField(sinSalto);
      })(),

      vehiculoPatente: (() => {
        if (backendData.vehiculoPatente) return backendData.vehiculoPatente;

        const conSalto = findFieldValue(["vehiculo.matricula"]) || "";
        if (conSalto) return cleanPatenteField(conSalto);

        const sinSalto = findFieldValue(["vehiculoPatente", "vehiculo_matricula", "matricula", "patente"]) || "";
        return cleanPatenteField(sinSalto);
      })(),

      aseguradoNombre: backendData.aseguradoNombre || 
                       cleanText(findFieldValue([
                         "asegurado.nombre"      
                       ]) || "") || "",
      
      aseguradoDocumento: backendData.aseguradoDocumento || 
                          cleanText(findFieldValue([
                            "conductor.cedula",     
                            "asegurado.documento",  
                            "asegurado.ci"         
                          ]) || "") || "",
      
      aseguradoTelefono: cleanText(findFieldValue([
        "asegurado.telefono"         
      ]) || "") || "",
      
      aseguradoDireccion: cleanText(findFieldValue([
        "asegurado.direccion"        
      ]) || "") || "",
      
      aseguradoDepartamento: cleanText(findFieldValue([
        "asegurado.departamento"      
      ]) || "") || "",

      modalidad: cleanText(findFieldValue([
        "poliza.modalidad"        
      ]) || "") || "",
      
      tipoMovimiento: cleanText(findFieldValue([
        "poliza.tipo_de_movimiento",
        "poliza.tipo_movimiento"      
      ]) || "") || "",
      
      moneda: cleanText(findFieldValue([
        "poliza.moneda"          
      ]) || "") || "",

      tipoUso: cleanText(findFieldValue([
        "vehiculo.tipo_de_uso" 
      ]) || "") || "",
    };
  };

  const calculateCompletionPercentage = (polizaMapping: any) => {
    if (polizaMapping.metrics?.completionPercentage) {
      return polizaMapping.metrics.completionPercentage;
    }
    
    const mappedData = polizaMapping.mappedData || {};
    const requiredFields = ['NumeroPoliza', 'FechaDesde', 'FechaHasta', 'Premio'];
    const completedFields = requiredFields.filter(field => 
      mappedData[field] && mappedData[field] !== '' && mappedData[field] !== 0
    );
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const mapFieldIssues = (backendIssues: any[]) => {
    return backendIssues.map(issue => ({
      fieldName: mapBackendFieldToFrontend(issue.fieldName),
      reason: issue.description || issue.issueType || 'Requiere verificación',
      severity: issue.severity?.toLowerCase() || 'warning'
    }));
  };

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

const uploadWithContext = useCallback(async (file: File): Promise<boolean> => {
    if (!isContextValid()) {
      toast.error('Contexto incompleto. Selecciona cliente, compañía y sección.');
      return false;
    }

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
        status: 'uploading' as const,
        extractedData: {},
        mappedData: {},
        completionPercentage: 0,
        requiresAttention: [],
        errorMessage: undefined,
      },
      isLoading: true,
    });

    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('clienteId', state.context.clienteId?.toString() || '');
      formData.append('companiaId', state.context.companiaId?.toString() || '');
      formData.append('seccionId', state.context.seccionId?.toString() || '');
      formData.append('notes', '');

      updateState({
        file: {
          selected: file,
          uploaded: false,
          scanId: null,
          uploadProgress: 50,
        },
        scan: {
          status: 'scanning' as const,
          extractedData: {},
          mappedData: {},
          completionPercentage: 0,
          requiresAttention: [],
          errorMessage: undefined,
        },
        isLoading: true,
      });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      const response = await fetch(`${API_URL}/api/Document/upload-with-context`, {
        method: 'POST',
        headers: getAuthHeadersForFormData(),
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
      const dataForDisplay = Object.keys(normalizedData).length > 0 ? normalizedData : originalExtractedData;
     
      const displayData = mapBackendDataToFrontend(
        polizaMapping.mappedData || {}, 
        dataForDisplay
      );
      
      const combinedExtractedData = {
        ...dataForDisplay,   
        ...displayData    
      };
      
      updateState({
        file: {
          selected: file,
          uploaded: true,
          scanId: scanResult.scanId || scanResult.id || null,
          uploadProgress: 100,
        },
        scan: {
          status: 'completed' as const,
          extractedData: combinedExtractedData,
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

      updateState({
        file: {
          selected: file,
          uploaded: false,
          scanId: null,
          uploadProgress: 0,
        },
        scan: {
          status: 'error' as const,
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

  const removeSelectedFile = useCallback(() => {
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
        errorMessage: undefined,
      }
    });

    toast.success('Archivo removido. Puedes cargar otro documento.');
  }, [updateState]);

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
      const createRequest = {
        scanId: state.file.scanId,
        clienteId: state.context.clienteId,
        companiaId: state.context.companiaId,
        seccionId: state.context.seccionId,
        
        fuelCodeOverride: state.masterData.combustibleId || "",
        tariffIdOverride: parseInt(state.masterData.tarifaId) || 0,
        departmentIdOverride: parseInt(state.masterData.departamentoId) || 0,
        destinationIdOverride: parseInt(state.masterData.destinoId) || 0,
        categoryIdOverride: parseInt(state.masterData.categoriaId) || 0,
        qualityIdOverride: parseInt(state.masterData.calidadId) || 0,
        brokerIdOverride: parseInt(state.masterData.corredorId) || 0,
        
        policyNumber: state.scan.extractedData?.polizaNumber || "",
        startDate: state.scan.extractedData?.vigenciaDesde || "",
        endDate: state.scan.extractedData?.vigenciaHasta || "",
        premium: parseFloat(state.scan.extractedData?.prima || "0"),
        
        vehicleBrand: state.scan.extractedData?.vehiculoMarca || "",
        vehicleModel: state.scan.extractedData?.vehiculoModelo || "",
        vehicleYear: parseInt(state.scan.extractedData?.vehiculoAno || "0"),
        motorNumber: state.scan.extractedData?.vehiculoMotor || "",
        chassisNumber: state.scan.extractedData?.vehiculoChasis || "",
        
        paymentMethod: state.masterData.medioPagoId || "",
        installmentCount: state.masterData.cantidadCuotas || 1,
        
        notes: state.masterData.observaciones || "",
        correctedFields: []
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      const response = await fetch(`${API_URL}/api/Document/${state.file.scanId}/create-in-velneo`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(createRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          handle401Error();
          return false;
        }
        
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

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
        return true;
      } else {
        throw new Error(result.message || 'Error creando póliza en Velneo');
      }

    } catch (error: any) {
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
  }, [state, canProceedToStep3, updateState]);

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

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      const response = await fetch(`${API_URL}/api/Document/${state.file.scanId}/reprocess`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ forceReprocess: true }),
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
  }, [state.file.scanId, state.scan, updateState, mapBackendDataToFrontend, mapFieldIssues]);

  const updateStep3Status = (status: 'idle' | 'creating' | 'completed' | 'error', message?: string, additionalData?: any) => {
    setState(prev => ({
      ...prev,
      step3: {
        ...prev.step3,
        status,
        errorMessage: status === 'error' ? message : undefined,
        successMessage: status === 'completed' ? message : undefined,
        velneoPolizaId: additionalData?.velneoPolizaId || prev.step3.velneoPolizaId,
        polizaNumber: additionalData?.polizaNumber || prev.step3.polizaNumber,
        createdAt: additionalData?.createdAt || prev.step3.createdAt
      },
      isLoading: status === 'creating'
    }));
  };

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

  const updateContext = useCallback((contextUpdates: Partial<ContextData>) => {
    const newContext = { ...state.context, ...contextUpdates };
    
    updateState({
      context: newContext
    });

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

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(initialState);
    toast.success('Proceso reiniciado');
  }, []);

  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    updateState({ isLoading: false });
    toast('Operación cancelada', { icon: '⏹️' });
  }, [updateState]);

  return {
      state,
      isContextValid,
      canProceedToStep2,
      canProceedToStep3,
      removeSelectedFile,
      nextStep,
      prevStep,
      reset,
      cancelOperation,
      updateStep3Status,
      updateContext,        
      uploadWithContext,
      updateState         
    };
  }