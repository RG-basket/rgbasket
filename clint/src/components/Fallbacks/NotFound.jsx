import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  const [chickenY, setChickenY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacleX, setObstacleX] = useState(100);
  const [obstacleSpeed, setObstacleSpeed] = useState(1.2);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [obstacleType, setObstacleType] = useState("🥕");
  const [timeElapsed, setTimeElapsed] = useState(0);

  const gravity = 2.5;
  const jumpHeight = 60;
  const requestRef = useRef();

  // Jump logic
  const handleJump = useCallback(() => {
    if (!isJumping && !gameOver) {
      setIsJumping(true);
      let jumpVelocity = jumpHeight;
      const jumpInterval = setInterval(() => {
        setChickenY((prev) => {
          if (jumpVelocity <= 0 && prev <= 0) {
            clearInterval(jumpInterval);
            setIsJumping(false);
            return 0;
          }
          jumpVelocity -= gravity;
          return Math.max(prev + jumpVelocity * 0.5, 0);
        });
      }, 30);
    }
  }, [isJumping, gameOver]);

  // Keyboard jump
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleJump]);

  // Main game loop
  useEffect(() => {
    if (gameOver) return;
    let lastTime = performance.now();

    const loop = (time) => {
      const delta = time - lastTime;
      lastTime = time;

      // Gradual difficulty increase
      setTimeElapsed((prev) => prev + delta / 1000);
      setObstacleSpeed((speed) => Math.min(speed + 0.0002, 7)); // smooth acceleration

      setObstacleX((prev) => {
        if (prev < -10) {
          setScore((s) => s + 1);
          setObstacleType(Math.random() > 0.5 ? "🥕" : "🍅");
          return 100;
        }
        return prev - obstacleSpeed * (delta / 16);
      });

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameOver, obstacleSpeed]);

  // Collision detection
  useEffect(() => {
    if (obstacleX < 12 && obstacleX > 4 && chickenY < 10 && !gameOver) {
      setGameOver(true);
    }
  }, [obstacleX, chickenY, gameOver]);

  return (
    <div
      onClick={handleJump}
      className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden 
      bg-gradient-to-r from-emerald-50 via-lime-50 to-white text-center select-none"
    >
      {/* Title */}
      <h1 className="text-7xl md:text-8xl font-extrabold text-emerald-600 drop-shadow-sm mb-2">
        404
      </h1>
      <p className="text-base md:text-lg text-gray-700 mb-4 px-4">
        The chicken is escaping! 🐔 Tap or press SPACE to help it jump over veggies!
      </p>

      {/* Game Area */}
      <div className="relative w-[95%] max-w-[600px] h-[220px] md:h-[250px] bg-gradient-to-r from-lime-100 via-emerald-50 to-white 
        border border-emerald-200 rounded-3xl shadow-inner overflow-hidden cursor-pointer touch-none"
      >
        {/* Ground */}
        <div className="absolute bottom-0 left-0 w-full h-[10%] bg-emerald-200/40 border-t border-emerald-300 rounded-b-3xl" />

        {/* Chicken */}
        <motion.div
          className="absolute left-[10%] bottom-[10%] text-[12vw] md:text-7xl"
          animate={{ y: -chickenY }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        >
          🐔
        </motion.div>

        {/* Obstacle */}
        {!gameOver && (
          <motion.div
            className="absolute bottom-[9%] text-[10vw] md:text-7xl"
            animate={{ x: `${obstacleX}vw` }}
            transition={{ duration: 0 }}
          >
            {obstacleType}
          </motion.div>
        )}

        {/* Score */}
        {!gameOver && (
          <div className="absolute top-2 right-4 text-sm md:text-lg font-semibold text-emerald-600">
            Score: {score}
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-3xl"
          >
            <p className="text-3xl md:text-4xl font-bold text-red-600 mb-2">💥 Oops!</p>
            <p className="text-base md:text-lg text-gray-700 mb-3">
              You hit a {obstacleType === "🥕" ? "carrot 🥕" : "tomato 🍅"}!
            </p>
            <p className="text-sm md:text-md text-emerald-700 mb-4">
              Final Score: {score}
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold shadow-md"
              >
                🔄 Play Again
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md"
              >
                🏠 Go Home
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Tap Hint */}
      {!gameOver && (
        <motion.p
          className="mt-6 text-gray-500 text-sm md:text-base"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Tap anywhere or press SPACE to jump 🐥
        </motion.p>
      )}
    </div>
  );
};

export default NotFound;
