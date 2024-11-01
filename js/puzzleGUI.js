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
  let startReviewBtn = document.getElementById("startReviewBoardBtn");
  let flipBtn = document.getElementById("flipBoardBtn");
  let forwardBtn = document.getElementById("forwardBoardBtn");
  let backwardBtn = document.getElementById("backwardBoardBtn");
  let exportBtn = document.getElementById("exportBoardBtn");
  let goHomeBtn = document.getElementById("goHomeBoardBtn");
  function isBoardReady() {
    return window.chessGame !== undefined && window.BOARD !== undefined;
  }
  function isNotReviewing() {
    if (!window.isCurrentlyEvaluating) {
      return true;
    } else {
      return false;
    }
  }
  window.isNotReviewing = isNotReviewing;
  function decodePgnInput(pgnInput) {
    let decodedPgn = "";
    let startWriting = false;
    for (let i = 0; i < pgnInput.length; i++) {
      if (pgnInput[i] === "1" && pgnInput[i + 1] === "." && pgnInput[i + 2] === " ") {
        startWriting = true;
        decodedPgn += pgnInput[i];
      } else {
        if (startWriting === true) {
          decodedPgn += pgnInput[i];
        }
      }
    }
    const rawDecodedPgn = decodedPgn.trim();
    console.log("DECODED PGN INPUT");
    console.log(rawDecodedPgn);
    return rawDecodedPgn;
  }
  window.decodePgnInput = decodePgnInput;
  startReviewBtn.addEventListener("mousedown", async (event) => {
    console.log("start review btn clicked");
    if (isBoardReady()) {
      let startReviewGUI = document.getElementById("startReviewGUI");
      if (startReviewGUI.style.visibility === "hidden") {
        if (isNotReviewing()) {
          window.showStartReviewGUI();
        }
      } else {
        window.hideStartReviewGUI();
      }
    }
  });
  flipBtn.addEventListener("mousedown", (event) => {
    console.log("flip btn clicked");
    if (isBoardReady() && isNotReviewing()) {
      window.BOARD.flip();
    }
  });
  forwardBtn.addEventListener("mousedown", (event) => {
    console.log("forward btn clicked");
    if (isBoardReady()) {
      if (isNotReviewing()) {
        window.handleMoveForward();
      }
    }
  });
  backwardBtn.addEventListener("mousedown", (event) => {
    console.log("backward btn clicked");
    if (isBoardReady()) {
      if (isNotReviewing()) {
        window.handleMoveBackward();
      }
    }
  });
  exportBtn.addEventListener("mousedown", (event) => {
    console.log("export btn clicked");
    if (isBoardReady() && isNotReviewing() && window.currentPuzzleArray && window.currentPuzzleArray.length > 0) {
      const currPuzzleArr = window.currentPuzzleArray;
      let puzzleExportText = "";
      let counter = 0;
      for (let puzzle of currPuzzleArr) {
        counter++;
        switch (counter) {
          case 1: {
            puzzleExportText += "The FEN position of a blunder/mistake that was played in the game\n";
            puzzleExportText += puzzle[0];
            puzzleExportText += "\n";
            break;
          }
          case 2: {
            puzzleExportText += "The FEN position of the puzzle itself\n";
            puzzleExportText += puzzle[0];
            puzzleExportText += "\n";
            break;
          }
          case 3: {
            puzzleExportText += "The FEN position of the solution to the puzzle\n";
            puzzleExportText += puzzle[0];
            puzzleExportText += "\n";
            puzzleExportText += "\n";
            break;
          }
        }
        if (counter >= 3) {
          counter = 0;
        }
      }
      let exportPGNWindow = window.open("", "_blank");
      exportPGNWindow.document.write("<pre>" + puzzleExportText + "</pre>");
      exportPGNWindow.document.title = "Puzzle Export";
      exportPGNWindow.document.close();
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
