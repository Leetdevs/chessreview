function mainEvalBar() {
  console.log("evalbar init");
  const EBAR = {
    currEval: 0,
    perspective: "white",
  };
  function setEvalbarEvaluation(evaluation) {
    EBAR.currEval = evaluation;
  }
  window.setEvalbarEvaluation = setEvalbarEvaluation;
  function drawEvalText(num) {
    if (typeof num === "number") {
      let textString = String(num);
      if (textString.length < 3 && !textString.includes(".")) {
        textString += ".0";
      }
      return textString;
    } else {
      return num;
    }
  }
  function setWhitePlayerText(text) {
    const whitePlayerTextInfoBg = document.getElementById("whitePlayerText");
    if (whitePlayerTextInfoBg) {
      whitePlayerTextInfoBg.innerHTML = text;
    }
  }
  window.setWhitePlayerText = setWhitePlayerText;
  function setBlackPlayerText(text) {
    const blackPlayerTextInfoBg = document.getElementById("blackPlayerText");
    if (blackPlayerTextInfoBg) {
      blackPlayerTextInfoBg.innerHTML = text;
    }
  }
  window.setBlackPlayerText = setBlackPlayerText;
  function getPlayerNameFromPgn(pgnString) {
    try {
      if (typeof pgnString === "string") {
        const whitePlayerName = pgnString.match(/\[White "([^"]+)"\]/)[1];
        const blackPlayerName = pgnString.match(/\[Black "([^"]+)"\]/)[1];
        if (typeof whitePlayerName === "string" && typeof blackPlayerName === "string") {
          return {
            w: whitePlayerName,
            b: blackPlayerName,
          };
        } else {
          return {
            w: "White",
            b: "Black",
          };
        }
      } else {
        return {
          w: "White",
          b: "Black",
        };
      }
    } catch (err) {
      return {
        w: "White",
        b: "Black",
      };
    }
  }
  window.getPlayerNameFromPgn = getPlayerNameFromPgn;
  const defaultWhitePlayerText = document.getElementById("whitePlayerText").innerHTML;
  const defaultBlackPlayerText = document.getElementById("blackPlayerText").innerHTML;
  function resetPlayerText() {
    document.getElementById("whitePlayerText").innerHTML = defaultWhitePlayerText;
    document.getElementById("blackPlayerText").innerHTML = defaultBlackPlayerText;
  }
  window.resetPlayerText = resetPlayerText;
  function setInfoText(infoTextString) {
    document.getElementById("evaluationInfoText").innerHTML = infoTextString;
  }
  window.setInfoText = setInfoText;
  function getPgnFromArray(arr) {
    let pgnString = "";
    let turnCounter = 1;
    let cleanArr = [];
    for (let move of arr) {
      if (typeof move === "string") {
        cleanArr.push(move);
      }
    }
    for (let i = 0; i < cleanArr.length; i = i + 2) {
      if (cleanArr[i]) {
        pgnString += `${turnCounter}. `;
        turnCounter++;
        pgnString += `${cleanArr[i]}`;
        if (cleanArr[i + 1]) {
          pgnString += ` ${cleanArr[i + 1]} `;
        }
      }
    }
    let trimmedPgn = pgnString.trim();
    return trimmedPgn;
  }
  window.getPgnFromArray = getPgnFromArray;
  function calcAccuracy(classificationsArr) {
    let accuracy = 100;
    let perMove = 100 / classificationsArr.length;
    for (let i = 0; i < classificationsArr.length; i++) {
      let foundClassif = false;
      const classif = classificationsArr[i];
      if (classif.includes("best") || classif.includes("great") || classif.includes("mate")) {
        // no need to subtract
        foundClassif = true;
      } else if (classif.includes("excellent")) {
        accuracy -= perMove * 0.2;
        foundClassif = true;
      } else if (classif.includes("good")) {
        accuracy -= perMove * 0.4;
        foundClassif = true;
      } else if (classif.includes("inaccuracy")) {
        accuracy -= perMove * 0.6;
        foundClassif = true;
      } else if (classif.includes("mistake")) {
        accuracy -= perMove * 0.8;
        foundClassif = true;
      } else if (classif.includes("blunder")) {
        accuracy -= perMove;
        foundClassif = true;
      } else if (!foundClassif) {
        console.error("DID NOT FIND CLASSIFICATION IN CALCULATE ACCURACY");
      }
    }
    return Math.round(accuracy * 10) / 10;
  }
  window.calcAccuracy = calcAccuracy;
  function updateEvalBarSize() {
    let evalCanvas = document.getElementById("evalcanvas");
    let infoBg = document.getElementById("infoBg");
    let boardGUI = document.getElementById("guiBg");
    let boardHeight;
    try {
      boardHeight = document.getElementsByClassName("chessboard-63f37")[0].offsetHeight;
    } catch (err) {
      boardHeight = 1;
    }
    /* evalcanvas dimensions */
    evalCanvas.width = 48;
    evalCanvas.height = boardHeight;
    /* boardGUI dimensions */
    boardGUI.style.width = "255px";
    boardGUI.style.height = boardHeight;
    /* boardCanvas centering */
    const totalElementWidth = Math.round(evalCanvas.getBoundingClientRect().width) + boardHeight + Math.round(boardGUI.getBoundingClientRect().width);
    const startElementPosition = (window.innerWidth - totalElementWidth) / 2;
    document.getElementById("board-container").style.left = `${Math.round(startElementPosition + evalCanvas.getBoundingClientRect().width)}px`;
    document.getElementById("board-container").style.top = `${Math.round(window.innerHeight / 2 + document.getElementById("chessNavbar").getBoundingClientRect().height / 2)}px`;
    /* new boardCanvas rect */
    let boardRect_ = document.getElementById("board-container").getBoundingClientRect();
    const boardRect = {
      top: boardRect_.top,
      bottom: boardRect_.top + boardHeight,
      left: boardRect_.left,
      right: boardRect_.left + boardHeight,
    };
    /* evalcanvas position */
    evalCanvas.style.top = Math.round(boardRect.top);
    evalCanvas.style.left = Math.round(boardRect.left) - Math.round(evalCanvas.getBoundingClientRect().width) - 18;
    /* boardGUI position */
    boardGUI.style.top = Math.round(boardRect.top);
    boardGUI.style.left = Math.round(boardRect.left) + Math.round(boardGUI.getBoundingClientRect().height) + 18;
    /* infoBg */
    const extraInfoBgWidth = 90;
    const extraInfoBgHeight = 90;
    const textOffset = 6;
    infoBg.style.top = Math.round(boardRect.top - extraInfoBgHeight / 2);
    infoBg.style.left = Math.round(document.getElementById("evalcanvas").getBoundingClientRect().left) - extraInfoBgWidth / 2;
    infoBg.style.width = totalElementWidth + 36 + extraInfoBgWidth;
    infoBg.style.height = boardHeight + extraInfoBgHeight;
    /* new boardRect */
    const newBoardRect_ = document.getElementById("board-container").getBoundingClientRect();
    const newBoardRect = {
      top: newBoardRect_.top,
      bottom: newBoardRect_.top + boardHeight,
      left: newBoardRect_.left,
      right: newBoardRect_.left + boardHeight,
    };
    /* infoBg player text position */
    let whitePlayerText = document.getElementById("whitePlayerText");
    let blackPlayerText = document.getElementById("blackPlayerText");
    whitePlayerText.style.left = Math.round(newBoardRect.left);
    blackPlayerText.style.left = Math.round(newBoardRect.left);
    try {
      const bOrientation = BOARD.orientation();
      if (bOrientation === "white") {
        whitePlayerText.style.top = newBoardRect.bottom + textOffset;
        blackPlayerText.style.top = newBoardRect.top - Math.round(document.getElementById("blackPlayerText").getBoundingClientRect().height) - textOffset;
      }
      if (bOrientation === "black") {
        whitePlayerText.style.top = newBoardRect.top - Math.round(document.getElementById("whitePlayerText").getBoundingClientRect().height) - textOffset;
        blackPlayerText.style.top = newBoardRect.bottom + textOffset;
      }
      /* evaluationInfoText position */
      let evaluationInfoText = document.getElementById("evaluationInfoText");
      evaluationInfoText.style.top = newBoardRect.top - Math.round(document.getElementById("evaluationInfoText").getBoundingClientRect().height) - textOffset;
      evaluationInfoText.style.left = newBoardRect.right - Math.round(document.getElementById("evaluationInfoText").getBoundingClientRect().width);
      if (EBAR.perspective !== bOrientation && (bOrientation === "white" || bOrientation === "black")) {
        EBAR.perspective = bOrientation;
      }
    } catch (err) {}
    requestAnimationFrame(updateEvalBarSize);
  }
  updateEvalBarSize();
  function updateEvaluation() {
    let evalbar = document.getElementById("evalcanvas");
    let ctx = evalbar.getContext("2d");
    ctx.clearRect(0, 0, evalbar.width, evalbar.height);
    let currEval = EBAR.currEval;
    if (typeof EBAR.currEval === "string") {
      EBAR.currEval[0] === "+" ? (currEval = 100) : (currEval = -100);
    }
    if (EBAR.perspective === "black") {
      let whiteAreaHeight = evalbar.height / 2;
      whiteAreaHeight += currEval * (evalbar.height / 20);
      let areaWidth = evalbar.width;
      ctx.save();
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, areaWidth, whiteAreaHeight);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "black";
      ctx.fillRect(0, whiteAreaHeight, areaWidth, evalbar.height - whiteAreaHeight);
      ctx.restore();
      ctx.save();
      let topEvalTextDrawPos;
      let evalTextDraw;
      if (typeof EBAR.currEval === "string") {
        evalTextDraw = EBAR.currEval[1] + EBAR.currEval[2];
        if (EBAR.currEval[0] === "+") {
          ctx.fillStyle = "black";
          topEvalTextDrawPos = 5 + 16;
        }
        if (EBAR.currEval[0] === "-") {
          ctx.fillStyle = "white";
          topEvalTextDrawPos = evalbar.height - 10;
        }
      }
      if (typeof EBAR.currEval === "number") {
        evalTextDraw = EBAR.currEval;
        if (EBAR.currEval > 0) {
          ctx.fillStyle = "black";
          topEvalTextDrawPos = 5 + 16;
        }
        if (EBAR.currEval <= 0) {
          ctx.fillStyle = "white";
          topEvalTextDrawPos = evalbar.height - 10;
        }
      }
      ctx.font = "bold 16px Arial";
      let text = drawEvalText(evalTextDraw);
      let textWidth = ctx.measureText(text).width;
      let textX = (evalbar.width - textWidth) / 2;
      ctx.fillText(text, textX, topEvalTextDrawPos);
      ctx.restore();
    }
    if (EBAR.perspective === "white") {
      let whiteAreaHeight = evalbar.height / 2;
      whiteAreaHeight += currEval * (evalbar.height / 20);
      let areaWidth = evalbar.width;
      let blackAreaHeight = evalbar.height - whiteAreaHeight;
      ctx.save();
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, areaWidth, blackAreaHeight);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "white";
      ctx.fillRect(0, blackAreaHeight, areaWidth, evalbar.height - blackAreaHeight);
      ctx.restore();
      ctx.save();
      let topEvalTextDrawPos;
      let evalTextDraw;
      if (typeof EBAR.currEval === "string") {
        evalTextDraw = EBAR.currEval[1] + EBAR.currEval[2];
        if (EBAR.currEval[0] === "+") {
          ctx.fillStyle = "black";
          topEvalTextDrawPos = evalbar.height - 10;
        }
        if (EBAR.currEval[0] === "-") {
          ctx.fillStyle = "white";
          topEvalTextDrawPos = 5 + 16;
        }
      }
      if (typeof EBAR.currEval === "number") {
        evalTextDraw = EBAR.currEval;
        if (EBAR.currEval >= 0) {
          ctx.fillStyle = "black";
          topEvalTextDrawPos = evalbar.height - 10;
        }
        if (EBAR.currEval < 0) {
          ctx.fillStyle = "white";
          topEvalTextDrawPos = 5 + 16;
        }
      }
      ctx.font = "bold 16px Arial";
      let text = drawEvalText(evalTextDraw);
      let textWidth = ctx.measureText(text).width;
      let textX = (evalbar.width - textWidth) / 2;
      ctx.fillText(text, textX, topEvalTextDrawPos);
      ctx.restore();
    }
    requestAnimationFrame(updateEvaluation);
  }
  updateEvaluation();
}
document.addEventListener("DOMContentLoaded", () => {
  mainEvalBar();
});
