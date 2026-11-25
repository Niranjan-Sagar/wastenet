import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportComplaint from './pages/ReportComplaint';
import MyComplaints from './pages/MyComplaints';
import AdminDashboard from './pages/AdminDashboard';
import ComplaintDetail from './pages/ComplaintDetail';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={
          <div className="max-w-5xl mx-auto px-4 py-6">
            <MapPage />
          </div>
        } />
        <Route path="/login" element={
          <div className="max-w-5xl mx-auto px-4 py-6">
            <Login />
          </div>
        } />
        <Route path="/register" element={
          <div className="max-w-5xl mx-auto px-4 py-6">
            <Register />
          </div>
        } />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <div className="max-w-5xl mx-auto px-4 py-6">
                <ReportComplaint />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-complaints"
          element={
            <ProtectedRoute>
              <div className="max-w-5xl mx-auto px-4 py-6">
                <MyComplaints />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/complaints/:id"
          element={
            <ProtectedRoute>
              <div className="max-w-5xl mx-auto px-4 py-6">
                <ComplaintDetail />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <div className="max-w-5xl mx-auto px-4 py-6">
                <AdminDashboard />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
