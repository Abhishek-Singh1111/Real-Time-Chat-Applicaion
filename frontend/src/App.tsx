import './App.css'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import ChatSection from './components/ChatSection';
import Nav from './components/Nav';
import Signup from './signup';
import Login from './login';
import { FaUserSlash } from "react-icons/fa";
function AppLayout() {
  return (
    <>
      <Outlet />
    </>
  );
}

function ChatPage() {
  const isLoggedIn = !!localStorage.getItem('token');

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
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<ChatPage />} />
          <Route path="signup" element={<Signup />} />
          <Route path="login" element={<Login />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

