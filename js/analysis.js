window.isChessGameOver = false;
function moveClassification(oldScore, newScore, source, target, greatmove) {
  let moveClassification;
  if (greatmove[0] === source && greatmove[1] === target) {
    moveClassification = "great";
    return moveClassification;
  }
  if (typeof oldScore === "number" && typeof newScore === "number") {
    let classificationChange;
    classificationChange = newScore - oldScore;
    if (window.chessGame.turn() === "w") {
      classificationChange = classificationChange * -1;
      console.log("loss/gain for black: " + classificationChange);
    } else {
      console.log("loss/gain for white: " + classificationChange);
    }
    if (classificationChange <= -2) {
      moveClassification = "blunder";
    } else if (classificationChange <= -1) {
      moveClassification = "mistake";
    } else if (classificationChange <= -0.5) {
      moveClassification = "inaccuracy";
    } else if (classificationChange <= -0.2) {
      moveClassification = "good";
    } else if (classificationChange <= -0.1) {
      moveClassification = "excellent";
    } else if (classificationChange <= 0) {
      moveClassification = "best";
    }
    if (classificationChange >= 0) {
      moveClassification = "best";
    }
  } else {
    let matingOldScore = oldScore;
    let matingNewScore = newScore;
    if (typeof matingOldScore === "string" && matingOldScore.includes("-")) {
      matingOldScore = -1000;
    }
    if (typeof matingOldScore === "string" && !matingOldScore.includes("-")) {
      matingOldScore = 1000;
    }
    if (typeof matingNewScore === "string" && matingNewScore.includes("-")) {
      matingNewScore = -1000;
    }
    if (typeof matingNewScore === "string" && !matingNewScore.includes("-")) {
      matingNewScore = 1000;
    }
    let matingClassificationChange = matingNewScore - matingOldScore;
    if (window.chessGame.turn() === "w") {
      matingClassificationChange = matingClassificationChange * -1;
      console.log("M - loss/gain for black: " + matingClassificationChange);
    } else {
      console.log("M - loss/gain for white: " + matingClassificationChange);
    }
    if (matingClassificationChange >= 0) {
      moveClassification = "best";
    } else {
      moveClassification = "blunder";
    }
  }
  return moveClassification;
}
window.isCurrentlyEvaluating = false;
const startingPositionLog = [["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 0, [null, null], ["e2", "e4"]]];
window.startingPositionLog = startingPositionLog;
window.previousPositions = JSON.parse(JSON.stringify(window.startingPositionLog));
async function evaluatePosition(fen, depth) {
  return new Promise((resolve, reject) => {
    const stockfish = new Worker("./stockfish/stockfish-nnue-16-single.js");
    isCurrentlyEvaluating = true;
    const evaluation = {
      e: null,
      b: null,
    };
    stockfish.onmessage = function (event) {
      const message = event.data ? event.data : event;
      if (message === "uciok") {
        stockfish.postMessage("isready");
      } else if (message === "readyok") {
        stockfish.postMessage(`position fen ${fen}`);
        stockfish.postMessage(`go depth ${depth}`);
      } else if (typeof message === "string" && message.startsWith("info") && message.includes("score") && message.includes(`info depth ${depth}`)) {
        evaluation.e = message;
        console.log(evaluation.e);
      } else if (typeof message === "string" && message.startsWith("bestmove")) {
        evaluation.b = message;
        console.log(evaluation.b);
        stockfish.postMessage("quit");
        stockfish.terminate();
        resolve(evaluation);
        isCurrentlyEvaluating = false;
      }
    };
    stockfish.onerror = function (error) {
      reject(error);
    };
    stockfish.postMessage("uci");
  });
}
function extractEvaluation(infoString) {
  try {
    const scoreCpIndex = infoString.indexOf("score cp");
    const scoreMateIndex = infoString.indexOf("score mate");

    if (scoreCpIndex !== -1) {
      const scoreSubstring = infoString.substring(scoreCpIndex + "score cp".length).trim();
      const parts = scoreSubstring.split(" ");
      const centipawnValue = parseInt(parts[0], 10);
      const pawnEvaluation = centipawnValue / 100;
      return pawnEvaluation;
    } else if (scoreMateIndex !== -1) {
      const scoreSubstring = infoString.substring(scoreMateIndex + "score mate".length).trim();
      const parts = scoreSubstring.split(" ");
      const mateInMoves = parseInt(parts[0], 10);
      return `M${mateInMoves}`;
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
}
function extractBestMove(bestMoveString) {
  let str = bestMoveString;
  console.log("bestmovestring");
  console.log(str);
  if (str.includes("(none)")) {
    return ["none", "none"];
  }
  let parts = str.split(" ");
  let move = parts[1];
  let start = move.slice(0, 2);
  let end = move.slice(2, 4);
  return [start, end];
}
function main() {
  let $board = $("#board");
  let squareClass = "square-55d63";
  let game = new Chess();
  window.chessGame = game;
  let BOARD = Chessboard("board", {
    position: "start",
    draggable: true,
    sparePieces: false,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
  });
  window.BOARD = BOARD;
  let oldBoardMultiplier = Number(document.getElementById("boardSizeRangeSlider").value) / 100;
  let oldWindowWidth = window.innerWidth;
  let oldWindowHeight = window.innerHeight;
  let updateCounter = 0;
  function resizeBoard() {
    const boardSizeMultiplier = Number(document.getElementById("boardSizeRangeSlider").value) / 100;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    if (updateCounter === 0 || oldBoardMultiplier !== boardSizeMultiplier || oldWindowWidth !== windowWidth || oldWindowHeight !== windowHeight) {
      console.log("update board size");
      updateCounter++;
      var container = document.getElementById("board-container");
      var size = Math.min(window.innerWidth, window.innerHeight) * boardSizeMultiplier;
      container.style.width = size + "px";
      container.style.height = size + "px";
      BOARD.resize();
    }
    oldBoardMultiplier = boardSizeMultiplier;
    oldWindowWidth = windowWidth;
    oldWindowHeight = windowHeight;
    window.requestAnimationFrame(resizeBoard);
  }
  resizeBoard();

  // Initial resize to ensure the board is sized correctly on page load
  resizeBoard();
  /* remove all move classifications */
  function removeMoveClassifications() {
    $board.find(".move-classification-image").remove();
    $board.find("." + squareClass).removeClass("highlight-square-blunder");
    $board.find("." + squareClass).removeClass("highlight-square-mistake");
    $board.find("." + squareClass).removeClass("highlight-square-inaccuracy");
    $board.find("." + squareClass).removeClass("highlight-square-good");
    $board.find("." + squareClass).removeClass("highlight-square-excellent");
    $board.find("." + squareClass).removeClass("highlight-square-best");
    $board.find("." + squareClass).removeClass("highlight-square-great");
    $board.find("." + squareClass).removeClass("highlight-square-mate");
  }
  window.removeMoveClassifications = removeMoveClassifications;
  /* draw move classification */
  function drawMoveClassification(square, imgUrl) {
    removeMoveClassifications();
    function drawClassifications() {
      if (typeof square === "string" && typeof imgUrl === "string") {
        const classificationImgUrl = imgUrl;
        let $square = $board.find(".square-" + square);
        let $img = $("<img>").attr("src", classificationImgUrl).addClass("move-classification-image").css({
          position: "absolute",
          width: "60%",
          height: "60%",
          top: "-20%",
          right: "-20%",
          draggable: false,
          pointerEvents: "none",
        });
        $square.append($img);
        if (classificationImgUrl.includes("great")) {
          $square.addClass("highlight-square-great");
        } else if (classificationImgUrl.includes("best")) {
          $square.addClass("highlight-square-best");
        } else if (classificationImgUrl.includes("excellent")) {
          $square.addClass("highlight-square-excellent");
        } else if (classificationImgUrl.includes("good")) {
          $square.addClass("highlight-square-good");
        } else if (classificationImgUrl.includes("inaccuracy")) {
          $square.addClass("highlight-square-inaccuracy");
        } else if (classificationImgUrl.includes("mistake")) {
          $square.addClass("highlight-square-mistake");
        } else if (classificationImgUrl.includes("blunder")) {
          $square.addClass("highlight-square-blunder");
        } else if (classificationImgUrl.includes("mate")) {
          $square.addClass("highlight-square-mate");
        }
      }
    }
    drawClassifications();
  }
  /* draw great move glow */
  function drawGreatMoveGlow() {
    $board.find("." + squareClass).removeClass("highlight-square-glowEnd");
    $board.find("." + squareClass).removeClass("highlight-square-glowStart");
    let glowSquares = window.previousPositions[window.previousPositions.length - 1][3];
    if (typeof glowSquares[0] === "string" && typeof glowSquares[1] === "string") {
      let $glowSquareEnd = $board.find(".square-" + glowSquares[1]);
      let $glowSquareStart = $board.find(".square-" + glowSquares[0]);
      if (!$glowSquareEnd.hasClass("highlight-square-glowEnd")) {
        $glowSquareEnd.addClass("highlight-square-glowEnd");
      }
      if (!$glowSquareStart.hasClass("highlight-square-glowStart")) {
        $glowSquareStart.addClass("highlight-square-glowStart");
      }
    }
    window.requestAnimationFrame(drawGreatMoveGlow);
  }
  drawGreatMoveGlow();
  /* legal move check */
  function onDrop(source, target) {
    if (window.isChessGameOver) {
      return "snapback";
    }
    if (isCurrentlyEvaluating) {
      return "snapback";
    }
    let move = game.move({
      from: source,
      to: target,
      promotion: "q",
    });
    if (move === null) {
      return "snapback";
    }
  }
  function onSnapEnd(source, target) {
    console.log("MOVING");
    const fenPos = game.fen();
    BOARD.position(fenPos);
    evaluatePosition(fenPos, Number(document.getElementById("stockfishDepthRangeSlider").value))
      .then((evaluation) => {
        //  console.log(evaluation);
        const currTurn = game.turn();
        const currEval = extractEvaluation(evaluation.e);
        const currBestMove = extractBestMove(evaluation.b);
        evaluation.e = null;
        evaluation.b = null;
        let stonkfishEval;
        if (currTurn === "w") {
          if (typeof currEval === "number") {
            stonkfishEval = currEval;
          }
          if (typeof currEval === "string" && !currEval.includes("-")) {
            stonkfishEval = "+" + currEval;
          } else if (typeof currEval === "string" && currEval.includes("-")) {
            let negativeEval = currEval.replace("-", "");
            stonkfishEval = "-" + negativeEval;
          }
        }
        if (currTurn === "b") {
          if (typeof currEval === "number") {
            stonkfishEval = currEval * -1;
          }
          if (typeof currEval === "string" && !currEval.includes("-")) {
            stonkfishEval = "-" + currEval;
          } else if (typeof currEval === "string" && currEval.includes("-")) {
            let negativeEval = currEval.replace("-", "");
            stonkfishEval = "+" + negativeEval;
          }
        }
        if (game.fen() !== fenPos) {
          console.error("game.fen is not in sync with fenPos");
          while (1) {}
        }
        if (stonkfishEval !== null && stonkfishEval !== undefined) {
          const MOVE_CLASSIFICATION = moveClassification(previousPositions[previousPositions.length - 1][1], stonkfishEval, source, target, previousPositions[previousPositions.length - 1][3]);
          console.log("move classification");
          console.log(MOVE_CLASSIFICATION);
          drawMoveClassification(target, "./img/classifications/" + MOVE_CLASSIFICATION + ".png");
          previousPositions.push([fenPos, stonkfishEval, [target, "./img/classifications/" + MOVE_CLASSIFICATION + ".png"], currBestMove]);
          window.setEvalbarEvaluation(stonkfishEval);
        } else {
          if (currBestMove[0] === "none" && currBestMove[1] === "none" && (stonkfishEval === undefined || stonkfishEval === null) && (currEval === undefined || currEval === null)) {
            const matingStonkfishEval = window.previousPositions[previousPositions.length - 1][1];
            const MateInOnePosition = [fenPos, matingStonkfishEval, [target, "./img/classifications/" + "mate" + ".png"], [source, target]];
            console.log("MATE IN ONE PLAYED!");
            console.log(MateInOnePosition);
            drawMoveClassification(target, "./img/classifications/" + "mate" + ".png");
            previousPositions.push(MateInOnePosition);
            window.setEvalbarEvaluation(matingStonkfishEval);
          }
        }
      })
      .catch((error) => {
        alert("Critical Error: Refresh the Page");
        console.error("Error evaluating position:", error);
      });
    if (game.in_checkmate()) {
      window.isChessGameOver = true;
      console.log("Checkmate! Game over.");
    } else if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition() || game.insufficient_material()) {
      window.isChessGameOver = true;
      alert("Draw! Game over.");
    } else if (game.in_check()) {
    }
  }
  function handleMovingBack() {
    function moveBack() {
      if (!isCurrentlyEvaluating && previousPositions.length > 1 && window.chessGame !== undefined) {
        removeMoveClassifications();
        previousPositions.splice(previousPositions.length - 1, 1);
        const previousFenPos = previousPositions[previousPositions.length - 1][0];
        // window.chessGame.load(previousFenPos);
        // Ensure the FEN is valid and load it into chess.js
        if (window.chessGame.validate_fen(previousFenPos).valid) {
          window.chessGame.load(previousFenPos);
        } else {
          console.error("Invalid FEN:", previousFenPos);
          while (1) {}
        }
        BOARD.position(previousFenPos);
        const previousEval = previousPositions[previousPositions.length - 1][1];
        const previousTarget = previousPositions[previousPositions.length - 1][2][0];
        const previousClassificationImage = previousPositions[previousPositions.length - 1][2][1];
        drawMoveClassification(previousTarget, previousClassificationImage);
        window.setEvalbarEvaluation(previousEval);
        window.isChessGameOver = false;
      }
    }
    window.handleMoveBack = moveBack;
    document.addEventListener("keydown", (event) => {
      if (event.code === "ArrowLeft") {
        moveBack();
      }
    });
  }
  handleMovingBack();
}

document.addEventListener("DOMContentLoaded", () => {
  main();
});
