import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useMasterData } from '../../../hooks/use-master-data';
import { MasterDataSelector } from '@/components/ui/master-data-selector';
import type { MasterDataItem } from '@/types/master-data';

interface MasterDataFormProps {
  hookInstance: any;
}

export function MasterDataForm({ hookInstance }: MasterDataFormProps) {
  const { state, updateState } = hookInstance;
  const { getMasterDataByType, loading: masterDataLoading } = useMasterData();
  
  // Estados locales para datos maestros
  const [combustibles, setCombustibles] = useState<MasterDataItem[]>([]);
  const [categorias, setCategorias] = useState<MasterDataItem[]>([]);
  const [destinos, setDestinos] = useState<MasterDataItem[]>([]);
  const [departamentos, setDepartamentos] = useState<MasterDataItem[]>([]);
  const [calidades, setCalidades] = useState<MasterDataItem[]>([]);
  const [tarifas, setTarifas] = useState<MasterDataItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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

  const mapScannedDataToMasterData = useCallback(() => {
    const rawData = state.scan.extractedData || {};
    const newFormData = { ...formData };
    let hasChanges = false;

    console.log('🔍 Iniciando mapeo automático con datos:', rawData);

    // Mapear COMBUSTIBLE desde "vehiculo.combustible": "COMBUSTIBLE\nNAFTA"
    if (rawData["vehiculo.combustible"] && combustibles.length > 0) {
      const combustibleText = rawData["vehiculo.combustible"]
        .replace("COMBUSTIBLE\n", "")
        .replace("COMBUSTIBLE", "")
        .trim();
      
      console.log('Buscando combustible para:', combustibleText);
      
      const combustibleMatch = combustibles.find(item => 
        item.nombre.toLowerCase().includes(combustibleText.toLowerCase()) ||
        combustibleText.toLowerCase().includes(item.nombre.toLowerCase())
      );
      
      if (combustibleMatch && !formData.combustibleId) {
        newFormData.combustibleId = combustibleMatch.id.toString();
        hasChanges = true;
        console.log('✅ Combustible mapeado automáticamente:', combustibleMatch.nombre);
      }
    }

    // Mapear DESTINO desde "vehiculo.destino_del_vehiculo": "DESTINO DEL VEHÍCULO.\nPARTICULAR"
    if (rawData["vehiculo.destino_del_vehiculo"] && destinos.length > 0) {
      const destinoText = rawData["vehiculo.destino_del_vehiculo"]
        .replace("DESTINO DEL VEHÍCULO.\n", "")
        .replace("DESTINO DEL VEHÍCULO", "")
        .trim();
      
      console.log('Buscando destino para:', destinoText);
      
      const destinoMatch = destinos.find(item => 
        item.nombre.toLowerCase().includes(destinoText.toLowerCase()) ||
        destinoText.toLowerCase().includes(item.nombre.toLowerCase())
      );
      
      if (destinoMatch && !formData.destinoId) {
        newFormData.destinoId = destinoMatch.id.toString();
        hasChanges = true;
        console.log('✅ Destino mapeado automáticamente:', destinoMatch.nombre);
      }
    }

    // Mapear DEPARTAMENTO desde "asegurado.departamento": "Depto:\nMONTEVIDEO"
    if (rawData["asegurado.departamento"] && departamentos.length > 0) {
      const deptText = rawData["asegurado.departamento"]
        .replace("Depto:\n", "")
        .replace("Depto:", "")
        .trim();
      
      console.log('Buscando departamento para:', deptText);
      
      const deptMatch = departamentos.find(item => 
        item.nombre.toLowerCase().includes(deptText.toLowerCase()) ||
        deptText.toLowerCase().includes(item.nombre.toLowerCase())
      );
      
      if (deptMatch && !formData.departamentoId) {
        newFormData.departamentoId = deptMatch.id.toString();
        hasChanges = true;
        console.log('✅ Departamento mapeado automáticamente:', deptMatch.nombre);
      }
    }

    if (hasChanges) {
      updateState({ masterData: newFormData });
      console.log('✅ Formulario actualizado con mapeo automático');
    }
  }, [state.scan.extractedData, formData, combustibles, destinos, departamentos, updateState]);

  // Ejecutar mapeo automático cuando se carguen los datos maestros y haya datos escaneados
  useEffect(() => {
    if (!loadingData && 
        combustibles.length > 0 && 
        destinos.length > 0 && 
        departamentos.length > 0 && 
        state.scan.extractedData && 
        Object.keys(state.scan.extractedData).length > 0) {
      
      // Delay para asegurar que el estado esté actualizado
      setTimeout(() => {
        mapScannedDataToMasterData();
      }, 100);
    }
  }, [loadingData, combustibles, destinos, departamentos, state.scan.extractedData, mapScannedDataToMasterData]);

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

        {/* <MasterDataSelector
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
        /> */}

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