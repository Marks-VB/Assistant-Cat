export type Priority = 'high' | 'normal' | 'low';
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';
export type ThemeId =
  | 'midnight'
  | 'porcelain'
  | 'minimal'
  | 'glass'
  | 'nord'
  | 'cyberpunk'
  | 'retro'
  | 'system';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface RepeatAfter {
  unit: 'days' | 'weeks' | 'months';
  amount: number;
}

export interface Task {
  id: string;
  title: string;
  due?: string;
  done: boolean;
  priority?: Priority;
  subtasks?: Subtask[];
  repeatAfter?: RepeatAfter | null;
  completedAt?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  allDay?: boolean;
  time?: string;
  duration?: number;
  recurrence?: Recurrence;
  notes?: string;
  /** Minutos antes do início para disparar o lembrete. null/undefined = sem lembrete. */
  reminderMinutes?: number | null;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
}

export interface TrashItem {
  id: string;
  kind: 'event' | 'task';
  deletedAt: string;
  item: CalendarEvent | Task;
}

export interface ProposalPayload {
  title?: string;
  content?: string;
  date?: string;
  time?: string;
  duration?: number;
  priority?: Priority;
  // AI schema fields and legacy/app-level fields retained for proposal compatibility.
  recurrence?: Recurrence;
  notes?: string;
  due?: string;
  repeatAfter?: RepeatAfter | null;
  reminderMinutes?: number | null;
}

export interface Proposal {
  kind: 'create_event' | 'create_task' | 'create_memory' | 'none';
  action?: 'create_event' | 'create_task' | 'create_memory' | 'none';
  payload: ProposalPayload;
  confidence?: number;
  missingFields?: string[];
  status: 'needs_review' | 'executed';
  key?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  proposal?: Proposal | null;
  isThinking?: boolean;
}

export interface CatAppearance {
  coat: 'tuxedo' | 'ginger' | 'black' | 'calico' | 'siamese' | 'solid_gray' | 'white' | 'gray_tabby';
  outfit: 'none' | 'suit' | 'hoodie';
  glasses: 'none' | 'round' | 'square';
  state?: 'idle' | 'speaking' | 'listening';
  background?: 'neutral' | 'dark';
}

export interface Profile {
  name: string;
  assistantName: string;
}

export interface AISettingsState {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  /**
   * URL absoluta do Worker de proxy, por exemplo `https://assistant-cat.SUBDOMINIO.workers.dev`.
   * Vazio (ou ausente) = mesmo host da página (web). No app nativo é obrigatório, porque a
   * origem do WebView é `https://localhost` e não existe servidor local de `/api/ai`.
   */
  proxyUrl?: string;
}

/** Posição da navegação principal. `auto` usa lateral no desktop e inferior no celular. */
export type NavLayout = 'auto' | 'bottom' | 'side';

export interface AppState {
  schemaVersion: number;
  profile: Profile;
  appearance: CatAppearance;
  theme: ThemeId;
  layout?: NavLayout;
  /** false até concluir as boas-vindas de primeiro acesso. */
  onboarded?: boolean;
  /** Duração padrão (minutos) ao criar compromisso manualmente. */
  defaultDuration?: number;
  tab: 'now' | 'chat' | 'calendar' | 'actions' | 'me';
  events: CalendarEvent[];
  tasks: Task[];
  messages: ChatMessage[];
  memories: Memory[];
  trash?: TrashItem[];
  executedProposalKeys: string[];
  autoSpeak?: boolean;
  ai?: AISettingsState;
}

export interface WeeklyRecap {
  week: { start: string; end: string };
  events: {
    total: number;
    totalMinutes: number;
    totalHours: string;
    categories: Record<string, number>;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
    subtasks: { total: number; completed: number };
  };
  productivity: {
    level: string;
    label: string;
    message: string;
  };
  summaryText: string;
}
