import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('visits.db');

// Type definition for a visit
export type Visit = {
  id: number;
  photoUri: string;
  description: string;
  latitude: number;
  longitude: number;
  userId: string;
  timestamp: string;
  address: string;
  // The address field is optional and can be used to store the address of the visit
  synced: number;
};

// ✅ Initialize the visits table
export const initDb = () => {
  db.runSync(`DROP TABLE IF EXISTS visits;`);
  db.runSync(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photoUri TEXT,
      description TEXT,
      latitude REAL,
      longitude REAL,
      userId TEXT,
      timestamp TEXT,
      address TEXT,
      synced INTEGER DEFAULT 0
    );
  `);
};


// ✅ Save a visit locally
export const saveVisitLocally = (visit: Omit<Visit, 'id' | 'synced'>) => {
  db.runSync(
    `INSERT INTO visits (photoUri, description, latitude, longitude, userId, timestamp, address, synced)
     VALUES (?, ?, ?, ?, ?, ?,?, 0);`,
    [
      visit.photoUri,
      visit.description,
      visit.latitude,
      visit.longitude,
      visit.userId,
      visit.timestamp,
      visit.address,
      // 0 for unsynced
    ]
  );
  console.log('Visit saved locally:', visit);
};

// ✅ Get unsynced visits
export const getUnsyncedVisits = (): Visit[] => {
  const result = db.getAllSync<Visit>(`SELECT * FROM visits WHERE synced = 0;`);
  return result;
};

// ✅ Mark a visit as synced
export const markVisitAsSynced = (id: number) => {
  db.runSync(`UPDATE visits SET synced = 1 WHERE id = ?;`, [id]);
};