import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Home from './pages/Home/Home';
import Apps from './pages/Apps/Apps';
import P2PTransfer from './pages/P2PTransfer/P2PTransfer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="apps" element={<Apps />} />
          <Route path="apps/p2p-transfer" element={<P2PTransfer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;