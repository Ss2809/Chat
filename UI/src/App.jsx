import { HashRouter, Routes, Route } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ChatList from "./pages/ChatList";
import VerifyOTP from "./pages/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChatScreen from "./pages/ChatScreen";
import Profile from "./pages/Profile";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<VerifyOTP />} />
<Route path="/chat" element={<ChatList />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset/:token" element={<ResetPassword />} />
      <Route path="/chat/:chatId" element={<ChatScreen />} />
      <Route path="/profile" element={<Profile />} />

      </Routes>
    </HashRouter>
  );
}

export default App;






