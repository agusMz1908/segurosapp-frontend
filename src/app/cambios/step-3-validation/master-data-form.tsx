// src/app/cambios/step-3-validation/master-data-form.tsx
// ✅ ADAPTADO DE RENOVACIONES: Usar la misma lógica que funciona
// ✅ CORREGIDO: Usar colores consistentes con Nueva Póliza y Renovaciones

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

// Componente controlado simple y confiable - COPIADO DE RENOVACIONES
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

  // Estados locales - COPIADO DE RENOVACIONES
  const [combustibles, setCombustibles] = useState<MasterDataItem[]>([]);
  const [categorias, setCategorias] = useState<MasterDataItem[]>([]);
  const [destinos, setDestinos] = useState<MasterDataItem[]>([]);
  const [departamentos, setDepartamentos] = useState<MasterDataItem[]>([]);
  const [calidades, setCalidades] = useState<MasterDataItem[]>([]);
  const [tarifas, setTarifas] = useState<MasterDataItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [autoMappingExecuted, setAutoMappingExecuted] = useState(false);

  // Acceder directamente a state.masterData para evitar problemas de referencia
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
  console.log('🔍 CAMBIOS MASTER DATA - formData actual:', formData);
  console.log('🔍 CAMBIOS MASTER DATA - state.masterData:', state.masterData);
  console.log('🔍 CAMBIOS MASTER DATA - autoMappingExecuted:', autoMappingExecuted);

  // DEBUG: useEffect para monitorear cambios en state.masterData
  useEffect(() => {
    console.log('🔧 CAMBIOS useEffect - state.masterData cambió:', state.masterData);
  }, [state.masterData]);

  // Cargar datos maestros - ADAPTADO PARA CAMBIOS
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoadingData(true);
        console.log('🔄 CAMBIOS - Cargando datos maestros...');
        
        // Obtener companiaId del contexto heredado
        const companiaId = state.context?.companiaId;
        console.log('🏢 CAMBIOS - CompaniaId del contexto:', companiaId);
        
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
          getMasterDataByType('tarifas', companiaId) // Usar companiaId heredado
        ]);
        
        setCombustibles(combustiblesData);
        setCategorias(categoriasData);
        setDestinos(destinosData);
        setDepartamentos(departamentosData);
        setCalidades(calidadesData);
        setTarifas(tarifasData);
        
        console.log('✅ CAMBIOS - Datos maestros cargados:', {
          combustibles: combustiblesData.length,
          categorias: categoriasData.length,
          destinos: destinosData.length,
          departamentos: departamentosData.length,
          calidades: calidadesData.length,
          tarifas: tarifasData.length,
          tarifasParaCompania: companiaId
        });
      } catch (error) {
        console.error('❌ CAMBIOS - Error loading master data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadMasterData();
  }, [getMasterDataByType, state.context?.companiaId]);

  // Mapeo inteligente - COPIADO DE RENOVACIONES
  const executeIntelligentMapping = useCallback(() => {
    if (!state.scan?.extractedData || Object.keys(state.scan.extractedData).length === 0) {
      console.log('⚠️ CAMBIOS - No hay datos extraídos para mapear');
      return;
    }

    // Log de compañía al ejecutar mapeo
    const companiaId = state.context?.companiaId;
    console.log('🤖 CAMBIOS - Ejecutando mapeo inteligente con compañía:', companiaId);
    console.log('🔍 CAMBIOS - ANTES del mapeo - formData actual:', formData);

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

    console.log('🔍 CAMBIOS - Datos para mapeo:', {
      extractedData: state.scan.extractedData,
      currentFormData,
      companiaId,
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

    console.log('🔍 CAMBIOS - RESULTADO del mapeo:', mappedData);

    const hasChanges = Object.keys(mappedData).some(key => 
      mappedData[key as keyof MasterDataFormData] !== currentFormData[key as keyof MasterDataFormData]
    );

    console.log('🔍 CAMBIOS - ¿Hay cambios?', hasChanges);

    if (hasChanges) {
      // Crear objeto completo manteniendo valores existentes
      const updatedFormData = {
        ...formData, // Mantener todos los campos existentes
        ...mappedData // Sobrescribir solo los mapeados
      };
      
      console.log('🔍 CAMBIOS - ANTES de updateState:', updatedFormData);
      
      // Forzar un re-render usando una función de actualización
      updateState((prevState: any) => {
        console.log('🔧 CAMBIOS - updateState - prevState:', prevState);
        const newState = {
          ...prevState,
          masterData: updatedFormData
        };
        console.log('🔧 CAMBIOS - updateState - newState:', newState);
        return newState;
      });
      
      console.log('✅ CAMBIOS - updateState llamado con:', { masterData: updatedFormData });
      
      // Mostrar en consola qué campos se mapearon
      const mappedFields = [];
      if (mappedData.combustibleId !== currentFormData.combustibleId) mappedFields.push('Combustible');
      if (mappedData.destinoId !== currentFormData.destinoId) mappedFields.push('Destino');
      if (mappedData.departamentoId !== currentFormData.departamentoId) mappedFields.push('Departamento');
      if (mappedData.calidadId !== currentFormData.calidadId) mappedFields.push('Calidad');
      if (mappedData.categoriaId !== currentFormData.categoriaId) mappedFields.push('Categoría');
      if (mappedData.tarifaId !== currentFormData.tarifaId) mappedFields.push('Tarifa');
      
      console.log('✅ CAMBIOS - Campos mapeados:', mappedFields.join(', ') || 'Ninguno');
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

  // Ejecutar mapeo automático - COPIADO DE RENOVACIONES
  useEffect(() => {
    if (!loadingData && 
        !autoMappingExecuted && 
        combustibles.length > 0 && 
        state.scan?.extractedData) {
      console.log('🔄 CAMBIOS - Ejecutando mapeo automático...');
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

  // Manejar cambios de campos - COPIADO DE RENOVACIONES
  const handleFieldChange = (fieldName: string, value: string | number) => {
    console.log(`🔧 CAMBIOS - handleFieldChange: ${fieldName} = ${value}`);
    
    const newFormData = {
      ...formData,
      [fieldName]: value
    };
    
    console.log('🔧 CAMBIOS - handleFieldChange - newFormData:', newFormData);
    
    // Usar función de actualización para asegurar consistencia
    updateState((prevState: any) => {
      const newState = {
        ...prevState,
        masterData: newFormData
      };
      console.log('🔧 CAMBIOS - handleFieldChange - updateState newState:', newState);
      return newState;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Datos Maestros para Cambio</CardTitle>
        <CardDescription>
          Completa la información requerida para procesar el cambio en la póliza
          {autoMappingExecuted && (
            <span className="text-green-600 dark:text-green-400 ml-2">
              • Mapeo automático aplicado
            </span>
          )}
          {/* 🔥 CAMBIO: Usar azul en lugar de violeta para consistencia */}
          {state.context?.companiaInfo && (
            <span className="text-blue-600 dark:text-blue-400 ml-2">
              • {state.context.companiaInfo.nombre}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Grid de 2 columnas - IGUAL QUE RENOVACIONES */}
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
          
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
            Cargando datos maestros para cambio...
          </div>
        )}

        {/* Debug en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-xs">
            <summary className="cursor-pointer font-medium">Debug Info Cambios</summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
              {JSON.stringify({
                formData,
                companiaId: state?.context?.companiaId,
                autoMappingExecuted,
                hasExtractedData: !!(state?.scan?.extractedData && Object.keys(state.scan.extractedData).length > 0),
                loadingData,
                optionsCounts: {
                  combustibles: combustibles.length,
                  categorias: categorias.length,
                  destinos: destinos.length,
                  departamentos: departamentos.length,
                  calidades: calidades.length,
                  tarifas: tarifas.length
                }
              }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}