import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FuturesPage from "./pages/FuturesPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/futures" element={<FuturesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
