function startPuzzleGUIMain() {
  let startReviewGUI = document.getElementById("startReviewGUI");
  let startReviewGUIBackground = document.getElementById("startReviewGUIBackground");
  let startGameReviewBtnChessApps = document.getElementById("startGameReviewBtnChessApps");
  /* hide startReviewGUI on page load */
  startReviewGUI.style.visibility = "hidden";
  startReviewGUIBackground.style.visibility = "hidden";
  function resizeStartReviewGUI() {
    let srGUI = document.getElementById("startReviewGUI");
    let boardRectContainer = document.getElementById("board-container").getBoundingClientRect();
    let bHeight;
    try {
      bHeight = document.getElementsByClassName("chessboard-63f37")[0].offsetHeight;
    } catch (err) {
      bHeight = 1;
    }
    if (srGUI && boardRectContainer) {
      srGUI.style.top = boardRectContainer.top + bHeight / 2;
      srGUI.style.left = boardRectContainer.left + bHeight / 2;
      if (bHeight > 500) {
        srGUI.style.height = Math.round(bHeight * 0.85);
        srGUI.style.width = Math.round(bHeight * 0.85);
      } else {
        srGUI.style.height = Math.round(bHeight * 1.2);
        srGUI.style.width = Math.round(bHeight * 1.2);
      }
    }
    window.requestAnimationFrame(resizeStartReviewGUI);
  }
  resizeStartReviewGUI();
  function showStartReviewGUI() {
    startReviewGUI.style.visibility = "visible";
    startReviewGUIBackground.style.visibility = "visible";
  }
  window.showStartReviewGUI = showStartReviewGUI;
  function hideStartReviewGUI() {
    startReviewGUI.style.visibility = "hidden";
    startReviewGUIBackground.style.visibility = "hidden";
  }
  window.hideStartReviewGUI = hideStartReviewGUI;
  /* start findPuzzles */
  startGameReviewBtnChessApps.addEventListener("mousedown", async () => {
    if (!window.isCurrentlyEvaluating) {
      window.hideStartReviewGUI();
      /* startReviewGUI elements */
      let targetSearchWebsite = document.getElementById("targetSearchWebsite");
      let accountNameInput = document.getElementById("accountNameInput");
      let numberOfPuzzles = document.getElementById("numberOfPuzzles");
      const playerNameInput = accountNameInput.value;
      const platformNameInput = targetSearchWebsite.value;
      const amountInput = Number(numberOfPuzzles.value);
      let searchPuzzle = await window.findPuzzles(playerNameInput, platformNameInput, amountInput);
      window.currentPuzzleArray = searchPuzzle;
    }
  });
}
document.addEventListener("DOMContentLoaded", () => {
  startPuzzleGUIMain();
});
