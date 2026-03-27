import sqlite3InitModule, {
  type Sqlite3Static,
  type Database,
  type WasmPointer,
  type SqlValue,
} from "@sqlite.org/sqlite-wasm";
import schema from "$/sql/migrations/0000.sql";

// -- Types --------------------------------------------------------------------

type InitMsg = {
  id: number;
  type: "init";
  payload: { token: string; gist_id: string | null };
};

type SaveMsg = {
  id: number;
  type: "save";
  payload: { token: string; gist_id: string };
};

type QueryMsg = {
  id: number;
  type: "query";
  payload: { sql: string; bind?: SqlValue[] };
};

type InboundMsg = InitMsg | SaveMsg | QueryMsg;

type InitReply = { id: number; type: "init"; gist_id: string };
type SaveReply = { id: number; type: "save" };
type QueryReply = {
  id: number;
  type: "query";
  rows: Record<string, SqlValue>[];
};
type ErrorReply = { id: number; type: "error"; error: string };

export type OutboundMsg = InitReply | SaveReply | QueryReply | ErrorReply;

// -- State --------------------------------------------------------------------

const sqlite3: Sqlite3Static = await sqlite3InitModule();
let db: Database | null = null;

// -- Helpers ------------------------------------------------------------------

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary_string = atob(base64);
  const bytes = new Uint8Array(binary_string.length);
  for (let i = 0; i < binary_string.length; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

/** Safely extracts the current DB state as a Uint8Array using the standard C-style API. */
function serializeInternal(db_ptr: WasmPointer): Uint8Array {
  const p_size = sqlite3.wasm.alloc(8);
  try {
    const p_output = sqlite3.capi.sqlite3_serialize(db_ptr, "main", p_size, 0);

    if (p_output === 0) {
      throw new Error("Serialization failed: returned null pointer");
    }

    const size = Number(sqlite3.wasm.peek(p_size, "i64"));

    const binary = new Uint8Array(
      sqlite3.wasm.heap8u().buffer,
      p_output,
      size,
    ).slice();

    sqlite3.capi.sqlite3_free(p_output);

    return binary;
  } finally {
    sqlite3.wasm.dealloc(p_size);
  }
}

// -- Gist Actions -------------------------------------------------------------

async function createGist(token: string): Promise<string> {
  const temp_db = new sqlite3.oo1.DB();
  temp_db.exec(schema);

  const binary = serializeInternal(temp_db.pointer!);
  const base64 = uint8ToBase64(binary);
  temp_db.close();

  const res = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: "WatchLog Database",
      public: false,
      files: { "db.sqlite": { content: base64 } },
    }),
  });

  if (!res.ok) throw new Error(`Gist create failed: ${res.status}`);
  const json = (await res.json()) as { id: string };
  return json.id;
}

async function loadFromGist(token: string, gist_id: string): Promise<void> {
  const res = await fetch(`https://api.github.com/gists/${gist_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error(`Gist fetch failed: ${res.status}`);

  const json = (await res.json()) as {
    files: Record<string, { content: string }>;
  };
  const file_content = json.files["db.sqlite"]?.content;

  if (db) db.close();
  db = new sqlite3.oo1.DB();

  if (!file_content || file_content.trim() === "") {
    db.exec(schema);
  } else {
    const binary = base64ToUint8(file_content);
    const p = sqlite3.wasm.allocFromTypedArray(binary);

    const rc = sqlite3.capi.sqlite3_deserialize(
      db.pointer!,
      "main",
      p,
      binary.byteLength,
      binary.byteLength,
      sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
        sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
    );

    if (rc !== 0) throw new Error(`SQLite deserialize failed with code: ${rc}`);
  }
}

async function saveToGist(token: string, gist_id: string): Promise<void> {
  if (!db) throw new Error("No DB to save");

  const binary = serializeInternal(db.pointer!);
  const base64 = uint8ToBase64(binary);

  const res = await fetch(`https://api.github.com/gists/${gist_id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files: { "db.sqlite": { content: base64 } } }),
  });

  if (!res.ok) throw new Error(`Gist save failed: ${res.status}`);
}

// -- Message router ------------------------------------------------------------

self.onmessage = async (e: MessageEvent<InboundMsg>): Promise<void> => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case "init": {
        let gist_id = msg.payload.gist_id;
        if (!gist_id) gist_id = await createGist(msg.payload.token);
        await loadFromGist(msg.payload.token, gist_id);
        self.postMessage({ id: msg.id, type: "init", gist_id } as InitReply);
        break;
      }
      case "save": {
        await saveToGist(msg.payload.token, msg.payload.gist_id);
        self.postMessage({ id: msg.id, type: "save" } as SaveReply);
        break;
      }
      case "query": {
        if (!db) throw new Error("DB not initialized");
        const rows = db.exec({
          sql: msg.payload.sql,
          bind: msg.payload.bind,
          returnValue: "resultRows",
          rowMode: "object",
        });
        self.postMessage({ id: msg.id, type: "query", rows } as QueryReply);
        break;
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    self.postMessage({ id: msg.id, type: "error", error } as ErrorReply);
  }
};
