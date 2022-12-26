import { useState, useCallback, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getProjectList,
  getAllTasks,
  postWorkHourLog,
  syncNetworkErrorLog,
} from "../../redux/Actions/ProjectsAndTasksAction";
import { postScreenShot } from "../../redux/Actions/screenShotAction";
import {
  localstorage_project,
  localstorage_task,
  localstorage_current_date,
  localstorage_show_screenshot,
} from "../../constants";
import { TimeLogData } from "./utils";
import { v4 as uuid } from "uuid";
import moment from "moment";
import {
  cleareTimeLogDB,
  cleareSyncTimeLogDB,
  removeImageLogsDB,
} from "../../DBactions";

// initialize DBs ******************************
let dbRequest = indexedDB.open("ClockSession", 1);
let dbRequestSync = indexedDB.open("ClockSessionSync", 1);
let dbRequestImageSync = indexedDB.open("ClockSessionImageSync", 1);

// check for DB errors ***********************
dbRequest.onerror = (event) => {
  console.log("ERROR 1", event);
};

dbRequestSync.onerror = (event) => {
  console.log("ERROR sync 2", event);
};

dbRequestImageSync.onerror = (event) => {
  console.log("ERROR Image sync 2", event);
};

// create DB if not present *******************
dbRequest.onupgradeneeded = (event) => {
  const db = dbRequest.result;

  if (!db.objectStoreNames.contains("timeLogData")) {
    db.createObjectStore("timeLogData", { keyPath: "id" });
  }
};

dbRequestSync.onupgradeneeded = (event) => {
  const db = dbRequestSync.result;

  if (!db.objectStoreNames.contains("timeSyncLogData")) {
    db.createObjectStore("timeSyncLogData", { keyPath: "id" });
  }
};

dbRequestImageSync.onupgradeneeded = (event) => {
  const db = dbRequestImageSync.result;

  if (!db.objectStoreNames.contains("ClockSessionImageSync")) {
    db.createObjectStore("imageSyncLogData", { keyPath: "id" });
  }
};

// when DB initialization sucess ***************
dbRequest.onsuccess = () => {
  console.log("database opened successfully");
};

dbRequestSync.onsuccess = () => {
  console.log("database Sync opened successfully");
};

dbRequestImageSync.onsuccess = () => {
  console.log("Image database Sync opened successfully");
};

//hook for responsible Projects and tasks Timer functionalitys
export default function useProject() {
  const dispatch = useDispatch();
  const [latestSS, setLatestSS] = useState("");
  const [isTrackerOn, setIsTrackerOn] = useState(false);
  const [activeProject, setActiveProject] = useState("");
  const { userInfo } = useSelector((store) => store.auth);
  const { Projects, Tasks, ProAndTasks, SSShow } = useSelector(
    (store) => store.PAT
  );
  const [activetask, setActiveTask] = useState({});

  const [tasksTracker, setTaskTracker] = useState([]);
  const [oldTimeLogs, setOldTimeLogs] = useState([]);
  const [time, setTime] = useState(0);
  const intervalIDRef = useRef(null);
  const [workingModule, setWorkingModule] = useState(false);

  const [projectCount, setProjectCount] = useState(1);
  const [taskCount, setTaskCount] = useState(1);

  // runs every sec after tracker on
  const updateTaskTime = useCallback(
    (taskId) => {
      let tasks = tasksTracker;

      let Index = tasks.findIndex((task) => task.id === taskId);
      tasks[Index] = {
        ...tasks[Index],
        seconds_worked_today: tasks[Index].seconds_worked_today + 1,
      };

      // update DB
      TimeLogData(tasks[Index]);

      setTaskTracker(tasks);
      //     setTaskTracker(oldTasks => {
      //  oldTasks.s
      //     })
    },
    [tasksTracker]
  );

  const fatchTasks = useCallback(() => {
    dispatch(getAllTasks(taskCount, setTaskCount));
  }, [dispatch, taskCount]);

  const fatchProjects = useCallback(() => {
    dispatch(getProjectList(projectCount, setProjectCount));
  }, [dispatch, projectCount]);

  //load tasks and projects
  useEffect(() => {
    let showSS = localStorage.getItem(localstorage_show_screenshot);
    if (!showSS) {
      localStorage.setItem(localstorage_show_screenshot, true);
    }

    fatchProjects();
    fatchTasks();
  }, [dispatch, projectCount, taskCount, fatchProjects, fatchTasks]);

  // restore Image sync logs
  const restoreImageSyncData = useCallback(() => {
    const dbSyncPromiss = indexedDB.open("ClockSessionImageSync", 1);
    dbSyncPromiss.onsuccess = () => {
      const dbsync = dbSyncPromiss.result;
      const docsync = dbsync.transaction("imageSyncLogData", "readonly");
      const imgSyncLogs = docsync.objectStore("imageSyncLogData");
      const imageSyncLogData = imgSyncLogs.getAll();

      imageSyncLogData.onsuccess = (query) => {
        let data = query.srcElement.result;

        let screenshort_error_logs = data.filter(
          (log) => log.error === "ERR_NETWORK"
        );

        console.log("SS error logs", { screenshort_error_logs });
        if (screenshort_error_logs.length > 0) {
          screenshort_error_logs.forEach((log) => {
            dispatch(postScreenShot(log));
            removeImageLogsDB(log);
          });
        }
      };

      imageSyncLogData.onerror = (event) => {
        console.error(event);
      };

      docsync.oncomplete = () => {
        dbsync.close();
      };
    };
  }, [dispatch]);

  //restore sync logs from DB
  const restoreSyncData = useCallback(() => {
    const dbSyncPromiss = indexedDB.open("ClockSessionSync", 1);
    dbSyncPromiss.onsuccess = () => {
      const dbsync = dbSyncPromiss.result;
      const docsync = dbsync.transaction("timeSyncLogData", "readonly");
      const timeSyncLogs = docsync.objectStore("timeSyncLogData");
      const timeSyncLogData = timeSyncLogs.getAll();

      timeSyncLogData.onsuccess = (query) => {
        let data = query.srcElement.result;

        let network_error_logs = data.filter(
          (log) => log.error === "ERR_NETWORK"
        );
        let error_logs = data.filter(
          (log) => log.error === true && log.error_code
        );

        let networkLogsToRestore = network_error_logs.map((task) => ({
          task: task.task_id,
          logStartdateandTime: task.start_time,
          logEnddateandTime: task.end_time,
        }));

        let req = {
          list_Of_log: networkLogsToRestore,
        };

        // restore logs to BE if any otherwise clear sync DB
        if (networkLogsToRestore.length > 0) {
          console.log("calling network shync");
          dispatch(syncNetworkErrorLog(req, cleareSyncTimeLogDB, fatchTasks));
        }

        console.log("syncData", {
          data,
          network_error_logs,
          error_logs,
          logsToRestore: req,
        });
      };

      timeSyncLogData.onerror = (event) => {
        console.error(event);
      };

      docsync.oncomplete = () => {
        dbsync.close();
      };
    };
  }, [dispatch, fatchTasks]);

  // restore old logs from DB or clear logs when day changes
  useEffect(() => {
    let currentDate = localStorage.getItem(localstorage_current_date);
    let Today = moment().format("MMM DD, YYYY");

    if (currentDate) {
      // if days matches restore logss else clear log DB
      if (currentDate === Today) {
        const dbPromiss = indexedDB.open("ClockSession", 1);
        dbPromiss.onsuccess = () => {
          const db = dbPromiss.result;
          const doc = db.transaction("timeLogData", "readonly");
          const timeLogs = doc.objectStore("timeLogData");
          const timeLogData = timeLogs.getAll();

          timeLogData.onsuccess = (query) => {
            setOldTimeLogs(query.srcElement.result);
            // console.log("logs", query.srcElement.result);
          };

          timeLogData.onerror = (event) => {
            console.error(event);
          };

          doc.oncomplete = () => {
            db.close();
          };
        };
      } else {
        localStorage.setItem(localstorage_current_date, Today);
        cleareTimeLogDB();
      }
    } else {
      localStorage.setItem(localstorage_current_date, Today);
    }
  }, []);

  // calculate task time ( compare local DB time and from api and show task time)
  useEffect(() => {
    if (Tasks?.length > 0) {
      if (oldTimeLogs.length > 0) {
        // console.log("oldTimeLogs", oldTimeLogs);

        const oldLogsIds = oldTimeLogs.map((log) => log.id);

        const addedTasks = Tasks.map((task) => {
          if (task.seconds_worked_today > 0) {
            return task;
          }
          if (oldLogsIds.includes(task.id)) {
            return oldTimeLogs.filter((ot) => ot.id === task.id)[0];
          }
          return task;
        });

        const TotalTime = addedTasks.reduce(
          (accumulator, currentValue) =>
            accumulator + currentValue.seconds_worked_today,
          0
        );

        setTime(TotalTime);
        setTaskTracker(addedTasks);
      } else {
        setTaskTracker(Tasks);
        const TotalTime = Tasks.reduce(
          (accumulator, currentValue) =>
            accumulator + currentValue.seconds_worked_today,
          0
        );

        setTime(TotalTime);
      }

      let localTask = localStorage.getItem(localstorage_task);
      if (!localTask && Tasks?.length > 0) {
        localStorage.setItem(localstorage_task, JSON.stringify(Tasks[0]));
        setActiveTask(Tasks[0]);
      } else {
        setActiveTask(JSON.parse(localTask));
      }
    }
  }, [Tasks, oldTimeLogs]);

  // set projects
  useEffect(() => {
    let projectId = localStorage.getItem(localstorage_project);
    if (!projectId && Projects?.length > 0) {
      localStorage.setItem(localstorage_project, Projects[0]?.id);
      setActiveProject(Projects[0]?.id);
    } else {
      setActiveProject(projectId);
    }
  }, [Projects]);

  const stopTimer = useCallback(() => {
    clearInterval(intervalIDRef.current);
    intervalIDRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (intervalIDRef.current === null) {
      intervalIDRef.current = setInterval(() => {
        setTime((prev) => prev + 1);

        updateTaskTime(activetask.id);
      }, 1000);
    }
  }, [activetask.id, updateTaskTime, stopTimer]);

  const selectProject = (ID) => {
    setActiveProject(ID);
    localStorage.setItem(localstorage_project, ID);
  };

  // resetTimer works similarly to stopTimer but also calls `setTime(0)`
  useEffect(() => {
    return () => clearInterval(intervalIDRef.current); // to clean up on unmount
  }, []);

  const secondsTohms = (seconds) => {
    seconds = Number(seconds);
    var h = Math.floor((seconds % (3600 * 24)) / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = Math.floor(seconds % 60);

    return seconds === 0 ? "0:0:0" : `${h}:${m}:${s}`;
  };

  // make api request for task when called
  const updateLogForTask = useCallback(
    (TASK) => {
      let log = {
        id: uuid(),
        start_time: moment(TASK.start_time).format("YYYY-MM-DDTHH:mm:ssZ"),
        end_time: moment(TASK.end_time).format("YYYY-MM-DDTHH:mm:ssZ"),
        user_id: userInfo.id,
        task_id: activetask?.id,
        sync_id: null,
        error: null,
      };
      dispatch(postWorkHourLog(log, fatchTasks, restoreSyncData));
    },
    [dispatch, activetask?.id, fatchTasks, restoreSyncData, userInfo.id]
  );

  // runs when task started or paused
  const setTaskAndTimer = useCallback(
    (task) => {
      stopTimer();
      let currentTime = moment().format("YYYY-MM-DDTHH:mm:ssZ");

      // if continued with paused task
      if (activetask.id === task.id) {
        if (isTrackerOn) {
          let taskWithEndTime = { ...activetask, end_time: currentTime };
          setActiveTask(taskWithEndTime);
          setIsTrackerOn(false);
          localStorage.setItem(
            localstorage_task,
            JSON.stringify(taskWithEndTime)
          );
          // console.log("end time", {
          //   taskWithEndTime,
          //   isTrackerOn,
          //   task,
          //   activetask,
          // });

          // hit api when a timer stopped manually
          updateLogForTask(taskWithEndTime);
        } else {
          let taskWithStartTime = {
            ...activetask,
            start_time: currentTime,
            end_time: null,
          };
          setActiveTask(taskWithStartTime);
          setIsTrackerOn(true);
          localStorage.setItem(
            localstorage_task,
            JSON.stringify(taskWithStartTime)
          );
        }
        // setIsTrackerOn((state) => !state);
      } else {
        // if tracker is on then create new and log old to BE
        if (isTrackerOn) {
          //hit api when tasks Changes with old task data
          updateLogForTask({ ...activetask, end_time: currentTime });

          // create new task and start time with 1 sec delay
          setTimeout(() => {
            let taskWithStartTime = {
              ...task,
              start_time: moment().format("YYYY-MM-DDTHH:mm:ssZ"),
              end_time: null,
            };
            setIsTrackerOn(true);
            setActiveTask(taskWithStartTime);
            localStorage.setItem(
              localstorage_task,
              JSON.stringify(taskWithStartTime)
            );
          }, 1000);
        } else {
          // just create and start new task
          let taskWithStartTime = {
            ...task,
            start_time: moment().format("YYYY-MM-DDTHH:mm:ssZ"),
            end_time: null,
          };
          setIsTrackerOn(true);
          setActiveTask(taskWithStartTime);
          localStorage.setItem(
            localstorage_task,
            JSON.stringify(taskWithStartTime)
          );
        }
      }
    },
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ isTrackerOn, stopTimer, updateLogForTask]
  );

  useEffect(() => {
    if (latestSS) {
      let time = moment().format("YYYY-MM-DDTHH:mm:ssZ");
      let taskid = activetask?.id;

      let logImg = {
        id: uuid(),
        user_id: userInfo.id,
        task: taskid,
        userScreenshot: latestSS,
        datetime_of_capture: time,
      };

      dispatch(postScreenShot(logImg, restoreImageSyncData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestSS, dispatch]);

  // run when time comes for update task ( automatic  when interval runs)
  const updateLoginInterval = useCallback(
    () => {
      // console.log(activetask);

      let log = {
        id: uuid(),
        start_time: moment(activetask.start_time).format(
          "YYYY-MM-DDTHH:mm:ssZ"
        ),
        end_time: moment().format("YYYY-MM-DDTHH:mm:ssZ"),
        user_id: userInfo.id,
        task_id: activetask.id,
        sync_id: null,
        error: null,
      };
      dispatch(postWorkHourLog(log, fatchTasks, restoreSyncData));

      //1 sec dilay for next start time
      setTimeout(() => {
        stopTimer();
        let TaskwithnewStarttime = {
          ...activetask,
          start_time: moment().format("YYYY-MM-DDTHH:mm:ssZ"),
          end_time: null,
        };
        // console.log("TaskwithnewStarttime", { TaskwithnewStarttime });
        setActiveTask(TaskwithnewStarttime);
        localStorage.setItem(
          localstorage_task,
          JSON.stringify(TaskwithnewStarttime)
        );
      }, 1000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, userInfo, stopTimer, activetask]
  );

  const pauseTimerWhenDetuctIdeal = useCallback(() => {
    setIsTrackerOn(false);
    setTaskAndTimer(activetask);
    setWorkingModule(true);
  }, [setTaskAndTimer, activetask]);

  // start / stop intervels when timer starts
  useEffect(() => {
    let interval;
    let idealstate;
    let screencaptureTime = 1000 * 60 * userInfo.screenshots;

    // let screencaptureTime = 1000 * 20;
    if (isTrackerOn) {
      // for Screenshot
      interval = setInterval(() => {
        window.electron.screenCaptureApi.captureScreen(
          activetask.id,
          SSShow,
          (img) => setLatestSS(img)
        );
        updateLoginInterval();
      }, screencaptureTime);

      // for ideal time
      idealstate = setInterval(() => {
        window.electron.IdealTimeApi.getIdealTime(
          isTrackerOn,
          screencaptureTime / 1000,
          (idtime) => {
            if (idtime > screencaptureTime / 1000) {
              pauseTimerWhenDetuctIdeal();
              // setIsTrackerOn(false);
              // setWorkingModule(true);
            }
          }
        );
      }, 1000 * 5);

      if (isTrackerOn) {
        startTimer();
      }
    } else {
      clearInterval(interval);
      clearInterval(idealstate);
      stopTimer();
    }

    return () => {
      clearInterval(interval);
      clearInterval(idealstate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTrackerOn, startTimer, stopTimer, updateLoginInterval, SSShow]);

  const ProjectName = () => {
    let proId;
    Object.keys(ProAndTasks).forEach((key) => {
      if (ProAndTasks[key].includes(activetask.id)) {
        proId = key;
      }
    });

    return Projects.filter((pro) => pro.id === proId)[0]?.name;
  };

  //runs when sync time button pressed
  const syncTime = () => {
    let currentTime = moment().format("YYYY-MM-DDTHH:mm:ssZ");
    updateLogForTask({ ...activetask, end_time: currentTime });

    // create new task and start time with 1 sec delay
    setTimeout(() => {
      let taskWithStartTime = {
        ...activetask,
        start_time: moment().format("YYYY-MM-DDTHH:mm:ssZ"),
        end_time: null,
      };
      setIsTrackerOn(true);
      setActiveTask(taskWithStartTime);
      localStorage.setItem(
        localstorage_task,
        JSON.stringify(taskWithStartTime)
      );
    }, 1000);
  };

  return {
    activeProject,
    selectProject,
    tasksTracker,
    ProAndTasks,
    secondsTohms,
    setTaskAndTimer,
    activetask,
    isTrackerOn,
    time,
    Projects,
    ProjectName,
    workingModule,
    setIsTrackerOn,
    setWorkingModule,
    syncTime,
  };
}
