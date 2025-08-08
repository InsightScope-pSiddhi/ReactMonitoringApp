import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Health from './pages/Health';
import Ready from './pages/Ready';
import Live from './pages/Live';
import Logs from './pages/Logs';
import Metrics from './pages/Metrics';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/health" element={<Health />} />
        <Route path="/ready" element={<Ready />} />
        <Route path="/live" element={<Live />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="*" element={<Health />} />
      </Routes>
    </Router>
  );
}

export default App;
