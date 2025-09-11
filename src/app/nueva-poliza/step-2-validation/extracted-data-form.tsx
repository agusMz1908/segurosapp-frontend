import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useNuevaPoliza } from '../../../hooks/use-nueva-poliza';

export function ExtractedDataForm() {
  const { state, updateState } = useNuevaPoliza();
  const [editedData, setEditedData] = useState<any>({});

  // Mock de datos extraídos si no existen
  const mockExtractedData = {
    polizaNumber: "POL-2024-001",
    vigenciaDesde: "2024-01-15",
    vigenciaHasta: "2024-12-15",
    prima: "45000",
    vehiculoMarca: "Toyota",
    vehiculoModelo: "Corolla",
    vehiculoAno: "2020",
    vehiculoChasis: "JTDBR32E400123456",
    vehiculoPatente: "ABC1234",
    aseguradoNombre: state.context.clienteInfo?.nombre || "Cliente Seleccionado",
    aseguradoDocumento: state.context.clienteInfo?.documento || "12345678-9",
  };

  const displayData = state.scan.extractedData || mockExtractedData;
  const requiresAttention = state.scan.requiresAttention || [
    { fieldName: 'vehiculoChasis', reason: 'Confianza baja', severity: 'warning' },
    { fieldName: 'prima', reason: 'Valor no estándar', severity: 'info' }
  ];

  // Inicializar datos editados
  useEffect(() => {
    if (displayData) {
      setEditedData(displayData);
    }
  }, [displayData]);

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
      vehiculoPatente: 'Patente',
      aseguradoNombre: 'Nombre del Asegurado',
      aseguradoDocumento: 'Documento del Asegurado',
    };
    return translations[fieldName] || fieldName;
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(displayData).map(([key, value]) => {
          const status = getFieldStatus(key);
          const hasWarning = status === 'warning';
          
          return (
            <div key={key} className="space-y-2">
              <Label 
                htmlFor={key}
                className={`flex items-center gap-2 ${hasWarning ? 'text-yellow-700' : ''}`}
              >
                {formatFieldName(key)}
                {hasWarning && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                {status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              </Label>
              <Input
                id={key}
                value={editedData[key] || value || ''}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                className={hasWarning ? 'border-yellow-300 bg-yellow-50' : ''}
                placeholder={`Ingresa ${formatFieldName(key).toLowerCase()}`}
              />
              {hasWarning && (
                <p className="text-xs text-yellow-600">
                  {requiresAttention.find((item: { fieldName: string; }) => item.fieldName === key)?.reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}