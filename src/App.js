import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [fuel, setFuel] = useState(10);
  const [stars, setStars] = useState(0);
  const [fallingStars, setFallingStars] = useState([]);
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  const [airplanePosition, setAirplanePosition] = useState({ x: 512, y: 300 });
  const [gameOver, setGameOver] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [birds, setBirds] = useState([]);
  const [parachutes, setParachutes] = useState([]);
  const [clouds, setClouds] = useState([]);
  const [difficulty, setDifficulty] = useState(1);
  const gameAreaRef = useRef(null);
  // const [intervalId, setIntervalId] = useState(null);
  const [showGameOverMessage, setShowGameOverMessage] = useState(false);
  const [isRankingVisible, setIsRankingVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startGame = () => {
    if (gameOver) {
      resetGame();
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const resetGame = () => {
    setTime(0);
    setFuel(10);
    setStars(0);
    setFallingStars([]);
    setBirds([]);
    setParachutes([]);
    setClouds([]);
    setDifficulty(1);
    setAirplanePosition({ x: 512, y: 300 });
    setGameOver(false);
    setIsRankingVisible(false);
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
    setIsPaused(!isPaused);
  };

  // Randomly spawn birds, parachutes, and stars
  const spawnItems = () => {
    if (Math.random() > 0.2) {
      setBirds((prev) => [
        ...prev,
        {
          x: 700 + Math.random() * 200,
          y: Math.random() * 700,
          id: Date.now(),
        },
      ]);
    }
    if (Math.random() > 0.7) {
      setParachutes((prev) => [
        ...prev,
        { x: Math.random() * 1024, y: 0, id: Date.now() },
      ]);
    }
    if (Math.random() > 0.8) {
      setFallingStars((prev) => [
        ...prev,
        { x: Math.random() * 1024, y: 0, id: Date.now() },
      ]);
    }
    if (Math.random() > 0.5) {
      setClouds((prev) => [
        ...prev,
        {
          x: 512 + Math.random() * 200,
          y: Math.random() * 700,
          id: Date.now(),
        },
      ]);
    }
  };

  // Handling keyboard controls
  const handleKeyPress = (e) => {
    if (e.key === " " && !gameOver) {
      togglePause();
    }
    if (isRunning) {
      const { x, y } = airplanePosition;
      if (e.key === "ArrowUp" && y > 0) setAirplanePosition({ x, y: y - 10 });
      if (e.key === "ArrowDown" && y < 768)
        setAirplanePosition({ x, y: y + 10 });
      if (e.key === "ArrowLeft" && x > 0) setAirplanePosition({ x: x - 10, y });
      if (e.key === "ArrowRight" && x < 1024)
        setAirplanePosition({ x: x + 10, y });
    }
  };

  // Updating difficulty level and spawn items over time
  useEffect(() => {
    if (isRunning && !gameOver) {
      const difficultyInterval = setInterval(() => {
        setDifficulty((prev) => prev + 50.0); // Increasing difficulty gradually
      }, 5000); // Every 5 seconds

      return () => clearInterval(difficultyInterval);
    }
  }, [isRunning, gameOver]);

  // Updating the time, fuel, spawn items, and handle movement
  useEffect(() => {
    if (isRunning && !gameOver) {
      const timer = setInterval(() => {
        setTime((prev) => prev + 1);
        setFuel((prev) => prev - 1);
        if (fuel <= 0) setGameOver(true); // End game if fuel runs out
      }, 1000);

      const itemMover = setInterval(() => {
        spawnItems();
        setBirds((prev) =>
          prev.map((bird) => ({ ...bird, x: bird.x - (20 + difficulty * 0.2) }))
        );
        setParachutes((prev) => prev.map((p) => ({ ...p, y: p.y + 5 })));
        setFallingStars((prev) =>
          prev.map((star) => ({ ...star, y: star.y + 5 }))
        );
      }, 500);

      const cloudMover = setInterval(() => {
        setClouds((prev) =>
          prev.map((cloud) => ({
            ...cloud,
            x: cloud.x - 20,
            y: cloud.y + (Math.random() - 0.5) * 2,
          }))
        );
      }, 500);

      return () => {
        clearInterval(timer);
        clearInterval(itemMover);
        clearInterval(cloudMover);
      };
    }
  }, [isRunning, gameOver, fuel, difficulty]);

  // Handle collisions with falling stars, parachutes, and birds
  useEffect(() => {
    const { x, y } = airplanePosition;

    birds.forEach((bird) => {
      if (Math.abs(bird.x - x) < 30 && Math.abs(bird.y - y) < 30)
        setGameOver(true);
    });

    parachutes.forEach((parachute) => {
      if (Math.abs(parachute.x - x) < 30 && Math.abs(parachute.y - y) < 30) {
        setFuel((prev) => prev + 10);
        setParachutes((prev) => prev.filter((p) => p.id !== parachute.id));
      }
    });

    fallingStars.forEach((star) => {
      if (Math.abs(star.x - x) < 30 && Math.abs(star.y - y) < 30) {
        setStars((prev) => prev + 1);
        setFallingStars((prev) => prev.filter((s) => s.id !== star.id));
      }
    });
  }, [airplanePosition, birds, parachutes, fallingStars]);

  // Submit score to mock server using fetch
  const submitScore = async (name) => {
    setIsSubmitting(true); // Disabling the button immediately after submission starts
    try {
      const payload = JSON.stringify({ name, time, stars });
      console.log("Payload:", payload); // Debugging log
      setIsNameSubmitted(true); // Enable start game button after submission

      const response = await fetch("https://sky-angel-api.vercel.app/register", { // API provided in the PDF is not working or invalid that's why i am using my api
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error submitting score: ${errorText}`);
      }

      const data = await response.json();
      const sortedRanking = data.sort(
        (a, b) => b.stars - a.stars || b.time - a.time
      );
      setRanking(sortedRanking);
      setIsRankingVisible(true);
    } catch (err) {
      console.error("Error submitting score:", err);
    }
    finally {
      setIsSubmitting(false); // Re-enable button after submission
    }
  };

  // Display Game Over message
  useEffect(() => {
    if (gameOver) {
      setShowGameOverMessage(true);
      setIsNameSubmitted(false); // Reset submission flag on game over
      setTimeout(() => setShowGameOverMessage(false), 3000);
    }
  }, [gameOver]);

   // Ranking Table JSX
   const RankingTable = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const playersPerPage = 5;
  
    // Calculate ranks with ties
    const rankedPlayers = ranking.map((player, index, arr) => {
      // Determine rank based on previous player
      if (
        index > 0 &&
        player.stars === arr[index - 1].stars &&
        player.time === arr[index - 1].time
      ) {
        player.rank = arr[index - 1].rank;
      } else {
        player.rank = index + 1;
      }
      return player;
    });
  
    const startIndex = currentPage * playersPerPage;
    const currentPlayers = rankedPlayers.slice(
      startIndex,
      startIndex + playersPerPage
    );
  
    const nextPage = () => {
      if (startIndex + playersPerPage < ranking.length) {
        setCurrentPage((prevPage) => prevPage + 1);
      }
    };
  
    const previousPage = () => {
      if (currentPage > 0) {
        setCurrentPage((prevPage) => prevPage - 1);
      }
    };
  
    return (
      <div className="ranking">
        <h2>Leaderboard</h2>
        <table className="ranking-table">
          <thead>
            <tr>
              <th className="rank">Rank</th>
              <th className="name">Name</th>
              <th className="stars">Stars</th>
              <th className="time">Time (Seconds)</th>
            </tr>
          </thead>
          <tbody>
            {currentPlayers.map((player, index) => (
              <tr key={startIndex + index}>
                <td className="rank">{player.rank}</td>
                <td className="name">{player.name}</td>
                <td className="stars">{player.stars}</td>
                <td className="time">{player.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination-controls">
          <button onClick={previousPage} disabled={currentPage === 0}>
            Previous
          </button>
          <button
            onClick={nextPage}
            disabled={startIndex + playersPerPage >= ranking.length}
          >
            Next
          </button>
        </div>
      </div>
    );
  };
  
  

  return (
    <div
      className="game-container"
      onKeyDown={handleKeyPress}
      tabIndex="0"
      ref={gameAreaRef}
    >
      <header>
        <h1>Sky Angel</h1>
        <button
          disabled={!isNameSubmitted && gameOver}
          onClick={
            gameOver || (!isRunning && !isPaused) ? startGame : togglePause
          }
        >
          {gameOver || (!isRunning && !isPaused)
            ? "Start Game"
            : isPaused
            ? "Resume Game"
            : "Pause Game"}
        </button>
        <p>
          Time: {time}s | Fuel: {fuel} | Stars: {stars}
        </p>
      </header>
      <main className="game-area">
        {showGameOverMessage && (
          <div className="game-over-message">Game Over!</div>
        )}

        {gameOver ? (
          !isRankingVisible ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitScore(e.target.username.value);
              }}
            >
              <input
                type="text"
                name="username"
                placeholder="Your Name"
                required
              />
              <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit"}</button>
            </form>
          ) : (
            <RankingTable />
          )
        ) : (
          <>
            <div
              className="airplane"
              style={{ top: airplanePosition.y, left: airplanePosition.x }}
            >
              🛩️
            </div>
            {birds.map((bird) => (
              <div
                key={bird.id}
                className="bird"
                style={{ top: bird.y, left: bird.x }}
              >
                🦅
              </div>
            ))}
            {parachutes.map((parachute) => (
              <div
                key={parachute.id}
                className="parachute"
                style={{ top: parachute.y, left: parachute.x }}
              >
                🪂
              </div>
            ))}
            {fallingStars.map((star) => (
              <div
                key={star.id}
                className="star"
                style={{ top: star.y, left: star.x }}
              >
                ⭐
              </div>
            ))}
            {clouds.map((cloud) => (
              <div
                key={cloud.id}
                className="cloud"
                style={{ top: cloud.y, left: cloud.x }}
              >
                ☁️
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
