import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useMasterData } from '../../../hooks/use-master-data';
import { MasterDataSelector } from '@/components/ui/master-data-selector';

interface MasterDataFormProps {
  hookInstance: any;
}

export function MasterDataForm({ hookInstance }: MasterDataFormProps) {
  const { state, updateState } = hookInstance;
  const { getMasterDataByType, loading: masterDataLoading } = useMasterData();
  
  const [combustibles, setCombustibles] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [calidades, setCalidades] = useState<any[]>([]);
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [mediospago, setMediosPago] = useState<any[]>([]);
  const [corredores, setCorredores] = useState<any[]>([]);

  const formData = state.masterData || {
    combustibleId: '',
    categoriaId: '',
    destinoId: '',
    departamentoId: '',
    corredorId: '',
    calidadId: '',
    tarifaId: '',
    medioPagoId: '',
    cantidadCuotas: 1,
    observaciones: ''
  };

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [
          combustiblesData, 
          categoriasData, 
          destinosData,
          calidadesData,
          tarifasData,
          departamentosData,
          mediosPagoData,
          corredoresData
        ] = await Promise.all([
          getMasterDataByType('combustibles'),
          getMasterDataByType('categorias'),
          getMasterDataByType('destinos'),
          getMasterDataByType('calidades'),
          getMasterDataByType('tarifas'),
          getMasterDataByType('departamentos'),
          getMasterDataByType('medios-pago'),
          getMasterDataByType('corredores'),
        ]);
        
        setCombustibles(combustiblesData);
        setCategorias(categoriasData);
        setDestinos(destinosData);
        setCalidades(calidadesData);
        setTarifas(tarifasData);
        setDepartamentos(departamentosData);
        setMediosPago(mediosPagoData);
        setCorredores(corredoresData);
      } catch (error) {
        console.error('Error loading master data:', error);
      }
    };

    loadMasterData();
  }, [getMasterDataByType]);

  useEffect(() => {
    if (state.scan.mappedData && Object.keys(state.scan.mappedData).length > 0) {
      const suggestions = state.scan.mappedData.suggestions || [];
      const newFormData = { ...formData };

      suggestions.forEach((suggestion: any) => {
        if (suggestion.fieldName === 'combustible' && suggestion.suggestedValue) {
          newFormData.combustibleId = suggestion.suggestedValue;
        }
        if (suggestion.fieldName === 'categoria' && suggestion.suggestedValue) {
          newFormData.categoriaId = suggestion.suggestedValue;
        }
      });

      updateState({
        masterData: newFormData
      });
    }
  }, [state.scan.mappedData]);

  const handleFieldChange = (fieldName: string, value: string | number) => {
    const newFormData = {
      ...formData,
      [fieldName]: value
    };
    
    updateState({
      masterData: newFormData
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Datos Maestros</CardTitle>
        <CardDescription>
          Completa la información requerida para crear la póliza
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <MasterDataSelector
          label="Tipo de Combustible"
          value={formData.combustibleId}
          onValueChange={(value) => handleFieldChange('combustibleId', value)}
          options={combustibles}
          required={false}
          loading={masterDataLoading}
          placeholder="Seleccionar combustible..."
        />

        <MasterDataSelector
          label="Categoría"
          value={formData.categoriaId}
          onValueChange={(value) => handleFieldChange('categoriaId', value)}
          options={categorias}
          required={false}
          loading={masterDataLoading}
          placeholder="Seleccionar categoría..."
        />

        <MasterDataSelector
          label="Destino del Vehículo"
          value={formData.destinoId}
          onValueChange={(value) => handleFieldChange('destinoId', value)}
          options={destinos}
          required={false}
          loading={masterDataLoading}
          placeholder="Seleccionar destino..."
        />

        <MasterDataSelector
          label="Departamento"
          value={formData.departamentoId}
          onValueChange={(value) => handleFieldChange('departamentoId', value)}
          options={departamentos}
          required={false}
          loading={masterDataLoading}
          placeholder="Seleccionar departamento..."
        />

        <MasterDataSelector
          label="Calidad"
          value={formData.calidadId}
          onValueChange={(value) => handleFieldChange('calidadId', value)}
          options={calidades}
          required={false}
          loading={masterDataLoading}
          placeholder="Seleccionar calidad..."
        />

        <MasterDataSelector
          label="Tarifa"
          value={formData.tarifaId}
          onValueChange={(value) => handleFieldChange('tarifaId', value)}
          options={tarifas}
          required={false}
          loading={masterDataLoading}
          placeholder="Seleccionar tarifa..."
        />

        <MasterDataSelector
          label="Corredor"
          value={formData.corredorId}
          onValueChange={(value) => handleFieldChange('corredorId', value)}
          options={corredores.map(item => ({
            ...item,
            displayName: `${item.nombre}${item.codigo ? ` (${item.codigo})` : ''}`
          }))}
          required={false}
          loading={masterDataLoading}
          placeholder="Seleccionar corredor..."
        />

        <MasterDataSelector
          label="Medio de Pago"
          value={formData.medioPagoId}
          onValueChange={(value) => handleFieldChange('medioPagoId', value)}
          options={mediospago.map(item => ({
            id: item.code || item.id,
            nombre: item.nombre,
            codigo: item.code
          }))}
          required={false}
          loading={masterDataLoading}
          placeholder="Seleccionar medio de pago..."
        />

        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <textarea
            id="observaciones"
            className="w-full p-2 border rounded-md resize-none dark:bg-gray-800 dark:border-gray-600"
            rows={3}
            placeholder="Observaciones adicionales..."
            value={formData.observaciones}
            onChange={(e) => handleFieldChange('observaciones', e.target.value)}
          />
        </div>
        
        {masterDataLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando datos maestros...
          </div>
        )}
      </CardContent>
    </Card>
  );
}