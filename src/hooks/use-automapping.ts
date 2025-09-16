// hooks/use-automapping.ts
// ✅ CORREGIDO: Ahora incluye filtro por compañía para tarifas

import { useEffect, useState } from 'react';
import { useMasterData } from './use-master-data';
import { intelligentMapping, type MasterDataFormData, type MasterDataSets } from '@/utils/intelligent-mapping';

interface UseAutoMappingProps {
  extractedData: Record<string, any> | null;
  currentMasterData: MasterDataFormData;
  onMappingComplete: (mappedData: MasterDataFormData) => void;
  companiaId?: number; // ✅ NUEVO: Parámetro opcional para compañía
}

export function useAutoMapping({ 
  extractedData, 
  currentMasterData, 
  onMappingComplete, 
  companiaId // ✅ NUEVO: Destructuring companiaId
}: UseAutoMappingProps) {
  const { getMasterDataByType } = useMasterData();
  const [hasExecuted, setHasExecuted] = useState(false);
  const [masterDataReady, setMasterDataReady] = useState(false);

  useEffect(() => {
    // Cargar datos maestros una sola vez
    const loadMasterData = async () => {
      try {
        console.log('🔄 Cargando datos maestros para auto-mapeo...');
        console.log('🏢 CompaniaId para auto-mapeo:', companiaId); // ✅ NUEVO: Log companiaId
        
        // ✅ CORREGIDO: Incluir tarifas con filtro por compañía
        const [
          combustibles,
          destinos,
          departamentos,
          calidades,
          categorias,
          tarifas
        ] = await Promise.all([
          getMasterDataByType('combustibles'),
          getMasterDataByType('destinos'),
          getMasterDataByType('departamentos'),
          getMasterDataByType('calidades'),
          getMasterDataByType('categorias'),
          getMasterDataByType('tarifas', companiaId) // ✅ CORREGIDO: Pasar companiaId
        ]);

        console.log('📊 Datos maestros cargados para auto-mapeo:', {
          combustibles: combustibles.length,
          destinos: destinos.length,
          departamentos: departamentos.length,
          calidades: calidades.length,
          categorias: categorias.length,
          tarifas: tarifas.length, // ✅ CORREGIDO: Log de tarifas cargadas
          companiaId // ✅ NUEVO: Log de compañía usada
        });

        // Ejecutar mapeo inmediatamente si tenemos datos extraídos
        if (extractedData && Object.keys(extractedData).length > 0 && !hasExecuted) {
          console.log('🤖 Ejecutando auto-mapeo con datos filtrados...');
          
          // ✅ CORREGIDO: Incluir tarifas filtradas en masterDataSets
          const masterDataSets: MasterDataSets = {
            combustibles,
            destinos,
            departamentos,
            calidades,
            categorias,
            tarifas // ✅ CORREGIDO: Ahora contiene solo tarifas de la compañía
          };

          const mappedData = intelligentMapping(extractedData, currentMasterData, masterDataSets);
          
          // Solo actualizar si hay cambios
          const hasChanges = Object.keys(mappedData).some(key => 
            mappedData[key as keyof MasterDataFormData] !== currentMasterData[key as keyof MasterDataFormData]
          );

          if (hasChanges) {
            onMappingComplete(mappedData);
            console.log('✅ Auto-mapeo completado con filtro por compañía');
          } else {
            console.log('ℹ️ Auto-mapeo sin cambios');
          }

          setHasExecuted(true);
        }

        setMasterDataReady(true);
        
      } catch (error) {
        console.error('❌ Error en auto-mapeo:', error);
      }
    };

    if (!hasExecuted && !masterDataReady) {
      loadMasterData();
    }
  }, [
    extractedData, 
    currentMasterData, 
    hasExecuted, 
    masterDataReady, 
    getMasterDataByType, 
    onMappingComplete,
    companiaId // ✅ NUEVO: Agregar companiaId como dependencia
  ]);

  return {
    hasExecuted,
    masterDataReady
  };
}