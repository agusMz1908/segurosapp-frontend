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

  // FIX: Acceder directamente a state.masterData para evitar problemas de referencia
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

  // Debug logs mejorados
  console.log('🔍 RENDER - formData actual:', formData);
  console.log('🔍 RENDER - state.masterData:', state.masterData);
  console.log('🔍 RENDER - autoMappingExecuted:', autoMappingExecuted);

  // ✅ DEBUG AGREGADO: useEffect para monitorear cambios en state.masterData
  useEffect(() => {
    console.log('🔧 useEffect - state.masterData cambió:', state.masterData);
  }, [state.masterData]);

  // ✅ MODIFICADO: Agregar companiaId como dependencia y pasarlo a tarifas
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoadingData(true);
        console.log('🔄 Cargando datos maestros...');
        
        // ✅ NUEVO: Obtener companiaId del contexto
        const companiaId = state.context?.companiaId;
        console.log('🏢 CompaniaId del contexto:', companiaId);
        
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
          getMasterDataByType('tarifas', companiaId) // ✅ NUEVO: Pasar companiaId
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
          tarifas: tarifasData.length,
          tarifasParaCompania: companiaId // ✅ NUEVO: Log de compañía
        });
      } catch (error) {
        console.error('❌ Error loading master data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadMasterData();
  }, [getMasterDataByType, state.context?.companiaId]); // ✅ NUEVO: Agregar companiaId como dependencia

  const executeIntelligentMapping = useCallback(() => {
    if (!state.scan?.extractedData || Object.keys(state.scan.extractedData).length === 0) {
      console.log('⚠️ No hay datos extraídos para mapear');
      return;
    }

    // ✅ NUEVO: Log de compañía al ejecutar mapeo
    const companiaId = state.context?.companiaId;
    console.log('🤖 Ejecutando mapeo inteligente con compañía:', companiaId);
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
      companiaId, // ✅ NUEVO: Log de compañía
      masterDataSets: {
        combustibles: combustibles.length,
        destinos: destinos.length,
        departamentos: departamentos.length,
        calidades: calidades.length,
        categorias: categorias.length,
        tarifas: tarifas.length
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
      // FIX: Crear objeto completo manteniendo valores existentes
      const updatedFormData = {
        ...formData, // Mantener todos los campos existentes
        ...mappedData // Sobrescribir solo los mapeados
      };
      
      console.log('🔍 ANTES de updateState:', updatedFormData);
      
      // ✅ DEBUG AGREGADO: Log antes de updateState
      console.log('🔧 Estado del hook ANTES de updateState:', state);
      
      // FIX: Forzar un re-render usando una función de actualización
      updateState((prevState: any) => {
        console.log('🔧 updateState - prevState:', prevState);
        const newState = {
          ...prevState,
          masterData: updatedFormData
        };
        console.log('🔧 updateState - newState:', newState);
        return newState;
      });
      
      console.log('✅ updateState llamado con:', { masterData: updatedFormData });
      
      // ✅ DEBUG AGREGADO: Log después de updateState
      setTimeout(() => {
        console.log('🔧 Estado del hook DESPUÉS de updateState (timeout):', state);
      }, 100);
      
      // Mostrar en consola qué campos se mapearon
      const mappedFields = [];
      if (mappedData.combustibleId !== currentFormData.combustibleId) mappedFields.push('Combustible');
      if (mappedData.destinoId !== currentFormData.destinoId) mappedFields.push('Destino');
      if (mappedData.departamentoId !== currentFormData.departamentoId) mappedFields.push('Departamento');
      if (mappedData.calidadId !== currentFormData.calidadId) mappedFields.push('Calidad');
      if (mappedData.categoriaId !== currentFormData.categoriaId) mappedFields.push('Categoría');
      if (mappedData.tarifaId !== currentFormData.tarifaId) mappedFields.push('Tarifa');
      
      console.log('✅ Campos mapeados:', mappedFields);
    } else {
      console.log('ℹ️ Mapeo inteligente completado sin cambios');
    }

    setAutoMappingExecuted(true);
  }, [
    state.scan?.extractedData,
    state.context?.companiaId, // ✅ NUEVO: Agregar companiaId como dependencia
    formData, 
    combustibles, 
    destinos, 
    departamentos, 
    calidades, 
    categorias, 
    tarifas, 
    updateState,
    state
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
                             tarifas.length > 0 &&
                             state.scan?.extractedData && 
                             Object.keys(state.scan.extractedData).length > 0;

    if (canExecuteMapping) {
      console.log('🎯 Condiciones cumplidas para mapeo automático');
      // FIX: Aumentar el timeout para asegurar que el estado se haya estabilizado
      setTimeout(() => {
        executeIntelligentMapping();
      }, 500);
    } else {
      console.log('⏳ Esperando condiciones para mapeo:', {
        loadingData,
        autoMappingExecuted,
        combustiblesReady: combustibles.length > 0,
        destinosReady: destinos.length > 0,
        departamentosReady: departamentos.length > 0,
        calidadesReady: calidades.length > 0,
        categoriasReady: categorias.length > 0,
        tarifasReady: tarifas.length > 0,
        hasExtractedData: state.scan?.extractedData && Object.keys(state.scan.extractedData).length > 0
      });
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
    console.log(`🔧 handleFieldChange: ${fieldName} = ${value}`);
    
    const newFormData = {
      ...formData,
      [fieldName]: value
    };
    
    console.log('🔧 handleFieldChange - newFormData:', newFormData);
    
    // ✅ DEBUG AGREGADO: Log antes y después de updateState manual
    console.log('🔧 handleFieldChange - Estado ANTES de updateState:', state);
    
    // FIX: Usar función de actualización para asegurar consistencia
    updateState((prevState: any) => {
      const newState = {
        ...prevState,
        masterData: newFormData
      };
      console.log('🔧 handleFieldChange - updateState newState:', newState);
      return newState;
    });
    
    setTimeout(() => {
      console.log('🔧 handleFieldChange - Estado DESPUÉS de updateState (timeout):', state);
    }, 50);
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
          {/* ✅ NUEVO: Mostrar compañía en descripción */}
          {state.context?.companiaInfo && (
            <span className="text-blue-600 dark:text-blue-400 ml-2">
              • {state.context.companiaInfo.nombre}
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

        {/* Tarifa - ✅ NUEVO: Mostrar número de opciones filtradas */}
        <ControlledSelect
          label={`Tarifa ${tarifas.length > 0 ? `(${tarifas.length} opciones)` : ''}`}
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

        {(masterDataLoading || loadingData) && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando datos maestros...
          </div>
        )}
      </CardContent>
    </Card>
  );
}