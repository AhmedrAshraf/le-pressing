import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Program from './pages/Program';
import Booking from './pages/Booking';
import Courses from './pages/Courses';
import Contact from './pages/Contact';
import EventsAdmin from './pages/admin/Events';
import Login from './pages/Login';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/auth';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/programme" element={<Program />} />
              <Route path="/reservation/:eventId" element={<Booking />} />
              <Route path="/cours" element={<Courses />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin/events" element={<EventsAdmin />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;