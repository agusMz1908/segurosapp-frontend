// src/app/renovaciones/step-3-validation/extracted-data-form.tsx
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
    
    // Actualizar el estado global usando updateExtractedData
    updateExtractedData({ [fieldName]: value });
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
      minimumFractionDigits: 2
    }).format(numValue);
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
              value={editedData.numeroPoliza || editedData.polizaNumber || ''}
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
              value={editedData.premio || editedData.prima || ''}
              onChange={(e) => handleFieldChange('premio', e.target.value)}
              placeholder="0.00"
            />
            {(editedData.premio || editedData.prima) && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(editedData.premio || editedData.prima)}
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
              value={editedData.fechaDesde || editedData.vigenciaDesde || ''}
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
              value={editedData.fechaHasta || editedData.vigenciaHasta || ''}
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
              type="number"
              step="0.01"
              value={editedData.valorPorCuota || editedData.valorCuota || ''}
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
              value={editedData.premioTotal || editedData.montoTotal || editedData.premio || ''}
              onChange={(e) => handleFieldChange('premioTotal', e.target.value)}
              placeholder="0.00"
            />
            {(editedData.premioTotal || editedData.montoTotal || editedData.premio) && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(editedData.premioTotal || editedData.montoTotal || editedData.premio)}
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
              value={editedData.vehiculoMarca || ''}
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
              value={editedData.vehiculoModelo || ''}
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
              value={editedData.vehiculoAno || ''}
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
              value={editedData.vehiculoPatente || ''}
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
              value={editedData.vehiculoChasis || ''}
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
              value={editedData.vehiculoMotor || ''}
              onChange={(e) => handleFieldChange('vehiculoMotor', e.target.value)}
              placeholder="Número de motor"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* Observaciones específicas de renovación */}
      <div className="space-y-2">
        <Label htmlFor="observaciones" className="text-lg font-semibold">
          Observaciones de la Renovación
        </Label>
        <textarea
          id="observaciones"
          className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
          value={editedData.observaciones || ''}
          onChange={(e) => handleFieldChange('observaciones', e.target.value)}
          placeholder="Observaciones específicas para esta renovación..."
        />
      </div>

      {/* Información sobre la renovación */}
      {state.polizaAnterior && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Información de Renovación
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Esta póliza renovará a la póliza <strong>{state.polizaAnterior.numero}</strong> del cliente{' '}
            <strong>{state.polizaAnterior.cliente.nombre}</strong>. La póliza anterior será marcada como 
            "Antecedente" y mantendrá la referencia al mismo contexto (cliente, compañía, sección).
          </p>
        </div>
      )}

      {/* Campos que requieren atención */}
      {state.scan.requiresAttention && state.scan.requiresAttention.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Campos que Requieren Atención
          </h4>
          <div className="space-y-1">
            {state.scan.requiresAttention.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                <span className="text-yellow-800 dark:text-yellow-200">
                  <strong>{item.fieldName}:</strong> {item.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}