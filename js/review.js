window.reviewInfoText = {
  progress: "",
  move: "",
  classification: "",
  accuracy: "",
};
function resetReviewInfoText() {
  window.reviewInfoText = {
    progress: "",
    move: "",
    classification: "",
    accuracy: "",
  };
}
window.resetReviewInfoText = resetReviewInfoText;
let previousReviewInfoText = JSON.parse(JSON.stringify(window.reviewInfoText));
function setReviewInfoText() {
  if (window.reviewInfoText !== previousReviewInfoText && document.getElementById("stockfishDepthRangeSlider") && window.setInfoText) {
    window.setInfoText(`${window.reviewInfoText.progress} ${window.reviewInfoText.move} ${window.reviewInfoText.classification} ${window.reviewInfoText.accuracy}`);
    previousReviewInfoText = JSON.parse(JSON.stringify(window.reviewInfoText));
  }
  window.requestAnimationFrame(setReviewInfoText);
}
setReviewInfoText();
window.reviewInfoText.progress = "Enter PGN => Load Game";
window.isReadyToReview = true;
window.isChessGameOver = false;
window.currentMoveIndex = 0;
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
const startingPositionLog = [["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 0, [null, null], ["e2", "e4"], null]];
window.startingPositionLog = startingPositionLog;
window.previousPositions = JSON.parse(JSON.stringify(window.startingPositionLog));
async function evaluatePosition(fen, depth) {
  return new Promise((resolve, reject) => {
    const stockfish = new Worker("./stockfish/stockfish-16.1-lite-single.js");
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
        //    console.log(evaluation.b);
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
      var size = Math.round(Math.min(window.innerWidth, window.innerHeight) * boardSizeMultiplier);
      if (window.innerHeight < 600) {
        size = size + 10;
      }
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
    $board.find("." + squareClass).removeClass("highlight-square-draw");
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
          window.reviewInfoText.classification = "great";
        } else if (classificationImgUrl.includes("best")) {
          $square.addClass("highlight-square-best");
          window.reviewInfoText.classification = "best";
        } else if (classificationImgUrl.includes("excellent")) {
          $square.addClass("highlight-square-excellent");
          window.reviewInfoText.classification = "excellent";
        } else if (classificationImgUrl.includes("good")) {
          $square.addClass("highlight-square-good");
          window.reviewInfoText.classification = "good";
        } else if (classificationImgUrl.includes("inaccuracy")) {
          $square.addClass("highlight-square-inaccuracy");
          window.reviewInfoText.classification = "inaccuracy";
        } else if (classificationImgUrl.includes("mistake")) {
          $square.addClass("highlight-square-mistake");
          window.reviewInfoText.classification = "mistake";
        } else if (classificationImgUrl.includes("blunder")) {
          $square.addClass("highlight-square-blunder");
          window.reviewInfoText.classification = "blunder";
        } else if (classificationImgUrl.includes("mate")) {
          $square.addClass("highlight-square-mate");
          window.reviewInfoText.classification = "mate";
        } else if (classificationImgUrl.includes("draw")) {
          $square.addClass("highlight-square-draw");
          window.reviewInfoText.classification = "draw";
        }
      }
    }
    drawClassifications();
  }
  /* draw great move glow */
  function drawGreatMoveGlow() {
    $board.find("." + squareClass).removeClass("highlight-square-glowEnd");
    $board.find("." + squareClass).removeClass("highlight-square-glowStart");
    if (!window.isChessGameOver) {
      let glowSquares = window.previousPositions[window.currentMoveIndex][3];
      if (typeof glowSquares[0] === "string" && typeof glowSquares[1] === "string" && !glowSquares[0].includes("none") && !glowSquares[1].includes("none")) {
        let $glowSquareEnd = $board.find(".square-" + glowSquares[1]);
        let $glowSquareStart = $board.find(".square-" + glowSquares[0]);
        if (!$glowSquareEnd.hasClass("highlight-square-glowEnd")) {
          $glowSquareEnd.addClass("highlight-square-glowEnd");
        }
        if (!$glowSquareStart.hasClass("highlight-square-glowStart")) {
          $glowSquareStart.addClass("highlight-square-glowStart");
        }
      }
    }
    window.requestAnimationFrame(drawGreatMoveGlow);
  }
  drawGreatMoveGlow();
  /* evaluate all positions in a pgn and add them to previouspositions array */
  async function evaluateAllPositions(pgn) {
    if (window.isReadyToReview && !window.isCurrentlyEvaluating) {
      window.isReadyToReview = false;
      console.log("%c[SUCCESS] STARTING GAME REVIEW", "color: red; font-weight: bold;");
      function resetPreviousData() {
        window.previousPositions = JSON.parse(JSON.stringify(window.startingPositionLog));
        window.currentMoveIndex = 0;
        window.chessGame.load(previousPositions[0][0]);
        window.BOARD.position(previousPositions[0][0]);
        window.setEvalbarEvaluation(previousPositions[0][1]);
        window.removeMoveClassifications();
        window.isChessGameOver = false;
      }
      resetPreviousData();
      async function evaluatePositions() {
        game.load_pgn(pgn);
        const moves = game.history();
        console.log("Moves in SAN:", moves);
        if (moves.length < 1) {
          alert("[ERROR] INVALID PGN USE THIS FORMAT: 1. e4 e5 2. Nf3 Nc6");
          console.error("COULD NOT PARSE PGN");
        }
        game.reset();
        /* reset move array */
        window.previousPositions = JSON.parse(JSON.stringify(window.startingPositionLog));
        window.chessGame.load(previousPositions[0][0]);
        window.BOARD.position(previousPositions[0][0]);
        window.setEvalbarEvaluation(previousPositions[0][1]);
        window.removeMoveClassifications();
        window.isChessGameOver = false;
        /* play out the game */
        async function evaluateFenPos(fenPos, source, target, sanMove) {
          try {
            if (game.fen() !== fenPos) {
              console.error("game.fen is not in sync with fenPos");
              while (1) {}
            }
            const evaluation = await evaluatePosition(fenPos, Number(document.getElementById("stockfishDepthRangeSlider").value));
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
            } else if (currTurn === "b") {
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
            let drawn = false;
            if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition() || game.insufficient_material()) {
              drawn = true;
              const drawEval = 0;
              let currBestMoveDraw = ["none", "none"];
              if (stonkfishEval !== null && stonkfishEval !== undefined) {
                currBestMoveDraw = currBestMove;
              }
              console.log("DRAW PLAYED!");
              previousPositions.push([fenPos, drawEval, [target, "./img/classifications/" + "draw" + ".png"], currBestMove, sanMove]);
            }
            if (!drawn && stonkfishEval !== null && stonkfishEval !== undefined) {
              const MOVE_CLASSIFICATION = moveClassification(previousPositions[previousPositions.length - 1][1], stonkfishEval, source, target, previousPositions[previousPositions.length - 1][3]);
              previousPositions.push([fenPos, stonkfishEval, [target, "./img/classifications/" + MOVE_CLASSIFICATION + ".png"], currBestMove, sanMove]);
            } else {
              if (!drawn && currBestMove[0] === "none" && currBestMove[1] === "none" && (stonkfishEval === undefined || stonkfishEval === null) && (currEval === undefined || currEval === null)) {
                if (game.in_checkmate()) {
                  let matingStonkfishEval;
                  if (game.turn() === "w") {
                    // black won
                    matingStonkfishEval = "-M0";
                  }
                  if (game.turn() === "b") {
                    // white won
                    matingStonkfishEval = "+M0";
                  }
                  const MateInOnePosition = [fenPos, matingStonkfishEval, [target, "./img/classifications/" + "mate" + ".png"], [source, target], sanMove];
                  console.log("MATE IN ONE PLAYED!");
                  previousPositions.push(MateInOnePosition);
                }
              }
            }
          } catch (error) {
            alert("Critical Error: Refresh the Page");
            console.error("Error evaluating position:", error);
            while (1) {}
          }
        }
        async function processMoves(moves) {
          let moveCounter = 0;
          //   document.getElementById("reviewProgressText").innerHTML = `Progress: 0%`;
          window.reviewInfoText.progress = "Progress 0%";
          for (const move of moves) {
            const moveInfo = game.move(move);
            await evaluateFenPos(game.fen(), moveInfo.from, moveInfo.to, moveInfo.san);
            moveCounter++;
            if (moveCounter < moves.length) {
              //  document.getElementById("reviewProgressText").innerHTML = `Progress: ${Math.round((moveCounter / moves.length) * 100)}%`;
              window.reviewInfoText.progress = `Progress ${Math.round((moveCounter / moves.length) * 100)}%`;
            }
            if (moveCounter === moves.length) {
              //    document.getElementById("reviewProgressText").innerHTML = `Progress: 100%`;
              window.reviewInfoText.progress = "Progress 100%";
            }
          }
        }
        await processMoves(moves);
        /* reset board after game is played out */
        game.reset();
      }
      await evaluatePositions();
      window.isReadyToReview = true;
      function calculatePlayerAccuracy() {
        let whiteClassifications = [];
        let blackClassifications = [];
        let turn = "white";
        for (let i = 1; i < previousPositions.length; i++) {
          if (turn === "white") {
            whiteClassifications.push(previousPositions[i][2][1]);
            turn = "black";
          } else {
            blackClassifications.push(previousPositions[i][2][1]);
            turn = "white";
          }
        }
        window.reviewInfoText.progress = "";
        window.reviewInfoText.accuracy = `W ${window.calcAccuracy(whiteClassifications)}% B ${window.calcAccuracy(blackClassifications)}%`;
      }
      calculatePlayerAccuracy();
    } else {
      console.log("%c[ERROR] NOT READY FOR REVIEW", "color: red; font-weight: bold;");
    }
  }
  window.evaluateAllPositions = evaluateAllPositions;
  function handleMovement() {
    function handleMoveForward() {
      if (!isCurrentlyEvaluating && currentMoveIndex + 1 < previousPositions.length && window.chessGame !== undefined) {
        removeMoveClassifications();
        const previousFenPos = previousPositions[currentMoveIndex + 1][0];
        if (window.chessGame.validate_fen(previousFenPos).valid) {
          window.chessGame.load(previousFenPos);
        } else {
          console.error("Invalid FEN:", previousFenPos);
          while (1) {}
        }
        BOARD.position(previousFenPos);
        const previousEval = previousPositions[currentMoveIndex + 1][1];
        const previousTarget = previousPositions[currentMoveIndex + 1][2][0];
        const previousClassificationImage = previousPositions[currentMoveIndex + 1][2][1];
        drawMoveClassification(previousTarget, previousClassificationImage);
        const previousSanMove = previousPositions[currentMoveIndex + 1][4];
        window.reviewInfoText.move = previousSanMove;
        window.setEvalbarEvaluation(previousEval);
        window.isChessGameOver = false;
        currentMoveIndex++;
      }
    }
    window.handleMoveForward = handleMoveForward;
    function handleMoveBackward() {
      if (!isCurrentlyEvaluating && currentMoveIndex >= 1 && previousPositions.length > 1 && window.chessGame !== undefined) {
        removeMoveClassifications();
        const previousFenPos = previousPositions[currentMoveIndex - 1][0];
        if (window.chessGame.validate_fen(previousFenPos).valid) {
          window.chessGame.load(previousFenPos);
        } else {
          console.error("Invalid FEN:", previousFenPos);
          while (1) {}
        }
        BOARD.position(previousFenPos);
        const previousEval = previousPositions[currentMoveIndex - 1][1];
        const previousTarget = previousPositions[currentMoveIndex - 1][2][0];
        const previousClassificationImage = previousPositions[currentMoveIndex - 1][2][1];
        drawMoveClassification(previousTarget, previousClassificationImage);
        const previousSanMove = previousPositions[currentMoveIndex - 1][4];
        window.reviewInfoText.move = previousSanMove;
        window.setEvalbarEvaluation(previousEval);
        window.isChessGameOver = false;
        currentMoveIndex--;
      }
      if (!isCurrentlyEvaluating && currentMoveIndex < 1 && window.chessGame !== undefined) {
        window.reviewInfoText.classification = "";
        window.reviewInfoText.move = "";
      }
    }
    window.handleMoveBackward = handleMoveBackward;
    function processMoveForward() {
      document.addEventListener("keydown", (event) => {
        if (event.code === "ArrowRight") {
          handleMoveForward();
        }
      });
    }
    processMoveForward();
    function processMoveBackward() {
      document.addEventListener("keydown", (event) => {
        if (event.code === "ArrowLeft") {
          handleMoveBackward();
        }
      });
    }
    processMoveBackward();
  }
  handleMovement();
}

document.addEventListener("DOMContentLoaded", () => {
  main();
});
