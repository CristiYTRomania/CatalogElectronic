import React, { useContext } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../../database/firebase";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { currentUser } = useContext(AuthContext);

  return (
    <div className="navbar">
      <span className="logo">Lama Chat</span>
      <div className="user">
        <img
          src={
            currentUser.photoLink ||
            "https://firebasestorage.googleapis.com/v0/b/catalog-cce7f.appspot.com/o/profile-elev.webp?alt=media&token=c991b0b9-5ac1-479b-8db5-14789963aca3"
          }
          alt=""
        />
        <span>{currentUser.displayName}</span>
        <button onClick={() => signOut(auth)}>logout</button>
      </div>
    </div>
  );
};

export default Navbar;
