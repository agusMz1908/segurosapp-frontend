import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ExtractedDataFormProps {
  hookInstance: any
}

export function ExtractedDataForm({ hookInstance }: ExtractedDataFormProps) {
  const { state, updateExtractedData } = hookInstance;
  const [editedData, setEditedData] = useState<any>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Usar extractedData directamente
  const dataSource = state.scan.extractedData || {};

  useEffect(() => {
    if (dataSource && Object.keys(dataSource).length > 0) {
      setEditedData(dataSource);
      setIsInitialized(true);
    }
  }, [dataSource]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
    
    // 🔧 FIX CRÍTICO: Usar updateExtractedData en lugar de updateState
    if (updateExtractedData) {
      updateExtractedData({ [fieldName]: value });
    }
  };

  const getFieldStatus = (fieldName: string) => {
    const requiresAttention = state.scan.requiresAttention || [];
    const hasAttention = requiresAttention.some((item: { fieldName: string; }) => item.fieldName === fieldName);
    return hasAttention ? 'warning' : 'success';
  };

  // 🔧 FIX BSE/SURA: Funciones mejoradas de manejo de números
  const formatCurrency = (value: string | number) => {
    if (!value) return '';
    
    let stringValue = typeof value === 'string' ? value : value.toString();
    
    // 🔧 FIX BSE/SURA: Manejar formato uruguayo
    if (stringValue.includes('.') && stringValue.includes(',')) {
      // Formato uruguayo: 10.683,00 → 10683.00
      stringValue = stringValue.replace(/\./g, '').replace(',', '.');
    } else if (stringValue.includes(',') && !stringValue.includes('.')) {
      // Solo coma: 10683,00 → 10683.00
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
    
    // 🔧 FIX BSE/SURA: Manejar formato uruguayo con puntos y comas
    console.log('🔍 CAMBIOS BSE/SURA - Procesando número:', stringValue);
    
    // Si tiene tanto puntos como comas (formato uruguayo: 10.683,00)
    if (stringValue.includes('.') && stringValue.includes(',')) {
      // Remover puntos (separadores de miles) y cambiar coma por punto decimal
      stringValue = stringValue.replace(/\./g, '').replace(',', '.');
      console.log('🔧 CAMBIOS BSE/SURA - Formato uruguayo detectado, convertido a:', stringValue);
    }
    // Si solo tiene coma (podría ser decimal europeo: 10683,00)
    else if (stringValue.includes(',') && !stringValue.includes('.')) {
      // Verificar si es separador decimal (máximo 2 dígitos después de la coma)
      const parts = stringValue.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        stringValue = stringValue.replace(',', '.');
        console.log('🔧 CAMBIOS BSE/SURA - Coma decimal detectada, convertida a:', stringValue);
      }
    }
    
    // Limpiar caracteres no numéricos excepto punto decimal
    const numValue = parseFloat(stringValue.replace(/[^\d.-]/g, ''));
    
    if (isNaN(numValue)) {
      console.log('❌ CAMBIOS BSE/SURA - No se pudo convertir a número:', stringValue);
      return '';
    }
    
    // Mantener precisión decimal completa (no redondear a centavos)
    const result = numValue.toString();
    console.log('✅ CAMBIOS BSE/SURA - Número final:', result);
    return result;
  };

  // 🔧 FUNCIONES AUXILIARES PARA BUSCAR CAMPOS (iguales que Renovaciones)
  const findPolizaNumber = () => {
    const possibleFields = [
      'polizaNumber',
      'polizaNumero', 
      'numeroPoliza',
      'NumeroPoliza',
      'poliza_numero'
    ];
    
    for (const field of possibleFields) {
      if (editedData[field] && editedData[field].toString().trim()) {
        let polizaNumber = editedData[field].toString().trim();
        
        // Quitar prefijos y caracteres no deseados
        polizaNumber = polizaNumber
          .replace(/^(nro\.\s*|nro\s*|número\s*|numero\s*)/i, '')
          .replace(/^:\s*/, '')
          .replace(/^\s*:\s*/, '')
          .trim();
        
        return polizaNumber;
      }
    }
    
    return '';
  };

  const findVehicleField = (fieldName: string) => {
    // Mapeo específico para padrón
    if (fieldName === 'vehiculoPadron') {
      const padronFields = [
        'vehiculoPadron',
        'vehiculo.padron',
        'padron',
        'PADRON',
        'Padron'
      ];
      
      for (const field of padronFields) {
        if (editedData[field] && editedData[field].toString().trim()) {
          let padronValue = editedData[field].toString().trim();
          // Limpiar prefijos específicos del padrón
          padronValue = padronValue.replace(/^(PADRÓN\.\s*|PADRON\.\s*|PADRÓN\s*|PADRON\s*)/i, '').trim();
          console.log(`🎯 CAMBIOS FIX - Padrón encontrado en campo '${field}':`, editedData[field], '→ limpiado:', padronValue);
          return padronValue;
        }
      }
      
      console.log('❌ CAMBIOS FIX - No se encontró padrón en ningún campo');
      return '';
    }
    
    // Lógica original para otros campos de vehículo
    const possibleFields = [
      fieldName,
      `vehiculo${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`,
      `Vehiculo${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`,
      fieldName.replace('vehiculo', ''),
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
    ];

    for (const field of possibleFields) {
      if (editedData[field] && editedData[field].toString().trim()) {
        console.log(`🎯 CAMBIOS FIX - ${fieldName} encontrado en campo '${field}':`, editedData[field]);
        return editedData[field].toString();
      }
    }
    
    return '';
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Esperando datos del escaneo de cambios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Información de la Póliza Modificada
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Número de Póliza
              {getFieldStatus('polizaNumber') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {getFieldStatus('polizaNumber') === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </Label>
            <Input
              value={findPolizaNumber()}
              onChange={(e) => handleFieldChange('polizaNumber', e.target.value)}
              placeholder="Número de póliza modificada"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Prima (UYU)
              {getFieldStatus('prima') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              type="number"
              step="0.01"
              value={cleanNumberForInput(editedData.prima || editedData.premio || editedData.Premio || '')}
              onChange={(e) => handleFieldChange('prima', e.target.value)}
              placeholder="0.00"
            />
            {(editedData.prima || editedData.premio || editedData.Premio) && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(editedData.prima || editedData.premio || editedData.Premio)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Vigencia de la Póliza
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Vigencia Desde
              {getFieldStatus('vigenciaDesde') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              type="date"
              value={editedData.vigenciaDesde || editedData.fechaDesde || editedData.FechaDesde || ''}
              onChange={(e) => handleFieldChange('vigenciaDesde', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Vigencia Hasta
              {getFieldStatus('vigenciaHasta') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>
            <Input
              type="date"
              value={editedData.vigenciaHasta || editedData.fechaHasta || editedData.FechaHasta || ''}
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
              value={cleanNumberForInput(editedData.valorPorCuota || editedData.valorCuota || '')}
              onChange={(e) => handleFieldChange('valorPorCuota', e.target.value)}
              placeholder="0.00"
            />
            {(editedData.valorPorCuota || editedData.valorCuota) && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(editedData.valorPorCuota || editedData.valorCuota)}
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
        <strong>Debug Info Cambios:</strong>
        <pre>{JSON.stringify({
          extractedDataKeys: Object.keys(editedData).slice(0, 10),
          polizaNumbers: {
            polizaNumber: editedData.polizaNumber,
            polizaNumero: editedData.polizaNumero,
            numeroPoliza: editedData.numeroPoliza,
            NumeroPoliza: editedData.NumeroPoliza
          },
          vehiclePadron: {
            vehiculoPadron: editedData.vehiculoPadron,
            'vehiculo.padron': editedData['vehiculo.padron'],
            padron: editedData.padron
          }
        }, null, 2)}</pre>
      </div>
    </div>
  );
}