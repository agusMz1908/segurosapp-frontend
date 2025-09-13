import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';
import { useMasterData } from '../../../hooks/use-master-data';

interface MasterDataFormProps {
  hookInstance: any;
}

export function MasterDataForm({ hookInstance }: MasterDataFormProps) {
  const { state, updateState } = hookInstance;
  const { getMasterDataByType, loading: masterDataLoading } = useMasterData();
  
  // Estados locales para datos maestros
  const [combustibles, setCombustibles] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [calidades, setCalidades] = useState<any[]>([]);
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [mediospago, setMediosPago] = useState<any[]>([]);
  const [corredores, setCorredores] = useState<any[]>([]);

  // Estado del formulario (sincronizado con el estado global)
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

  // Cargar datos maestros al montar
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

  // Preseleccionar valores basados en sugerencias del backend
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
        // Agregar más campos según necesidades...
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
    
    // Actualizar estado global directamente
    updateState({
      masterData: newFormData
    });
  };

  const isFieldComplete = (fieldName: string) => {
    return formData[fieldName as keyof typeof formData] && 
           formData[fieldName as keyof typeof formData] !== '';
  };

  const isFieldRequired = (fieldName: string) => {
    // Campos requeridos para poder crear la póliza
    const requiredFields = ['combustibleId', 'categoriaId', 'destinoId', 'departamentoId'];
    return requiredFields.includes(fieldName);
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
        
        {/* Tipo de Combustible - REQUERIDO */}
        <div className="space-y-2">
          <Label htmlFor="combustible" className="flex items-center gap-2">
            Tipo de Combustible *
            {isFieldComplete('combustibleId') && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <select
            id="combustible"
            className={`w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 ${
              isFieldRequired('combustibleId') && !isFieldComplete('combustibleId') 
                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' 
                : ''
            }`}
            disabled={masterDataLoading}
            value={formData.combustibleId}
            onChange={(e) => handleFieldChange('combustibleId', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {combustibles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Categoría - REQUERIDO */}
        <div className="space-y-2">
          <Label htmlFor="categoria" className="flex items-center gap-2">
            Categoría *
            {isFieldComplete('categoriaId') && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <select
            id="categoria"
            className={`w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 ${
              isFieldRequired('categoriaId') && !isFieldComplete('categoriaId') 
                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' 
                : ''
            }`}
            disabled={masterDataLoading}
            value={formData.categoriaId}
            onChange={(e) => handleFieldChange('categoriaId', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {categorias.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Destino del Vehículo - REQUERIDO */}
        <div className="space-y-2">
          <Label htmlFor="destino" className="flex items-center gap-2">
            Destino del Vehículo *
            {isFieldComplete('destinoId') && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <select
            id="destino"
            className={`w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 ${
              isFieldRequired('destinoId') && !isFieldComplete('destinoId') 
                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' 
                : ''
            }`}
            disabled={masterDataLoading}
            value={formData.destinoId}
            onChange={(e) => handleFieldChange('destinoId', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {destinos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Departamento - REQUERIDO */}
        <div className="space-y-2">
          <Label htmlFor="departamento" className="flex items-center gap-2">
            Departamento *
            {isFieldComplete('departamentoId') && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <select
            id="departamento"
            className={`w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 ${
              isFieldRequired('departamentoId') && !isFieldComplete('departamentoId') 
                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' 
                : ''
            }`}
            disabled={masterDataLoading}
            value={formData.departamentoId}
            onChange={(e) => handleFieldChange('departamentoId', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {departamentos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Calidad - Opcional */}
        <div className="space-y-2">
          <Label htmlFor="calidad" className="flex items-center gap-2">
            Calidad
            {isFieldComplete('calidadId') && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <select
            id="calidad"
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
            disabled={masterDataLoading}
            value={formData.calidadId}
            onChange={(e) => handleFieldChange('calidadId', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {calidades.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Tarifa - Opcional */}
        <div className="space-y-2">
          <Label htmlFor="tarifa" className="flex items-center gap-2">
            Tarifa
            {isFieldComplete('tarifaId') && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <select
            id="tarifa"
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
            disabled={masterDataLoading}
            value={formData.tarifaId}
            onChange={(e) => handleFieldChange('tarifaId', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {tarifas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Corredor - Opcional */}
        <div className="space-y-2">
          <Label htmlFor="corredor" className="flex items-center gap-2">
            Corredor
            {isFieldComplete('corredorId') && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <select
            id="corredor"
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
            disabled={masterDataLoading}
            value={formData.corredorId}
            onChange={(e) => handleFieldChange('corredorId', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {corredores.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre} {item.codigo && `(${item.codigo})`}
              </option>
            ))}
          </select>
        </div>

        {/* Medio de Pago - Opcional */}
        <div className="space-y-2">
          <Label htmlFor="medioPago" className="flex items-center gap-2">
            Medio de Pago
            {isFieldComplete('medioPagoId') && <CheckCircle className="h-4 w-4 text-green-500" />}
          </Label>
          <select
            id="medioPago"
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
            disabled={masterDataLoading}
            value={formData.medioPagoId}
            onChange={(e) => handleFieldChange('medioPagoId', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {mediospago.map((item) => (
              <option key={item.code || item.id} value={item.code || item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad de Cuotas */}
        <div className="space-y-2">
          <Label htmlFor="cuotas">Cantidad de Cuotas</Label>
          <select
            id="cuotas"
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
            value={formData.cantidadCuotas}
            onChange={(e) => handleFieldChange('cantidadCuotas', parseInt(e.target.value))}
          >
            {[1, 2, 3, 4, 6, 12].map(num => (
              <option key={num} value={num}>{num} cuota{num > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

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

        {/* Indicador de campos requeridos */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          * Campos requeridos para poder crear la póliza
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