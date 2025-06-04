import Card from "./components/Card";
import Learn from "./components/Learn";
import Login from "./components/Login";
import { BrowserRouter, Routes, Route } from "react-router-dom";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Card />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/learn" element={<Learn />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
