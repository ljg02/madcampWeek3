import React from 'react';
import './App.css';
import World from './pages/world.js';
import MainPage from './pages/mainPage.js';
import Gameover from './pages/gameover.js';
import ControlsPage from './pages/controlPage.js';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/world" element={<World />} />
        <Route path="/" element={<MainPage />} />
        <Route path="/gameover" element={<Gameover />} />
        <Route path="/controls" element={<ControlsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
