export interface GlpiUser {
  id: number;
  name: string;
  realname: string;
  firstname: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export interface GlpiGroup {
  id: number;
  name: string;
  comment: string;
  is_requester: boolean;
  is_assign: boolean;
  is_notify: boolean;
}

export interface GlpiLocation {
  id: number;
  name: string;
  completename: string;
  comment: string;
}

export interface GlpiManufacturer {
  id: number;
  name: string;
  comment: string;
}

export interface GlpiState {
  id: number;
  name: string;
  comment: string;
  is_visible_computer: boolean;
}

export interface GlpiITILCategory {
  id: number;
  name: string;
  completename: string;
  comment: string;
}

export interface GlpiEntity {
  id: number;
  name: string;
  completename: string;
  comment: string;
  phonenumber: string;
  address: string;
  postcode: string;
  town: string;
  country: string;
}

export interface GlpiProblem {
  id: number;
  name: string;
  content: string;
  date: string;
  status: number;
  priority: number;
  impact: number;
  urgency: number;
}

export interface GlpiChange {
  id: number;
  name: string;
  content: string;
  date: string;
  status: number;
  priority: number;
  impact: number;
  urgency: number;
}
