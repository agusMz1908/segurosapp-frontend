import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ExtractedDataFormProps {
  hookInstance: any;
}

export function ExtractedDataForm({ hookInstance }: ExtractedDataFormProps) {
  const { state, updateExtractedData } = hookInstance;
  const [editedData, setEditedData] = useState<any>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // 🔧 FIX RENOVACIONES: Usar EXACTAMENTE la misma lógica que Cambios (después del fix)
  // Solo usar extractedData como fuente única (no cascada compleja)
  const dataSource = state.scan.extractedData || {};
  
  console.log('🔍 RENOVACIONES FIXED - ExtractedData disponible:', {
    extractedDataKeys: Object.keys(state.scan.extractedData || {}),
    sampleData: {
      polizaNumber: state.scan.extractedData?.polizaNumber,
      numeroPoliza: state.scan.extractedData?.numeroPoliza,
      vehiculoPatente: state.scan.extractedData?.vehiculoPatente,
      vehiculoAno: state.scan.extractedData?.vehiculoAno
    }
  });

  useEffect(() => {
    if (dataSource && Object.keys(dataSource).length > 0) {
      console.log('✅ RENOVACIONES FIXED - Inicializando con extractedData unificado:', dataSource);
      setEditedData(dataSource);
      setIsInitialized(true);
    }
  }, [dataSource]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
    
    if (updateExtractedData) {
      updateExtractedData({ [fieldName]: value });
    }
  };

  const getFieldStatus = (fieldName: string) => {
    const requiresAttention = state.scan.requiresAttention || [];
    const hasAttention = requiresAttention.some((item: { fieldName: string; }) => item.fieldName === fieldName);
    return hasAttention ? 'warning' : 'success';
  };

  // 🔧 FIX: Mismas funciones que en Cambios para manejar SURA y MAPFRE
  const formatCurrency = (value: string | number) => {
    if (!value) return '';
    
    let stringValue = typeof value === 'string' ? value : value.toString();
    
    // 🔧 FIX SURA: Manejar formato uruguayo
    if (stringValue.includes('.') && stringValue.includes(',')) {
      // Formato uruguayo: 3.670,09 → 3670.09
      stringValue = stringValue.replace(/\./g, '').replace(',', '.');
    } else if (stringValue.includes(',') && !stringValue.includes('.')) {
      // Solo coma: 3670,09 → 3670.09
      const parts = stringValue.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        stringValue = stringValue.replace(',', '.');
      }
    }
    
    const numValue = parseFloat(stringValue.replace(/[^\d.-]/g, ''));
    if (isNaN(numValue)) return '';
    
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  const cleanNumberForInput = (value: string | number) => {
    if (!value) return '';
    
    let stringValue = typeof value === 'string' ? value : value.toString();
    
    // 🔧 FIX SURA: Manejar formato uruguayo con puntos y comas
    // Ejemplos: "3.670,09" → "3670.09", "36.691,09" → "36691.09"
    
    console.log('🔍 RENOVACIONES SURA - Procesando número:', stringValue);
    
    // Si tiene tanto puntos como comas (formato uruguayo: 1.234,56)
    if (stringValue.includes('.') && stringValue.includes(',')) {
      // Remover puntos (separadores de miles) y cambiar coma por punto decimal
      stringValue = stringValue.replace(/\./g, '').replace(',', '.');
      console.log('🔧 RENOVACIONES SURA - Formato uruguayo detectado, convertido a:', stringValue);
    }
    // Si solo tiene coma (podría ser decimal europeo: 1234,56)
    else if (stringValue.includes(',') && !stringValue.includes('.')) {
      // Verificar si es separador decimal (máximo 2 dígitos después de la coma)
      const parts = stringValue.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        stringValue = stringValue.replace(',', '.');
        console.log('🔧 RENOVACIONES SURA - Coma decimal detectada, convertida a:', stringValue);
      }
    }
    
    // Limpiar caracteres no numéricos excepto punto decimal
    const numValue = parseFloat(stringValue.replace(/[^\d.-]/g, ''));
    
    if (isNaN(numValue)) {
      console.log('❌ RENOVACIONES SURA - No se pudo convertir a número:', stringValue);
      return '';
    }
    
    // Mantener precisión decimal completa (no redondear a centavos)
    const result = numValue.toString();
    console.log('✅ RENOVACIONES SURA - Número final:', result);
    return result;
  };

  // 🔧 FUNCIONES AUXILIARES PARA BUSCAR CAMPOS (iguales que Cambios)
  const findPolizaNumber = () => {
    // Buscar en múltiples posibles nombres de campo
    const possibleFields = [
      'polizaNumber',      // Como Nueva Póliza
      'polizaNumero',      // Del mapeo de cambios  
      'numeroPoliza',      // Alternativo
      'NumeroPoliza',      // Backend
      'poliza_numero'      // Snake case
    ];
    
    for (const field of possibleFields) {
      if (editedData[field] && editedData[field].toString().trim()) {
        let polizaNumber = editedData[field].toString().trim();
        
        // 🔧 FIX: Quitar prefijos y caracteres no deseados
        polizaNumber = polizaNumber
          .replace(/^(nro\.\s*|nro\s*|número\s*|numero\s*)/i, '')  // Prefijos
          .replace(/^:\s*/, '')                                     // Dos puntos al inicio (SURA)
          .replace(/^\s*:\s*/, '')                                  // Dos puntos con espacios
          .trim();
        
        console.log(`🎯 RENOVACIONES FIX - Número de póliza encontrado en campo '${field}':`, editedData[field], '→ limpiado:', polizaNumber);
        return polizaNumber;
      }
    }
    
    console.log('❌ RENOVACIONES FIX - No se encontró número de póliza en ningún campo');
    return '';
  };

  const findVehicleField = (fieldName: string) => {
    const possibleFields = [
      fieldName,                           // Nombre directo
      `vehiculo${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`,  // vehiculoPatente
      `Vehiculo${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`,  // VehiculoPatente
      fieldName.replace('vehiculo', ''),   // patente (sin prefijo)
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1) // Patente
    ];

    for (const field of possibleFields) {
      if (editedData[field] && editedData[field].toString().trim()) {
        console.log(`🎯 RENOVACIONES FIX - ${fieldName} encontrado en campo '${field}':`, editedData[field]);
        return editedData[field].toString();
      }
    }
    
    return '';
  };

  const extractValorPorCuota = (data: any) => {
    if (!data) return "";
    
    console.log('🔍 RENOVACIONES - Buscando valor por cuota en:', data);

    const cuotaFields = [
      "pago.cuota_monto[1]",      
      "pago.cuotas[0].prima",    
      "pago.prima_cuota[1]",      
      "pago.primera_cuota",      
      "valorPorCuota",            
      "valorCuota"                
    ];

    for (const field of cuotaFields) {
      if (data[field]) {
        const valor = data[field].toString();
        console.log(`✅ RENOVACIONES - Valor por cuota encontrado en ${field}:`, valor);
        return valor;
      }
    }
    
    const total = data.premioTotal || data.montoTotal || data.premio || data["financiero.premio_total"];
    const cuotas = parseInt(data.cantidadCuotas || "1");
    
    if (total && cuotas > 1) {
      const totalNum = parseFloat(total.toString().replace(/[^\d.-]/g, ''));
      if (!isNaN(totalNum)) {
        const valorCalculado = totalNum / cuotas;
        console.log(`🧮 RENOVACIONES - Valor por cuota calculado: ${total} / ${cuotas} = ${valorCalculado}`);
        return valorCalculado.toString();
      }
    }
    
    console.log('❌ RENOVACIONES - No se encontró valor de cuota');
    return "";
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Esperando datos del escaneo de renovación...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Información de la Nueva Póliza
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Número de Póliza
              {getFieldStatus('polizaNumber') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {getFieldStatus('polizaNumber') === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </Label>
            {/* 🔧 RENOVACIONES FIX: Usar función inteligente de búsqueda */}
            <Input
              value={findPolizaNumber()}
              onChange={(e) => handleFieldChange('polizaNumber', e.target.value)}
              placeholder="Número de la nueva póliza"
              className="font-mono"
            />
            {/* Debug info */}
            <div className="text-xs text-gray-500">
              Debug: Buscando en: polizaNumber, polizaNumero, numeroPoliza, NumeroPoliza
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Prima (UYU)
              {getFieldStatus('premio') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {getFieldStatus('premio') === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </Label>
            <Input
              type="number"
              step="0.01"
              value={cleanNumberForInput(editedData.premio || editedData.prima || editedData.Premio || '')}
              onChange={(e) => handleFieldChange('premio', e.target.value)}
              placeholder="0.00"
            />
            {(editedData.premio || editedData.prima || editedData.Premio) && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(editedData.premio || editedData.prima || editedData.Premio)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Vigencia de la Nueva Póliza
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Vigencia Desde
              {getFieldStatus('vigenciaDesde') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {getFieldStatus('vigenciaDesde') === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </Label>
            <Input
              type="date"
              value={editedData.fechaDesde || editedData.vigenciaDesde || editedData.FechaDesde || ''}
              onChange={(e) => handleFieldChange('vigenciaDesde', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Vigencia Hasta
              {getFieldStatus('vigenciaHasta') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {getFieldStatus('vigenciaHasta') === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </Label>
            <Input
              type="date"
              value={editedData.fechaHasta || editedData.vigenciaHasta || editedData.FechaHasta || ''}
              onChange={(e) => handleFieldChange('vigenciaHasta', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Información Financiera
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Cantidad de Cuotas
              {getFieldStatus('cantidadCuotas') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              type="number"
              value={editedData.cantidadCuotas || editedData.CantidadCuotas || ''}
              onChange={(e) => handleFieldChange('cantidadCuotas', e.target.value)}
              placeholder="1"
              min="1"
              max="12"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Valor por Cuota
              {getFieldStatus('valorPorCuota') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              type="number"
              step="0.01"
              value={cleanNumberForInput(editedData.valorPorCuota || editedData.valorCuota || extractValorPorCuota(editedData) || '')}
              onChange={(e) => handleFieldChange('valorPorCuota', e.target.value)}
              placeholder="0.00"
            />
            {(editedData.valorPorCuota || editedData.valorCuota || extractValorPorCuota(editedData)) && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(editedData.valorPorCuota || editedData.valorCuota || extractValorPorCuota(editedData))}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Premio Total
              {getFieldStatus('premioTotal') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              type="number"
              step="0.01"
              value={cleanNumberForInput(editedData.premioTotal || editedData.montoTotal || editedData.premio || editedData.Premio || '')}
              onChange={(e) => handleFieldChange('premioTotal', e.target.value)}
              placeholder="0.00"
            />
            {(editedData.premioTotal || editedData.montoTotal || editedData.premio || editedData.Premio) && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(editedData.premioTotal || editedData.montoTotal || editedData.premio || editedData.Premio)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Información del Vehículo
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Marca del Vehículo
              {getFieldStatus('vehiculoMarca') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              value={findVehicleField('vehiculoMarca')}
              onChange={(e) => handleFieldChange('vehiculoMarca', e.target.value)}
              placeholder="Marca del vehículo"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Modelo del Vehículo
              {getFieldStatus('vehiculoModelo') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              value={findVehicleField('vehiculoModelo')}
              onChange={(e) => handleFieldChange('vehiculoModelo', e.target.value)}
              placeholder="Modelo del vehículo"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Año del Vehículo
              {getFieldStatus('vehiculoAno') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              type="number"
              value={findVehicleField('vehiculoAno')}
              onChange={(e) => handleFieldChange('vehiculoAno', e.target.value)}
              placeholder="2024"
              min="1900"
              max="2030"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Patente
              {getFieldStatus('vehiculoPatente') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              value={findVehicleField('vehiculoPatente')}
              onChange={(e) => handleFieldChange('vehiculoPatente', e.target.value.toUpperCase())}
              placeholder="ABC1234"
              className="font-mono uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Número de Chasis
              {getFieldStatus('vehiculoChasis') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              value={findVehicleField('vehiculoChasis')}
              onChange={(e) => handleFieldChange('vehiculoChasis', e.target.value)}
              placeholder="Número de chasis"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Padrón
              {getFieldStatus('vehiculoPadron') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              value={findVehicleField('vehiculoPadron')}
              onChange={(e) => handleFieldChange('vehiculoPadron', e.target.value)}
              placeholder="Número de padrón"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Número de Motor
              {getFieldStatus('vehiculoMotor') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              value={findVehicleField('vehiculoMotor')}
              onChange={(e) => handleFieldChange('vehiculoMotor', e.target.value)}
              placeholder="Número de motor"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* 🔧 PANEL DE DEBUG (remover después) */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs">
        <strong>Debug Info Renovaciones:</strong>
        <pre>{JSON.stringify({
          extractedDataKeys: Object.keys(editedData).slice(0, 10),
          polizaNumbers: {
            polizaNumber: editedData.polizaNumber,
            polizaNumero: editedData.polizaNumero,
            numeroPoliza: editedData.numeroPoliza,
            NumeroPoliza: editedData.NumeroPoliza
          }
        }, null, 2)}</pre>
      </div>
    </div>
  );
}