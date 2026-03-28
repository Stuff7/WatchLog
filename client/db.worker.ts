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
  payload: { token: string; app_name: string };
};

type SaveMsg = {
  id: number;
  type: "save";
  payload: { token: string; app_name: string };
};

type QueryMsg = {
  id: number;
  type: "query";
  payload: { sql: string; bind?: SqlValue[] };
};

type InboundMsg = InitMsg | SaveMsg | QueryMsg;

type InitReply = { id: number; type: "init" };
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

function dbPath(app_name: string): string {
  return `/Apps/${app_name}/db.sqlite`;
}

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

// -- Dropbox Actions ----------------------------------------------------------

async function loadFromDropbox(token: string, app_name: string): Promise<void> {
  const response = await fetch(
    "https://content.dropboxapi.com/2/files/download",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({ path: dbPath(app_name) }),
      },
    },
  );

  if (db) db.close();
  db = new sqlite3.oo1.DB();

  if (response.status === 409) {
    // File doesn't exist yet — start fresh
    db.exec(schema);
    return;
  }

  if (!response.ok) {
    throw new Error(`Dropbox download failed: ${response.status}`);
  }

  const binary = new Uint8Array(await response.arrayBuffer());
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

  if (rc !== 0) {
    throw new Error(`SQLite deserialize failed with code: ${rc}`);
  }
}

async function saveToDropbox(token: string, app_name: string): Promise<void> {
  if (!db) throw new Error("No DB to save");

  const binary = serializeInternal(db.pointer!);

  const response = await fetch(
    "https://content.dropboxapi.com/2/files/upload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: dbPath(app_name),
          mode: "overwrite",
          autorename: false,
          mute: false,
        }),
        "Content-Type": "application/octet-stream",
      },
      body: binary,
    },
  );

  if (!response.ok) {
    throw new Error(`Dropbox upload failed: ${response.status}`);
  }
}

// -- Message router -----------------------------------------------------------

self.onmessage = async (e: MessageEvent<InboundMsg>): Promise<void> => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case "init": {
        await loadFromDropbox(msg.payload.token, msg.payload.app_name);
        self.postMessage({ id: msg.id, type: "init" } as InitReply);
        break;
      }
      case "save": {
        await saveToDropbox(msg.payload.token, msg.payload.app_name);
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
