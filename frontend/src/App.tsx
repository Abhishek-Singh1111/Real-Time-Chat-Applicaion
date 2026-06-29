import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import ChatSection from "./components/ChatSection";
import Nav from "./components/Nav";
import Signup from "./signup";
import Login from "./login";
import EditUser from "./components/EditUser";
import { FaUserSlash } from "react-icons/fa";
import { SocketProvider } from "./context/SocketContext";

function AppLayout() {
  return <Outlet />;
}

function ChatPage() {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <>
      {isLoggedIn ? (
        <div className="notlogin-container">
          <ChatSection />
        </div>
      ) : (
        <>
          <Nav />
          <div className="not-logged-in">
            <h2>Please log in to access the chat</h2>
            <FaUserSlash size={100} color="#888" />
          </div>
        </>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<ChatPage />} />
            <Route path="signup" element={<Signup />} />
            <Route path="login" element={<Login />} />
            <Route path="/edit-profile" element={<EditUser />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;