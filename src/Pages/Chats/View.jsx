import React from "react";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import { AuthContextProvider } from "./context/AuthContext";
import { ChatContextProvider } from "./context/ChatContext";
import { Modal } from "semantic-ui-react";
import "./style.css";
const Home = ({ open, setOpen }) => {
  return (
    <Modal
      open={open}
      size="fullscreen"
      closeIcon
      onClose={() => {
        setOpen(false);
      }}
    >
      <AuthContextProvider>
        <ChatContextProvider>
          <div className="home">
            <div className="container">
              <Sidebar />
              <Chat />
            </div>
          </div>
        </ChatContextProvider>
      </AuthContextProvider>
    </Modal>
  );
};

export default Home;
