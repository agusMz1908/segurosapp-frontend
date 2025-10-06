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

  const extractValorPorCuota = (data: any) => {
    if (!data) return "";
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
        return valor;
      }
    }
    
    const total = data.premioTotal || data.montoTotal || data.premio || data["financiero.premio_total"];
    const cuotas = parseInt(data.cantidadCuotas || "1");
    
    if (total && cuotas > 1) {
      const totalNum = parseFloat(total.toString().replace(/[^\d.-]/g, ''));
      if (!isNaN(totalNum)) {
        const valorCalculado = totalNum / cuotas;
        return valorCalculado.toString();
      }
    }

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
            <Input
              value={findPolizaNumber()}
              onChange={(e) => handleFieldChange('polizaNumber', e.target.value)}
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
    </div>
  );
}