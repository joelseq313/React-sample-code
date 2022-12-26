import React from "react";
import "./styles.css";
import useProject from "./useProject";
import WorkingAlert from "../../common/workingAlert";
import LatestScreenShorts from "./LatestScreenshot";

export default function Projects() {
  const {
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
    syncTime
  } = useProject();

  // console.log( {
  //   activeProject,
  //   selectProject,
  //   tasksTracker,
  //   ProAndTasks,
  //   secondsTohms,
  //   activetask,
  //   isTrackerOn,
  //   StartTracking,
  //   time,
  //   ScreenShorts,
  //   workingModule
  // })


  return (
    <>
      <div className="project-controler">
        <div className="project-list">
          <h4>Project List</h4>
          <div className="project-names">
            {Projects?.length === 0 ? (
              <h5>No Project Assign to you </h5>
            ) : (
              Projects?.map((project) => (
                <h5
                  className={
                    project.id === activeProject ? "project-active" : null
                  }
                  onClick={() => selectProject(project.id)}
                  key={project.id}
                >
                  {project.name}
                </h5>
              ))
            )}
          </div>
        </div>
        <div className="task-list">
        <div className="task-list-inner">
          <table>
            <thead>
              <tr>
                <th>Task List </th>
                <th style={{width:'65px'}}></th>
                <th style={{width:'35px'}}>{activetask?.id && <button className="submit btn btn-primary" onClick={() => syncTime()}>Sync Time</button>} </th>
              </tr>
            </thead>
            </table>
            <div className="task-list-body">
            <table>
            <tbody>
              {tasksTracker?.filter((task) =>
                ProAndTasks[activeProject]?.includes(task.id)
              ).length === 0 ? (
                <tr>
                  <td>No task Present</td>
                </tr>
              ) : (
                tasksTracker
                  ?.filter((task) =>
                    ProAndTasks[activeProject]?.includes(task.id)
                  )
                  .map((task) => (
                    <tr key={task.id}>
                      <td>{task.name}</td>
                      <td>{secondsTohms(task.seconds_worked_today)}</td>
                      <td>
                        <button onClick={() => setTaskAndTimer(task)}>
                          <img
                            src={
                              activetask.id === task.id
                                ? isTrackerOn
                                  ? "images/icons/red-pause.png"
                                  : "images/icons/green-play.png"
                                : "images/icons/green-play.png"
                            }
                            alt="start"
                            width="30"
                          />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
            </table>
          </div>
          </div>
        </div>
        <div className="timer-controler">
        {activetask?.id &&  <div className="timer-card">
            <div className="timer-action-container">
              <button className="timer-btn-pause" onClick={()=> setTaskAndTimer(activetask)}>
                <img
                  className="tracker-text"
                  src={
                    isTrackerOn
                      ? "images/icons/red-pause.png"
                      : "images/icons/green-play.png"
                  }
                  alt="timer-action"
                />
              </button>
            </div>

            <h5 className="active-project-name">
              {/* {activeProject?.length > 0 && Projects?.length > 0
                ? Projects.filter((project) => project.id === activeProject)[0]
                    .name
                : "No Project Selected"} */}
              {ProjectName()}
            </h5>

            <p>{activetask?.name ? activetask.name : "No Task Selected"}</p>

            {secondsTohms(
              tasksTracker.filter((task) => task.id === activetask.id)?.[0]
                ?.seconds_worked_today
            )}
          </div>}
          <div className="timer-card-bottom">
            <h5>Total Time</h5>
              <div className="pie no-round animate" style={{ "--p": time/28800 *100}}>
		              <span className="outer-circle">
                    {" "}
                    <span className="digits">
                      {"0" + Math.floor((time / 3600) % 60)}:
                    </span>
                    <span className="digits">{Math.floor((time / 60) % 60)}:</span>
                    <span className="digits">{Math.floor(time % 60)}</span>
                  </span>
	            </div>
          </div>
        </div>
      </div>
      {/* {SS?.length >0 &&   <div className="SS-container">
      <div className="SS-inner-container" style={{ display: "flex" }}>
      {SS.map((data) => (
          <img
            key={data.id}
            src={data.img}
            alt="latest ScreenShorts"
            width="150"
            height="150"
            style={{ margin: "0 5px" }}
          />
          ))}
      </div>
      </div>} */}
    <div className="screenshot-table-body" >
    <LatestScreenShorts/>
    </div>

      <WorkingAlert
        open={workingModule}
        yes={() => {
          setIsTrackerOn(true);
          setWorkingModule(false);
        }}
      />
    </>
  );
}
