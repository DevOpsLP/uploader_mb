// Define the body type for the request
export interface FormBody {
  url: string;
  coleccion: string;
  coleccion2?: string;
  copUsd: string;
  ganancia: string;
  page: number;
  tienda: string;
}

export interface Hit {
  title: string;
  meta: {
    global: {
      all_sizes: string;
    };
    linked_products: {
      swatches: string;
    };
  };
  handle: string;
  product_type: string;
  template_suffix: string | null;
  id: number;
  tags: string[];
  option_names: string[];
  variants_min_price: number;
  variants_max_price: number;
  product_image: string;
  body_html_safe: string;
  collections: string[];
  collection_ids: number[];
  sku: string;
  barcode: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  position: number;
  requires_shipping: boolean;
  taxable: boolean;
  inventory_management: string | null;
  inventory_policy: string;
  variant_title: string | null;
  options: {
    size: string | null;
  };
  price: number;
  compare_at_price: number | null;
  price_ratio: number | null;
  price_range: string | null;
  image: string;
  named_tags: {
    category: string[];
    category_es: string[];
    category_group: string[];
    category_group_es: string | null;
    color: string | null;
    color_fam: string | null;
    deals: string | null;
    default_collection_id: string | null;
    detail: string | null;
    detail_es: string | null;
    fabric: string | null;
    print: string | null;
    print_es: string | null;
    product_group: string | null;
    trend: string | null;
  };
  named_tags_names: string[];
  all_sizes: string;
  all_sizes_array: string[];
  all_sizes_in_stock: boolean;
  all_sizes_in_stock_array: string[];
  any_variant_inventory_available: boolean;
  dataOpsNewInRanking: number;
  dataOpsSaleRanking: number;
  dataOpsSalesRanking: number;
  product_image_plus: string | null;
  variants_compare_at_price_min: number | null;
  variants_compare_at_price_max: number | null;
  dataOps3HrUnitSales: number;
  dataOpsSaleCollectionRanking: number;
  available_markets: string[];
  product_image_trending: string | null;
  product_image_plus_trending: string | null;
  product_video: string | null;
  title_es: string | null;
  objectID: string;
  _highlightResult: {
    title: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
    handle: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
    product_type: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
    id: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
    tags: Array<{
      value: string;
      matchLevel: string;
      matchedWords: string[];
    }>;
    collections: Array<{
      value: string;
      matchLevel: string;
      matchedWords: string[];
    }>;
    named_tags: {
      category: Array<{
        value: string;
        matchLevel: string;
        matchedWords: string[];
      }>;
      category_es: Array<{
        value: string;
        matchLevel: string;
        matchedWords: string[];
      }>;
      category_group: Array<{
        value: string;
        matchLevel: string;
        matchedWords: string[];
      }>;
      category_group_es: {
        value: string;
        matchLevel: string;
        matchedWords: string[];
      };
      color: {
        value: string;
        matchLevel: string;
        matchedWords: string[];
      };
      detail: {
        value: string;
        matchLevel: string;
        matchedWords: string[];
      };
      detail_es: {
        value: string;
        matchLevel: string;
        matchedWords: string[];
      };
      fabric: {
        value: string;
        matchLevel: string;
        matchedWords: string[];
      };
      print: {
        value: string;
        matchLevel: string;
        matchedWords: string[];
      };
      print_es: {
        value: string;
        matchLevel: string;
        matchedWords: string[];
      };
    };
  };
}

export interface Result {
  hits: Hit[];
}

export interface ApiResponse {
  results: Result[];
}

export interface Product {
  handle: string; // Product handle for URLs
  title: string; // Product title
  bodyHtml: string; // Product description as HTML
  published: boolean; // Whether the product is published or not
  options: string[]; // Product options such as "Color" and "Talla"
  vendor: string; // Fashion Nova default
  productType: string; // Product type
  collectionsToJoin: (string | undefined)[];
  variants: Variant[]; // Product variants
}


export interface Image{
    src: string; // URL of the image
    alt: string; // Alt text for the image
}

export interface Media{
    mediaContentType: string; // Type of media, e.g., "IMAGE"
    originalSource: Image; // URL of the media
    alt: string; // Alt text for the media
}
export type ProductList = Product[];

export interface ProductWithMedia {
  product: Product;
  media: Media[];
}

type CollectionNode = {
  id: string;
  title: string;
};

type CollectionEdge = {
  node: CollectionNode;
};

export type ShopifyCollectionsResponse = {
  data: {
    collections: {
      edges: CollectionEdge[];
    };
  };
};


type SizeTableRow = {
  [key: string]: string | undefined;
};

export type HTML_BODY = {
  attributes: string;
  sizeTable: SizeTableRow[];
};

export type StoreData = {
  copUsd: number;
  ganancia: number;
  tienda: string;
  collections: (string | undefined)[];
};

export interface Variant {
  title: string; // The title of the variant, e.g., "Product Name / Size"
  sku: string; // The SKU, unique per variant
  price: number; // The price of the variant
  inventoryQuantities: Array<{
    availableQuantity: number; // Quantity available in inventory
    locationId: string; // Location ID for the inventory
  }>;
  options: [string, string]; // Options for the variant, e.g., ["Color", "Size"]
}