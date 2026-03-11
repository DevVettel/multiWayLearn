//               ____            __     __   _   _       _    
//              |  _ \  _____   _\ \   / /__| |_| |_ ___| |   
//              | | | |/ _ \ \ / /\ \ / / _ \ __| __/ _ \ |   
//              | |_| |  __/\ V /_ \ V /  __/ |_| ||  __/ |   
//              |____/ \___| \_/| | \_/ \___|\__|\__\___|_|   
//               / _` | '_ \ / _` |                           
//              | (_| | | | | (_| |                           
//               \__,_|_| |_|\__,_|                           
//                ___  _               _                      
//               / _ \| | ____ _ _ __ | |_ __ _  ___          
//              | | | | |/ / _` | '_ \| __/ _` |/ _ \         
//              | |_| |   < (_| | | | | || (_| | (_) |        
//               \___/|_|\_\__,_|_| |_|\__\__,_|\___/         

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Words from './pages/Words';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/words" element={
          <PrivateRoute><Words /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}