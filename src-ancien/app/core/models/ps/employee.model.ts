export interface EmployeeWritable {
  id_lang: number;
  id_profile: number;
  passwd: string;
  lastname: string;
  firstname: string;
  email: string;
  active: boolean;
  bo_color: string;
  default_tab: number;
  bo_theme: string;
  bo_css: string;
  bo_width: number;
  bo_menu: boolean;
  stats_compare_option: number;
  preselect_date_range: string;
  id_last_order: number;
  id_last_customer_message: number;
  id_last_customer: number;
  reset_password_token: string;
  reset_password_validity: string | null;
  has_enabled_gravatar: boolean;
}

export interface Employee extends EmployeeWritable {
  readonly id: number;
  readonly last_passwd_gen: string;
  readonly stats_date_from: string;
  readonly stats_date_to: string;
  readonly stats_compare_from: string;
  readonly stats_compare_to: string;
}

export interface EmployeeListItem {
  id: number;
  href: string;
}
