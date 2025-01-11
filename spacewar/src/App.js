import React from 'react';
import './App.css';
import Test from './testing/test.js';
import Map from './testing/testingmap.js';
import Monster from './monster/monster.js';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/test" element={<Test />} />
        <Route path="/map" element={<Map />} />
        <Route path="/" element={<Monster/>}/>
      </Routes>
    </Router>
  );
}

export default App;
