import { useEffect, useState } from 'react';
import { useMasterData } from './use-master-data';
import { intelligentMapping, type MasterDataFormData, type MasterDataSets } from '@/utils/intelligent-mapping';

interface UseAutoMappingProps {
  extractedData: Record<string, any> | null;
  currentMasterData: MasterDataFormData;
  onMappingComplete: (mappedData: MasterDataFormData) => void;
  companiaId?: number; 
}

export function useAutoMapping({ 
  extractedData, 
  currentMasterData, 
  onMappingComplete, 
  companiaId 
}: UseAutoMappingProps) {
  const { getMasterDataByType } = useMasterData();
  const [hasExecuted, setHasExecuted] = useState(false);
  const [masterDataReady, setMasterDataReady] = useState(false);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
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
          getMasterDataByType('tarifas', companiaId) 
        ]);

        if (extractedData && Object.keys(extractedData).length > 0 && !hasExecuted) {
          const masterDataSets: MasterDataSets = {
            combustibles,
            destinos,
            departamentos,
            calidades,
            categorias,
            tarifas 
          };

          const mappedData = intelligentMapping(extractedData, currentMasterData, masterDataSets);
          const hasChanges = Object.keys(mappedData).some(key => 
            mappedData[key as keyof MasterDataFormData] !== currentMasterData[key as keyof MasterDataFormData]
          );

          if (hasChanges) {
            onMappingComplete(mappedData);
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
    companiaId 
  ]);

  return {
    hasExecuted,
    masterDataReady
  };
}