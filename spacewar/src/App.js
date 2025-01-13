import React from 'react';
import './App.css';
import Test from './testing/test.js';
import Map from './testing/testingmap.js';
import GameMap from './monster/monster.js';
import Combine from './mapmonster/combine.js';
import InfiniteBackground from './testing/testingBackground.js';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/test" element={<Test />} />
        <Route path="/map" element={<Map />} />
        <Route path="/mapmonster" element={<GameMap/>}/>
        <Route path="/background" element={<InfiniteBackground />} />
        <Route path="/" element={<Combine />} />
      </Routes>
    </Router>
  );
}

export default App;
