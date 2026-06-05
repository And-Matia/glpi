export interface CustomizationWritable {
  id_address_delivery: number;
  id_cart: number;
  id_product: number;
  id_product_attribute: number;
  quantity: number;
  quantity_refunded: number;
  quantity_returned: number;
  in_cart: boolean;
  associations: {
    customized_data_text_fields: {
      id_customization_field: number;
      value: string;
    }[];
    customized_data_images: {
      id_customization_field: number;
      value: string;
    }[];
  };
}

export interface Customization extends CustomizationWritable {
  readonly id: number;
}

export interface CustomizationListItem {
  id: number;
  href: string;
}
