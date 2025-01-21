import * as dotenv from "dotenv";
dotenv.config();

export const STORE_LOCATIONS: Record<string, string> = {
    MUYBONITA: process.env.MUYBONITA_LOCATION || "",
    MISBEBES: process.env.MISBEBES_LOCATION || "",
    BOLUDOS: process.env.BOLUDOS_LOCATION || "",
    HOGAR: process.env.HOGAR_LOCATION || "",
  };
  
  export const STORE_TOKENS: Record<string, string> = {
    MUYBONITA: process.env.MUYBONITA_TOKEN || "",
    MISBEBES: process.env.MISBEBES_TOKEN || "",
    BOLUDOS: process.env.BOLUDOS_TOKEN || "",
    HOGAR: process.env.HOGAR_TOKEN || "",
  };
  
  export const domainMap: Record<string, string> = {
    MUYBONITA: 'ropamujerusa',
    MISBEBES: 'misbebes-co',
    BOLUDOS: 'boludosmuybonita',
    HOGAR: 'hogarmb',
  };
  
  export const API_VERSION = process.env.SHOPIFY_VERSION || '2023-10'