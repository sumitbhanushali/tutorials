import express, {Request, Response} from "express";
import { getTopPlayers, publishUpdate, subscribeToUpdates, updateScore } from "./leaderboard";

const port = 3000;
const app = express();

app.get('/', (req, res) => {
    res.send("Ok");
})

// SSE endpoint for real-time leaderboard updates
app.get("/leaderboard/events", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  
    // Send an initial event to confirm the connection
    res.write(`data: Connected to leaderboard updates\n\n`);
  
    // Subscribe to leaderboard updates
    subscribeToUpdates((message) => {
      res.write(`data: ${message}\n\n`);
    });
  
    // Cleanup on client disconnect
    req.on("close", () => {
      console.log("Client disconnected from leaderboard updates");
      res.end();
    });
  });

setInterval(async () => {
    await updateScore(Math.floor(Math.random() * 10).toString(), 10);

    // Get the updated top 10 players and broadcast the update
    const topPlayers = await getTopPlayers(10);
    const leaderboardUpdate = JSON.stringify(topPlayers);
    await publishUpdate(leaderboardUpdate);
}, 1000)

app.get("/leaderboard", async (req: Request, res: Response) => {
    const topPlayers = await getTopPlayers(10);
    res.json(topPlayers);
  });

app.listen(port, () => {
    console.log(`listening on ${port}`);
});