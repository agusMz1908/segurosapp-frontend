import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExtractedDataFormProps {
  hookInstance: any
}

export function ExtractedDataForm({ hookInstance }: ExtractedDataFormProps) {
  const { state, updateState } = hookInstance;
  const [editedData, setEditedData] = useState<any>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

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

  const formatFieldName = (fieldName: string) => {
    const translations: { [key: string]: string } = {
      polizaNumber: 'Número de Póliza',
      vigenciaDesde: 'Vigencia Desde',
      vigenciaHasta: 'Vigencia Hasta',
      prima: 'Prima (UYU)',
      vehiculoMarca: 'Marca del Vehículo',
      vehiculoModelo: 'Modelo del Vehículo',
      vehiculoAno: 'Año del Vehículo',
      vehiculoChasis: 'Número de Chasis',
      vehiculoMotor: 'Número de Motor',
      vehiculoPatente: 'Patente',
      aseguradoNombre: 'Nombre del Asegurado',
      aseguradoDocumento: 'Documento del Asegurado',
      aseguradoDepartamento: 'Departamento',
      aseguradoDireccion: 'Dirección',
      combustible: 'Combustible',
      destinoVehiculo: 'Destino del Vehículo',
      corredorNombre: 'Corredor',
      corredorNumero: 'Número de Corredor',
      medioPago: 'Medio de Pago',
      cantidadCuotas: 'Cantidad de Cuotas'
    };
    return translations[fieldName] || fieldName;
  };

  // Definir campos principales y secundarios
  const mainFields = [
    'polizaNumber', 'vigenciaDesde', 'vigenciaHasta', 'prima',
    'vehiculoMarca', 'vehiculoModelo', 'vehiculoAno', 'vehiculoChasis',
    'aseguradoNombre', 'aseguradoDocumento'
  ];

  const additionalFields = [
    'vehiculoMotor', 'vehiculoPatente', 'aseguradoDepartamento', 
    'aseguradoDireccion', 'combustible', 'destinoVehiculo',
    'corredorNombre', 'corredorNumero', 'medioPago', 'cantidadCuotas'
  ];

  // Si no hay datos escaneados y no estamos cargando, mostrar mensaje
  if (!isInitialized && state.scan.status !== 'scanning' && state.scan.status !== 'uploading') {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">No hay datos para mostrar</p>
          <p className="text-sm">Sube y procesa un documento primero</p>
        </div>
      </div>
    );
  }

  // Mostrar loading cuando está escaneando
  if (state.scan.status === 'scanning' || state.scan.status === 'uploading') {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {state.scan.status === 'uploading' ? 'Subiendo documento...' : 'Extrayendo datos con IA...'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Este proceso puede tomar unos momentos
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si hay problemas
  if (state.scan.status === 'error') {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 dark:text-red-400">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-lg font-medium mb-2">Error procesando documento</p>
          <p className="text-sm">{state.scan.errorMessage || 'Error desconocido'}</p>
        </div>
      </div>
    );
  }

  const renderField = (key: string, value: any) => {
    const status = getFieldStatus(key);
    const hasWarning = status === 'warning';
    const requiresAttention = state.scan.requiresAttention || [];
    
    return (
      <div key={key} className="space-y-2">
        <Label 
          htmlFor={key}
          className={`flex items-center gap-2 ${hasWarning ? 'text-yellow-700 dark:text-yellow-300' : ''}`}
        >
          {formatFieldName(key)}
          {hasWarning && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          {status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
        </Label>
        <Input
          id={key}
          value={editedData[key] || value || ''}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          className={hasWarning ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20' : ''}
          placeholder={`Ingresa ${formatFieldName(key).toLowerCase()}`}
        />
        {hasWarning && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            {requiresAttention.find((item: { fieldName: string; reason: string; }) => item.fieldName === key)?.reason}
          </p>
        )}
      </div>
    );
  };

  const fieldsToShow = showAllFields ? [...mainFields, ...additionalFields] : mainFields;
  const availableFields = fieldsToShow.filter(field => field in editedData);

  return (
    <div className="space-y-4">
      {/* Campos principales */}
      <div className="grid md:grid-cols-2 gap-4">
        {availableFields.map(key => renderField(key, editedData[key]))}
      </div>

      {/* Botón para mostrar/ocultar campos adicionales */}
      {additionalFields.some(field => field in editedData) && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAllFields(!showAllFields)}
            className="flex items-center gap-2"
          >
            {showAllFields ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showAllFields ? 'Ocultar campos adicionales' : 'Mostrar todos los campos'}
          </Button>
        </div>
      )}
      
      {/* Información adicional si hay datos */}
      {isInitialized && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Los datos fueron extraídos automáticamente del documento usando Azure Document Intelligence. 
            Puedes editarlos si es necesario antes de continuar.
          </p>
          {Object.keys(editedData).length > mainFields.length && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Se extrajeron {Object.keys(editedData).length} campos en total del documento.
            </p>
          )}
        </div>
      )}
    </div>
  );
}