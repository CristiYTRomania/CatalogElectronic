import React, { useContext } from "react";
import Cam from "../img/cam.png";
import Add from "../img/add.png";
import More from "../img/more.png";
import Messages from "./Messages";
import Input from "./Input";
import { ChatContext } from "../context/ChatContext";
import { Image } from "antd";

const Chat = () => {
  const { data } = useContext(ChatContext);

  return (
    <div className="chat">
      <div className="chatInfo">
        <Image
          src={
            data.user?.photoLink ||
            "https://firebasestorage.googleapis.com/v0/b/catalog-cce7f.appspot.com/o/profile-elev.webp?alt=media&token=c991b0b9-5ac1-479b-8db5-14789963aca3"
          }
          alt=""
          height="40px"
        />
        <span>{data.user?.displayName}</span>
        <div className="chatIcons">
          <img src={Cam} alt="" />
          <img src={Add} alt="" />
          <img src={More} alt="" />
        </div>
      </div>
      <Messages />
      {data.chatId !== "null" && <Input />}
    </div>
  );
};

export default Chat;
