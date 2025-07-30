import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FuturesPage from "./pages/FuturesPage";
import AddBetPage from "./pages/AddBetPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/futures" element={<FuturesPage />} />
        <Route path="/add-bet" element={<AddBetPage />} />
      </Routes>
    </Router>
  );
}

export default App;
