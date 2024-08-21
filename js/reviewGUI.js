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
  let goHomeBtn = document.getElementById("goHomeBoardBtn");
  function isBoardReady() {
    return window.chessGame !== undefined && window.BOARD !== undefined;
  }
  function isNotReviewing() {
    if (window.isReadyToReview && !window.isCurrentlyEvaluating) {
      return true;
    } else {
      return false;
    }
  }
  startReviewBtn.addEventListener("mousedown", async (event) => {
    console.log("start review btn clicked");
    if (isBoardReady()) {
      let reviewPgnInput = document.getElementById("reviewPgnInput").value;
      if (typeof reviewPgnInput === "string" && reviewPgnInput.length > 0) {
        if (isNotReviewing()) {
          await window.evaluateAllPositions(reviewPgnInput);
        }
      }
    }
  });
  flipBtn.addEventListener("mousedown", (event) => {
    console.log("flip btn clicked");
    if (isBoardReady()) {
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
