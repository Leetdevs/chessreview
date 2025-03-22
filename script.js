/* main array holding all the fen data */
const evaluatedFenArray = [];

/* restart page and alert the user on error */
function criticalError(msg) {
  alert(msg);
  window.location.reload();
}

/* just reload page without alert */
function reloadPage() {
  window.location.reload();
}

async function stockfishEval(fen, depth) {
  return new Promise((resolve, reject) => {
    const stockfish = new Worker("./libraries/stockfish/stockfish-16.1-lite-single.js");
    const evaluation = {
      info: null,
      bestMove: null,
    };
    stockfish.onmessage = function (event) {
      const message = event.data ? event.data : event;
      if (message === "uciok") {
        stockfish.postMessage("isready");
      } else if (message === "readyok") {
        stockfish.postMessage(`position fen ${fen}`);
        stockfish.postMessage(`go depth ${depth}`);
      } else if (typeof message === "string" && message.startsWith("info") && message.includes("score") && message.includes(`info depth ${depth}`)) {
        evaluation.info = message;
      } else if (typeof message === "string" && message.startsWith("bestmove")) {
        evaluation.bestMove = message;
        stockfish.postMessage("quit");
        stockfish.terminate();
        resolve(evaluation);
      }
    };
    stockfish.onerror = function (error) {
      reject(error);
      console.error(error);
      criticalError("Stockfish error");
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
  if (str.includes("(none)")) {
    return ["none", "none"];
  }
  let parts = str.split(" ");
  let move = parts[1];
  let start = move.slice(0, 2);
  let end = move.slice(2, 4);
  return [start, end];
}

function moveClassification(oldScore, newScore, turn) {
  let moveClassification;
  if (typeof oldScore === "number" && typeof newScore === "number") {
    let classificationChange;
    classificationChange = newScore - oldScore;
    if (turn === "w") {
      classificationChange = classificationChange * -1;
      //log("loss/gain for black: " + classificationChange);
    } else {
      //log("loss/gain for white: " + classificationChange);
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
    if (turn === "w") {
      matingClassificationChange = matingClassificationChange * -1;
      //log("M - loss/gain for black: " + matingClassificationChange);
    } else {
      //log("M - loss/gain for white: " + matingClassificationChange);
    }
    if (matingClassificationChange >= 0) {
      moveClassification = "best";
    } else {
      moveClassification = "mate";
    }
  }
  return moveClassification;
}

/* remove all move classifications */
function removeMoveClassifications() {
  $board.find(".move-classification-image").remove();
  $board.find("." + squareClass).removeClass("highlight-square-blunder");
  $board.find("." + squareClass).removeClass("highlight-square-mistake");
  $board.find("." + squareClass).removeClass("highlight-square-inaccuracy");
  $board.find("." + squareClass).removeClass("highlight-square-good");
  $board.find("." + squareClass).removeClass("highlight-square-excellent");
  $board.find("." + squareClass).removeClass("highlight-square-best");
  $board.find("." + squareClass).removeClass("highlight-square-mate");
}

/* draw move classification */
function drawMoveClassification(square, imgUrl) {
  removeMoveClassifications();
  function drawClassifications() {
    if (typeof square === "string" && typeof imgUrl === "string" && imgUrl !== "none") {
      const classificationImgUrl = `./images/classifications/${imgUrl}.png`;
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
      if (classificationImgUrl.includes("best")) {
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

function main() {
  /* get more accurate board size */
  window.accurateBoardSize = 0;

  /* make the user unable to click on the "game review" button for the first 10s on first page load (stockfish is not cached) */
  if (!localStorage.isCached) {
    window.loadTime = 10_000;
  }
  localStorage.isCached = true;

  /* menu elements */
  let settingsMenuContainer = document.getElementById("settingsMenuContainer");
  let startButton = document.getElementsByClassName("buttonStyle")[0];
  let nameInput = document.getElementsByClassName("textInput")[0];
  let websiteSelect = document.getElementsByClassName("selectStyle")[0];
  let loadTimeText = document.getElementById("loadTimeText");
  loadTimeText.style.display = "none";
  let evalMenuContainer = document.getElementById("evalMenuContainer");
  evalMenuContainer.style.display = "none";
  let boardMenuContainer = document.getElementById("boardMenuContainer");
  boardMenuContainer.style.display = "none";
  let chessboardBtnGroup = document.getElementById("chessboard-button-group");
  let leftBtn = document.getElementById("left-chessboard-btn");
  let rightBtn = document.getElementById("right-chessboard-btn");
  let reloadBtn = document.getElementById("reload-chessboard-btn");

  /* automatically assign player name if its cached */
  if (localStorage.cachedPlayerName) {
    nameInput.value = localStorage.cachedPlayerName;
  }

  /* automatically select cached website */
  if (localStorage.cachedWebsiteSelect) {
    websiteSelect.value = localStorage.cachedWebsiteSelect;
  }

  /* show loading text instead of "game review" button */
  let loadTimeInterval;
  let finishedLoading = false;
  function handleLoadTime() {
    if (typeof window.loadTime === "number") {
      if (performance.now() < window.loadTime) {
        startButton.style.display = "none";
        loadTimeText.style.display = "";
        loadTimeText.innerHTML = `loading stockfish ${Math.round((performance.now() / 10_000) * 100)}%`;
      }
      if (performance.now() >= window.loadTime) {
        startButton.style.display = "";
        loadTimeText.style.display = "none";
        finishedLoading = true;
      }
    }
    if (finishedLoading) {
      cancelAnimationFrame(loadTimeInterval);
    } else {
      loadTimeInterval = requestAnimationFrame(handleLoadTime);
    }
  }
  handleLoadTime();

  /* set board text info */
  function setBoardTextInfo(textInfo) {
    document.getElementById("boardTextInfo").innerHTML = textInfo;
  }

  /* eval bar init */
  let currentPercentage = 50;
  let flipped = false;

  function updateEvalBar() {
    const top = document.getElementById("eval-bar-segment-top");
    const bottom = document.getElementById("eval-bar-segment-bottom");
    top.style.backgroundColor = "white";
    bottom.style.backgroundColor = "black";
    top.style.height = currentPercentage + "%";
    bottom.style.height = 100 - currentPercentage + "%";
  }
  window.updateEvalBar = updateEvalBar;

  function setEvalBarColor(percentage) {
    currentPercentage = Math.max(0, Math.min(100, percentage));
    updateEvalBar();
  }
  window.setEvalBarColor = setEvalBarColor;

  function flipEvalBar() {
    flipped = !flipped;
    const evalBar = document.getElementById("eval-bar-container");
    evalBar.style.transform = flipped ? "rotate(0.5turn)" : "rotate(0turn)";
  }
  window.flipEvalBar = flipEvalBar;

  function setEvalBarDimensions(width, height) {
    const container = document.getElementById("eval-bar-container");
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    updateEvalBar();
  }
  window.setEvalBarDimensions = setEvalBarDimensions;

  function evaluationToEvalBarPercentage(se) {
    if (typeof se === "string") {
      if (se.includes("-")) {
        return 0;
      }
      if (se.includes("+")) {
        return 100;
      }
    } else {
      let seNum = Number(se);
      let absSeNum = Math.abs(seNum * 10);
      let outputNum;
      if (seNum >= 0) {
        outputNum = 50 + absSeNum * 0.5;
      } else {
        outputNum = 50 - absSeNum * 0.5;
      }
      if (outputNum > 100) {
        return 100;
      }
      if (outputNum < 0) {
        return 0;
      }
      return outputNum;
    }
    console.error("can't set eval bar data because it's invalid");
  }
  window.evaluationToEvalBarPercentage = evaluationToEvalBarPercentage;

  /* set eval bar to equal position */
  updateEvalBar();

  /* init chessboard */
  let $board = $("#board");
  let boardEl = document.getElementById("board");
  let squareClass = "square-55d63";
  window.$board = $board;
  window.squareClass = squareClass;
  let board = Chessboard("board", {
    position: "start",
    draggable: false,
  });
  const relativeBoardSize = 0.6;
  function updateBoardSize() {
    if (window.innerWidth > window.innerHeight) {
      boardEl.style.width = `${Math.round(window.innerHeight * relativeBoardSize)}px`;
    } else {
      boardEl.style.width = `${Math.round(window.innerWidth * relativeBoardSize)}px`;
    }
    board.resize();
    /* set button sizes */
    window.accurateBoardSize = document.getElementsByClassName("board-b72b1")[0].clientWidth;
    chessboardBtnGroup.style.width = `${window.accurateBoardSize}px`;
    chessboardBtnGroup.style.height = `${window.accurateBoardSize * 0.1}px`;
    /* set eval bar size */
    const evalBarWidthSize = window.accurateBoardSize * 0.07;
    chessboardBtnGroup.style.paddingLeft = `${evalBarWidthSize}px`;
    window.setEvalBarDimensions(evalBarWidthSize, window.accurateBoardSize);
  }
  updateBoardSize();
  window.updateBoardSize = updateBoardSize;

  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  window.addEventListener("resize", () => {
    if (window.innerWidth !== lastW || window.innerHeight !== lastH) {
      lastW = window.innerWidth;
      lastH = window.innerHeight;
      updateBoardSize();
    }
  });
  let currMovementIndex = 0;
  function updateBoardPosition(moveIndex) {
    const cPos = evaluatedFenArray[moveIndex];
    /* set board position to a new fen */
    board.position(cPos.fen);
    /* draw move classifications */
    drawMoveClassification(cPos.ctarget, cPos.classification);
    /* set board text info */
    if (cPos.classification !== "none") {
      if (cPos.evaluation !== undefined) {
        setBoardTextInfo(`${cPos.classification} ${cPos.evaluation}`);
      } else {
        setBoardTextInfo(`${cPos.classification}#`);
      }
    } else {
      setBoardTextInfo("press left or right arrow keys");
    }
    /* return the current evaluation to be able to update the eval bar */
    return cPos.evaluation;
  }
  function moveForward() {
    if (currMovementIndex + 1 < evaluatedFenArray.length && evaluatedFenArray.length > 0) {
      currMovementIndex++;
      const bEval = updateBoardPosition(currMovementIndex);
      window.setEvalBarColor(window.evaluationToEvalBarPercentage(bEval));
    }
  }
  function moveBackward() {
    if (currMovementIndex > 0 && evaluatedFenArray.length > 0) {
      currMovementIndex--;
      const bEval = updateBoardPosition(currMovementIndex);
      window.setEvalBarColor(window.evaluationToEvalBarPercentage(bEval));
    }
  }
  window.addEventListener("keydown", (event) => {
    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      event.preventDefault();
    }
    switch (event.code) {
      case "ArrowLeft": {
        moveBackward();
        break;
      }
      case "ArrowRight": {
        moveForward();
        break;
      }
    }
  });
  leftBtn.addEventListener("mousedown", () => {
    moveBackward();
  });
  rightBtn.addEventListener("mousedown", () => {
    moveForward();
  });
  reloadBtn.addEventListener("mousedown", () => {
    reloadPage();
  });
  /* fetch last chess.com game */
  async function fetchChessComLastGame(username) {
    try {
      const archivesResponse = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
      const archivesData = await archivesResponse.json();
      if (!archivesData.archives || archivesData.archives.length === 0) {
        throw new Error("No game archives found.");
      }
      const latestArchiveUrl = archivesData.archives[archivesData.archives.length - 1];
      const gamesResponse = await fetch(latestArchiveUrl);
      const gamesData = await gamesResponse.json();
      if (!gamesData.games || gamesData.games.length === 0) {
        throw new Error("No games found in the latest archive.");
      }
      const lastGame = gamesData.games[gamesData.games.length - 1];
      let rawPgn = lastGame.pgn;
      // Remove annotations in curly braces (e.g., clock times or commentary)
      rawPgn = rawPgn.replace(/\{[^}]*\}/g, "");
      // Remove header lines in square brackets (e.g., game info)
      rawPgn = rawPgn.replace(/\[.*?\]\s*/g, "");
      // Remove extra whitespace
      rawPgn = rawPgn.replace(/\s+/g, " ").trim();
      return {
        pgn: rawPgn,
        white: lastGame.white.username,
        black: lastGame.black.username,
      };
    } catch (error) {
      console.error("Error fetching last game from chess.com:", error);
      return criticalError(error.message);
    }
  }

  /* fetch last lichess.org game */
  async function fetchLichessOrgLastGame(username) {
    try {
      const response = await fetch(`https://lichess.org/api/games/user/${username}?max=1`, {
        headers: { Accept: "application/x-chess-pgn" },
      });
      const LPGN = await response.text();
      if (!LPGN) {
        throw new Error("No pgn data received.");
      }
      const whiteMatch = LPGN.match(/\[White "([^"]+)"\]/);
      const blackMatch = LPGN.match(/\[Black "([^"]+)"\]/);
      const white = whiteMatch ? whiteMatch[1] : null;
      const black = blackMatch ? blackMatch[1] : null;
      /* if the username does not exist reload page */
      if (white === null || black === null) {
        criticalError("Received invalid data.");
      }
      let rawPgn = LPGN;
      // Remove annotations in curly braces (e.g., clock times or commentary)
      rawPgn = rawPgn.replace(/\{[^}]*\}/g, "");
      // Remove header lines in square brackets (e.g., game info)
      rawPgn = rawPgn.replace(/\[.*?\]\s*/g, "");
      // Remove extra whitespace
      rawPgn = rawPgn.replace(/\s+/g, " ").trim();
      return {
        pgn: rawPgn,
        white: white,
        black: black,
      };
    } catch (error) {
      console.error("Error fetching last game from lichess.org:", error);
      return criticalError(error.message);
    }
  }

  /* start game review click listener */
  startButton.addEventListener("click", () => {
    /* cache the username and selected website on review btn click */
    localStorage.cachedPlayerName = nameInput.value;
    localStorage.cachedWebsiteSelect = websiteSelect.value;
    /* hide the main settings menu */
    settingsMenuContainer.style.display = "none";
    /* eval menu elements */
    evalMenuContainer.style.display = "flex";
    let evalTextPercentage = document.getElementById("evalPercentage");
    let evalTextHeader = document.getElementById("evalText1");
    let evalTextDescription = document.getElementById("evalText2");
    /* use the correct fetch function */
    let fetchGame;
    switch (websiteSelect.value) {
      case "chess.com": {
        fetchGame = fetchChessComLastGame;
        evalTextPercentage.innerHTML = "fetching chess.com data";
        break;
      }
      case "lichess.org": {
        fetchGame = fetchLichessOrgLastGame;
        evalTextPercentage.innerHTML = "fetching lichess.org data";
        break;
      }
    }
    const lowerCaseUsername = nameInput.value.toLowerCase();
    /* fetch last played game */
    fetchGame(lowerCaseUsername).then(async (data) => {
      const whitePlayer = data.white.toLowerCase();
      const blackPlayer = data.black.toLowerCase();
      const cleanPgn = data.pgn;
      const myPlayerColor = lowerCaseUsername === whitePlayer ? "white" : "black";
      /* set evaluation text */
      evalTextPercentage.innerHTML = "waiting for stockfish";
      /* convert the pgn into a fen array using chessJS */
      const chessJS = new window.Chess();
      chessJS.load_pgn(cleanPgn);
      const moves = chessJS.history();
      chessJS.reset();
      const startingFen = chessJS.fen();
      const fenArray = [];
      moves.forEach((move) => {
        const moveInfo = chessJS.move(move);
        fenArray.push([chessJS.fen(), chessJS.turn(), { source: moveInfo.from, target: moveInfo.to }]);
      });
      chessJS.reset();
      /* evaluate the fen array with stockfish */
      evaluatedFenArray.push({ fen: startingFen, evaluation: 0, best: "none", classification: "none", csource: "none", ctarget: "none", cbestSource: "none", cbestTarget: "none" });
      for (let fen of fenArray) {
        /* evaluate the current fen position with stockfish */
        const currFen = fen[0];
        const evaluatedFen = await stockfishEval(currFen, 16);

        /* parsing the evaluation from stockfish input relative to the current turn */
        const currEval = extractEvaluation(evaluatedFen.info);
        const currTurn = fen[1];
        let realEvaluation;
        if (currTurn === "w") {
          if (typeof currEval === "number") {
            realEvaluation = currEval;
          }
          if (typeof currEval === "string" && !currEval.includes("-")) {
            realEvaluation = "+" + currEval;
          } else if (typeof currEval === "string" && currEval.includes("-")) {
            let negativeEval = currEval.replace("-", "");
            realEvaluation = "-" + negativeEval;
          }
        } else if (currTurn === "b") {
          if (typeof currEval === "number") {
            realEvaluation = currEval * -1;
          }
          if (typeof currEval === "string" && !currEval.includes("-")) {
            realEvaluation = "-" + currEval;
          } else if (typeof currEval === "string" && currEval.includes("-")) {
            let negativeEval = currEval.replace("-", "");
            realEvaluation = "+" + negativeEval;
          }
        }

        /* the previous evaluation to be able to compare it and calculate the move classification */
        let oldEvalScore = evaluatedFenArray[evaluatedFenArray.length - 1].evaluation;

        /* push new position data to evaluatedFenArray */
        const bMove = extractBestMove(evaluatedFen.bestMove);
        evaluatedFenArray.push({ fen: currFen, evaluation: realEvaluation, best: bMove, classification: moveClassification(oldEvalScore, realEvaluation, currTurn), csource: fen[2].source, ctarget: fen[2].target, cbestSource: bMove[0], cbestTarget: bMove[1] });

        /* set the animation text */
        evalTextPercentage.innerHTML = `progress elapsed ${Math.round(((evaluatedFenArray.length - 1) / fenArray.length) * 100)}%`;
        evalTextHeader.innerHTML = `evaluating ${whitePlayer} vs ${blackPlayer}`;
        evalTextDescription.innerHTML = `info ${evaluatedFen.bestMove}`;
      }

      // log the final arr for debugging purposes
      // log(evaluatedFenArray);

      /* hide the text animation eval menu */
      evalMenuContainer.style.display = "none";

      /* make the chessboard container visible */
      boardMenuContainer.style.display = "";

      /* get more accurate board size */
      window.accurateBoardSize = document.getElementsByClassName("board-b72b1")[0].clientWidth;
      window.updateBoardSize();

      /* flip the board and eval bar so it is from the position of my player */
      // log(myPlayerColor);
      if (myPlayerColor === "white") {
        window.flipEvalBar();
      } else {
        board.flip();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  main();
});
