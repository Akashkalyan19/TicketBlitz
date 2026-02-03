import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventPage from './pages/EventPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen w-full flex flex-col">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/event/:id" element={<EventPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
