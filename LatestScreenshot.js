import React from "react";
import ScreenShortCard from "../../common/ScreenShortCard";
import useLatestScreenShorts from "./useLatestScreenShorts";

export default function LatestScreenShorts() {
  const {
    LatestScreenshots,
    inProgress,
    currentPage,
    setCurrentPage,
    totalValues,
    pages,
    renderPageButtons,
  } = useLatestScreenShorts();

  return (
    <>
      <div className="dashboard-screenshort-container">
        {inProgress && <h1>Loading Screen Shorts</h1>}

        {!inProgress && (
          <>
            <div className="screenshort-table-body">
              {LatestScreenshots.length > 0 ? (
                LatestScreenshots.map((screenshort) => (
                  <ScreenShortCard key={screenshort.id} data={screenshort} />
                ))
              ) : (
                <h4>No Screenshorts to show</h4>
              )}
            </div>

            <div className="screenshort-table-footer">
              <p>Showing {totalValues <=4  ? totalValues : "4"  } of {totalValues}</p>

              <div className="table-pagination">
                <button
                  className="prev-scr"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === pages[0] ? true : false}
                >
                  {" PREV"}
                </button>
                {renderPageButtons}
                <button
                  className="next-scr"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={
                    currentPage === pages[pages.length - 1] ? true : false
                  }
                >
                  {"NEXT "}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
