import React from 'react';
import './App.css';
import Test from './testing/test.js';
import Map from './testing/testingmap.js';
import GameMap from './monster/monster.js';
import Combine from './mapmonster/combine.js';
import World from './testing/testingBackground.js';
import Game from './testing/testingClient.js';
import MainPage from './pages/mainpage.js';
import Gameover from './pages/gameover.js';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/test" element={<Test />} />
        <Route path="/map" element={<Map />} />
        <Route path="/mapmonster" element={<GameMap/>}/>
        <Route path="/world" element={<World />} />
        <Route path="/" element={<Combine />} />
        <Route path="/client" element={<Game />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/gameover" element={<Gameover />} />
      </Routes>
    </Router>
  );
}

export default App;
