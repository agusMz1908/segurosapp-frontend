// src/utils/intelligent-mapping.ts
// Implementación simple y directa del mapeo inteligente

import { toast } from 'react-hot-toast';
import type { MasterDataItem } from '@/types/master-data';

/**
 * Función auxiliar para calcular similitud entre strings
 */
const calculateSimilarity = (text1: string, text2: string): number => {
  const str1 = text1.toLowerCase().trim();
  const str2 = text2.toLowerCase().trim();
  
  // Coincidencia exacta
  if (str1 === str2) return 1.0;
  
  // Uno contiene al otro
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;
  
  // Similitud por palabras comunes
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter(word => 
    words2.some(w => w.includes(word) || word.includes(w))
  );
  
  if (commonWords.length > 0) {
    return commonWords.length / Math.max(words1.length, words2.length);
  }
  
  // Similitud por caracteres comunes (básico)
  let matches = 0;
  const minLength = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLength; i++) {
    if (str1[i] === str2[i]) matches++;
  }
  
  return matches / Math.max(str1.length, str2.length);
};

/**
 * Función para encontrar la mejor coincidencia
 */
const findBestMatch = (extractedValue: string, masterDataList: MasterDataItem[], threshold = 0.7): MasterDataItem | null => {
  if (!extractedValue || !masterDataList.length) return null;
  
  // Limpiar el valor extraído
  const cleanValue = extractedValue
    .replace(/^[A-Z\s]+\n/, '') // Remover prefijos como "COMBUSTIBLE\n"
    .replace(/[.:\n]/g, ' ')    // Remover puntos, dos puntos, saltos de línea
    .trim();
  
  console.log(`🔍 Buscando coincidencia para: "${cleanValue}"`);
  
  let bestMatch: MasterDataItem | null = null;
  let bestScore = 0;
  
  for (const item of masterDataList) {
    const score = calculateSimilarity(cleanValue, item.nombre);
    console.log(`   - "${item.nombre}": ${(score * 100).toFixed(1)}%`);
    
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = item;
    }
  }
  
  if (bestMatch) {
    console.log(`✅ Mejor coincidencia: "${bestMatch.nombre}" (${(bestScore * 100).toFixed(1)}%)`);
  } else {
    console.log(`❌ No se encontró coincidencia suficiente (threshold: ${threshold * 100}%)`);
  }
  
  return bestMatch;
};

/**
 * Interface para los datos del formulario
 */
export interface MasterDataFormData {
  combustibleId: string;
  destinoId: string;
  departamentoId: string;
  calidadId: string;
  categoriaId: string;
  tarifaId?: string;
}

/**
 * Interface para los datos maestros necesarios
 */
export interface MasterDataSets {
  combustibles: MasterDataItem[];
  destinos: MasterDataItem[];
  departamentos: MasterDataItem[];
  calidades: MasterDataItem[];
  categorias: MasterDataItem[];
  tarifas?: MasterDataItem[];
}

/**
 * FUNCIÓN PRINCIPAL DE MAPEO INTELIGENTE
 * Esta es la implementación directa de tu código original
 */
export const intelligentMapping = (
  extractedData: Record<string, any>,
  currentFormData: MasterDataFormData,
  masterDataSets: MasterDataSets
): MasterDataFormData => {
  
  const { combustibles, destinos, departamentos, calidades, categorias } = masterDataSets;
  const newFormData = { ...currentFormData };
  let hasChanges = false;

  console.log('🤖 Iniciando mapeo inteligente de datos maestros...');

  // MAPEAR COMBUSTIBLE
  if (extractedData["vehiculo.combustible"] && combustibles.length > 0 && !newFormData.combustibleId) {
    const combustibleText = extractedData["vehiculo.combustible"];
    
    // Mapeos específicos conocidos para combustibles
    const combustibleMappings: { [key: string]: string } = {
      'NAFTA': 'GAS',      // NAFTA → GASOLINA
      'GASOLINA': 'GAS',   // GASOLINA → GASOLINA
      'DIESEL': 'DIS',     // DIESEL → DISEL
      'DISEL': 'DIS',      // DISEL → DISEL
      'GAS-OIL': 'DIS',    // GAS-OIL → DISEL
      'ELECTRICO': 'ELE',  // ELECTRICO → ELECTRICOS
      'HIBRIDO': 'HYB',    // HIBRIDO → HYBRIDO
      'HYBRID': 'HYB'      // HYBRID → HYBRIDO
    };

    const cleanCombustible = combustibleText.replace('COMBUSTIBLE\n', '').trim();
    
    // Buscar mapeo directo primero
    let combustibleMatch: MasterDataItem | null = null;
    const directMapping = combustibleMappings[cleanCombustible.toUpperCase()];
    if (directMapping) {
      // Buscar por id (si es número) o por código (si es string)
      combustibleMatch = combustibles.find(c => 
        c.id.toString() === directMapping || c.codigo === directMapping
      ) || null;
    }
    
    // Si no hay mapeo directo, usar similitud
    if (!combustibleMatch) {
      combustibleMatch = findBestMatch(combustibleText, combustibles, 0.6);
    }
    
    if (combustibleMatch) {
      newFormData.combustibleId = combustibleMatch.id.toString();
      hasChanges = true;
      console.log(`🚗 Combustible mapeado: "${cleanCombustible}" → "${combustibleMatch.nombre}"`);
    }
  }

  // MAPEAR DESTINO DEL VEHÍCULO
  if (extractedData["vehiculo.destino_del_vehiculo"] && destinos.length > 0 && !newFormData.destinoId) {
    const destinoMatch = findBestMatch(extractedData["vehiculo.destino_del_vehiculo"], destinos, 0.8);
    
    if (destinoMatch) {
      newFormData.destinoId = destinoMatch.id.toString();
      hasChanges = true;
      console.log(`🎯 Destino mapeado: "${destinoMatch.nombre}"`);
    }
  }

  // MAPEAR DEPARTAMENTO
  if (extractedData["asegurado.departamento"] && departamentos.length > 0 && !newFormData.departamentoId) {
    const deptMatch = findBestMatch(extractedData["asegurado.departamento"], departamentos, 0.8);
    
    if (deptMatch) {
      newFormData.departamentoId = deptMatch.id.toString();
      hasChanges = true;
      console.log(`🏢 Departamento mapeado: "${deptMatch.nombre}"`);
    }
  }

  // MAPEAR CALIDAD (desde vehiculo.calidad_contratante)
  if (extractedData["vehiculo.calidad_contratante"] && calidades.length > 0 && !newFormData.calidadId) {
    const calidadMatch = findBestMatch(extractedData["vehiculo.calidad_contratante"], calidades, 0.8);
    
    if (calidadMatch) {
      newFormData.calidadId = calidadMatch.id.toString();
      hasChanges = true;
      console.log(`👤 Calidad mapeada: "${calidadMatch.nombre}"`);
    }
  }

  // MAPEAR CATEGORÍA (usando tipo de vehículo como referencia)
  if (extractedData["vehiculo.tipo_vehiculo"] && categorias.length > 0 && !newFormData.categoriaId) {
    // Mapeos específicos conocidos para categorías
    const categoriaMappings: { [key: string]: string[] } = {
      'AUTOMOVIL': ['Automóvil'],
      'AUTO': ['Automóvil'],
      'CAMIONETA': ['Camioneta Rural', 'Pick-Up'],
      'PICKUP': ['Pick-Up Doble Cabina'],
      'JEEP': ['Jeeps'],
      'SUV': ['Jeeps'],
      'CAMION': ['Camion', 'Furgón'],
      'FURGON': ['Camioneta furgon', 'Furgón'],
      'OMNIBUS': ['Omnibus'],
      'MOTO': ['MOTOS']
    };

    const tipoVehiculo = extractedData["vehiculo.tipo_vehiculo"].replace('TIPO DE VEHÍCULO\n', '').trim();
    
    let categoriaMatch: MasterDataItem | null = null;
    
    // Buscar en mapeos específicos
    for (const [key, valores] of Object.entries(categoriaMappings)) {
      if (tipoVehiculo.toUpperCase().includes(key)) {
        for (const valor of valores) {
          categoriaMatch = categorias.find(c => 
            c.nombre.toLowerCase().includes(valor.toLowerCase())
          ) || null;
          if (categoriaMatch) break;
        }
        if (categoriaMatch) break;
      }
    }
    
    // Si no hay mapeo específico, usar similitud
    if (!categoriaMatch) {
      categoriaMatch = findBestMatch(extractedData["vehiculo.tipo_vehiculo"], categorias, 0.6);
    }
    
    if (categoriaMatch) {
      newFormData.categoriaId = categoriaMatch.id.toString();
      hasChanges = true;
      console.log(`🚙 Categoría mapeada: "${tipoVehiculo}" → "${categoriaMatch.nombre}"`);
    }
  }

  // Aplicar cambios si los hay
  if (hasChanges) {
    console.log('✅ Mapeo inteligente completado con cambios aplicados');
    
    // Mostrar resumen de mapeos
    const mappedFields = [];
    if (newFormData.combustibleId !== currentFormData.combustibleId) mappedFields.push('Combustible');
    if (newFormData.destinoId !== currentFormData.destinoId) mappedFields.push('Destino');
    if (newFormData.departamentoId !== currentFormData.departamentoId) mappedFields.push('Departamento');
    if (newFormData.calidadId !== currentFormData.calidadId) mappedFields.push('Calidad');
    if (newFormData.categoriaId !== currentFormData.categoriaId) mappedFields.push('Categoría');
    
    toast.success(`Datos maestros mapeados automáticamente: ${mappedFields.join(', ')}`);
  } else {
    console.log('ℹ️ Mapeo inteligente completado sin cambios');
  }

  return newFormData;
};