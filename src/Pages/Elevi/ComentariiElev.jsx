import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getDataDoc } from "../../database";
import Comentarii from "../../Components/Comentarii";
function ComentariiElev() {
  const user = useSelector((state) => state.user);
  const [note, setNote] = useState([]);
  useEffect(() => {
    fetchData();
  }, [user]);
  const fetchData = async () => {
    let data = await getDataDoc("elevi", user.uid);

    const not = await getDataDoc("catalog", user.uid);
    let dataClass = await getDataDoc("claseData", data.clasa || "faraclasa");

    let obj = {};
    dataClass.materii?.forEach((materieId) => {
      obj[materieId.materie] = { note: [] };
    });
    not?.note?.forEach((n) => {
      obj[n.materieId]?.note?.push(n);
    });
    setNote(Object.entries(obj));
  };
  useEffect(() => {}, []);

  return (
    <div>
      {" "}
      {note.length > 0 && user ? (
        <Comentarii elevData={user} id={user.uid} note={note} />
      ) : (
        "Nu sunt date"
      )}
    </div>
  );
}

export default ComentariiElev;
