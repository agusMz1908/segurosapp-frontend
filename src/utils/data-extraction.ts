export interface ExtractedData {
  polizaNumber: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  fechaEmision: string;
  prima: string;
  premioTotal: string;
  iva: string;
  cantidadCuotas: string;
  valorPorCuota: string;
  formaPago: string;
  vehiculoMarca: string;
  vehiculoModelo: string;
  vehiculoAno: string;
  vehiculoChasis: string;
  vehiculoMotor: string;
  vehiculoPatente: string;
  aseguradoNombre: string;
  aseguradoDocumento: string;
  aseguradoTelefono: string;
  aseguradoDireccion: string;
  aseguradoDepartamento: string;
  modalidad: string;
  tipoMovimiento: string;
  moneda: string;
  tipoUso: string;
}

class DataExtractionService {
  
  // 🧹 Funciones de limpieza comunes
  private cleanText(str: string): string {
    if (!str) return "";
    return str.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
  }

  private extractNumber(str: string): string {
    if (!str) return "";
    
    const cleanStr = this.cleanText(str);
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
  }

  private extractDate(dateStr: string): string {
    if (!dateStr) return "";
    
    const cleanDateStr = this.cleanText(dateStr);
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
          return `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
        } else {
          return `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
        }
      }
    }

    return "";
  }

  // 🔧 Limpieza específica para vehículos (versión mejorada y menos restrictiva)
  private cleanVehicleField(str: string): string {
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
    
    // Limpiar : al inicio si existe
    cleaned = cleaned.replace(/^:\s*/, '').trim();
    return cleaned;
  }

  // 🔧 Limpieza para patentes (menos restrictiva)
  private cleanPatenteField(str: string): string {
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
    
    return cleaned.toUpperCase(); // Siempre mayúsculas para patentes
  }

  // 🔧 Extracción de número de póliza (menos restrictiva)
  private extractPolizaNumber(str: string): string {
    if (!str) return "";
    
    const cleanStr = this.cleanText(str);
    
    // Patrón más flexible - solo limpiar prefijos obvios
    const cleanedNumber = cleanStr.replace(/^(Póliza|Numero|Number)[\s:]*\s*/i, '').trim();
    
    return cleanedNumber || cleanStr;
  }

  // 🔧 Extracción de año (más flexible)
  private extractYear(str: string): string {
    if (!str) return "";
    
    const cleanStr = this.cleanText(str);
    
    // Limpiar prefijos
    let cleaned = cleanStr.replace(/^(AÑO|Año|YEAR|Year)[\s:]*\s*/i, '').trim();
    
    // Buscar año de 4 dígitos
    const yearMatch = cleaned.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
    if (yearMatch) {
      return yearMatch[0];
    }
    
    // Si ya es un número de 4 dígitos válido
    if (/^\d{4}$/.test(cleaned)) {
      const year = parseInt(cleaned);
      if (year >= 1950 && year <= new Date().getFullYear() + 1) {
        return cleaned;
      }
    }
    
    return "";
  }

  // 🔧 Buscar valor en múltiples campos
  private findFieldValue(data: any, possibleFields: string[]): string | null {
    for (const field of possibleFields) {
      if (data[field] && data[field].toString().trim()) {
        return data[field].toString();
      }
    }
    return null;
  }

  // 🔧 Contar cuotas
  private countCuotas(data: any): string {
    if (!data) return "";
    
    const cuotasCount = Object.keys(data)
      .filter(key => 
        key.startsWith("pago.vencimiento_cuota[") ||    
        key.startsWith("pago.cuotas[") ||               
        key.startsWith("pago.numero_cuota[")            
      )
      .length;

    return cuotasCount > 0 ? cuotasCount.toString() : "";
  }

  // 🔧 Extraer primera cuota
  private extractPrimeraCuota(data: any): string {
    if (!data) return "";

    const cuotaFields = [
      "pago.cuota_monto[1]",      
      "pago.cuotas[0].prima",   
      "pago.prima_cuota[1]",      
      "pago.primera_cuota"
    ];

    for (const field of cuotaFields) {
      if (data[field]) {
        return this.extractNumber(data[field]);
      }
    }
    
    return "";
  }

  /**
   * 🎯 MÉTODO PRINCIPAL: Mapea datos del backend al frontend
   * Usado tanto por Nueva Póliza como por Cambios
   */
  public mapBackendDataToFrontend(backendData: any, rawData: any): ExtractedData {
    console.log('🔄 DataExtractionService.mapBackendDataToFrontend iniciado:', {
      backendDataKeys: Object.keys(backendData || {}),
      rawDataKeys: Object.keys(rawData || {})
    });

    if (!rawData || Object.keys(rawData).length === 0) {
      console.log('⚠️ No hay rawData disponible');
      return {} as ExtractedData;
    }

    const result: ExtractedData = {
      // 📋 Información de la póliza
      polizaNumber: this.extractPolizaNumber(
        this.findFieldValue(rawData, [
          "poliza.numero", "poliza.numero_poliza", "poliza_numero", "numeroPoliza"
        ]) || ""
      ) || backendData.numeroPoliza || "",
      
      vigenciaDesde: (() => {
        if (backendData.fechaDesde && backendData.fechaDesde !== "2025-09-17") {
          return backendData.fechaDesde;
        }
        return this.extractDate(this.findFieldValue(rawData, [
          "poliza.vigencia.desde", "poliza.fecha-desde", "poliza.fecha_desde"
        ]) || "") || "";
      })(),
      
      vigenciaHasta: (() => {
        if (backendData.fechaHasta && backendData.fechaHasta !== "2025-09-17") {
          return backendData.fechaHasta;
        }
        return this.extractDate(this.findFieldValue(rawData, [
          "poliza.vigencia.hasta", "poliza.fecha-hasta", "poliza.fecha_hasta"
        ]) || "") || "";
      })(),

      fechaEmision: this.extractDate(this.findFieldValue(rawData, [
        "poliza.fecha_emision", "fecha_emision"
      ]) || "") || "",

      // 💰 Información financiera
      prima: backendData.premio?.toString() || 
             this.extractNumber(this.findFieldValue(rawData, [
               "poliza.prima_comercial", "costo.costo", "premio.premio", "prima"
             ]) || "") || "",
      
      premioTotal: backendData.premioTotal?.toString() || 
                   this.extractNumber(this.findFieldValue(rawData, [
                     "financiero.premio_total", "costo.premio_total", "premio.total"
                   ]) || "") || "",

      iva: this.extractNumber(this.findFieldValue(rawData, [
        "costo.iva", "poliza.iva", "premio.iva"
      ]) || "") || "",

      cantidadCuotas: backendData.cantidadCuotas?.toString() || 
                      this.countCuotas(rawData) || "",
      
      valorPorCuota: (() => {
        const valorEspecifico = this.extractPrimeraCuota(rawData);
        if (valorEspecifico) return valorEspecifico;

        if (backendData.valorCuota) return backendData.valorCuota.toString();

        const cuotas = parseInt(rawData.cantidadCuotas || backendData.cantidadCuotas?.toString() || "1");
        if (cuotas === 1) {
          const total = this.extractNumber(this.findFieldValue(rawData, [
            "financiero.premio_total", "premio.total"
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
                 this.cleanText(this.findFieldValue(rawData, [
                   "pago.forma_pago", "modo_de_pago", "pago.medio"
                 ]) || "") || "",

      // 🚗 Información del vehículo  
      vehiculoMarca: (() => {
        if (backendData.vehiculoMarca) {
          return this.cleanVehicleField(backendData.vehiculoMarca);
        }
        
        const rawValue = this.findFieldValue(rawData, [
          "vehiculo.marca", "vehiculoMarca", "vehiculo_marca"
        ]);
        
        return rawValue ? this.cleanVehicleField(rawValue) : "";
      })(),

      vehiculoModelo: (() => {
        if (backendData.vehiculoModelo) {
          return this.cleanVehicleField(backendData.vehiculoModelo);
        }
        
        const rawValue = this.findFieldValue(rawData, [
          "vehiculo.modelo", "vehiculoModelo", "vehiculo_modelo"
        ]);
        
        return rawValue ? this.cleanVehicleField(rawValue) : "";
      })(),

      vehiculoAno: (() => {
        if (backendData.vehiculoAño?.toString()) {
          return backendData.vehiculoAño.toString();
        }
        
        const rawValue = this.findFieldValue(rawData, [
          "vehiculo.anio", "vehiculo.año", "vehiculoAno", "vehiculo_anio"
        ]);
        
        return rawValue ? this.extractYear(rawValue) : "";
      })(),

      vehiculoChasis: (() => {
        if (backendData.vehiculoChasis) return backendData.vehiculoChasis;
        
        const rawValue = this.findFieldValue(rawData, [
          "vehiculo.chasis", "vehiculoChasis", "vehiculo_chasis"
        ]);
        
        return rawValue ? this.cleanVehicleField(rawValue) : "";
      })(),

      vehiculoMotor: (() => {
        if (backendData.vehiculoMotor) return backendData.vehiculoMotor;
        
        const rawValue = this.findFieldValue(rawData, [
          "vehiculo.motor", "vehiculoMotor", "vehiculo_motor"
        ]);
        
        return rawValue ? this.cleanVehicleField(rawValue) : "";
      })(),

      vehiculoPatente: (() => {
        if (backendData.vehiculoPatente) return backendData.vehiculoPatente;

        const rawValue = this.findFieldValue(rawData, [
          "vehiculo.matricula", "vehiculoPatente", "vehiculo_matricula", "matricula", "patente"
        ]);

        return rawValue ? this.cleanPatenteField(rawValue) : "";
      })(),

      // 👤 Información del asegurado
      aseguradoNombre: backendData.aseguradoNombre || 
                       this.cleanText(this.findFieldValue(rawData, [
                         "asegurado.nombre"
                       ]) || "") || "",
      
      aseguradoDocumento: backendData.aseguradoDocumento || 
                          this.cleanText(this.findFieldValue(rawData, [
                            "conductor.cedula", "asegurado.documento", "asegurado.ci"
                          ]) || "") || "",
      
      aseguradoTelefono: this.cleanText(this.findFieldValue(rawData, [
        "asegurado.telefono"
      ]) || "") || "",
      
      aseguradoDireccion: this.cleanText(this.findFieldValue(rawData, [
        "asegurado.direccion"
      ]) || "") || "",
      
      aseguradoDepartamento: this.cleanText(this.findFieldValue(rawData, [
        "asegurado.departamento"
      ]) || "") || "",

      // 📝 Información adicional
      modalidad: this.cleanText(this.findFieldValue(rawData, [
        "poliza.modalidad"
      ]) || "") || "",
      
      tipoMovimiento: this.cleanText(this.findFieldValue(rawData, [
        "poliza.tipo_de_movimiento", "poliza.tipo_movimiento"
      ]) || "") || "",
      
      moneda: this.cleanText(this.findFieldValue(rawData, [
        "poliza.moneda"
      ]) || "") || "",

      tipoUso: this.cleanText(this.findFieldValue(rawData, [
        "vehiculo.tipo_de_uso"
      ]) || "") || ""
    };

    console.log('✅ DataExtractionService.mapBackendDataToFrontend completado:', {
      polizaNumber: result.polizaNumber,
      vehiculoPatente: result.vehiculoPatente,
      vehiculoAno: result.vehiculoAno,
      vehiculoMarca: result.vehiculoMarca
    });

    return result;
  }

  /**
   * 🔄 Crear extractedData combinado (igual que Nueva Póliza)
   */
  public createCombinedExtractedData(
    dataForDisplay: any, 
    backendData: any
  ): ExtractedData {
    console.log('🔄 DataExtractionService.createCombinedExtractedData iniciado');
    
    const displayData = this.mapBackendDataToFrontend(backendData, dataForDisplay);
    
    const combinedExtractedData = {
      ...dataForDisplay,   
      ...displayData    
    };

    console.log('✅ Combined data creado:', combinedExtractedData);
    return combinedExtractedData;
  }
}

// 🏭 Exportar instancia singleton
export const dataExtractionService = new DataExtractionService();