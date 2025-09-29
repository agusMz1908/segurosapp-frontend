import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useMasterData } from '../../../hooks/use-master-data';
import { intelligentMapping, type MasterDataFormData, type MasterDataSets } from '@/utils/intelligent-mapping';
import type { MasterDataItem } from '@/types/master-data';

interface MasterDataFormProps {
  hookInstance: any;
}

const ControlledSelect = ({ 
  label, 
  value, 
  onChange, 

  options, 
  placeholder,
  required = false,
  loading = false 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: MasterDataItem[];
  placeholder: string;
  required?: boolean;
  loading?: boolean;
}) => {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500">*</span>}
        {value && <CheckCircle className="h-4 w-4 text-green-500" />}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </label>
      <select
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">{placeholder}</option>
        {options.map((item, index) => (
          <option key={`${item.id}-${index}`} value={item.id}>
            {item.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export function MasterDataForm({ hookInstance }: MasterDataFormProps) {
  const { state, updateState } = hookInstance;
  const { getMasterDataByType, loading: masterDataLoading } = useMasterData();

  const [combustibles, setCombustibles] = useState<MasterDataItem[]>([]);
  const [categorias, setCategorias] = useState<MasterDataItem[]>([]);
  const [destinos, setDestinos] = useState<MasterDataItem[]>([]);
  const [departamentos, setDepartamentos] = useState<MasterDataItem[]>([]);
  const [calidades, setCalidades] = useState<MasterDataItem[]>([]);
  const [tarifas, setTarifas] = useState<MasterDataItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [autoMappingExecuted, setAutoMappingExecuted] = useState(false);

  const formData = state.masterData || {
    combustibleId: '',
    categoriaId: '',
    destinoId: '',
    departamentoId: '',
    calidadId: '',
    tarifaId: '',
    cantidadCuotas: 1,
    observaciones: ''
  };

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoadingData(true);
        const companiaId = state.context?.companiaId;    
        const [
          combustiblesData, 
          categoriasData, 
          destinosData,
          departamentosData,
          calidadesData,
          tarifasData
        ] = await Promise.all([
          getMasterDataByType('combustibles'),
          getMasterDataByType('categorias'),
          getMasterDataByType('destinos'),
          getMasterDataByType('departamentos'),
          getMasterDataByType('calidades'),
          getMasterDataByType('tarifas', companiaId)
        ]);
        
        setCombustibles(combustiblesData);
        setCategorias(categoriasData);
        setDestinos(destinosData);
        setDepartamentos(departamentosData);
        setCalidades(calidadesData);
        setTarifas(tarifasData);
      } catch (error) {
        console.error('❌ RENOVACIONES - Error loading master data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadMasterData();
  }, [getMasterDataByType, state.context?.companiaId]);

  const executeIntelligentMapping = useCallback(() => {
    if (!state.scan?.extractedData || Object.keys(state.scan.extractedData).length === 0) {
      console.log('⚠️ RENOVACIONES - No hay datos extraídos para mapear');
      return;
    }

    const companiaId = state.context?.companiaId;
    const currentFormData: MasterDataFormData = {
      combustibleId: formData.combustibleId || '',
      destinoId: formData.destinoId || '',
      departamentoId: formData.departamentoId || '',
      calidadId: formData.calidadId || '',
      categoriaId: formData.categoriaId || '',
      tarifaId: formData.tarifaId || '',
    };

    const masterDataSets: MasterDataSets = {
      combustibles,
      destinos,
      departamentos,
      calidades,
      categorias,
      tarifas
    };

    const mappedData = intelligentMapping(
      state.scan.extractedData,
      currentFormData,
      masterDataSets
    );

    const hasChanges = Object.keys(mappedData).some(key => 
      mappedData[key as keyof MasterDataFormData] !== currentFormData[key as keyof MasterDataFormData]
    );

    if (hasChanges) {
      const updatedFormData = {
        ...formData, 
        ...mappedData 
      };

      updateState((prevState: any) => {
        const newState = {
          ...prevState,
          masterData: updatedFormData
        };

        return newState;
      });

      const mappedFields = [];
      if (mappedData.combustibleId !== currentFormData.combustibleId) mappedFields.push('Combustible');
      if (mappedData.destinoId !== currentFormData.destinoId) mappedFields.push('Destino');
      if (mappedData.departamentoId !== currentFormData.departamentoId) mappedFields.push('Departamento');
      if (mappedData.calidadId !== currentFormData.calidadId) mappedFields.push('Calidad');
      if (mappedData.categoriaId !== currentFormData.categoriaId) mappedFields.push('Categoría');
      if (mappedData.tarifaId !== currentFormData.tarifaId) mappedFields.push('Tarifa');
      setAutoMappingExecuted(true);
    }
  }, [
    loadingData, 
    autoMappingExecuted,
    combustibles.length, 
    destinos.length, 
    departamentos.length, 
    calidades.length,
    categorias.length,
    tarifas.length,
    state.scan?.extractedData, 
    formData,
    state.context?.companiaId,
    updateState
  ]);

  useEffect(() => {
    if (!loadingData && 
        !autoMappingExecuted && 
        combustibles.length > 0 && 
        state.scan?.extractedData) {
      executeIntelligentMapping();
    }
  }, [
    loadingData, 
    autoMappingExecuted,
    combustibles.length, 
    destinos.length, 
    departamentos.length, 
    calidades.length,
    categorias.length,
    tarifas.length,
    state.scan?.extractedData, 
    executeIntelligentMapping
  ]);

  const handleFieldChange = (fieldName: string, value: string | number) => {
    
    const newFormData = {
      ...formData,
      [fieldName]: value
    };
 
    updateState((prevState: any) => {
      const newState = {
        ...prevState,
        masterData: newFormData
      };
      return newState;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Datos Maestros para Renovación</CardTitle>
        <CardDescription>
          Completa la información requerida para crear la nueva póliza
          {autoMappingExecuted && (
            <span className="text-green-600 dark:text-green-400 ml-2">
              • Mapeo automático aplicado
            </span>
          )}
          {state.context?.companiaInfo && (
            <span className="text-blue-600 dark:text-blue-400 ml-2">
              • {state.context.companiaInfo.nombre}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">

          <ControlledSelect
            label="Tipo de Combustible"
            value={formData.combustibleId}
            onChange={(value) => handleFieldChange('combustibleId', value)}
            options={combustibles}
            placeholder="Seleccionar combustible..."
            loading={loadingData}
          />

          <ControlledSelect
            label="Categoría"
            value={formData.categoriaId}
            onChange={(value) => handleFieldChange('categoriaId', value)}
            options={categorias}
            placeholder="Seleccionar categoría..."
            loading={loadingData}
          />

          <ControlledSelect
            label="Destino del Vehículo"
            value={formData.destinoId}
            onChange={(value) => handleFieldChange('destinoId', value)}
            options={destinos}
            placeholder="Seleccionar destino..."
            loading={loadingData}
          />

          <ControlledSelect
            label="Departamento"
            value={formData.departamentoId}
            onChange={(value) => handleFieldChange('departamentoId', value)}
            options={departamentos}
            placeholder="Seleccionar departamento..."
            loading={loadingData}
          />

          <ControlledSelect
            label="Calidad"
            value={formData.calidadId}
            onChange={(value) => handleFieldChange('calidadId', value)}
            options={calidades}
            placeholder="Seleccionar calidad..."
            loading={loadingData}
          />

          <ControlledSelect
            label={`Tarifa ${tarifas.length > 0 ? `(${tarifas.length} opciones)` : ''}`}
            value={formData.tarifaId}
            onChange={(value) => handleFieldChange('tarifaId', value)}
            options={tarifas}
            placeholder="Seleccionar tarifa..."
            loading={loadingData}
          />
        </div>

        {(masterDataLoading || loadingData) && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando datos maestros para renovación...
          </div>
        )}
      </CardContent>
    </Card>
  );
}