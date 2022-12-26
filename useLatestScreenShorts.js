import React, { useState, useEffect } from "react";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { getlatestSecrrenShots } from "../../redux/Actions/screenShotAction";
import { RenderPageButtons } from "../../Utils/randerPageButtons";

export default function useLatestScreenShorts() {
  const dispatch = useDispatch();
  const [openSSModal, setOpenSSModal] = useState(false);
  const { LatestScreenshots, uploadScreenshot } = useSelector((store) => store.Screenshot);
  const { userInfo } = useSelector((store) => store.auth);
  const [openedSS, setOpenedSS] = useState("");
  const [modeOfChange, setModeOfChange] = useState("");
 
  const date = moment().format("YYYY-MM-DD");
  const [inProgress, setInProgress] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [pageCounts, setPageCounts] = useState(1);
  const [totalValues, setTotalValues] = useState(0);
  const userid=userInfo.id
  useEffect(() => {
    dispatch(
      getlatestSecrrenShots(
        date,
        setInProgress,
        currentPage,
        itemsPerPage,
        setPageCounts,
        setTotalValues,
        userid
      )
    );
  }, [dispatch, currentPage, itemsPerPage, date, uploadScreenshot,userid]);

  const openModalAndSetSS = (SS) => {
    console.log("to open , ", SS);
    setOpenedSS(SS);
    setOpenSSModal(true);
    return;
  };

  //for opened modal page change event
  useEffect(() => {
    if (openSSModal) {
      if (LatestScreenshots.length > 0) {
        if (modeOfChange === "next") {
          setOpenedSS(LatestScreenshots[0]);
        }
        if (modeOfChange === "prev") {
          setOpenedSS(LatestScreenshots[LatestScreenshots.length - 1]);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [LatestScreenshots]);

  const hendleNextImg = () => {
    const indexOf = LatestScreenshots.findIndex(
      (item) => item.id === openedSS.id
    );
    if (indexOf !== -1 && indexOf !== LatestScreenshots.length - 1) {
      setOpenedSS(LatestScreenshots[indexOf + 1]);
    }
    if (indexOf === LatestScreenshots.length - 1 && currentPage < pageCounts) {
      setModeOfChange("next");
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousImg = () => {
    const indexOf = LatestScreenshots.findIndex(
      (item) => item.id === openedSS.id
    );
    if (indexOf !== -1 && indexOf !== 0) {
      setOpenedSS(LatestScreenshots[indexOf - 1]);
      console.log("ioff 1", LatestScreenshots[indexOf - 1]);
    }
    if (indexOf === 0 && currentPage > 1) {
      console.log("ioff 2");
      setModeOfChange("prev");
      setCurrentPage((prev) => prev - 1);
    }
  };

  const pages = [];

  for (let i = 1; i <= pageCounts; i++) {
    pages.push(i);
  }

  const renderPageNumbers = pages.map((number) => {
    return (
      <button
        onClick={() => setCurrentPage(Number(number))}
        key={number}
        className={currentPage === number ? "active" : null}
      >
        {number}
      </button>
    );
  });

  const renderPageButtons = RenderPageButtons(
    currentPage,
    pageCounts,
    setCurrentPage
  );

  return {
    openSSModal,
    setOpenSSModal,
    openedSS,
    setOpenedSS,
    LatestScreenshots,
    inProgress,
    setInProgress,
    currentPage,
    setCurrentPage,
    pageCounts,
    setPageCounts,
    totalValues,
    setTotalValues,
    openModalAndSetSS,
    hendleNextImg,
    renderPageNumbers,
    handlePreviousImg,
    pages,
    renderPageButtons,
  };
}
