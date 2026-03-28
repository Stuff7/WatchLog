import type { Media, Profile } from "$/types.d.ts";
import { search, fetchTV, fetchMovie } from "$/tmdb.ts";
import { persistMedia } from "$/App.svelte";

export type ImportStatus =
  | "pending"
  | "searching"
  | "importing"
  | "done"
  | "conflict"
  | "error"
  | "skipped";

export type ImportItem = {
  name: string;
  status: ImportStatus;
  result?: Media;
  error?: string;
};

export type ConflictItem = {
  name: string;
  candidates: Media[];
  resolve: (pick: Media | null) => void;
};

const DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function doImport(
  profile: Profile,
  media: Media,
  item: ImportItem,
  onError: (msg: string) => void,
) {
  item.status = "importing";
  const full =
    media.media_type === "tv"
      ? await fetchTV(media.tmdb_id)
      : await fetchMovie(media.tmdb_id);
  const err = await persistMedia(profile, full);
  if (err) {
    item.status = "error";
    item.error = err;
    onError(err);
  } else {
    item.status = "done";
    item.result = full;
  }
  await sleep(DELAY_MS);
}

export class ImportState {
  items = $state<ImportItem[]>([]);
  conflicts = $state<ConflictItem[]>([]);
  running = $state(false);
  done = $state(false);
  resolving = $state(false);

  get total() {
    return this.items.length;
  }
  get completed() {
    return this.items.filter(
      (i) =>
        i.status === "done" || i.status === "skipped" || i.status === "error",
    ).length;
  }
  get success_count() {
    return this.items.filter((i) => i.status === "done").length;
  }
  get error_count() {
    return this.items.filter((i) => i.status === "error").length;
  }
  get conflict_count() {
    return this.conflicts.length;
  }

  reset() {
    this.items = [];
    this.conflicts = [];
    this.running = false;
    this.done = false;
    this.resolving = false;
  }

  async run(names: string[], profile: Profile, onError: (msg: string) => void) {
    this.items = names.map((name) => ({ name, status: "pending" }));
    this.conflicts = [];
    this.running = true;
    this.done = false;

    const conflict_queue: { item: ImportItem; candidates: Media[] }[] = [];

    for (const item of this.items) {
      item.status = "searching";

      try {
        const results = await search(item.name);
        await sleep(DELAY_MS);

        if (results.length === 0) {
          item.status = "error";
          item.error = "No results found";
          continue;
        }

        const exact = results.filter(
          (r) => r.name.toLowerCase() === item.name.toLowerCase(),
        );
        const candidates = exact.length > 0 ? exact : results.slice(0, 5);

        if (candidates.length === 1) {
          await doImport(profile, candidates[0], item, onError);
        } else {
          item.status = "conflict";
          conflict_queue.push({ item, candidates });
        }
      } catch (e: any) {
        item.status = "error";
        item.error = e.message ?? "Unknown error";
      }
    }

    this.running = false;

    if (conflict_queue.length === 0) {
      this.done = true;
      return;
    }

    this.resolving = true;
    this.conflicts = conflict_queue.map(({ item, candidates }) => ({
      name: item.name,
      candidates,
      resolve: async (pick: Media | null) => {
        this.conflicts = this.conflicts.filter((c) => c.name !== item.name);

        if (!pick) {
          item.status = "skipped";
        } else {
          await doImport(profile, pick, item, onError);
        }

        if (this.conflicts.length === 0) {
          this.resolving = false;
          this.done = true;
        }
      },
    }));
  }
}
