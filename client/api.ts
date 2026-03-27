import type { Media, Profile } from "$/types.d.ts";

async function request<T = void>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`${res.status}: ${path}`);
  if (res.status === 204 || options?.method === "DELETE") return undefined as T;
  return res.json() as Promise<T>;
}

function json(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// -- Profiles ------------------------------------------------------------------

export function getProfiles(): Promise<Profile[]> {
  return request("/api/profiles");
}

export function createProfile(
  id: string,
  name: string,
  open: boolean,
): Promise<void> {
  return request("/api/profile", json("POST", { id, name, open }));
}

export function updateProfile(
  id: string,
  patch: Partial<Pick<Profile, "name" | "open">>,
): Promise<void> {
  return request(`/api/profile/${id}`, json("PUT", patch));
}

export function deleteProfile(id: string): Promise<void> {
  return request(`/api/profile/${id}`, { method: "DELETE" });
}

export function cloneProfile(
  id: string,
  new_id: string,
  new_name: string,
): Promise<void> {
  return request(
    `/api/profile/clone/${id}`,
    json("POST", { new_id, new_name }),
  );
}

// -- Media ---------------------------------------------------------------------

export function addMedia(
  profile_id: string,
  media: Media,
): Promise<{ id: string }> {
  return request(`/api/profile/media/${profile_id}`, json("POST", media));
}

export function removeMedia(
  profile_id: string,
  media_id: string,
): Promise<void> {
  return request(`/api/profile/media/${profile_id}/${media_id}`, {
    method: "DELETE",
  });
}

export function refreshMedia(media_id: string, fresh: Media): Promise<void> {
  return request(`/api/profile/media/refresh/${media_id}`, json("PUT", fresh));
}

export function reorderMedia(profile_id: string, ids: string[]): Promise<void> {
  return request(
    `/api/profile/media/reorder/${profile_id}`,
    json("PUT", { ids }),
  );
}

// -- Progress ------------------------------------------------------------------

export type EpisodeProgress = {
  episode_id: number;
  watched: boolean;
  season_number: number;
  episode_number: number;
};

export type EpisodeProgressUpdate = {
  media_id: string;
  season_number: number;
  episode_number: number;
  name: string;
  air_date: string | null;
  runtime: number | null;
  still: string | null;
  watched: boolean;
};

export function getProgress(
  profile_id: string,
  media_id: string,
): Promise<EpisodeProgress[]> {
  return request(`/api/progress/${profile_id}/${media_id}`);
}

export function updateMediaWatched(
  profile_id: string,
  media_id: string,
  watched: boolean,
): Promise<void> {
  return request(
    `/api/progress/media/${profile_id}/${media_id}`,
    json("PUT", { watched }),
  );
}

export function updateEpisodeWatched(
  profile_id: string,
  episode_id: number,
  update: EpisodeProgressUpdate,
): Promise<void> {
  return request(
    `/api/progress/episode/${profile_id}/${episode_id}`,
    json("PUT", update),
  );
}
