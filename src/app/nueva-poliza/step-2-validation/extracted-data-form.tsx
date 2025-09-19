import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ExtractedDataFormProps {
  hookInstance: any
}

export function ExtractedDataForm({ hookInstance }: ExtractedDataFormProps) {
  const { state, updateState } = hookInstance;
  const [editedData, setEditedData] = useState<any>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar datos cuando lleguen del escaneo
  useEffect(() => {
    if (state.scan.extractedData && Object.keys(state.scan.extractedData).length > 0) {
      setEditedData(state.scan.extractedData);
      setIsInitialized(true);
    }
  }, [state.scan.extractedData]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Actualizar el estado global
    updateState({
      scan: {
        ...state.scan,
        extractedData: {
          ...state.scan.extractedData,
          [fieldName]: value
        }
      }
    });
  };

  const getFieldStatus = (fieldName: string) => {
    const requiresAttention = state.scan.requiresAttention || [];
    const hasAttention = requiresAttention.some((item: { fieldName: string; }) => item.fieldName === fieldName);
    return hasAttention ? 'warning' : 'success';
  };

  const formatCurrency = (value: string | number) => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 2
    }).format(numValue);
  };

  const formatNumberWithDecimals = (value: string | number) => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
    return new Intl.NumberFormat('es-UY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Esperando datos del escaneo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Información de la Póliza */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Número de Póliza
            {getFieldStatus('polizaNumber') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {getFieldStatus('polizaNumber') === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          </Label>
          <Input
            value={editedData.polizaNumber || ''}
            onChange={(e) => handleFieldChange('polizaNumber', e.target.value)}
            placeholder="Ingresa número de póliza"
            maxLength={50}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Vigencia Desde
            {getFieldStatus('vigenciaDesde') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <Input
            type="date"
            value={editedData.vigenciaDesde || ''}
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
            value={editedData.vigenciaHasta || ''}
            onChange={(e) => handleFieldChange('vigenciaHasta', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Prima (UYU)
            {getFieldStatus('prima') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <Input
            value={editedData.prima || ''}
            onChange={(e) => handleFieldChange('prima', e.target.value)}
            placeholder="0"
          />
          {editedData.prima && (
            <p className="text-xs text-muted-foreground">
              {formatCurrency(editedData.prima)}
            </p>
          )}
        </div>
      </div>

      {/* Información Financiera */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Cantidad de Cuotas
            {getFieldStatus('cantidadCuotas') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <Input
            type="number"
            value={editedData.cantidadCuotas || ''}
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
            value={editedData.valorPorCuota || ''}
            onChange={(e) => handleFieldChange('valorPorCuota', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Premio Total
            {getFieldStatus('premioTotal') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <Input
            value={editedData.premioTotal || ''}
            onChange={(e) => handleFieldChange('premioTotal', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Datos del Vehículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Marca del Vehículo
            {getFieldStatus('vehiculoMarca') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <Input
            value={editedData.vehiculoMarca || ''}
            onChange={(e) => handleFieldChange('vehiculoMarca', e.target.value)}
            placeholder="Ingresa marca del vehículo"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Modelo del Vehículo
            {getFieldStatus('vehiculoModelo') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <Input
            value={editedData.vehiculoModelo || ''}
            onChange={(e) => handleFieldChange('vehiculoModelo', e.target.value)}
            placeholder="Ingresa modelo del vehículo"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Año del Vehículo
            {getFieldStatus('vehiculoAno') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <Input
            type="number"
            value={editedData.vehiculoAno || ''}
            onChange={(e) => handleFieldChange('vehiculoAno', e.target.value)}
            placeholder="2024"
            min="1900"
            max="2030"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Número de Chasis
            {getFieldStatus('vehiculoChasis') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <Input
            value={editedData.vehiculoChasis || ''}
            onChange={(e) => handleFieldChange('vehiculoChasis', e.target.value)}
            placeholder="Ingresa número de chasis"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Número de Motor
            {getFieldStatus('vehiculoMotor') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <Input
            value={editedData.vehiculoMotor || ''}
            onChange={(e) => handleFieldChange('vehiculoMotor', e.target.value)}
            placeholder="Ingresa número de motor"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Patente
            {getFieldStatus('vehiculoPatente') === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <Input
            value={editedData.vehiculoPatente || ''}
            onChange={(e) => handleFieldChange('vehiculoPatente', e.target.value)}
            placeholder="Ingresa patente"
          />
        </div>
      </div>
    </div>
  );
}