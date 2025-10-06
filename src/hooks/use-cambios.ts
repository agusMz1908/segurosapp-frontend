import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders, getAuthHeadersForFormData, getAuthToken, handle401Error } from '../utils/auth-utils';
import { dataExtractionService } from '../utils/data-extraction';

interface CambiosState {
  currentStep: number;
  isLoading: boolean;
  isLoadingPolizas: boolean;
  isProcessingCambio: boolean; // 🆕 Nuevo estado para procesamiento de cambio
  
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
  isLoadingPolizas: false,
  isProcessingCambio: false, // 🆕 Inicializar estado de procesamiento
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
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      updateState((prev: any) => ({
        ...prev,
        isLoadingPolizas: true,
        cliente: {
          ...prev.cliente,
          selectedId: clienteId,
          polizas: []
        }
      }));

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
      }

      console.log('📋 Lista de pólizas a filtrar:', polizasList.length, polizasList);

      const now = new Date();
      const polizasVigentes = polizasList.filter((poliza: any) => {
        console.log(`\n🔍 Evaluando póliza ${poliza.conpol}:`, {
          seccod: poliza.seccod,
          vencimiento: poliza.confchhas,
          compania: poliza.comcod
        });

        if (poliza.seccod !== 4) {
          console.log(`❌ Rechazada - No es automotor (sección ${poliza.seccod})`);
          return false;
        }
        
        let diasHastaVencimiento = 0;
        try {
          const fechaVencimiento = new Date(poliza.confchhas);
          diasHastaVencimiento = Math.ceil((fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          console.log(`📅 Días hasta vencimiento: ${diasHastaVencimiento}`);
        } catch (error) {
          console.log('❌ Error parseando fecha');
          return false;
        }
        
        const esVigenteParaCambios = diasHastaVencimiento >= -30;
        console.log(`${esVigenteParaCambios ? '✅' : '❌'} Vigente para cambios:`, esVigenteParaCambios);
        
        if (esVigenteParaCambios) {
          if (!poliza.comnom || poliza.comnom.trim() === '') {
            poliza.comnom = mapeoCompanias[poliza.comcod] || `Compañía ${poliza.comcod}`;
            console.log(`🏢 Nombre mapeado: ${poliza.comnom}`);
          }
        }
        
        return esVigenteParaCambios;
      });

      console.log('✅ Pólizas vigentes filtradas:', polizasVigentes.length, polizasVigentes);

      updateState((prevState: any) => ({
        ...prevState,
        isLoadingPolizas: false,
        cliente: {
          ...prevState.cliente,
          selectedId: clienteId,
          polizas: polizasVigentes
        }
      }));

      if (polizasVigentes.length === 0) {
        toast('Este cliente no tiene pólizas de automotor vigentes para cambios', {
          icon: 'ℹ️',
          duration: 4000,
        });
      } else {
        toast.success(`Se encontraron ${polizasVigentes.length} pólizas vigentes`);
      }

      return polizasVigentes;
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error('Error cargando pólizas: ' + (error.message || 'Error desconocido'));
      updateState((prevState: any) => ({
        ...prevState,
        isLoadingPolizas: false,
        cliente: {
          ...prevState.cliente,
          selectedId: clienteId,
          polizas: []
        }
      }));
      
      return [];
    }
  }, [updateState]);

  // 🆕 Función extractPrimeraCuota portada desde nueva póliza
  const extractPrimeraCuota = (data: any) => {
    if (!data) return "";

    console.log('🔍 CAMBIOS - extractPrimeraCuota - Buscando en:', data);

    const cuotaFields = [
      "pago.cuota_monto[1]",      
      "pago.cuotas[0].prima",   
      "pago.prima_cuota[1]",      
      "pago.primera_cuota",   
    ];

    for (const field of cuotaFields) {
      if (data[field]) {
        const valor = data[field].toString();
        console.log(`🎯 CAMBIOS - extractPrimeraCuota encontrado en '${field}':`, valor);
        return valor;
      }
    }
    
    console.log('❌ CAMBIOS - extractPrimeraCuota no encontró valor');
    return "";
  };

  // 🆕 Función extractNumber portada desde nueva póliza  
  const extractNumber = (str: string) => {
    if (!str) return "";
    
    let cleanNumber = str.toString().replace(/[^\d,.-]/g, '');
    
    if (cleanNumber.includes('.') && cleanNumber.includes(',')) {
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

  const cleanPadronField = (str: string) => {
    if (!str) return "";
    
    let cleaned = str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
    
    const padronPrefixes = [
      'PADRÓN: ', 'PADRÓN. : ', 'PADRÓN ',
      'PADRON: ', 'PADRON. : ', 'PADRON ',
      'Padrón: ', 'Padrón. : ', 'Padrón ',
      'Padron: ', 'Padron. : ', 'Padron '
    ];
    
    for (const prefix of padronPrefixes) {
      if (cleaned.startsWith(prefix)) {
        cleaned = cleaned.substring(prefix.length).trim();
        break;
      }
    }
    
    cleaned = cleaned.replace(/^:\s*/, '').trim();
    cleaned = cleaned.replace(/[^\d]/g, '');
    
    return cleaned;
  };

  const formatDateForInput = (dateStr: any) => {
    if (!dateStr) return '';
    
    try {
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      return '';
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '';
    }
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

    console.log('🔍 CAMBIOS - Debug fechas - Campos disponibles en extractedData:', Object.keys(extractedData));
    console.log('🔍 CAMBIOS - Debug fechas - Campos disponibles en backendData:', Object.keys(backendData));
    
    const fechaFields = Object.keys(extractedData).filter(key => 
      key.toLowerCase().includes('fecha') || 
      key.toLowerCase().includes('vigencia') || 
      key.toLowerCase().includes('desde') || 
      key.toLowerCase().includes('hasta') ||
      key.toLowerCase().includes('inicio') ||
      key.toLowerCase().includes('fin')
    );
    console.log('🔍 CAMBIOS - Campos relacionados con fechas encontrados:', fechaFields.map(key => ({
      campo: key,
      valor: extractedData[key]
    })));

    const financialFields = Object.keys(extractedData).filter(key => 
      key.toLowerCase().includes('cuota') || 
      key.toLowerCase().includes('valor') || 
      key.toLowerCase().includes('monto') || 
      key.toLowerCase().includes('premio') ||
      key.toLowerCase().includes('prima') ||
      key.toLowerCase().includes('total') ||
      key.toLowerCase().includes('cantidad') ||
      key.toLowerCase().includes('financ') ||
      key.toLowerCase().includes('pago') ||
      key.toLowerCase().includes('importe') ||
      key.toLowerCase().includes('costo')
    );
    console.log('🔍 CAMBIOS - Campos relacionados con finanzas encontrados:', financialFields.map(key => ({
      campo: key,
      valor: extractedData[key]
    })));

    const numericFields = Object.keys(extractedData).filter(key => {
      const valor = extractedData[key];
      if (!valor) return false;
      const str = valor.toString();
      return /[\d,.]/.test(str) && (
        /\d+[.,]\d+/.test(str) ||
        /\$\s*\d+/.test(str) ||
        /\d+\.\d{3}/.test(str) ||
        (parseFloat(str.replace(/[^\d.-]/g, '')) > 100 && parseFloat(str.replace(/[^\d.-]/g, '')) < 1000000)
      );
    });
    console.log('🔍 CAMBIOS - Campos con valores numéricos/monetarios encontrados:', numericFields.map(key => ({
      campo: key,
      valor: extractedData[key]
    })));

    const cleanVehicleField = (str: string) => {
      if (!str) return "";
      
      let cleaned = str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
      
      const prefixes = [
        'MARCA\n', 'MARCA ', 'MARCA:', 'Marca\n', 'Marca ', 'Marca:',
        'MODELO\n', 'MODELO ', 'MODELO:', 'Modelo\n', 'Modelo ', 'Modelo:',
        'MOTOR\n', 'MOTOR ', 'MOTOR:', 'Motor\n', 'Motor ', 'Motor:',
        'CHASIS\n', 'CHASIS ', 'CHASIS:', 'Chasis\n', 'Chasis ', 'Chasis:',
        'AÑO\n', 'AÑO ', 'AÑO:', 'Año\n', 'Año ', 'Año:',
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

    const cleanText = (str: string) => {
      if (!str) return "";
      return str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
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

      vehiculoPadron: (() => {
        if (backendData.vehiculoPadron) return backendData.vehiculoPadron;
        
        const conSalto = findFieldValue(["vehiculo.padron"]) || "";
        if (conSalto) return cleanPadronField(conSalto.toString());
        
        const sinSalto = findFieldValue(["vehiculoPadron", "vehiculo_padron", "padron"]) || "";
        return cleanPadronField(sinSalto.toString());
      })(),

      aseguradoNombre: backendData.aseguradoNombre || 
                       cleanText(findFieldValue(["asegurado.nombre"]) || "") || "",
      
      aseguradoDocumento: backendData.aseguradoDocumento || 
                          cleanText(findFieldValue(["conductor.cedula", "asegurado.documento", "asegurado.ci"]) || "") || "",
      
      aseguradoTelefono: cleanText(findFieldValue(["asegurado.telefono"]) || "") || "",
      
      aseguradoDireccion: cleanText(findFieldValue(["asegurado.direccion"]) || "") || "",
      
      aseguradoDepartamento: cleanText(findFieldValue(["asegurado.departamento"]) || "") || "",

      polizaNumber: (() => {
        const numeroPoliza = backendData.polizaNumero || 
                            findFieldValue(["poliza.numero", "numero_poliza", "polizaNumber", "numeroPoliza"]) || "";
        
        if (numeroPoliza) {
          let cleaned = numeroPoliza.toString().trim();
          cleaned = cleaned
            .replace(/^(nro\.\s*|nro\s*|número\s*|numero\s*|póliza\s*nro\.\s*)/i, '')
            .replace(/^:\s*/, '')
            .replace(/^\s*:\s*/, '')
            .trim();
          return cleaned;
        }
        return "";
      })(),
      
      vigenciaDesde: (() => {
        const posiblesCampos = [
          "poliza.vigencia_desde", "fecha_desde", "vigenciaDesde", "fechaDesde", "FechaDesde",
          "polizaVigenciaDesde", "poliza_vigencia_desde", "vigencia_desde",
          "fecha_inicio", "fechaInicio", "inicio_vigencia", "inicioVigencia",
          "fecha_emision", "fechaEmision", "emision", "fecha_alta",
          "vigencia.desde", "vigencia.inicio", "poliza.fecha_desde",
          "valid_from", "start_date", "effective_date"
        ];
        
        for (const campo of posiblesCampos) {
          const valor = extractedData[campo] || backendData[campo];
          if (valor && valor.toString().trim()) {
            console.log(`🎯 CAMBIOS - Fecha DESDE encontrada en campo '${campo}':`, valor);
            return formatDateForInput(valor);
          }
        }
        
        console.log('❌ CAMBIOS - No se encontró fecha DESDE en ningún campo');
        return "";
      })(),
      
      vigenciaHasta: (() => {
        const posiblesCampos = [
          "poliza.vigencia_hasta", "fecha_hasta", "vigenciaHasta", "fechaHasta", "FechaHasta",
          "polizaVigenciaHasta", "poliza_vigencia_hasta", "vigencia_hasta",
          "fecha_fin", "fechaFin", "fin_vigencia", "finVigencia",
          "fecha_vencimiento", "fechaVencimiento", "vencimiento", "fecha_baja",
          "vigencia.hasta", "vigencia.fin", "poliza.fecha_hasta",
          "valid_to", "end_date", "expiry_date"
        ];
        
        for (const campo of posiblesCampos) {
          const valor = extractedData[campo] || backendData[campo];
          if (valor && valor.toString().trim()) {
            console.log(`🎯 CAMBIOS - Fecha HASTA encontrada en campo '${campo}':`, valor);
            return formatDateForInput(valor);
          }
        }
        
        console.log('❌ CAMBIOS - No se encontró fecha HASTA en ningún campo');
        return "";
      })(),
      
      prima: (() => {
        const posiblesCampos = [
          "poliza.premio", "premio_total", "prima", "premio", "Premio",
          "polizaPremio", "monto_prima", "valor_prima", "costo_prima"
        ];
        
        for (const campo of posiblesCampos) {
          const valor = extractedData[campo] || backendData[campo];
          if (valor && valor.toString().trim() && valor !== "0") {
            console.log(`🎯 CAMBIOS - Prima encontrada en campo '${campo}':`, valor);
            return cleanText(valor.toString());
          }
        }
        
        console.log('❌ CAMBIOS - No se encontró prima en ningún campo');
        return "";
      })(),

      cantidadCuotas: (() => {
        const posiblesCampos = [
          "cantidadCuotas", "CantidadCuotas", "cantidad_cuotas", "pago.cantidad_cuotas",
          "cuotas", "num_cuotas", "numero_cuotas", "total_cuotas",
          "financiacion.cuotas", "pago.cuotas", "plan_cuotas", "cuotas_total"
        ];
        
        for (const campo of posiblesCampos) {
          const valor = extractedData[campo] || backendData[campo];
          if (valor && valor.toString().trim() && valor !== "0") {
            console.log(`🎯 CAMBIOS - Cantidad cuotas encontrada en campo '${campo}':`, valor);
            return cleanText(valor.toString());
          }
        }
        
        console.log('❌ CAMBIOS - No se encontró cantidad de cuotas en ningún campo');
        return "";
      })(),

      valorPorCuota: (() => {
        console.log('🔍 CAMBIOS - Iniciando búsqueda de valorPorCuota');
        
        const valorEspecifico = extractPrimeraCuota(extractedData);
        if (valorEspecifico) {
          console.log('🎯 CAMBIOS - Valor por cuota encontrado con extractPrimeraCuota:', valorEspecifico);
          return valorEspecifico;
        }

        if (backendData.valorCuota) {
          console.log('🎯 CAMBIOS - Valor por cuota encontrado en backendData.valorCuota:', backendData.valorCuota);
          return backendData.valorCuota.toString();
        }

        const posiblesCampos = [
          "valorPorCuota", "valorCuota", "valor_cuota", "monto_cuota", 
          "importe_cuota", "cuota_valor", "cuota_mensual"
        ];
        
        for (const campo of posiblesCampos) {
          const valor = extractedData[campo] || backendData[campo];
          if (valor && valor.toString().trim() && valor !== "0") {
            const valorLimpio = extractNumber(valor.toString());
            if (valorLimpio) {
              console.log(`🎯 CAMBIOS - Valor por cuota encontrado en '${campo}':`, valorLimpio);
              return valorLimpio;
            }
          }
        }

        const cuotas = parseInt(extractedData.cantidadCuotas || backendData.cantidadCuotas?.toString() || "1");
        if (cuotas === 1) {
          const total = extractNumber(extractedData.premioTotal || extractedData.montoTotal || backendData.montoTotal?.toString() || "");
          if (total) {
            console.log('🎯 CAMBIOS - Valor por cuota calculado para 1 cuota (total):', total);
            return total;
          }
        }

        if (backendData.montoTotal && backendData.cantidadCuotas && backendData.cantidadCuotas > 0) {
          const valorCalculado = backendData.montoTotal / backendData.cantidadCuotas;
          const valorFormateado = new Intl.NumberFormat('es-UY', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(valorCalculado);
          console.log(`🎯 CAMBIOS - Valor por cuota calculado: ${backendData.montoTotal} / ${backendData.cantidadCuotas} = ${valorFormateado}`);
          return valorFormateado;
        }

        console.log('❌ CAMBIOS - No se encontró valor por cuota con ningún método');
        return "";
      })(),

      premioTotal: (() => {
        const posiblesCampos = [
          "premioTotal", "montoTotal", "premio", "Premio", "polizaPremio", 
          "financiero.premio_total", "poliza.premio", "total_premio",
          "monto_total", "importe_total", "costo_total"
        ];
        
        for (const campo of posiblesCampos) {
          const valor = extractedData[campo] || backendData[campo];
          if (valor && valor.toString().trim() && valor !== "0") {
            console.log(`🎯 CAMBIOS - Premio total encontrado en campo '${campo}':`, valor);
            return cleanText(valor.toString());
          }
        }
        
        console.log('❌ CAMBIOS - No se encontró premio total en ningún campo');
        return "";
      })(),

      modalidad: cleanText(findFieldValue(["poliza.modalidad"]) || "") || "",
      tipoMovimiento: cleanText(findFieldValue(["poliza.tipo_movimiento"]) || "") || ""
    };

    console.log('✅ CAMBIOS - mapBackendDataToFrontend resultado:', result);
    return result;
  };

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
    // Necesitamos acceder al estado actual dentro del callback
    return new Promise((resolve) => {
      setState(currentState => {
        if (!currentState.context.clienteId || !currentState.context.seccionId || !currentState.context.companiaId) {
          toast.error('Contexto incompleto. Selecciona cliente y póliza correctamente.');
          resolve(false);
          return currentState;
        }

        // Realizar la carga del archivo
        (async () => {
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
                ...currentState.scan, 
                status: 'uploading', 
                fileName: file.name, 
                errorMessage: undefined 
              }
            });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('clienteId', currentState.context.clienteId!.toString());
            formData.append('companiaId', currentState.context.companiaId!.toString());
            formData.append('seccionId', currentState.context.seccionId!.toString());
            formData.append('notes', 'Cambio de póliza');

            updateState({
              file: {
                selected: file,
                uploaded: false,
                scanId: null,
                uploadProgress: 50,
              },
              scan: {
                ...currentState.scan,
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
                resolve(false);
                return;
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

            console.log('🔄 CAMBIOS - Procesando datos extraídos');
            
            const displayData = mapBackendDataToFrontend(
              mappedData, 
              dataForDisplay || {}
            );

            if (displayData.vehiculoPadron) {
              console.log('🏷️ CAMBIOS - Padrón extraído exitosamente:', {
                valorOriginal: dataForDisplay['vehiculo.padron'],
                valorLimpio: displayData.vehiculoPadron
              });
            } else {
              const padronKeys = Object.keys(dataForDisplay).filter(key => 
                key.toLowerCase().includes('padron') || 
                key.toLowerCase().includes('padrón')
              );
              
              if (padronKeys.length > 0) {
                console.log('🔍 CAMBIOS - Campos de padrón encontrados:', padronKeys.map(key => ({
                  campo: key,
                  valor: dataForDisplay[key]
                })));
              } else {
                console.log('❌ CAMBIOS - No se encontró padrón en ningún campo');
              }
            }

            const combinedExtractedData = {
              ...dataForDisplay,
              ...displayData
            };

            console.log('✅ CAMBIOS - Datos extraídos unificados:', {
              polizaNumber: combinedExtractedData.polizaNumber,
              vigenciaDesde: combinedExtractedData.vigenciaDesde,
              vigenciaHasta: combinedExtractedData.vigenciaHasta,
              vehiculoPatente: combinedExtractedData.vehiculoPatente,
              vehiculoPadron: combinedExtractedData.vehiculoPadron,
              prima: combinedExtractedData.prima
            });

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

            updateState({
              context: {
                ...currentState.context,
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
            resolve(true);

          } catch (error: any) { 
            updateState({
              file: {
                selected: file,
                uploaded: false,
                scanId: null,
                uploadProgress: 0,
              },
              scan: {
                ...currentState.scan,
                status: 'error',
                errorMessage: error.message || 'Error procesando documento'
              },
              isLoading: false,
            });

            toast.error('Error procesando documento: ' + (error.message || 'Error desconocido'));
            resolve(false);
          }
        })();

        return currentState;
      });
    });
  }, [updateState]);

  const setClienteData = useCallback((cliente: any) => {
    updateState((prev: { context: any; }) => ({
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
  }, [updateState]);

  const updateExtractedData = useCallback((updates: any) => {
    updateState((prevState: { scan: { extractedData: any; }; }) => ({
      ...prevState,
      scan: {
        ...prevState.scan,
        extractedData: { ...prevState.scan.extractedData, ...updates }
      }
    }));
  }, [updateState]);

  const updateMasterData = useCallback((updates: any) => {
    updateState((prev: { masterData: any; }) => ({
      ...prev,
      masterData: { ...prev.masterData, ...updates }
    }));
  }, [updateState]);

  const markProcessCompleted = useCallback((result: any) => {
    updateState((prev: any) => ({
      ...prev,
      processCompleted: true,
      processResult: result,
      isProcessingCambio: false // 🆕 Finalizar procesamiento
    }));
  }, [updateState]);

  // 🆕 Función para iniciar procesamiento
  const startProcessingCambio = useCallback(() => {
    updateState((prev: any) => ({
      ...prev,
      isProcessingCambio: true
    }));
  }, [updateState]);

  // 🆕 Función para finalizar procesamiento
  const stopProcessingCambio = useCallback(() => {
    updateState((prev: any) => ({
      ...prev,
      isProcessingCambio: false
    }));
  }, [updateState]);

  const nextStep = useCallback(() => {
    updateState((prev: { currentStep: number; }) => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, 4) }));
  }, [updateState]);

  const prevStep = useCallback(() => {
    updateState((prev: { currentStep: number; }) => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 1) }));
  }, [updateState]);

  const reset = useCallback(() => {
    setState(initialState);
    toast.success('Sistema de cambios reiniciado');
  }, []);

  const canProceedToStep2 = Boolean(state.cliente.selectedPoliza);
  const canProceedToStep3 = Boolean(state.scan.status === 'completed' && state.file.uploaded);
  const canProceedToStep4 = Boolean(
    state.scan.extractedData && 
    Object.keys(state.scan.extractedData).length > 0 &&
    state.masterData.combustibleId && 
    state.masterData.categoriaId
  );

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
    startProcessingCambio, // 🆕 Función para iniciar procesamiento
    stopProcessingCambio,  // 🆕 Función para finalizar procesamiento
    nextStep,
    prevStep,
    reset,
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4
  };
}