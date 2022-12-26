

export const TimeLogData = (task) => {

    const dbPromiss = indexedDB.open("ClockSession", 1);

    dbPromiss.onsuccess = () => {
      const db = dbPromiss.result;

      const doc = db.transaction("timeLogData", "readwrite");

      const timeLogs = doc.objectStore("timeLogData");

      const timeLog = timeLogs.put(task);

      timeLog.onsuccess = () => {
        doc.oncomplete = () => {
          db.close();
        };
      };

      timeLog.onerror = (event) => {
        console.log(event);
      };
    };

}

export const TimeSyncLogData = (task) =>{

    const dbPromiss = indexedDB.open("ClockSession", 1);

    dbPromiss.onsuccess = () => {
      const db = dbPromiss.result;

      const doc = db.transaction("timeSyncLogData", "readwrite");

      const timeLogs = doc.objectStore("timeSyncLogData");

      const timeLog = timeLogs.put(task);

      timeLog.onsuccess = () => {
        doc.oncomplete = () => {
          db.close();
        };
      };

      timeLog.onerror = (event) => {
        console.log(event);
      };
    };
}