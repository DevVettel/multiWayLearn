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
import PropTypes from 'prop-types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Words from './pages/Words';
import Quiz from './pages/Quiz';
import Settings from './pages/Settings';
import Analysis from './pages/Analysis';
import Wordle from './pages/Wordle';
import WordChain from './pages/WordChain';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

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
        <Route path="/quiz" element={
          <PrivateRoute><Quiz /></PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute><Settings /></PrivateRoute>
        } />
        <Route path="/analysis" element={
          <PrivateRoute><Analysis /></PrivateRoute>
        } />
        <Route path="/wordle" element={
          <PrivateRoute><Wordle /></PrivateRoute>
        } />
        <Route path="/wordchain" element={
          <PrivateRoute><WordChain /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}