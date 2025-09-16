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
    console.log('🔧 updateState recibido:', updates);
    
    setState(prev => {
      console.log('🔧 setState - prevState:', prev);
      
      const newUpdates = typeof updates === 'function' ? updates(prev) : updates;
      const newState = { ...prev, ...newUpdates };
      
      console.log('🔧 setState - newState:', newState);
      return newState;
    });
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
    
    return hasRequiredContext && hasExtractedData && hasRequiredPolicyData;
  }, [state]);

  // Función de mapeo universal (sin referencias específicas a compañías)
  const mapBackendDataToFrontend = (backendData: any, rawData?: any) => {
    console.log('🔍 MAPEO UNIVERSAL - backendData:', backendData);
    console.log('🔍 MAPEO UNIVERSAL - rawData:', rawData);

    if (!rawData || Object.keys(rawData).length === 0) {
      console.log('❌ rawData vacío o undefined');
      return {};
    }

    const cleanText = (str: string) => {
      if (!str) return "";
      return str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
    };

    const extractNumber = (str: string) => {
      if (!str) return "";
      
      const cleanStr = cleanText(str);
      console.log('🔍 Extrayendo número de:', cleanStr);
      
      const match = cleanStr.match(/\$?\s*([\d.,]+)/);
      if (!match) return "";
      
      let cleanNumber = match[1];

      if (cleanNumber.includes('.') && cleanNumber.includes(',')) {
        cleanNumber = cleanNumber.replace(/\./g, '').replace(',', '.');
      } else if (cleanNumber.includes(',')) {
        cleanNumber = cleanNumber.replace(',', '.');
      }
      
      const number = parseFloat(cleanNumber);
      if (isNaN(number)) return "";

      return new Intl.NumberFormat('es-UY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(number);
    };

    const extractDate = (dateStr: string) => {
      if (!dateStr) return "";
      
      const cleanDateStr = cleanText(dateStr);
      console.log('🔍 Extrayendo fecha de:', cleanDateStr);

      const match = cleanDateStr.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
      if (match) {
        const [, day, month, year] = match;
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        console.log('✅ Fecha extraída:', formattedDate);
        return formattedDate;
      }
      
      console.log('❌ No se pudo extraer fecha de:', cleanDateStr);
      return "";
    };

const cleanVehicleField = (str: string) => {
  if (!str) return "";
  
  const cleaned = str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
  
  // Prefijos más completos para MAPFRE y otras compañías
  const prefixes = [
    'Marca\n', 'Marca ', 'MARCA\n', 'MARCA ',
    'Modelo\n', 'Modelo ', 'MODELO\n', 'MODELO ',
    'Chasis\n', 'Chasis ', 'CHASIS\n', 'CHASIS ',
    'Motor\n', 'Motor ', 'MOTOR\n', 'MOTOR ',
    'Año\n', 'Año ', 'AÑO\n', 'AÑO ',
    'Color\n', 'Color ', 'COLOR\n', 'COLOR ',
    'Tipo\n', 'Tipo ', 'TIPO\n', 'TIPO ',
    'Riesgo nro.\n', 'Riesgo nro. ', 'RIESGO NRO.\n', 'RIESGO NRO. ',
    'Tipo de uso\n', 'Tipo de uso ', 'TIPO DE USO\n', 'TIPO DE USO '
  ];
  
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      return cleaned.substring(prefix.length).trim();
    }
  }
  
  return cleaned;
};

    const cleanPatenteField = (str: string) => {
      if (!str) return "";
      
      const cleaned = str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
      
      if (cleaned.startsWith('Patente ')) {
        return cleaned.substring('Patente '.length).trim();
      }
      
      return cleaned;
    };

    const extractPolizaNumber = (str: string) => {
      if (!str) return "";
      const cleanStr = cleanText(str);
      
      // Buscar patrones comunes de número de póliza
      const patterns = [
        /0040\d+(?:-\d+)?/,           // MAPFRE format
        /\d{7,12}(?:-\d+)?/,         // BSE format  
        /AP\d{7,}/,                  // SURA format
        /\d{4,}-\d{1,}/              // General format
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
      
      // Buscar diferentes formatos de cuotas según la compañía
      const cuotasCount = Object.keys(data)
        .filter(key => 
          key.startsWith("pago.vencimiento_cuota[") ||      // MAPFRE
          key.startsWith("pago.cuotas[") ||                 // BSE
          key.startsWith("pago.numero_cuota[")              // SURA
        )
        .length;
      
      console.log('🔍 Cuotas encontradas:', cuotasCount);
      return cuotasCount > 0 ? cuotasCount.toString() : "";
    };

    // Función para buscar un campo en múltiples ubicaciones posibles
    const findFieldValue = (possibleFields: string[]) => {
      for (const field of possibleFields) {
        if (rawData[field]) {
          return rawData[field];
        }
      }
      return null;
    };

    return {
      // Número de póliza - buscar en diferentes formatos
      polizaNumber: extractPolizaNumber(
        findFieldValue([
          "poliza.numero",           // BSE
          "poliza.numero_poliza",    // BSE alt
          "poliza_numero"            // Generic
        ]) || ""
      ) || backendData.numeroPoliza || "",
      
      // Fechas - priorizar backend (ya normalizado), fallback a rawData
      vigenciaDesde: backendData.fechaDesde || 
                     extractDate(findFieldValue([
                       "poliza.fecha_desde",        // MAPFRE
                       "poliza.vigencia.desde",     // BSE
                       "poliza.fecha-desde"         // SURA
                     ]) || "") || "",
      
      vigenciaHasta: backendData.fechaHasta || 
                     extractDate(findFieldValue([
                       "poliza.fecha_hasta",        // MAPFRE
                       "poliza.vigencia.hasta",     // BSE  
                       "poliza.fecha-hasta"         // SURA
                     ]) || "") || "",

      fechaEmision: extractDate(findFieldValue([
        "poliza.fecha_emision",      // MAPFRE
        "poliza.fecha_emision",      // BSE
        "poliza.fecha_emision"       // Generic
      ]) || "") || "",

      // Montos - priorizar backend, fallback a campos específicos
      prima: backendData.premio?.toString() || 
             extractNumber(findFieldValue([
               "poliza.prima_comercial",    // BSE
               "costo.costo",               // MAPFRE cost
               "premio.premio"              // SURA
             ]) || "") || "",
      
      premioTotal: backendData.premioTotal?.toString() || 
                   extractNumber(findFieldValue([
                     "financiero.premio_total",   // BSE
                     "costo.premio_total",        // MAPFRE
                     "premio.total"               // SURA
                   ]) || "") || "",

      iva: extractNumber(findFieldValue([
        "costo.iva",                 // MAPFRE
        "poliza.iva",                // BSE
        "premio.iva"                 // SURA
      ]) || "") || "",

      // Cuotas - usar lógica inteligente
      cantidadCuotas: backendData.cantidadCuotas?.toString() || 
                      countCuotas(rawData) || "",
      
      valorPorCuota: backendData.valorPorCuota?.toString() || 
                     extractNumber(findFieldValue([
                       "pago.cuotas[0].prima",      // BSE
                       "pago.cuota_monto[1]",       // MAPFRE
                       "pago.prima_cuota[1]"        // SURA
                     ]) || "") || "",

      formaPago: backendData.formaPago || 
                 cleanText(findFieldValue([
                   "pago.forma_pago",           // SURA
                   "modo_de_pago",              // MAPFRE
                   "pago.medio"                 // BSE
                 ]) || "") || "",

      // Vehículo
      vehiculoMarca: backendData.vehiculoMarca || 
                     cleanVehicleField(findFieldValue([
                       "vehiculo.marca"           // Universal
                     ]) || "") || "",
      
      vehiculoModelo: backendData.vehiculoModelo || 
                      cleanVehicleField(findFieldValue([
                        "vehiculo.modelo"         // Universal
                      ]) || "") || "",
      
      vehiculoAno: backendData.vehiculoAño?.toString() || 
                   cleanVehicleField(findFieldValue([
                     "vehiculo.anio",           // BSE/MAPFRE
                     "vehiculo.año"             // BSE alt
                   ]) || "") || "",
      
      vehiculoChasis: backendData.vehiculoChasis || 
                      cleanVehicleField(findFieldValue([
                        "vehiculo.chasis"         // Universal
                      ]) || "") || "",
      
      vehiculoMotor: backendData.vehiculoMotor || 
                     cleanVehicleField(findFieldValue([
                       "vehiculo.motor"           // Universal
                     ]) || "") || "",

      vehiculoColor: cleanVehicleField(findFieldValue([
        "vehiculo.color"              // Universal
      ]) || "") || "",
      
      vehiculoTipo: cleanVehicleField(findFieldValue([
        "vehiculo.tipo",              // MAPFRE
        "vehiculo.tipo_vehiculo"      // BSE
      ]) || "") || "",

      // Patente/Matrícula
      vehiculoPatente: backendData.vehiculoMatricula || 
                       cleanPatenteField(findFieldValue([
                         "vehiculo.matricula",    // MAPFRE/SURA
                         "vehiculo.patente"       // BSE
                       ]) || "") || "",

      // Asegurado
      aseguradoNombre: backendData.aseguradoNombre || 
                       cleanText(findFieldValue([
                         "asegurado.nombre"       // Universal
                       ]) || "") || "",
      
      aseguradoDocumento: backendData.aseguradoDocumento || 
                          cleanText(findFieldValue([
                            "conductor.cedula",     // MAPFRE
                            "asegurado.documento",  // BSE
                            "asegurado.ci"          // Generic
                          ]) || "") || "",
      
      aseguradoTelefono: cleanText(findFieldValue([
        "asegurado.telefono"          // Universal
      ]) || "") || "",
      
      aseguradoDireccion: cleanText(findFieldValue([
        "asegurado.direccion"         // Universal
      ]) || "") || "",
      
      aseguradoDepartamento: cleanText(findFieldValue([
        "asegurado.departamento"      // Universal
      ]) || "") || "",

      // Campos adicionales
      modalidad: cleanText(findFieldValue([
        "poliza.modalidad"            // Universal
      ]) || "") || "",
      
      tipoMovimiento: cleanText(findFieldValue([
        "poliza.tipo_de_movimiento",  // MAPFRE
        "poliza.tipo_movimiento"      // BSE
      ]) || "") || "",
      
      moneda: cleanText(findFieldValue([
        "poliza.moneda"               // Universal
      ]) || "") || "",

      tipoUso: cleanText(findFieldValue([
        "vehiculo.tipo_de_uso"        // Universal
      ]) || "") || "",
    };
  };

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
      
      console.log('🔍 === DEBUG UNIVERSAL - RESULTADO COMPLETO ===');
      console.log('🔍 result completo:', result);
      
      const scanResult = result.scanResult || {};
      const polizaMapping = result.polizaMapping || {};
      
      // ✅ NUEVO: Obtener datos normalizados y originales
      const originalExtractedData = scanResult.extractedData || {};
      const normalizedData = polizaMapping.normalizedData || {}; // ✅ NUEVO: Datos limpiados del backend

      console.log('🔍 originalExtractedData (Azure crudo):', originalExtractedData);
      console.log('🔍 normalizedData (limpiado por backend):', normalizedData); // ✅ NUEVO

      // ✅ NUEVO: Usar normalizedData si está disponible, fallback a original
      const dataForDisplay = Object.keys(normalizedData).length > 0 ? normalizedData : originalExtractedData;

      console.log('🔍 dataForDisplay elegido:', Object.keys(normalizedData).length > 0 ? 'normalizedData' : 'originalExtractedData');

      // ✅ NUEVO: Log específico para verificar limpieza de campos del vehículo
      if (Object.keys(normalizedData).length > 0) {
        console.log('🔄 === COMPARACIÓN ANTES/DESPUÉS DE LIMPIEZA ===');
        
        const vehicleFields = ['vehiculo.marca', 'vehiculo.modelo', 'vehiculo.matricula', 'vehiculo.motor', 'vehiculo.chasis', 'vehiculo.anio'];
        
        vehicleFields.forEach(field => {
          const original = originalExtractedData[field];
          const normalized = normalizedData[field];
          
          if (original && normalized && original !== normalized) {
            console.log(`✅ ${field}:`);
            console.log(`   Antes (Azure): "${original}"`);
            console.log(`   Después (Backend): "${normalized}"`);
          } else if (original === normalized && original) {
            console.log(`➡️ ${field}: Sin cambios - "${original}"`);
          } else if (!original && normalized) {
            console.log(`🆕 ${field}: Solo en normalizado - "${normalized}"`);
          } else if (original && !normalized) {
            console.log(`⚠️ ${field}: Solo en original - "${original}"`);
          }
        });
      }
      
      const displayData = mapBackendDataToFrontend(
        polizaMapping.mappedData || {}, 
        dataForDisplay // ✅ CAMBIO CRÍTICO: Usar datos normalizados en lugar de originales
      );
      
      console.log('🔧 displayData resultado (lo que ve el usuario):', displayData);

      // ✅ NUEVO: Verificación final de datos del vehículo en displayData
      if (dataForDisplay['vehiculo.matricula']) {
        console.log('🚗 vehiculo.matricula final para UI:', dataForDisplay['vehiculo.matricula']);
      }
      if (dataForDisplay['vehiculo.marca']) {
        console.log('🚗 vehiculo.marca final para UI:', dataForDisplay['vehiculo.marca']);
      }

      const combinedExtractedData = {
        ...dataForDisplay,     // ✅ CAMBIO: Usar datos normalizados primero
        ...displayData         // Los datos procesados por mapBackendDataToFrontend
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
          extractedData: combinedExtractedData, // ✅ CAMBIO: Incluye datos normalizados
          mappedData: polizaMapping.mappedData || {},
          completionPercentage: calculateCompletionPercentage(polizaMapping),
          requiresAttention: mapFieldIssues(polizaMapping.mappingIssues || []),
          errorMessage: undefined,
        },
        isLoading: false,
      });

      console.log('✅ Estado actualizado con datos normalizados');
      toast.success(`Documento procesado exitosamente (${calculateCompletionPercentage(polizaMapping)}% de confianza)`);
      return true;

    } catch (error: any) {
      console.log('❌ === ERROR EN uploadWithContext ===');
      console.log('❌ Error:', error);
      
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

  // Resto de las funciones sin cambios...
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
  }, [state.file.scanId, state.scan, updateState, mapBackendDataToFrontend, mapFieldIssues]);

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