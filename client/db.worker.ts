import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

const sqlite3 = await sqlite3InitModule();
const db = new sqlite3.oo1.DB();

db.exec(`CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)`);
db.exec({ sql: `INSERT INTO test (name) VALUES (?)`, bind: ["Breaking Bad"] });
db.exec({ sql: `INSERT INTO test (name) VALUES (?)`, bind: ["The Wire"] });

self.onmessage = (e) => {
  const rows = db.exec({
    sql: e.data,
    returnValue: "resultRows",
    rowMode: "object",
  });
  self.postMessage(rows);
};
