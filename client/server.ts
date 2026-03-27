export type DashboardLastWatched = {
  media_id: string;
  name: string;
  poster?: string | null;
  media_type: string;
  updated_at: number;
}

export type DashboardProfileSummary = {
  id: string;
  name: string;
  open: boolean;
  total: number;
  shows: number;
  movies: number;
  completed: number;
  in_progress: number;
  not_started: number;
  last_watched?: DashboardLastWatched | null;
}

export type Dashboard = {
  profiles: DashboardProfileSummary[];
}

export function createDashboardLastWatched(): DashboardLastWatched {
  return {
    media_id: "",
    name: "",
    poster: undefined,
    media_type: "",
    updated_at: 0,
  };
}

export function createDashboardProfileSummary(): DashboardProfileSummary {
  return {
    id: "",
    name: "",
    open: false,
    total: 0,
    shows: 0,
    movies: 0,
    completed: 0,
    in_progress: 0,
    not_started: 0,
    last_watched: undefined,
  };
}

export function createDashboard(): Dashboard {
  return {
    profiles: [],
  };
}

