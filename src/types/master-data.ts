"use client"

export interface ClienteItem {
  id: number;
  corrcod: number;
  subcorr: number;
  clinom: string;                  
  telefono: string;
  clifchnac?: string | null;      
  clifching?: string | null;    
  clifchegr?: string | null;      
  clicargo: string;
  clicon: string;            
  cliruc: string;          
  clirsoc: string;                
  cliced: string;             
  clilib: string;              
  clicatlib: string;
  clitpo: string;            
  clidir: string;              
  cliemail: string;            
  clivtoced?: string | null;         
  clivtolib?: string | null;
  cliposcod: number;
  clitelcorr: string;
  clidptnom: string;
  clisex: string;
  clitelant: string;
  cliobse: string;
  clifax: string;
  clitelcel: string;
  cliclasif: string;
  clinumrel: string;
  clicasapt: string;
  clidircob: string;
  clibse: number;
  clifoto: string;
  pruebamillares: number;
  ingresado: string;
  clialias: string;
  clipor: string;
  clisancor: string;
  clirsa: string;
  codposcob: number;
  clidptcob: string;
  activo: boolean;
  cli_s_cris: string;
  clifchnac1?: string | null;
  clilocnom: string;
  cliloccob: string;
  categorias_de_cliente: number;
  sc_departamentos: string;
  sc_localidades: string;
  fch_ingreso?: string | null;
  grupos_economicos: number;
  etiquetas: boolean;
  doc_digi: boolean;
  password: string;
  habilita_app: boolean;
  referido: string;
  altura: number;
  peso: number;
  cliberkley: string;
  clifar: string;
  clisurco: string;
  clihdi: string;
  climapfre: string;
  climetlife: string;
  clisancris: string;
  clisbi: string;
  edo_civil: string;
  not_bien_mail: boolean;
  not_bien_wap: boolean;
  ing_poliza_mail: boolean;
  ing_poliza_wap: boolean;
  ing_siniestro_mail: boolean;
  ing_siniestro_wap: boolean;
  noti_obs_sini_mail: boolean;
  noti_obs_sini_wap: boolean;
  last_update?: string | null;
  app_id: number;

  displayName: string;
  documentNumber: string;
  documentType: string;
  fullAddress: string;
  contactInfo: string;
}

export interface CompaniaItem {
  id: number;
  comnom: string;                  
  comrazsoc: string;              
  comruc: string;                   
  comdom: string;               
  comtel: string;                   
  comfax: string;                  
  comsumodia: string;
  comcntcli: number;
  comcntcon: number;
  comprepes: number;
  compredol: number;
  comcomipe: number;
  comcomido: number;
  comtotcomi: number;
  comtotpre: number;
  comalias: string;               
  comlog: string;
  broker: boolean;
  cod_srvcompanias: string;
  no_utiles: string;
  paq_dias: number;

  displayName: string;               
  isActive: boolean;
  shortCode: string;                
}

export interface SeccionItem {
  id: number;
  seccion: string;                  
  icono: string;
  displayName: string;            
  code: string;                    
  isActive: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  documento: string;
  documentType: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  displayName?: string;
  contactInfo?: string;
}

export interface Compania {
  id: number;
  nombre: string;
  codigo?: string;
  activa: boolean;
  displayName?: string;
}

export interface Seccion {
  id: number;
  nombre: string;
  codigo?: string;
  companiaId?: number;
  activa: boolean;
  displayName?: string;
}

export interface MasterDataItem {
  id: string | number;
  nombre: string;
  codigo?: string;
  valor?: string;
  activo: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startItem?: number;
  endItem?: number;
}

