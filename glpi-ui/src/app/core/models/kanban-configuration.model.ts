export interface KanbanLanguage {
  id: number;
  name: string;
}

export interface KanbanStatusName {
  id?: number;
  name: string;
  language: KanbanLanguage;
}

export interface KanbanStatus {
  id?: number;
  glpiCode: number;
  color: string;
  names: KanbanStatusName[];
}

export interface KanbanConfiguration {
  statuses: KanbanStatus[];
  languages: KanbanLanguage[];
}
