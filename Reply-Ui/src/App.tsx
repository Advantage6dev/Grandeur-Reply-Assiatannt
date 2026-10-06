import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from './components/navbar';
import LandingPage from './pages/landingpage';
import ReplyPage from './pages/replyPage';

type Mode = 'demo' | 'owner';

export default function App() {
  const [mode, setMode] = useState<Mode | undefined>(undefined);
  const navigate = useNavigate();

  function start(newMode: Mode) {
    setMode(newMode);
    navigate('/app');
  }

  function logout() {
    setMode(undefined);
    navigate('/');
  }

  return (
    <>
      <Navbar mode={mode} onLogout={logout} />

      <Routes>
        <Route
          path='/'
          element={
            mode ? (
              <Navigate to='/app' replace />
            ) : (
              <LandingPage
                // PLACEHOLDER: accepts any login for now. The real password
                // check will happen on the Node backend, not here.
                onLogin={() => start('owner')}
                onDemo={() => start('demo')}
              />
            )
          }
        />

        <Route
          path='/app'
          element={
            mode ? (
              <ReplyPage demo={mode === 'demo'} />
            ) : (
              <Navigate to='/' replace />
            )
          }
        />

        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </>
  );
}
