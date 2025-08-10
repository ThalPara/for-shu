import React, { useState } from "react";
import OhanaTetrisApp from "./OhanaTetris";
import SudokuApp from "./SudokuApp";

export default function OhanaArcade() {
  const [game, setGame] = useState<"tetris" | "sudoku">("tetris");

  return (
    <div className="min-h-screen text-[#e8eeff]" style={{
      background: "radial-gradient(1200px 800px at 10% 10%, #1b2550, transparent), radial-gradient(900px 600px at 90% 0%, #311a5a, transparent), linear-gradient(160deg, #0b1020, #1a1f3b)"
    }}>
      <div className="flex justify-center pt-6">
        <div style={{ width: "