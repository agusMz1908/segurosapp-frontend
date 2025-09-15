import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useMasterData } from '../../../hooks/use-master-data';
import { intelligentMapping, type MasterDataFormData, type MasterDataSets } from '@/utils/intelligent-mapping';
import type { MasterDataItem } from '@/types/master-data';

interface MasterDataFormProps {
  hookInstance: any;
}

// Componente controlado simple y confiable
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
      {/* Debug info - solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-gray-500">
          Opciones: {options.length} | Valor: "{value}" | Tipo: {typeof value}
        </p>
      )}
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

  // Debug logs - FUERA del useEffect
  console.log('🔍 RENDER - formData actual:', formData);
  console.log('🔍 RENDER - state.masterData:', state.masterData);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoadingData(true);
        console.log('🔄 Cargando datos maestros...');
        
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
          getMasterDataByType('tarifas')
        ]);
        
        setCombustibles(combustiblesData);
        setCategorias(categoriasData);
        setDestinos(destinosData);
        setDepartamentos(departamentosData);
        setCalidades(calidadesData);
        setTarifas(tarifasData);
        
        console.log('✅ Datos maestros cargados:', {
          combustibles: combustiblesData.length,
          categorias: categoriasData.length,
          destinos: destinosData.length,
          departamentos: departamentosData.length,
          calidades: calidadesData.length,
          tarifas: tarifasData.length
        });
      } catch (error) {
        console.error('❌ Error loading master data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadMasterData();
  }, [getMasterDataByType]);

  const executeIntelligentMapping = useCallback(() => {
    if (!state.scan?.extractedData || Object.keys(state.scan.extractedData).length === 0) {
      return;
    }

    console.log('🤖 Ejecutando mapeo inteligente mejorado...');
    console.log('🔍 ANTES del mapeo - formData actual:', formData);

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

    console.log('🔍 Datos para mapeo:', {
      extractedData: state.scan.extractedData,
      currentFormData,
      masterDataSets: {
        combustibles: combustibles.length,
        destinos: destinos.length,
        departamentos: departamentos.length,
        calidades: calidades.length,
        categorias: categorias.length
      }
    });

    const mappedData = intelligentMapping(
      state.scan.extractedData,
      currentFormData,
      masterDataSets
    );

    console.log('🔍 RESULTADO del mapeo:', mappedData);

    const hasChanges = Object.keys(mappedData).some(key => 
      mappedData[key as keyof MasterDataFormData] !== currentFormData[key as keyof MasterDataFormData]
    );

    console.log('🔍 ¿Hay cambios?', hasChanges);

    if (hasChanges) {
      const updatedFormData = {
        ...formData,
        ...mappedData
      };
      
      console.log('🔍 ANTES de updateState:', updatedFormData);
      updateState({ masterData: updatedFormData });
      console.log('✅ updateState llamado con:', { masterData: updatedFormData });
    } else {
      console.log('ℹ️ Mapeo inteligente completado sin cambios');
    }

    setAutoMappingExecuted(true);
  }, [
    state.scan?.extractedData, 
    formData, 
    combustibles, 
    destinos, 
    departamentos, 
    calidades, 
    categorias, 
    tarifas, 
    updateState
  ]);

  // UseEffect que ejecuta el mapeo automático
  useEffect(() => {
    const canExecuteMapping = !loadingData && 
                             !autoMappingExecuted &&
                             combustibles.length > 0 && 
                             destinos.length > 0 && 
                             departamentos.length > 0 && 
                             calidades.length > 0 &&
                             categorias.length > 0 &&
                             state.scan?.extractedData && 
                             Object.keys(state.scan.extractedData).length > 0;

    if (canExecuteMapping) {
      console.log('🎯 Condiciones cumplidas para mapeo automático');
      setTimeout(() => {
        executeIntelligentMapping();
      }, 300);
    }
  }, [
    loadingData, 
    autoMappingExecuted,
    combustibles.length, 
    destinos.length, 
    departamentos.length, 
    calidades.length,
    categorias.length,
    state.scan?.extractedData, 
    executeIntelligentMapping
  ]);

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
          {autoMappingExecuted && (
            <span className="text-green-600 dark:text-green-400 ml-2">
              • Mapeo automático aplicado
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Tipo de Combustible */}
        <ControlledSelect
          label="Tipo de Combustible"
          value={formData.combustibleId}
          onChange={(value) => handleFieldChange('combustibleId', value)}
          options={combustibles}
          placeholder="Seleccionar combustible..."
          loading={loadingData}
        />

        {/* Categoría */}
        <ControlledSelect
          label="Categoría"
          value={formData.categoriaId}
          onChange={(value) => handleFieldChange('categoriaId', value)}
          options={categorias}
          placeholder="Seleccionar categoría..."
          loading={loadingData}
        />

        {/* Destino del Vehículo */}
        <ControlledSelect
          label="Destino del Vehículo"
          value={formData.destinoId}
          onChange={(value) => handleFieldChange('destinoId', value)}
          options={destinos}
          placeholder="Seleccionar destino..."
          loading={loadingData}
        />

        {/* Departamento */}
        <ControlledSelect
          label="Departamento"
          value={formData.departamentoId}
          onChange={(value) => handleFieldChange('departamentoId', value)}
          options={departamentos}
          placeholder="Seleccionar departamento..."
          loading={loadingData}
        />

        {/* Calidad */}
        <ControlledSelect
          label="Calidad"
          value={formData.calidadId}
          onChange={(value) => handleFieldChange('calidadId', value)}
          options={calidades}
          placeholder="Seleccionar calidad..."
          loading={loadingData}
        />

        {/* Tarifa */}
        <ControlledSelect
          label="Tarifa"
          value={formData.tarifaId}
          onChange={(value) => handleFieldChange('tarifaId', value)}
          options={tarifas}
          placeholder="Seleccionar tarifa..."
          loading={loadingData}
        />

        {/* Observaciones */}
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

        {/* Loading indicator */}
        {(masterDataLoading || loadingData) && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando datos maestros...
          </div>
        )}

        {/* Debug info para desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            <strong>Debug:</strong>
            <br />• Auto-mapping ejecutado: {autoMappingExecuted ? 'Sí' : 'No'}
            <br />• Datos maestros cargados: {!loadingData ? 'Sí' : 'No'}
            <br />• Datos extraídos: {state.scan?.extractedData ? 'Sí' : 'No'}
            <br />• Combustibles: {combustibles.length}
            <br />• Categorías: {categorias.length}
            <br />• Destinos: {destinos.length}
            <br />• Form Data: {JSON.stringify({
              combustibleId: formData.combustibleId,
              categoriaId: formData.categoriaId,
              destinoId: formData.destinoId
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}