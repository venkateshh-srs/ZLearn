import Card from "./components/Card";
import Learn from "./components/Learn";
import Login from "./components/Login";
import CodeHome from "./components/code/CodeHome";
import CodeLearn from "./components/code/CodeLearn";

import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<Card />} />
      <Route path="/login" element={<Login />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/code/home" element={<CodeHome />} />
      <Route
        path="/code/dashboard"
        element={<CodeLearn onBack={() => navigate("/code/home")} onSelectLanguage={(lang) => navigate(`/code/dev?lang=${lang}`)} />}
      />
    </Routes>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWrapper;

