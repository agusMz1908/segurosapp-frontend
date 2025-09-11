import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useMasterData } from '../../../hooks/use-master-data';

export function MasterDataForm() {
  const { getMasterDataByType, loading: masterDataLoading } = useMasterData();
  
  // Estados locales para datos maestros
  const [combustibles, setCombustibles] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [usosVehiculo, setUsosVehiculo] = useState<any[]>([]);

  // Cargar datos maestros al montar
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [combustiblesData, categoriasData, usosData] = await Promise.all([
          getMasterDataByType('combustibles'),
          getMasterDataByType('categorias'),
          getMasterDataByType('usos-vehiculo'),
        ]);
        
        setCombustibles(combustiblesData);
        setCategorias(categoriasData);
        setUsosVehiculo(usosData);
      } catch (error) {
        console.error('Error loading master data:', error);
      }
    };

    loadMasterData();
  }, [getMasterDataByType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Datos Maestros</CardTitle>
        <CardDescription>
          Completa con información adicional requerida
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de Combustible */}
        <div className="space-y-2">
          <Label htmlFor="combustible">Tipo de Combustible</Label>
          <select
            id="combustible"
            className="w-full p-2 border rounded-md"
            disabled={masterDataLoading}
            defaultValue=""
          >
            <option value="">Seleccionar...</option>
            {combustibles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría</Label>
          <select
            id="categoria"
            className="w-full p-2 border rounded-md"
            disabled={masterDataLoading}
            defaultValue=""
          >
            <option value="">Seleccionar...</option>
            {categorias.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Uso del Vehículo */}
        <div className="space-y-2">
          <Label htmlFor="uso">Uso del Vehículo</Label>
          <select
            id="uso"
            className="w-full p-2 border rounded-md"
            disabled={masterDataLoading}
            defaultValue=""
          >
            <option value="">Seleccionar...</option>
            {usosVehiculo.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Información adicional */}
        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <textarea
            id="observaciones"
            className="w-full p-2 border rounded-md resize-none"
            rows={3}
            placeholder="Observaciones adicionales..."
          />
        </div>

        {masterDataLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando datos maestros...
          </div>
        )}
      </CardContent>
    </Card>
  );
}