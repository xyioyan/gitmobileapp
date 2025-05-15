import NetInfo from '@react-native-community/netinfo';
import { clearSyncedVisits, getUnsyncedVisits, markVisitAsSynced } from '@/storage/offlineQueue';
import { uploadVisit } from '@/services/uploadVisit';

type Visit = {
  id: number;
  photoUri: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  address: string;
  status: string;
  assignmentId: string;
  // The address field is optional and can be used to store the address of the visit
  userId: string;
};

export async function syncVisitsIfOnline() {
  console.log('Checking network status...');
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    console.log('Offline. Sync postponed.');
    return;
  }

  const unsyncedVisits: Visit[] = await getUnsyncedVisits();

  for (const visit of unsyncedVisits) {
    try {
      await uploadVisit({
        photoUri: visit.photoUri,
        description: visit.description,
        latitude: visit.latitude,
        longitude: visit.longitude,
        timestamp: visit.timestamp,
        address: visit.address,
        userId: visit.userId,
        status: visit.status,
        assignmentId: visit.assignmentId,
      });

      await markVisitAsSynced(Number(visit.id));
      console.log(`Synced visit: ${visit.id}`);
    } catch (err) {
      console.warn(`Sync failed for visit ${visit.id}`, err);
    }
  }
  console.log('Sync completed.');
  // ✅ Clean up synced visits from local DB
  clearSyncedVisits();
}