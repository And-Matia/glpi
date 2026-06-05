export type ImportResourceType =
  | 'addresses'
  | 'carriers'
  | 'cart_rules'
  | 'carts'
  | 'categories'
  | 'combinations'
  | 'configurations'
  | 'contacts'
  | 'content_management_system'
  | 'countries'
  | 'currencies'
  | 'customer_messages'
  | 'customer_threads'
  | 'customers'
  | 'customizations'
  | 'deliveries'
  | 'employees'
  | 'groups'
  | 'guests'
  | 'image_types'
  | 'languages'
  | 'manufacturers'
  | 'messages'
  | 'order_carriers'
  | 'order_cart_rules'
  | 'order_details'
  | 'order_histories'
  | 'order_invoices'
  | 'order_payments'
  | 'order_slip'
  | 'order_states'
  | 'orders'
  | 'price_ranges'
  | 'product_customization_fields'
  | 'product_feature_values'
  | 'product_features'
  | 'product_option_values'
  | 'product_options'
  | 'product_suppliers'
  | 'products'
  | 'shop_groups'
  | 'shop_urls'
  | 'shops'
  | 'specific_price_rules'
  | 'specific_prices'
  | 'states'
  | 'stock_availables'
  | 'stock_movement_reasons'
  | 'stock_movements'
  | 'stocks'
  | 'stores'
  | 'suppliers'
  | 'supply_order_details'
  | 'supply_order_histories'
  | 'supply_order_receipt_histories'
  | 'supply_order_states'
  | 'supply_orders'
  | 'tags'
  | 'tax_rule_groups'
  | 'tax_rules'
  | 'taxes'
  | 'translated_configurations'
  | 'warehouse_product_locations'
  | 'warehouses'
  | 'weight_ranges'
  | 'zones';

export const RESOURCE_LABELS: Record<ImportResourceType, string> = {
  addresses:                      'Adresses',
  carriers:                       'Transporteurs',
  cart_rules:                     'Règles panier',
  carts:                          'Paniers',
  categories:                     'Catégories',
  combinations:                   'Déclinaisons',
  configurations:                 'Configurations',
  contacts:                       'Contacts',
  content_management_system:      'Gestion de contenu',
  countries:                      'Pays',
  currencies:                     'Devises',
  customer_messages:              'Messages clients',
  customer_threads:               'Fils clients',
  customers:                      'Clients',
  customizations:                 'Personnalisations',
  deliveries:                     'Livraisons',
  employees:                      'Employés',
  groups:                         'Groupes',
  guests:                         'Invités',
  image_types:                    "Types d'image",
  languages:                      'Langues',
  manufacturers:                  'Marques',
  messages:                       'Messages',
  order_carriers:                 'Transporteurs commandes',
  order_cart_rules:               'Règles panier commandes',
  order_details:                  'Détails commandes',
  order_histories:                'Historiques commandes',
  order_invoices:                 'Factures commandes',
  order_payments:                 'Paiements commandes',
  order_slip:                     'Avoirs',
  order_states:                   'États commandes',
  orders:                         'Commandes',
  price_ranges:                   'Tranches de prix',
  product_customization_fields:   'Champs personnalisation',
  product_feature_values:         'Valeurs caractéristiques',
  product_features:               'Caractéristiques produits',
  product_option_values:          'Valeurs attributs',
  product_options:                'Attributs produits',
  product_suppliers:              'Fournisseurs produits',
  products:                       'Produits',
  shop_groups:                    'Groupes boutiques',
  shop_urls:                      'URLs boutiques',
  shops:                          'Boutiques',
  specific_price_rules:           'Règles prix spécifiques',
  specific_prices:                'Prix spécifiques',
  states:                         'Régions',
  stock_availables:               'Stocks disponibles',
  stock_movement_reasons:         'Motifs mouvements stock',
  stock_movements:                'Mouvements stock',
  stocks:                         'Stocks',
  stores:                         'Magasins',
  suppliers:                      'Fournisseurs',
  supply_order_details:           'Détails cmd. fournisseur',
  supply_order_histories:         'Historiques cmd. fournisseur',
  supply_order_receipt_histories: 'Historiques réceptions',
  supply_order_states:            'États cmd. fournisseur',
  supply_orders:                  'Commandes fournisseur',
  tags:                           'Tags',
  tax_rule_groups:                'Groupes règles TVA',
  tax_rules:                      'Règles TVA',
  taxes:                          'Taxes',
  translated_configurations:      'Configurations traduites',
  warehouse_product_locations:    'Emplacements produits',
  warehouses:                     'Entrepôts',
  weight_ranges:                  'Tranches de poids',
  zones:                          'Zones',
};
