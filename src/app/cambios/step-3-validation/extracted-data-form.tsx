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
    
    let stringValue = typeof value === 'string' ? value : value.toString();

    if (stringValue.includes('.') && stringValue.includes(',')) {
      stringValue = stringValue.replace(/\./g, '').replace(',', '.');
    } else if (stringValue.includes(',') && !stringValue.includes('.')) {
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
    if (stringValue.includes('.') && stringValue.includes(',')) {
      stringValue = stringValue.replace(/\./g, '').replace(',', '.');
    }
    else if (stringValue.includes(',') && !stringValue.includes('.')) {
      const parts = stringValue.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        stringValue = stringValue.replace(',', '.');
      }
    }

    const numValue = parseFloat(stringValue.replace(/[^\d.-]/g, ''));
    
    if (isNaN(numValue)) {
      return '';
    }

    const result = numValue.toString();
    return result;
  };

  // 🆕 Función mejorada para encontrar y formatear fechas
  const findDateField = (fieldType: string) => {
    let possibleFields: string[] = [];
    
    switch(fieldType) {
      case 'vigenciaDesde':
        possibleFields = [
          'vigenciaDesde', 'fechaDesde', 'FechaDesde', 
          'polizaVigenciaDesde', 'poliza.vigencia_desde', 'fecha_desde',
          'poliza_vigencia_desde', 'vigencia_desde'
        ];
        break;
      case 'vigenciaHasta':
        possibleFields = [
          'vigenciaHasta', 'fechaHasta', 'FechaHasta', 
          'polizaVigenciaHasta', 'poliza.vigencia_hasta', 'fecha_hasta',
          'poliza_vigencia_hasta', 'vigencia_hasta'
        ];
        break;
    }
    
    for (const field of possibleFields) {
      const value = editedData[field];
      if (value && value.toString().trim()) {
        const dateValue = value.toString().trim();
        
        // Si ya está en formato YYYY-MM-DD, devolverlo tal como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        
        // Intentar parsear y formatear la fecha
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        } catch (error) {
          console.warn(`Error parseando fecha ${field}:`, error);
        }
      }
    }
    
    return '';
  };

  const findPolizaNumber = () => {
    const possibleFields = [
      'polizaNumber',
      'polizaNumero', 
      'numeroPoliza',
      'NumeroPoliza',
      'poliza_numero',
      'poliza.numero'
    ];
    
    for (const field of possibleFields) {
      if (editedData[field] && editedData[field].toString().trim()) {
        let polizaNumber = editedData[field].toString().trim();

        polizaNumber = polizaNumber
          .replace(/^(nro\.\s*|nro\s*|número\s*|numero\s*|póliza\s*nro\.\s*)/i, '')
          .replace(/^:\s*/, '')
          .replace(/^\s*:\s*/, '')
          .trim();
        
        return polizaNumber;
      }
    }
    
    return '';
  };

  const findVehicleField = (fieldName: string) => {
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
          padronValue = padronValue.replace(/^(PADRÓN\.\s*|PADRON\.\s*|PADRÓN\s*|PADRON\s*)/i, '').trim();
          return padronValue;
        }
      }

      return '';
    }
    
    const possibleFields = [
      fieldName,
      `vehiculo${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`,
      `Vehiculo${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`,
      fieldName.replace('vehiculo', ''),
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
    ];

    for (const field of possibleFields) {
      if (editedData[field] && editedData[field].toString().trim()) {
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

  const findFinancialField = (fieldType: string) => {
    let possibleFields: string[] = [];
    
    switch(fieldType) {
      case 'prima':
        possibleFields = ['prima', 'premio', 'Premio', 'polizaPremio', 'financiero.premio_total', 'costo.premio_total', 'poliza.premio'];
        break;
      case 'premioTotal':
        possibleFields = ['premioTotal', 'montoTotal', 'premio', 'Premio', 'polizaPremio', 'financiero.premio_total', 'poliza.premio'];
        break;
      case 'valorPorCuota':
        possibleFields = ['valorPorCuota', 'valorCuota', 'pago.cuota_monto[1]', 'pago.primera_cuota', 'valor_cuota'];
        break;
      case 'cantidadCuotas':
        possibleFields = ['cantidadCuotas', 'CantidadCuotas', 'cantidad_cuotas', 'pago.cantidad_cuotas'];
        break;
    }
    
    for (const field of possibleFields) {
      if (editedData[field] && editedData[field].toString().trim() && editedData[field] !== '0') {
        return editedData[field].toString();
      }
    }

    return '';
  };

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
              value={cleanNumberForInput(findFinancialField('prima'))}
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
              value={findDateField('vigenciaDesde')}
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
              value={findDateField('vigenciaHasta')}
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
              value={findFinancialField('cantidadCuotas')}
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
              value={cleanNumberForInput(findFinancialField('valorPorCuota'))}
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
              value={cleanNumberForInput(findFinancialField('premioTotal'))}
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
    </div>
  );
}