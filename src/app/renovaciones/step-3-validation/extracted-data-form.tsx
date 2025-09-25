// src/app/renovaciones/step-3-validation/extracted-data-form.tsx
// ✅ CORREGIDO: Usar la misma lógica de extracción de datos que nueva póliza

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

  // ✅ CORREGIDO: Usar mappedData si está disponible, sino normalizedData, sino extractedData
  const dataSource = state.scan.mappedData && Object.keys(state.scan.mappedData).length > 0 
    ? state.scan.mappedData 
    : state.scan.normalizedData && Object.keys(state.scan.normalizedData).length > 0
    ? state.scan.normalizedData
    : state.scan.extractedData;

  console.log('🔍 EXTRACTED DATA FORM RENOVACIONES - Usando dataSource:', {
    mappedData: Object.keys(state.scan.mappedData || {}).length,
    normalizedData: Object.keys(state.scan.normalizedData || {}).length,
    extractedData: Object.keys(state.scan.extractedData || {}).length,
    elegido: dataSource === state.scan.mappedData ? 'mappedData' : 
             dataSource === state.scan.normalizedData ? 'normalizedData' : 'extractedData'
  });

  // Inicializar datos cuando lleguen del escaneo
  useEffect(() => {
    if (dataSource && Object.keys(dataSource).length > 0) {
      console.log('✅ EXTRACTED DATA FORM RENOVACIONES - Inicializando con datos:', dataSource);
      setEditedData(dataSource);
      setIsInitialized(true);
    }
  }, [dataSource]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Actualizar el estado global usando updateExtractedData
    if (updateExtractedData) {
      updateExtractedData({ [fieldName]: value });
    }
  };

  const getFieldStatus = (fieldName: string) => {
    const requiresAttention = state.scan.requiresAttention || [];
    const hasAttention = requiresAttention.some((item: { fieldName: string; }) => item.fieldName === fieldName);
    return hasAttention ? 'warning' : 'success';
  };

  const formatCurrency = (value: string | number) => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  // ✅ FUNCIÓN CORREGIDA: Limpiar números para inputs numéricos
  const cleanNumberForInput = (value: string | number) => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
    if (isNaN(numValue)) return '';
    // Devolver número limpio redondeado a 2 decimales para inputs type="number"
    return (Math.round(numValue * 100) / 100).toString();
  };

  // ✅ NUEVA FUNCIÓN: Extraer valor por cuota usando la misma lógica de nueva póliza
  const extractValorPorCuota = (data: any) => {
    if (!data) return "";
    
    console.log('🔍 RENOVACIONES - Buscando valor por cuota en:', data);
    
    // Buscar diferentes formatos según la compañía - IGUAL QUE NUEVA POLIZA
    const cuotaFields = [
      "pago.cuota_monto[1]",      // MAPFRE - primera cuota
      "pago.cuotas[0].prima",     // BSE - primera cuota
      "pago.prima_cuota[1]",      // SURA - primera cuota
      "pago.primera_cuota",       // Generic
      "valorPorCuota",            // Directo desde backend
      "valorCuota"                // Alternativa
    ];

    for (const field of cuotaFields) {
      if (data[field]) {
        const valor = data[field].toString();
        console.log(`✅ RENOVACIONES - Valor por cuota encontrado en ${field}:`, valor);
        return valor;
      }
    }
    
    // ✅ FALLBACK: Calcular desde el total si tenemos cantidad de cuotas
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
      
      {/* Información básica de la póliza */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Información de la Nueva Póliza
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Número de Póliza
              {getFieldStatus('numeroPoliza') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {getFieldStatus('numeroPoliza') === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </Label>
            <Input
              value={editedData.numeroPoliza || editedData.polizaNumber || editedData.NumeroPoliza || ''}
              onChange={(e) => handleFieldChange('numeroPoliza', e.target.value)}
              placeholder="Número de la nueva póliza"
              className="font-mono"
            />
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

      {/* Fechas de vigencia */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Vigencia de la Nueva Póliza
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Vigencia Desde
              {getFieldStatus('fechaDesde') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {getFieldStatus('fechaDesde') === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </Label>
            <Input
              type="date"
              value={editedData.fechaDesde || editedData.vigenciaDesde || editedData.FechaDesde || ''}
              onChange={(e) => handleFieldChange('fechaDesde', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Vigencia Hasta
              {getFieldStatus('fechaHasta') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {getFieldStatus('fechaHasta') === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </Label>
            <Input
              type="date"
              value={editedData.fechaHasta || editedData.vigenciaHasta || editedData.FechaHasta || ''}
              onChange={(e) => handleFieldChange('fechaHasta', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Información financiera */}
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
            {/* ✅ MOSTRAR VALOR FORMATEADO */}
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

      {/* Datos del vehículo */}
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
              value={editedData.vehiculoMarca || editedData.VehiculoMarca || ''}
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
              value={editedData.vehiculoModelo || editedData.VehiculoModelo || ''}
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
              value={editedData.vehiculoAno || editedData.VehiculoAño || ''}
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
              value={editedData.vehiculoPatente || editedData.Patente || ''}
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
              value={editedData.vehiculoChasis || editedData.VehiculoChasis || ''}
              onChange={(e) => handleFieldChange('vehiculoChasis', e.target.value)}
              placeholder="Número de chasis"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Número de Motor
              {getFieldStatus('vehiculoMotor') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              value={editedData.vehiculoMotor || editedData.VehiculoMotor || ''}
              onChange={(e) => handleFieldChange('vehiculoMotor', e.target.value)}
              placeholder="Número de motor"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* Debug en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer font-medium">Debug ExtractedData Renovaciones</summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
            {JSON.stringify({
              editedData,
              valorPorCuotaExtraido: extractValorPorCuota(editedData),
              dataSourceKeys: Object.keys(dataSource || {}),
              cuotaFields: [
                "pago.cuota_monto[1]",
                "pago.cuotas[0].prima", 
                "pago.prima_cuota[1]",
                "valorPorCuota",
                "valorCuota"
              ].map(field => ({ field, value: editedData[field] }))
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}