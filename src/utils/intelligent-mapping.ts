import { toast } from 'react-hot-toast';
import type { MasterDataItem } from '@/types/master-data';

const calculateSimilarity = (text1: string, text2: string): number => {
  const str1 = text1.toLowerCase().trim();
  const str2 = text2.toLowerCase().trim();

  if (str1 === str2) return 1.0;
  
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;

  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter(word => 
    words2.some(w => w.includes(word) || word.includes(w))
  );
  
  if (commonWords.length > 0) {
    return commonWords.length / Math.max(words1.length, words2.length);
  }
  
  let matches = 0;
  const minLength = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLength; i++) {
    if (str1[i] === str2[i]) matches++;
  }
  
  return matches / Math.max(str1.length, str2.length);
};

const findBestMatch = (extractedValue: string, masterDataList: MasterDataItem[], threshold = 0.7): MasterDataItem | null => {
  if (!extractedValue || !masterDataList.length) return null;
  
  const cleanValue = extractedValue
    .replace(/^[A-Z\s]+\n/, '') 
    .replace(/[.:\n]/g, ' ')  
    .trim();
  
  let bestMatch: MasterDataItem | null = null;
  let bestScore = 0;
  
  for (const item of masterDataList) {
    const score = calculateSimilarity(cleanValue, item.nombre);
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = item;
    }
  }
  return bestMatch;
};

export interface MasterDataFormData {
  combustibleId: string;
  destinoId: string;
  departamentoId: string;
  calidadId: string;
  categoriaId: string;
  tarifaId: string;
}

export interface MasterDataSets {
  combustibles: MasterDataItem[];
  destinos: MasterDataItem[];
  departamentos: MasterDataItem[];
  calidades: MasterDataItem[];
  categorias: MasterDataItem[];
  tarifas: MasterDataItem[];
}

export const intelligentMapping = (
  extractedData: Record<string, any>,
  currentFormData: MasterDataFormData,
  masterDataSets: MasterDataSets
): MasterDataFormData => {
  
  const { combustibles, destinos, departamentos, calidades, categorias, tarifas } = masterDataSets;
  const newFormData = { ...currentFormData };
  let hasChanges = false;

  const findValueInFields = (possibleFields: string[]) => {
    for (const field of possibleFields) {
      if (extractedData[field]) {
        return extractedData[field];
      }
    }
    return null;
  };

  if (combustibles.length > 0 && !newFormData.combustibleId) {
    const combustibleText = findValueInFields([
      "vehiculo.combustible",    
      "combustible",              
      "vehiculoTipoCombustible"  
    ]);
    
    if (combustibleText) {
      const combustibleMappings: { [key: string]: string } = {
        'NAFTA': 'GAS',          
        'GASOLINA': 'GAS',      
        'DIESEL': 'DIS',         
        'DISEL': 'DIS',          
        'GAS-OIL': 'DIS',        
        'GASOIL': 'DIS',        
        'ELECTRICO': 'ELE',       
        'ELÉCTRICO': 'ELE',   
        'HIBRIDO': 'HYB',       
        'HÍBRIDO': 'HYB',        
        'HYBRID': 'HYB',        
        'GLP': 'GLP',           
        'GNC': 'GNC'            
      };

      const cleanCombustible = combustibleText.replace(/COMBUSTIBLE\n?/i, '').trim();

      let combustibleMatch: MasterDataItem | null = null;
      const directMapping = combustibleMappings[cleanCombustible.toUpperCase()];
      if (directMapping) {
        combustibleMatch = combustibles.find(c => 
          c.id.toString() === directMapping || 
          c.codigo === directMapping ||
          c.nombre.toUpperCase().includes(directMapping)
        ) || null;
      }

      if (!combustibleMatch) {
        combustibleMatch = findBestMatch(combustibleText, combustibles, 0.6);
      }
      
      if (combustibleMatch) {
        newFormData.combustibleId = combustibleMatch.id.toString();
        hasChanges = true;
      }
    }
  }

  if (destinos.length > 0 && !newFormData.destinoId) {
    const destinoText = findValueInFields([
      "vehiculo.destino_del_vehiculo", 
      "vehiculo.tipo_de_uso",           
      "tipoUso",                       
      "destino"                     
    ]);
    
    if (destinoText) {
      const cleanDestino = destinoText.replace(/^Tipo de uso\s+/i, '').trim();
      const destinoMappings: { [key: string]: string[] } = {
        'COMERCIAL': ['TRABAJO', 'COMERCIAL', 'LABORAL', 'PROFESSIONAL'],
        'PARTICULAR': ['PARTICULAR', 'PERSONAL', 'PRIVADO', 'PRIVATE'],
        'TAXI': ['TAXI', 'REMISE'],
        'CARGA': ['CARGA', 'TRANSPORTE', 'TRANSPORT'],
        'PUBLICO': ['PÚBLICO', 'PUBLIC', 'OMNIBUS'],
        'EMERGENCIA': ['EMERGENCIA', 'AMBULANCIA', 'BOMBEROS'],
        'OFICIAL': ['OFICIAL', 'GOBIERNO', 'ESTATAL']
      };

      let destinoMatch: MasterDataItem | null = null;
      
      for (const [key, valores] of Object.entries(destinoMappings)) {
        if (cleanDestino.toUpperCase().includes(key)) {
          for (const valor of valores) {
            destinoMatch = destinos.find(d => 
              d.nombre.toUpperCase().includes(valor.toUpperCase())
            ) || null;
            if (destinoMatch) break;
          }
          if (destinoMatch) break;
        }
      }

      if (!destinoMatch) {
        destinoMatch = findBestMatch(cleanDestino, destinos, 0.5);
      }
      
      if (destinoMatch) {
        newFormData.destinoId = destinoMatch.id.toString();
        hasChanges = true;
      }
    }
  }

  if (departamentos.length > 0 && !newFormData.departamentoId) {
    const departamentoText = findValueInFields([
      "asegurado.departamento",
      "departamento", 
      "depto",
      "aseguradoDepartamento"
    ]);
    
    if (departamentoText) {
      const deptMatch = findBestMatch(departamentoText, departamentos, 0.8);
      
      if (deptMatch) {
        newFormData.departamentoId = deptMatch.id.toString();
        hasChanges = true;
      }
    }
  }

  if (calidades.length > 0 && !newFormData.calidadId) {
    const calidadText = findValueInFields([
      "vehiculo.calidad_contratante",
      "calidad_contratante",
      "calidad"
    ]);
    
    if (calidadText) {
      const calidadMatch = findBestMatch(calidadText, calidades, 0.8);
      
      if (calidadMatch) {
        newFormData.calidadId = calidadMatch.id.toString();
        hasChanges = true;
      }
    }
  }

  if (categorias.length > 0 && !newFormData.categoriaId) {
    const categoriaText = findValueInFields([
      "vehiculo.tipo_vehiculo",        
      "vehiculo.tipo",                 
      "vehiculoTipo",                
      "categoria"              
    ]);
    
    if (categoriaText) {
      const cleanCategoria = categoriaText.replace(/^Tipo\s+/i, '').trim();

      const categoriaMappings: { [key: string]: string[] } = {
        'AUTOMOVIL': ['Automóvil', 'AUTO', 'SEDAN'],
        'AUTO': ['Automóvil', 'AUTO', 'SEDAN'],
        'CAMIONETA': ['Camioneta Rural', 'Pick-Up', 'CAMIONETA'],
        'PICKUP': ['Pick-Up Doble Cabina', 'PICKUP', 'Camioneta'],
        'PICK-UP': ['Pick-Up', 'Camioneta', 'PICKUP'],
        'JEEP': ['Jeeps', 'SUV', 'JEEP'],
        'SUV': ['Jeeps', 'SUV', 'JEEP'],
        'CAMION': ['Camion', 'Furgón', 'TRUCK'],
        'FURGON': ['Camioneta furgon', 'Furgón', 'VAN'],
        'OMNIBUS': ['Omnibus', 'BUS', 'AUTOBUS'],
        'MOTO': ['MOTOS', 'MOTOCICLETA', 'MOTO'],
        'MOTOCICLETA': ['MOTOS', 'MOTOCICLETA'],
        'CICLOMOTOR': ['MOTOS', 'CICLOMOTOR'],
        'TRAILER': ['TRAILER', 'REMOLQUE'],
        'AGRICOLA': ['AGRICOLA', 'TRACTOR']
      };

      let categoriaMatch: MasterDataItem | null = null;
      
      for (const [key, valores] of Object.entries(categoriaMappings)) {
        if (cleanCategoria.toUpperCase().includes(key)) {
          for (const valor of valores) {
            categoriaMatch = categorias.find(c => 
              c.nombre.toLowerCase().includes(valor.toLowerCase())
            ) || null;
            if (categoriaMatch) break;
          }
          if (categoriaMatch) break;
        }
      }

      if (!categoriaMatch) {
        categoriaMatch = findBestMatch(cleanCategoria, categorias, 0.6);
      }
      
      if (categoriaMatch) {
        newFormData.categoriaId = categoriaMatch.id.toString();
        hasChanges = true;
      }
    }
  }

  if (tarifas.length > 0 && !newFormData.tarifaId) {
    let tarifaMatch: MasterDataItem | null = null;
    
    const modalidad = findValueInFields([
      "poliza.modalidad_normalizada",   
      "poliza.modalidad",               
      "modalidad",
      "cobertura"
    ]);
    
    if (modalidad) {
      const modalidadUpper = modalidad.toUpperCase();
      let modalidadDetectada = '';

      if (modalidadUpper.includes('TODO RIESGO') && modalidadUpper.includes('TOTAL')) {
        modalidadDetectada = 'TODO RIESGO TOTAL';
      } else if (modalidadUpper.includes('TODO RIESGO')) {
        modalidadDetectada = 'TODO RIESGO';
      } else if (modalidadUpper.includes('TOTAL') && !modalidadUpper.includes('BASICO')) {
        modalidadDetectada = 'TOTAL';
      } else if (modalidadUpper.includes('TERCEROS') || modalidadUpper.includes('RC')) {
        modalidadDetectada = 'TERCEROS';
      } else if (modalidadUpper.includes('PREMIUM')) {
        modalidadDetectada = 'PREMIUM';
      } else if (modalidadUpper.includes('BASICA') || modalidadUpper.includes('MINIMA')) {
        modalidadDetectada = 'BASICA';
      }
      
      if (modalidadDetectada) {
        const modalidadToTarifa: { [key: string]: string[] } = {
          'TODO RIESGO TOTAL': ['TODO RIESGO', 'TOTAL', 'COMPLETA', 'INTEGRAL', 'PREMIUM'],
          'TODO RIESGO': ['TODO RIESGO', 'TOTAL', 'COMPLETA', 'INTEGRAL'],
          'TOTAL': ['TODO RIESGO', 'TOTAL', 'COMPLETA'],
          'TERCEROS': ['TERCEROS', 'RC', 'RESPONSABILIDAD CIVIL'],
          'BASICA': ['BASICA', 'MINIMA', 'STANDARD'],
          'PREMIUM': ['PREMIUM', 'SUPERIOR', 'PLUS']
        };
        
        const tarifaNames = modalidadToTarifa[modalidadDetectada];
        for (const tarifaName of tarifaNames) {
          tarifaMatch = tarifas.find(t => 
            t.nombre.toUpperCase().includes(tarifaName)
          ) || null;
          if (tarifaMatch) {
            break;
          }
        }
      }
      
      if (!tarifaMatch) {
        tarifaMatch = findBestMatch(modalidad, tarifas, 0.6);
      }
    }

    if (!tarifaMatch) {
      if (newFormData.categoriaId) {
        const categoriaSeleccionada = categorias.find(c => c.id.toString() === newFormData.categoriaId);
        if (categoriaSeleccionada) {
          tarifaMatch = findBestMatch(categoriaSeleccionada.nombre, tarifas, 0.7);
        }
      }
      
      if (!tarifaMatch && tarifas.length > 0) {
        tarifaMatch = tarifas.find(t => 
          t.nombre.toLowerCase().includes('general') || 
          t.nombre.toLowerCase().includes('estandar') ||
          t.nombre.toLowerCase().includes('normal')
        ) || tarifas[0]; 
      }
    }

    if (tarifaMatch) {
      newFormData.tarifaId = tarifaMatch.id.toString();
      hasChanges = true;
    } else {
      console.log(`❌ No se pudo mapear ninguna tarifa para modalidad: "${modalidad || 'N/A'}"`);
    }
  }

  if (newFormData.tarifaId) {
    const tarifaFinal = tarifas.find(t => t.id.toString() === newFormData.tarifaId);
  }

  if (hasChanges) {
    const mappedFields = [];
    if (newFormData.combustibleId !== currentFormData.combustibleId) mappedFields.push('Combustible');
    if (newFormData.destinoId !== currentFormData.destinoId) mappedFields.push('Destino');
    if (newFormData.departamentoId !== currentFormData.departamentoId) mappedFields.push('Departamento');
    if (newFormData.calidadId !== currentFormData.calidadId) mappedFields.push('Calidad');
    if (newFormData.categoriaId !== currentFormData.categoriaId) mappedFields.push('Categoría');
    if (newFormData.tarifaId !== currentFormData.tarifaId) mappedFields.push('Tarifa');
    
    if (mappedFields.length > 0) {
      toast.success(`Datos maestros mapeados automáticamente: ${mappedFields.join(', ')}`);
    }
  } else {
    console.log('Mapeo inteligente universal completado sin cambios');
  }

  return newFormData;
};