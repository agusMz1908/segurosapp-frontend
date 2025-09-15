// hooks/use-automapping.ts
// ✅ CORREGIDO: Ahora incluye tarifas en la carga de datos

import { useEffect, useState } from 'react';
import { useMasterData } from './use-master-data';
import { intelligentMapping, type MasterDataFormData, type MasterDataSets } from '@/utils/intelligent-mapping';

interface UseAutoMappingProps {
  extractedData: Record<string, any> | null;
  currentMasterData: MasterDataFormData;
  onMappingComplete: (mappedData: MasterDataFormData) => void;
}

export function useAutoMapping({ extractedData, currentMasterData, onMappingComplete }: UseAutoMappingProps) {
  const { getMasterDataByType } = useMasterData();
  const [hasExecuted, setHasExecuted] = useState(false);
  const [masterDataReady, setMasterDataReady] = useState(false);

  useEffect(() => {
    // Cargar datos maestros una sola vez
    const loadMasterData = async () => {
      try {
        console.log('🔄 Cargando datos maestros para auto-mapeo...');
        
        // ✅ CORREGIDO: Incluir tarifas en la carga
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
          getMasterDataByType('tarifas') // ✅ CORREGIDO: Ahora se carga tarifas
        ]);

        console.log('📊 Datos maestros cargados:', {
          combustibles: combustibles.length,
          destinos: destinos.length,
          departamentos: departamentos.length,
          calidades: calidades.length,
          categorias: categorias.length,
          tarifas: tarifas.length // ✅ CORREGIDO: Log de tarifas cargadas
        });

        // Ejecutar mapeo inmediatamente si tenemos datos extraídos
        if (extractedData && Object.keys(extractedData).length > 0 && !hasExecuted) {
          console.log('🤖 Ejecutando auto-mapeo...');
          
          // ✅ CORREGIDO: Incluir tarifas en masterDataSets
          const masterDataSets: MasterDataSets = {
            combustibles,
            destinos,
            departamentos,
            calidades,
            categorias,
            tarifas // ✅ CORREGIDO: Ahora se incluye tarifas
          };

          const mappedData = intelligentMapping(extractedData, currentMasterData, masterDataSets);
          
          // Solo actualizar si hay cambios
          const hasChanges = Object.keys(mappedData).some(key => 
            mappedData[key as keyof MasterDataFormData] !== currentMasterData[key as keyof MasterDataFormData]
          );

          if (hasChanges) {
            onMappingComplete(mappedData);
            console.log('✅ Auto-mapeo completado');
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
  }, [extractedData, currentMasterData, hasExecuted, masterDataReady, getMasterDataByType, onMappingComplete]);

  return {
    hasExecuted,
    masterDataReady
  };
}