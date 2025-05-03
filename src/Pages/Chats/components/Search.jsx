import React, { useContext, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  or,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

import { db } from "../../../database/firebase";
import { AuthContext } from "../context/AuthContext";
import { openErrorNotification } from "../../../Components/Notifications/errorNotification";
import { updateDocDatabase } from "../../../database";
const Search = () => {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [err, setErr] = useState(false);

  const { currentUser } = useContext(AuthContext);

  const handleSearch = async () => {
    const q = query(
      collection(db, "users"),
      or(
        where("prenume", "==", username),
        where("numeDeFamilie", "==", username)
      )
    );

    try {
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        setUser(doc.data());
      });
    } catch (err) {
      setErr(true);
    }
  };

  const handleKey = (e) => {
    if (e.code === "Enter") {
      e.preventDefault();
    }
    e.code === "Enter" && handleSearch();
  };

  const handleSelect = async () => {
    //check whether the group(chats in firestore) exists, if not create

    const combinedId =
      currentUser.uid > user.uid
        ? currentUser.uid + user.uid
        : user.uid + currentUser.uid;

    try {
      const res = await getDoc(doc(db, "chats", combinedId));

      if (!res.exists()) {
        //create a chat in chats collection
        await updateDocDatabase("chats", combinedId, { messages: [] });

        //create user chats
      }
      let ress = await getDoc(doc(db, "userChats", currentUser.uid));
      if (!ress.exists()) {
        await updateDocDatabase("userChats", currentUser.uid, {
          [combinedId + ".userInfo"]: {
            uid: user.uid,
            displayName: user.displayName || "",
            photoLink: user.photoLink || "",
          },
          [combinedId + ".date"]: serverTimestamp(),
        });
      } else {
        await updateDocDatabase("userChats", currentUser.uid, {
          [combinedId + ".userInfo"]: {
            uid: user.uid,
            displayName: user.displayName || "",
            photoLink: user.photoLink || "",
          },
          [combinedId + ".date"]: serverTimestamp(),
        });
      }
      ress = await getDoc(doc(db, "userChats", user.uid));
      if (!ress.exists()) {
        await updateDocDatabase("userChats", user.uid, {
          [combinedId + ".userInfo"]: {
            uid: currentUser.uid,
            displayName: currentUser.displayName || "",
            photoLink: currentUser.photoLink || "",
          },
          [combinedId + ".date"]: serverTimestamp(),
        });
      } else {
        await updateDocDatabase("userChats", user.uid, {
          [combinedId + ".userInfo"]: {
            uid: currentUser.uid,
            displayName: currentUser.displayName || "",
            photoLink: currentUser.photoLink || "",
          },
          [combinedId + ".date"]: serverTimestamp(),
        });
      }
    } catch (err) {
      openErrorNotification(err.message);
    }

    setUser(null);
    setUsername("");
  };
  const getType = (type) => {
    if (type == "elevi") return "elev";
  };
  return (
    <div className="search">
      <div className="searchForm">
        <input
          type="text"
          placeholder="Find a user"
          onKeyDown={handleKey}
          onChange={(e) => setUsername(e.target.value)}
          value={username}
        />
      </div>
      {err && <span>User not found!</span>}
      {user && (
        <div className="userChat" onClick={handleSelect}>
          <img
            src={
              user.photoLink ||
              "https://firebasestorage.googleapis.com/v0/b/catalog-cce7f.appspot.com/o/profile-elev.webp?alt=media&token=c991b0b9-5ac1-479b-8db5-14789963aca3"
            }
            alt=""
            height="40px"
          />
          <div className="userChatInfo">
            <span>{user.displayName + "( " + getType(user.type) + " )"}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
