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
window.reviewInfoText.progress = "Enter Name => Load";
window.isCurrentlyEvaluating = false;
window.currentPuzzleArray = [];
window.currentPuzzleMoveIndex = 0;
/* fetch chess.com games */
async function fetchGamesChessCom(username) {
  let playerGames = [];
  try {
    const archivesResponse = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
    const archivesData = await archivesResponse.json();
    const lastArchive = archivesData.archives[archivesData.archives.length - 1];
    const gamesResponse = await fetch(lastArchive);
    const gamesData = await gamesResponse.json();
    const reversedGamesDataGames = gamesData.games.reverse();
    for (let gameData of reversedGamesDataGames) {
      if (typeof gameData.pgn === "string") {
        const trimmedPGN = gameData.pgn.trim();
        playerGames.push(trimmedPGN);
      }
    }
  } catch (error) {
    console.error("Fetch games chess.com error:", error);
    return "error";
  }
  return playerGames;
}
/* fetch lichess.org games */
async function fetchGamesLichessOrg(username) {
  const response = await fetch(`https://lichess.org/api/games/user/${username}?max=50&pgnInJson=true`, {
    method: "GET",
    headers: {
      Accept: "application/x-ndjson",
    },
  });
  if (!response.ok) {
    console.error("Failed to fetch games:", response.status, response.statusText);
    return "error";
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let playerGames = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    text
      .trim()
      .split("\n")
      .forEach((line) => {
        if (line) {
          playerGames.push(JSON.parse(line));
        }
      });
  }
  let cleanedUpPlayerGames = [];
  for (let gameData of playerGames) {
    const trimmedPGN = gameData.pgn.trim();
    cleanedUpPlayerGames.push(trimmedPGN);
  }
  return cleanedUpPlayerGames;
}
window.fetchGamesChessCom = fetchGamesChessCom;
window.fetchGamesLichessOrg = fetchGamesLichessOrg;
/* stockfish evaluatePosition */
async function evaluatePosition(fen, depth) {
  return new Promise((resolve, reject) => {
    const stockfish = new Worker("./stockfish/stockfish-16.1-lite-single.js");
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
        console.log(message);
      } else if (typeof message === "string" && message.startsWith("bestmove")) {
        evaluation.b = message;
        stockfish.postMessage("quit");
        stockfish.terminate();
        resolve(evaluation);
      }
    };
    stockfish.onerror = function (error) {
      reject(error);
    };
    stockfish.postMessage("uci");
  });
}
/* extract evaluation from stockfish */
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
/* extract best move from stockfish */
function extractBestMove(bestMoveString) {
  let str = bestMoveString;
  if (str.includes("(none)")) {
    return ["none", "none"];
  }
  let parts = str.split(" ");
  let move = parts[1];
  let start = move.slice(0, 2);
  let end = move.slice(2, 4);
  return [start, end];
}
async function main() {
  /* initialize board library */
  let $board = $("#board");
  let squareClass = "square-55d63";
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
    $board.find("." + squareClass).removeClass("highlight-square-puzzle");
    /* squareFrom */
    $board.find("." + squareClass).removeClass("squareFrom-great-highlight");
    $board.find("." + squareClass).removeClass("squareFrom-mistake-highlight");
    $board.find("." + squareClass).removeClass("squareFrom-blunder-highlight");
  }
  window.removeMoveClassifications = removeMoveClassifications;
  /* draw move classification */
  function drawMoveClassification(square, imgUrl, squareFrom) {
    /* only puzzle, great, mistake, blunder are being used */
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
          /* squareFrom */
          let $squareFrom = $board.find(".square-" + squareFrom);
          $squareFrom.addClass("squareFrom-great-highlight");
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
          /* squareFrom */
          let $squareFrom = $board.find(".square-" + squareFrom);
          $squareFrom.addClass("squareFrom-mistake-highlight");
          window.reviewInfoText.classification = "mistake";
        } else if (classificationImgUrl.includes("blunder")) {
          $square.addClass("highlight-square-blunder");
          /* squareFrom */
          let $squareFrom = $board.find(".square-" + squareFrom);
          $squareFrom.addClass("squareFrom-blunder-highlight");
          window.reviewInfoText.classification = "blunder";
        } else if (classificationImgUrl.includes("mate")) {
          $square.addClass("highlight-square-mate");
          window.reviewInfoText.classification = "mate";
        } else if (classificationImgUrl.includes("draw")) {
          $square.addClass("highlight-square-draw");
          window.reviewInfoText.classification = "draw";
        } else if (classificationImgUrl.includes("puzzle")) {
          $square.addClass("highlight-square-puzzle");
          window.reviewInfoText.classification = "puzzle";
        }
      }
    }
    drawClassifications();
  }
  /* initialize chessJS library */
  const chessJS = new Chess();
  window.chessGame = chessJS;
  /* move classification */
  function moveClassification(oldScore, newScore, source, target, greatmove) {
    let moveClassification;
    if (greatmove[0] === source && greatmove[1] === target) {
      moveClassification = "great";
      return moveClassification;
    }
    if (typeof oldScore === "number" && typeof newScore === "number") {
      let classificationChange;
      classificationChange = newScore - oldScore;
      if (chessJS.turn() === "w") {
        classificationChange = classificationChange * -1;
      } else {
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
      if (chessJS.turn() === "w") {
        matingClassificationChange = matingClassificationChange * -1;
      } else {
      }
      if (matingClassificationChange >= 0) {
        moveClassification = "best";
      } else {
        moveClassification = "blunder";
      }
    }
    return moveClassification;
  }
  /* find puzzles */
  async function findPuzzles(player, website, maxAmount) {
    maxAmount = maxAmount * 3; // 1 puzzle contains 3 positions
    window.currentPuzzleArray = [];
    window.currentPuzzleMoveIndex = 0;
    window.setEvalbarEvaluation(0);
    window.removeMoveClassifications();
    resetReviewInfoText();
    window.reviewInfoText.progress = `Puzzles Found 0/${maxAmount / 3} 0%`;
    chessJS.reset();
    BOARD.orientation("white");
    BOARD.position("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    chessJS.reset();
    window.isCurrentlyEvaluating = true;
    /* convert username to lowercase */
    if (typeof player !== "string") {
      console.error("find puzzles error username is not a string");
      /* stopping evaluation due to an error */
      alert("[ERROR] Invalid Username");
      window.isCurrentlyEvaluating = false;
      return [];
    }
    player = player.toLowerCase();
    /* load games by name and website */
    let fetchedGames = "error";
    if (website === "chess.com") {
      fetchedGames = await fetchGamesChessCom(player);
    }
    if (website === "lichess.org") {
      fetchedGames = await fetchGamesLichessOrg(player);
    }
    if (typeof fetchedGames !== typeof []) {
      console.error("find puzzles error fetching games");
      /* stopping evaluation due to an error */
      alert("[ERROR] Fetching Games Went Wrong");
      window.isCurrentlyEvaluating = false;
      return [];
    }
    fetchedGames = fetchedGames.slice(0, 30);
    /* get data about my player side */
    let myPlayerSideInGames = [];
    for (let pgn of fetchedGames) {
      const whitePlayerMatch = pgn.match(/\[White "(.*?)"\]/);
      const blackPlayerMatch = pgn.match(/\[Black "(.*?)"\]/);
      const whitePlayer = whitePlayerMatch[1];
      const blackPlayer = blackPlayerMatch[1];
      if (player === whitePlayer.toLowerCase() || player === blackPlayer.toLowerCase()) {
        if (player === whitePlayer.toLowerCase()) {
          myPlayerSideInGames.push("w");
        } else {
          myPlayerSideInGames.push("b");
        }
      } else {
        console.error("[CRITIAL ERROR] corrupted PGN, couldn't find player names");
        while (1) {}
      }
    }
    /* PGN positions to Array */
    let fetchedGamesPGNArray = [];
    for (let game of fetchedGames) {
      chessJS.load_pgn(game);
      fetchedGamesPGNArray.push(chessJS.history());
      chessJS.reset();
    }
    /* PGN positions to FEN Array */
    let fetchedGamesPGNFENArray = [];
    for (let PGNArr of fetchedGamesPGNArray) {
      let gameFenArr = [];
      for (let moves of PGNArr) {
        chessJS.move(moves);
        gameFenArr.push([moves, chessJS.fen()]);
      }
      chessJS.reset();
      fetchedGamesPGNFENArray.push(gameFenArr);
    }
    chessJS.reset();
    /* 
    the data is:
    [
    [["pgn", "fen"],["pgn", "fen"],["pgn", "fen"],["pgn", "fen"],["pgn", "fen"]],
    ...
    ]
    */
    let puzzlesArray = [];
    window.puzzlesArray = puzzlesArray;
    function searchPuzzles(evaluatedGame, myPlayerSide) {
      for (let i = 1; i < evaluatedGame.length; i++) {
        if (puzzlesArray.length < maxAmount) {
          let moveEval = evaluatedGame[i][0];
          let previousMoveEval = evaluatedGame[i - 1][0];
          let moveBestMove = evaluatedGame[i - 1][1];
          let moveCurrTurn = evaluatedGame[i][2];
          let moveCurrClassification = evaluatedGame[i][3];
          let moveCurrentFenPos = evaluatedGame[i][4];
          let movePreviousFenPos = evaluatedGame[i - 1][4];
          let movePlayedMove = evaluatedGame[i][5];
          let playedMoveNotationSAN = evaluatedGame[i][6];
          if ((moveCurrTurn === "w" && myPlayerSide === "b") || (moveCurrTurn === "b" && myPlayerSide === "w")) {
            if (Math.abs(evaluatedGame[i - 1][0]) <= 3 && typeof moveEval === "number" && (moveCurrClassification === "blunder" || moveCurrClassification === "mistake")) {
              if (moveBestMove[0] !== movePlayedMove[0] || moveBestMove[1] !== movePlayedMove[1]) {
                /* show the mistake/blunder */
                puzzlesArray.push([moveCurrentFenPos, movePlayedMove, myPlayerSide, moveEval, "./img/classifications/" + moveCurrClassification + ".png", playedMoveNotationSAN]);
                /* go back 1 move, show the puzzle */
                puzzlesArray.push([movePreviousFenPos, moveBestMove, myPlayerSide, previousMoveEval, "./img/classifications/" + "puzzle" + ".png", ""]);
                /* show the solution */
                chessJS.reset();
                chessJS.load(movePreviousFenPos);
                const puzzleSolutionMove = chessJS.move({ from: moveBestMove[0], to: moveBestMove[1] });
                const puzzleSolutionSAN = puzzleSolutionMove.san;
                const moveSolutionFenPos = chessJS.fen();
                puzzlesArray.push([moveSolutionFenPos, moveBestMove, myPlayerSide, previousMoveEval, "./img/classifications/" + "great" + ".png", puzzleSolutionSAN]);
                chessJS.reset();
                console.log("puzzlesArray pushing");
                window.reviewInfoText.progress = `Puzzles Found ${puzzlesArray.length / 3}/${maxAmount / 3} ${Math.round((puzzlesArray.length / maxAmount) * 100)}%`;
              }
            }
          }
        }
      }
    }
    let gameCounter = 0;
    for (let game of fetchedGamesPGNFENArray) {
      if (puzzlesArray.length < maxAmount) {
        let evaluatedGame = [[0, ["e2", "e4"], "w", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"]];
        for (let moves of game) {
          let pgnMoveNotation = moves[0];
          let fenMoveNotation = moves[1];
          const moveInfo = chessJS.move(pgnMoveNotation);
          let evaluation = await evaluatePosition(fenMoveNotation, document.getElementById("stockfishDepthRangeSlider").value);
          const fenPos = chessJS.fen();
          const currTurn = chessJS.turn();
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
          if (chessJS.fen() !== fenPos) {
            console.error("chessJS.fen is not in sync with fenPos");
            while (1) {}
          }
          const moveCl = moveClassification(evaluatedGame[evaluatedGame.length - 1][0], stonkfishEval, moveInfo.from, moveInfo.to, evaluatedGame[evaluatedGame.length - 1][1]);
          evaluatedGame.push([stonkfishEval, currBestMove, currTurn, moveCl, chessJS.fen(), [moveInfo.from, moveInfo.to], pgnMoveNotation]);
        }
        chessJS.reset();
        searchPuzzles(evaluatedGame, myPlayerSideInGames[gameCounter]);
        gameCounter++;
      }
    }
    chessJS.reset();
    console.log("puzzles done");
    function setStartingPuzzlePosition() {
      removeMoveClassifications();
      const previousFenPos = puzzlesArray[window.currentPuzzleMoveIndex][0];
      const previousEvaluation = puzzlesArray[window.currentPuzzleMoveIndex][3];
      chessJS.reset();
      const orientationRune = puzzlesArray[window.currentPuzzleMoveIndex][2];
      if (orientationRune === "w") {
        BOARD.orientation("white");
      }
      if (orientationRune === "b") {
        BOARD.orientation("black");
      }
      if (orientationRune !== "w" && orientationRune !== "b") {
        console.error("invalid board orientation error");
      }
      window.setEvalbarEvaluation(previousEvaluation);
      BOARD.position(previousFenPos);
      /* draw move classification */
      resetReviewInfoText();
      const previousClassificationImage = puzzlesArray[window.currentPuzzleMoveIndex][4];
      let previousTarget;
      if (!previousClassificationImage.includes("puzzle")) {
        previousTarget = puzzlesArray[window.currentPuzzleMoveIndex][1][1];
        let squareFromTarget = puzzlesArray[window.currentPuzzleMoveIndex][1][0];
        /* squareFrom */
        drawMoveClassification(previousTarget, previousClassificationImage, squareFromTarget);
      } else {
        previousTarget = puzzlesArray[window.currentPuzzleMoveIndex][1][0];
        /* without squareFrom (puzzle) */
        drawMoveClassification(previousTarget, previousClassificationImage);
      }
      /* set reviewInfoText SAN move */
      reviewInfoText.move = puzzlesArray[window.currentPuzzleMoveIndex][5];
    }
    setStartingPuzzlePosition();
    window.isCurrentlyEvaluating = false;
    return puzzlesArray;
  }
  window.findPuzzles = findPuzzles;

  /* test */
  /*
  if (!window.isCurrentlyEvaluating) {
    let searchPuzzle = await findPuzzles("leetdev", "lichess.org", 4);
    console.log(searchPuzzle);
    window.currentPuzzleArray = searchPuzzle;
  }
  */
  /* */

  /* board movement */
  function handleMoveForward() {
    if (!window.isCurrentlyEvaluating && window.currentPuzzleArray.length > window.currentPuzzleMoveIndex + 1) {
      removeMoveClassifications();
      window.currentPuzzleMoveIndex++;
      const previousFenPos = window.currentPuzzleArray[window.currentPuzzleMoveIndex][0];
      const previousEvaluation = window.currentPuzzleArray[window.currentPuzzleMoveIndex][3];
      chessJS.reset();
      const orientationRune = window.currentPuzzleArray[window.currentPuzzleMoveIndex][2];
      if (orientationRune === "w") {
        BOARD.orientation("white");
      }
      if (orientationRune === "b") {
        BOARD.orientation("black");
      }
      if (orientationRune !== "w" && orientationRune !== "b") {
        console.error("invalid board orientation error");
      }
      window.setEvalbarEvaluation(previousEvaluation);
      BOARD.position(previousFenPos);
      /* draw move classification */
      resetReviewInfoText();
      const previousClassificationImage = window.currentPuzzleArray[window.currentPuzzleMoveIndex][4];
      let previousTarget;
      if (!previousClassificationImage.includes("puzzle")) {
        previousTarget = window.currentPuzzleArray[window.currentPuzzleMoveIndex][1][1];
        let squareFromTarget = window.currentPuzzleArray[window.currentPuzzleMoveIndex][1][0];
        /* squareFrom */
        drawMoveClassification(previousTarget, previousClassificationImage, squareFromTarget);
      } else {
        previousTarget = window.currentPuzzleArray[window.currentPuzzleMoveIndex][1][0];
        /* without squareFrom (puzzle) */
        drawMoveClassification(previousTarget, previousClassificationImage);
      }
      /* set reviewInfoText SAN move */
      reviewInfoText.move = window.currentPuzzleArray[window.currentPuzzleMoveIndex][5];
    }
  }
  function handleMoveBackward() {
    if (!window.isCurrentlyEvaluating && window.currentPuzzleArray.length > 0 && window.currentPuzzleMoveIndex > 0) {
      removeMoveClassifications();
      window.currentPuzzleMoveIndex--;
      const previousFenPos = window.currentPuzzleArray[window.currentPuzzleMoveIndex][0];
      const previousEvaluation = window.currentPuzzleArray[window.currentPuzzleMoveIndex][3];
      chessJS.reset();
      const orientationRune = window.currentPuzzleArray[window.currentPuzzleMoveIndex][2];
      if (orientationRune === "w") {
        BOARD.orientation("white");
      }
      if (orientationRune === "b") {
        BOARD.orientation("black");
      }
      if (orientationRune !== "w" && orientationRune !== "b") {
        console.error("invalid board orientation error");
      }
      window.setEvalbarEvaluation(previousEvaluation);
      BOARD.position(previousFenPos);
      /* draw move classification */
      resetReviewInfoText();
      const previousClassificationImage = window.currentPuzzleArray[window.currentPuzzleMoveIndex][4];
      let previousTarget;
      if (!previousClassificationImage.includes("puzzle")) {
        previousTarget = window.currentPuzzleArray[window.currentPuzzleMoveIndex][1][1];
        let squareFromTarget = window.currentPuzzleArray[window.currentPuzzleMoveIndex][1][0];
        /* squareFrom */
        drawMoveClassification(previousTarget, previousClassificationImage, squareFromTarget);
      } else {
        previousTarget = window.currentPuzzleArray[window.currentPuzzleMoveIndex][1][0];
        /* without squareFrom (puzzle) */
        drawMoveClassification(previousTarget, previousClassificationImage);
      }
      /* set reviewInfoText SAN move */
      reviewInfoText.move = window.currentPuzzleArray[window.currentPuzzleMoveIndex][5];
    }
  }
  window.handleMoveForward = handleMoveForward;
  window.handleMoveBackward = handleMoveBackward;

  document.addEventListener("keydown", (event) => {
    if (event.code === "ArrowRight") {
      handleMoveForward();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.code === "ArrowLeft") {
      handleMoveBackward();
    }
  });
}
/* run after page is fully loaded */
document.addEventListener("DOMContentLoaded", () => {
  main();
});
