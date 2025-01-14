import React from 'react';
import './App.css';
import Combine from './mapmonster/combine.js';
import World from './testing/testingBackground.js';
import MainPage from './pages/mainpage.js';
import Gameover from './pages/gameover.js';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/world" element={<World />} />
        <Route path="/combine" element={<Combine />} />
        <Route path="/" element={<MainPage />} />
        <Route path="/gameover" element={<Gameover />} />
      </Routes>
    </Router>
  );
}

export default App;
