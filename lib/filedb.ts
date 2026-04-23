import fs from 'fs';
import path from 'path';
import os from 'os';

const dbPath = process.env.DB_PATH ||
  (process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'data', 'data.json')
    : path.join(os.tmpdir(), 'go-home-data.json'));

export function getDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify({ bookmarks: [], groups: ["General"] }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  } catch {
    return { bookmarks: [], groups: ["General"] };
  }
}

export function saveDB(data: any) {
  const json = JSON.stringify(data, null, 2);
  // Retry up to 5 times to handle OneDrive/Windows file locking
  for (let i = 0; i < 5; i++) {
    try {
      fs.writeFileSync(dbPath, json);
      return;
    } catch (e: any) {
      if (i === 4) throw e;
      // Busy wait ~50ms before retry
      const end = Date.now() + 50;
      while (Date.now() < end) {}
    }
  }
}
