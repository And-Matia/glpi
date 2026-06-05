export interface GuestWritable {
  id_customer: number | null;
  id_operating_system: number | null;
  id_web_browser: number | null;
  javascript: boolean;
  screen_resolution_x: number;
  screen_resolution_y: number;
  screen_color: number;
  sun_java: boolean;
  adobe_flash: boolean;
  adobe_director: boolean;
  apple_quicktime: boolean;
  real_player: boolean;
  windows_media: boolean;
  accept_language: string;
  mobile_theme: boolean;
}

export interface Guest extends GuestWritable {
  readonly id: number;
}

export interface GuestListItem {
  id: number;
  href: string;
}
