import React, { useEffect, useState } from "react";
import { Feed, Icon } from "semantic-ui-react";
import { useSelector } from "react-redux";
import { getDataDoc } from "../database";
import { openErrorNotification } from "./Notifications/errorNotification";
import { anonymus } from "../utils";
const formatDate = (today) => {
  const romaniaTime = new Date(
    today.toLocaleString("en-US", { timeZone: "Europe/Bucharest" })
  );

  const yyyy = romaniaTime.getFullYear();
  let mm = romaniaTime.getMonth() + 1; // Months start at 0!
  let dd = romaniaTime.getDate();
  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  return dd + "/" + mm;
};

function Comentarii({ elevData, id, note }) {
  const [comentarii, setComentarii] = useState([]);
  const materii = useSelector((state) => state.materii);
  const fetch = async () => {
    try {
      let newArray = [];
      for (let sub of note) {
        newArray = [
          ...(sub[1]?.note || []).filter((n) => n.tip === "comentariu"),
          ...newArray,
        ];
      }
      newArray.sort((b, a) => a.date - b.date);

      setComentarii(newArray);
    } catch (e) {
      openErrorNotification(e.message);
    }
  };
  useEffect(() => {
    fetch();
  }, [note]);

  return (
    <div style={{ paddingLeft: "15%" }}>
      <Feed size="large">
        {comentarii.map((el) => (
          <Feed.Event>
            <Feed.Label>
              <img alt="profil" src={el.photoURL || anonymus} />
            </Feed.Label>
            <Feed.Content>
              <Feed.Summary>
                <Feed.User>{el.displayName}</Feed.User> a adăugat un Comentariu
                la {materii?.find((mat) => mat.id === el.materieId).numeMaterie}
                <Feed.Date>{formatDate(new Date(el.date))}</Feed.Date>
              </Feed.Summary>
              <Feed.Extra text>{el.comentariu}</Feed.Extra>
            </Feed.Content>
          </Feed.Event>
        ))}
      </Feed>
    </div>
  );
}

export default Comentarii;
