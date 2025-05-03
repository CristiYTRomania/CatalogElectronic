import { doc, onSnapshot } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { Image } from "antd";
import { db } from "../../../database/firebase";

const Chats = () => {
  const [chats, setChats] = useState([]);

  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);

  useEffect(() => {
    const getChats = () => {
      const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
        setChats(doc.data());
      });

      return () => {
        unsub();
      };
    };

    currentUser.uid && getChats();
  }, [currentUser.uid]);

  const handleSelect = (u) => {
    dispatch({ type: "CHANGE_USER", payload: u });
  };

  return (
    <div className="chats">
      {Object.entries(chats || {})
        ?.sort((a, b) => b[1]?.date - a[1]?.date)
        .map((chat) => (
          <div
            className="userChat"
            key={chat[0]}
            onClick={() => handleSelect(chat[1]?.userInfo)}
          >
            <Image
              src={
                chat[1]?.userInfo?.photoLink ||
                "https://firebasestorage.googleapis.com/v0/b/catalog-cce7f.appspot.com/o/profile-elev.webp?alt=media&token=c991b0b9-5ac1-479b-8db5-14789963aca3"
              }
              alt=""
              height="60px"
            />
            <div className="userChatInfo">
              <span>{chat[1]?.userInfo?.displayName}</span>
              <p>{chat[1]?.lastMessage?.text}</p>
            </div>
          </div>
        ))}
    </div>
  );
};

export default Chats;
