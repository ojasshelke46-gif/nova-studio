export interface Project {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface Stat {
  id: string;
  label: string;
  value: string | number;
}

export interface AnalyticsEvent {
  type: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}
