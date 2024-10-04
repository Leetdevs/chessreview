function mainGUI() {
  /* engine depth slider */
  let stockfishDepthRangeSlider = document.getElementById("stockfishDepthRangeSlider");
  stockfishDepthRangeSlider.addEventListener("keydown", function (event) {
    event.preventDefault();
  });
  let stockfishDepthText = document.getElementById("stockfishDepthText");
  stockfishDepthText.innerHTML = "Engine Depth: " + stockfishDepthRangeSlider.value;
  stockfishDepthRangeSlider.oninput = function () {
    stockfishDepthText.innerHTML = "Engine Depth: " + this.value;
  };
  /* board size slider */
  let boardSizeRangeSlider = document.getElementById("boardSizeRangeSlider");
  boardSizeRangeSlider.addEventListener("keydown", function (event) {
    event.preventDefault();
  });
  let boardSizeText = document.getElementById("boardSizeText");
  boardSizeText.innerHTML = "Board Size: " + boardSizeRangeSlider.value + "%";
  boardSizeRangeSlider.oninput = function () {
    boardSizeText.innerHTML = "Board Size: " + this.value + "%";
  };
  /* buttons */
  let flipBtn = document.getElementById("flipBoardBtn");
  let resetBtn = document.getElementById("resetBoardBtn");
  let backwardBtn = document.getElementById("backwardBoardBtn");
  let exportBtn = document.getElementById("exportBoardBtn");
  let reviewBtn = document.getElementById("reviewBoardBtn");
  let goHomeBtn = document.getElementById("goHomeBoardBtn");
  function isBoardReady() {
    return window.chessGame !== undefined && window.BOARD !== undefined && window.isCurrentlyEvaluating === false;
  }
  flipBtn.addEventListener("mousedown", (event) => {
    console.log("flip btn clicked");
    if (isBoardReady()) {
      window.BOARD.flip();
    }
  });
  resetBtn.addEventListener("mousedown", (event) => {
    console.log("reset btn clicked");
    if (isBoardReady()) {
      window.previousPositions = JSON.parse(JSON.stringify(window.startingPositionLog));
      window.chessGame.load(previousPositions[0][0]);
      window.BOARD.position(previousPositions[0][0]);
      window.setEvalbarEvaluation(previousPositions[0][1]);
      window.removeMoveClassifications();
      window.resetAnalysisInfoText();
      window.isChessGameOver = false;
    }
  });
  backwardBtn.addEventListener("mousedown", (event) => {
    console.log("backward btn clicked");
    if (isBoardReady()) {
      window.handleMoveBack();
    }
  });
  exportBtn.addEventListener("mousedown", (event) => {
    console.log("export btn clicked");
    if (isBoardReady() && window.previousPositions.length > 1) {
      let generatedPgnFromArray = "";
      let movesToPgnArray = [];
      for (let i = 1; i < previousPositions.length; i++) {
        movesToPgnArray.push(previousPositions[i][4][2]);
      }
      if (movesToPgnArray.length >= 1) {
        generatedPgnFromArray = window.getPgnFromArray(movesToPgnArray);
      }
      if (generatedPgnFromArray.length > 0) {
        let exportPGNWindow = window.open("", "_blank");
        exportPGNWindow.document.write("<pre>" + generatedPgnFromArray + "</pre>");
        exportPGNWindow.document.title = "PGN Export";
        exportPGNWindow.document.close();
      }
    }
  });
  reviewBtn.addEventListener("mousedown", (event) => {
    console.log("review btn clicked");
    if (isBoardReady()) {
      window.location.href = "./review.html";
    }
  });
  goHomeBtn.addEventListener("mousedown", (event) => {
    console.log("go home btn clicked");
    if (isBoardReady()) {
      window.location.href = "./index.html";
    }
  });
}
document.addEventListener("DOMContentLoaded", (event) => {
  mainGUI();
});
