function startReviewGUIMain() {
  let startReviewGUI = document.getElementById("startReviewGUI");
  let startReviewGUIBackground = document.getElementById("startReviewGUIBackground");
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
  function handleButtonMousedown() {
    let appReviewBtn = document.getElementById("startGameReviewBtnChessApps");
    let pgnReviewBtn = document.getElementById("startGameReviewBtnPGN");
    let searchBtn = document.getElementById("accountNameSearchBtn");
    function checkPgn(pgnValue) {
      if (typeof pgnValue === "string" && pgnValue.length > 0 && pgnValue.includes("1. ")) {
        return true;
      }
    }
    function resetSearchedGamesSelect() {
      let last30Games = document.getElementById("last30Games");
      last30Games.innerHTML = "";
    }
    window.resetSearchedGamesSelect = resetSearchedGamesSelect;
    function addSearchedGamesSelect(optionText, optionValue) {
      let last30Games = document.getElementById("last30Games");
      const newOption = document.createElement("option");
      newOption.value = optionValue;
      newOption.text = optionText;
      last30Games.appendChild(newOption);
    }
    window.addSearchedGamesSelect = addSearchedGamesSelect;
    async function fetchGamesChessCom(username) {
      try {
        const archivesResponse = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
        const archivesData = await archivesResponse.json();
        const lastArchive = archivesData.archives[archivesData.archives.length - 1];
        const gamesResponse = await fetch(lastArchive);
        const gamesData = await gamesResponse.json();
        console.log(gamesData.games);
        const reversedGamesDataGames = gamesData.games.reverse();
        resetSearchedGamesSelect();
        for (let gameData of reversedGamesDataGames) {
          if (typeof gameData.pgn === "string") {
            const trimmedPGN = gameData.pgn.trim();
            addSearchedGamesSelect(`${gameData.time_class} ${gameData.white.username}(${gameData.white.rating}) vs ${gameData.black.username}(${gameData.black.rating})`, btoa(trimmedPGN));
          }
        }
      } catch (error) {
        let last30Games = document.getElementById("last30Games");
        last30Games.innerHTML = "";
        const errorOption = document.createElement("option");
        errorOption.value = "404";
        errorOption.text = "No Games Found";
        last30Games.appendChild(errorOption);
        console.error("Error fetching games:", error);
        alert("Error fetching games");
      }
    }
    window.fetchGamesChessCom = fetchGamesChessCom;
    async function fetchGamesLichessOrg(username) {
      const response = await fetch(`https://lichess.org/api/games/user/${username}?max=30&pgnInJson=true`, {
        method: "GET",
        headers: {
          Accept: "application/x-ndjson",
        },
      });
      if (!response.ok) {
        console.error("Failed to fetch games:", response.status, response.statusText);
        let last30Games = document.getElementById("last30Games");
        last30Games.innerHTML = "";
        const errorOption = document.createElement("option");
        errorOption.value = "404";
        errorOption.text = "No Games Found";
        last30Games.appendChild(errorOption);
        alert("Error fetching games");
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let gamesData = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        text
          .trim()
          .split("\n")
          .forEach((line) => {
            if (line) {
              gamesData.push(JSON.parse(line));
            }
          });
      }
      console.log(gamesData);
      resetSearchedGamesSelect();
      for (let gameData of gamesData) {
        if (typeof gameData.pgn === "string") {
          const trimmedPGN = gameData.pgn.trim();
          addSearchedGamesSelect(`${gameData.speed} ${gameData.players.white.user.name}(${gameData.players.white.rating}) vs ${gameData.players.black.user.name}(${gameData.players.black.rating})`, btoa(trimmedPGN));
        }
      }
    }
    window.fetchGamesLichessOrg = fetchGamesLichessOrg;
    searchBtn.addEventListener("mousedown", (event) => {
      let playerNameInput = document.getElementById("accountNameInput");
      if (playerNameInput) {
        const nameValue = playerNameInput.value.toLowerCase();
        console.log("namevalue");
        console.log(nameValue);
        if (nameValue.length > 0) {
          const targetWebsite = document.getElementById("targetSearchWebsite").value;
          console.log(targetWebsite);
          if (targetWebsite === "Chess.com") {
            console.log("fetching Chess.com data");
            fetchGamesChessCom(nameValue);
          } else if (targetWebsite === "Lichess.org") {
            console.log("fetching Lichess.org data");
            fetchGamesLichessOrg(nameValue);
          }
        } else {
          alert("invalid username length");
        }
      }
    });
    appReviewBtn.addEventListener("mousedown", (event) => {
      let selectGames = document.getElementById("last30Games");
      if (selectGames && selectGames.value !== "404") {
        const pgnValue = atob(selectGames.value);
        if (checkPgn(pgnValue)) {
          /*
         let reviewPgnInput = document.getElementById("reviewPgnInput").value;
         if (typeof reviewPgnInput === "string" && reviewPgnInput.length > 0) {
           const trimmedRawReviewPgnInput = decodePgnInput(reviewPgnInput); 
           if (isNotReviewing() && trimmedRawReviewPgnInput.length > 0) {
             window.resetReviewInfoText();
             await window.evaluateAllPositions(trimmedRawReviewPgnInput);
           }
         }
         */
          // do review
          let reviewPgnInput = pgnValue;
          if (typeof reviewPgnInput === "string" && reviewPgnInput.length > 0) {
            const trimmedRawReviewPgnInput = decodePgnInput(reviewPgnInput);
            if (window.isNotReviewing() && trimmedRawReviewPgnInput.length > 0) {
              hideStartReviewGUI();
              window.resetReviewInfoText();
              window.evaluateAllPositions(trimmedRawReviewPgnInput);
              const pngPlayerNames = window.getPlayerNameFromPgn(pgnValue);
              window.setWhitePlayerText(pngPlayerNames.w);
              window.setBlackPlayerText(pngPlayerNames.b);
              console.log("appReviewBtn start game review value");
              console.log(pgnValue);
            }
          }
        } else {
          alert("invalid pgn input");
        }
      }
    });
    pgnReviewBtn.addEventListener("mousedown", (event) => {
      let textAreaPGN = document.getElementById("yourPGNInput");
      if (textAreaPGN) {
        const pgnValue = textAreaPGN.value.trim();
        if (checkPgn(pgnValue)) {
          // do review
          let reviewPgnInput = pgnValue;
          if (typeof reviewPgnInput === "string" && reviewPgnInput.length > 0) {
            const trimmedRawReviewPgnInput = decodePgnInput(reviewPgnInput);
            if (window.isNotReviewing() && trimmedRawReviewPgnInput.length > 0) {
              hideStartReviewGUI();
              window.resetReviewInfoText();
              window.evaluateAllPositions(trimmedRawReviewPgnInput);
              const pngPlayerNames = window.getPlayerNameFromPgn(pgnValue);
              window.setWhitePlayerText(pngPlayerNames.w);
              window.setBlackPlayerText(pngPlayerNames.b);
              console.log("pgnReviewBtn start game review value");
              console.log(pgnValue);
            }
          }
        } else {
          alert("invalid pgn input");
        }
      }
    });
  }
  handleButtonMousedown();
}
document.addEventListener("DOMContentLoaded", () => {
  startReviewGUIMain();
});
