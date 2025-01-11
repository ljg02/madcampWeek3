import React from 'react';
import './App.css';
import Test from './testing/test.js';
import Map from './testing/testingmap.js';
import InfiniteBackground from './testing/testingBackground.js';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/test" element={<Test />} />
        <Route path="/" element={<Map />} />
        <Route path="/background" element={<InfiniteBackground />} />
      </Routes>
    </Router>
  );
}

export default App;
