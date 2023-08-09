const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const app = express();

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at https://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const formattedPlayers = (item) => {
  return {
    playerName: item.player_name,
    playerId: item.player_id,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersDetailsSqlQuery = `
    SELECT 
      * 
      FROM 
    player_details
    ORDER BY
    player_id;
        
    `;
  const playerDetails = await db.all(getPlayersDetailsSqlQuery);
  response.send(playerDetails.map((item) => formattedPlayers(item)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerId = `
    SELECT 
    *
    FROM 
    player_details
    WHERE 
    player_id=${playerId};

    `;
  const specificPlayerDetails = await db.get(getSpecificPlayerId);
  response.send({
    playerId: specificPlayerDetails.player_id,
    playerName: specificPlayerDetails.player_name,
  });
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetailed = request.body;

  const { playerName } = playerDetailed;
  const putSqlQuery = `
     UPDATE 
     player_details
     SET 
     player_name="${playerName}"
     WHERE 
     player_id=${playerId};
    `;
  await db.run(putSqlQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSqlMatchQuery = `
    SELECT *
    FROM 
    match_details
    WHERE 
    match_id=${matchId};
    `;
  const result = await db.get(getSqlMatchQuery);
  response.send({
    matchId: result.match_id,
    match: result.match,
    year: result.year,
  });
});

const formattedMatches = (items) => {
  return {
    matchId: items.match_id,
    match: items.match,
    year: items.year,
  };
};

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesFromPlayerIdQuery = `
    SELECT
    *
    FROM
    player_details
    JOIN
    match_details
    WHERE 
    player_id=${playerId};
    `;

  const result = await db.all(getMatchesFromPlayerIdQuery);
  response.send(result.map((items) => formattedMatches(items)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersFromMatchIdQuery = `
    SELECT
    *
    FROM
    player_details
    JOIN
    match_details
    WHERE 
    match_id=${matchId};
    `;

  const result = await db.all(getPlayersFromMatchIdQuery);
  response.send(result.map((items) => formattedPlayers(items)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerScoreFromPlayerId = `
     SELECT 
     player_details.player_id as playerId,
     player_details.player_name as playerName,
     SUM(player_match_score.score) as totalScore,
     SUM(fours) as totalFours,
     SUM(sixes) as totalSixes

     FROM 
     player_details
     INNER JOIN
     player_match_score
     ON 
     player_details.player_id=player_match_score.player_id
     WHERE 
     player_id=${playerId};
    `;
  const result = await db.get(playerScoreFromPlayerId);
  response.send(result);
});
module.exports = app;
