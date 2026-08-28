import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Home from './pages/Home/Home';
import Apps from './pages/Apps/Apps';
import P2PTransfer from './pages/P2PTransfer/P2PTransfer';
import ShortLink from './pages/ShortLink/ShortLink';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="apps" element={<Apps />} />
          <Route path="apps/p2p-transfer" element={<P2PTransfer />} />
          <Route path="apps/short-link" element={<ShortLink />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;