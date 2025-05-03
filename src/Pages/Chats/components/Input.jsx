import React, { useContext, useState } from "react";
import Img from "../img/img.png";

import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { SendOutlined } from "@ant-design/icons";
import { Button } from "antd";
import {
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../../../database/firebase";
import { v4 as uuid } from "uuid";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { getDataDoc } from "../../../database";

const Input = () => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);

  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(ChatContext);

  const handleSend = async () => {
    if (img) {
      const storageRef = ref(storage, uuid());

      const uploadTask = uploadBytesResumable(storageRef, img);

      uploadTask.on(
        (error) => {
          //TODO:Handle Error
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            let m = await getDataDoc("chats", data.chatId);
            let mes = m?.messages || [];

            await updateDoc(doc(db, "chats", data.chatId), {
              messages: [
                ...mes,
                {
                  id: uuid(),
                  text,
                  senderId: currentUser.uid,
                  date: Timestamp.now(),
                  img: downloadURL,
                },
              ],
            });
          });
        }
      );
    } else {
      if (text.length > 0) {
        let m = await getDataDoc("chats", data.chatId);
        let mes = m?.messages || [];

        await updateDoc(doc(db, "chats", data.chatId), {
          messages: [
            ...mes,
            {
              id: uuid(),
              text,
              senderId: currentUser.uid,
              date: Timestamp.now(),
            },
          ],
        });
      }
    }

    await updateDoc(doc(db, "userChats", currentUser.uid), {
      [data.chatId + ".lastMessage"]: {
        text,
      },
      [data.chatId + ".date"]: serverTimestamp(),
    });

    await updateDoc(doc(db, "userChats", data.user.uid), {
      [data.chatId + ".lastMessage"]: {
        text,
      },
      [data.chatId + ".date"]: serverTimestamp(),
    });

    setText("");
    setImg(null);
  };
  return (
    <div
      className="input"
      onKeyDown={(e) => {
        if (e.code === "Enter") {
          e.preventDefault();
          handleSend();
        }
      }}
    >
      <input
        type="text"
        placeholder="Type something..."
        onChange={(e) => setText(e.target.value)}
        value={text}
        style={{ width: "100%" }}
      />
      <div className="send" style={{ display: "flex", gap: "10px" }}>
        <input
          type="file"
          style={{ display: "none" }}
          id="file"
          onChange={(e) => {
            setImg(e.target.files[0]);
            handleSend();
          }}
        />
        <label htmlFor="file">
          <img src={Img} alt="" />
        </label>
        <Button onClick={handleSend} icon={<SendOutlined />} />
      </div>
    </div>
  );
};

export default Input;
