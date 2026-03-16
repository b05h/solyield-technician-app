export interface InspectionResponses {
  f_inverter_serial: string;
  f_generation: number;
  f_panel_condition: 'Clean' | 'Dusty' | 'Bird Droppings' | 'Damaged';
  f_wiring_check?: 'Intact' | 'Exposed' | 'Damaged';
  f_issues?: ('Shading' | 'Rusting' | 'Loose Connections')[];
  f_site_photo: string[];
  f_docs?: string[];
}

export interface InspectionImageUris {
  f_site_photo?: string[];
  f_docs?: string[];
}

