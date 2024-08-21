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
  function updateEvalBarSize() {
    let evalCanvas = document.getElementById("evalcanvas");
    let boardGUI = document.getElementById("guiBg");
    let boardCanvas = document.getElementById("board");
    let boardHeight = boardCanvas.getBoundingClientRect().height;
    /* evalcanvas dimensions */
    evalCanvas.width = 48;
    evalCanvas.height = boardHeight;
    /* boardGUI dimensions */
    boardGUI.style.width = "255px";
    boardGUI.style.height = boardHeight;
    /* boardCanvas centering */
    const totalElementWidth = evalCanvas.getBoundingClientRect().width + boardCanvas.getBoundingClientRect().width + boardGUI.getBoundingClientRect().width;
    const startElementPosition = (window.innerWidth - totalElementWidth) / 2;
    document.getElementById("board-container").style.left = `${startElementPosition + evalCanvas.getBoundingClientRect().width}px`;
    document.getElementById("board-container").style.top = `${window.innerHeight / 2 + document.getElementById("chessNavbar").getBoundingClientRect().height / 2 - 1}px`;
    /* new boardCanvas rect */
    let boardRect = document.getElementById("board").getBoundingClientRect();
    /* evalcanvas position */
    evalCanvas.style.top = boardRect.top;
    evalCanvas.style.left = boardRect.left - evalCanvas.getBoundingClientRect().width - 18;
    /* boardGUI position */
    boardGUI.style.top = boardRect.top;
    boardGUI.style.left = boardRect.left + boardGUI.getBoundingClientRect().height + 18;
    try {
      const bOrientation = BOARD.orientation();
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
