import React, { useEffect, useState } from "react";
import { InfoCircleOutlined, UserOutlined } from "@ant-design/icons";
import { Input, Tooltip, Button, Space } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { db } from "../../database/firebase";
import { getDocs, collection, onSnapshot } from "firebase/firestore";
import { useNavigate, createSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import "../../App.css";
import { getDataDoc } from "../../database";
import { setAllDocuments } from "react-doc-viewer/build/state/actions";
function ProfesoriElevi() {
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const user = useSelector((state) => state.user);
  const profesori = useSelector((state) => state.profesori);
  const [ans, setAns] = useState([]);
  const [profesoriDisplay, setProfesoriDisplay] = useState([]);
  const [formulare, setFormulare] = useState([]);
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  let inputHandler = (e) => {
    //convert input text to lower case
    var lowerCase = e.target?.value.toLowerCase();
    setInputValue(lowerCase);
  };
  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(db, "formulare"));

    let array = [];
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      if (doc.data().publication === true)
        array.push({
          ...doc.data(),
          startDate: new Date(doc.data().startDate),
          endDate: new Date(doc.data().endDate),
        });
    });
    setFormulare(array);
  };
  useEffect(() => {
    fetchData();
    const unsub3 = onSnapshot(collection(db, "formulare"), (doc) => {
      fetchData();
    });
  }, []);
  const fetchRaspunsuri = async () => {
    let raspunsuri = [];
    for await (let f of formulare || []) {
      for await (let materie of user?.clasaMea?.materii || []) {
        for await (let p of materie?.profesori || []) {
          let data2 = await getDataDoc(
            f.id + "prof" + (p || "") + "materie" + (materie?.materie || ""),
            user.uid || "id"
          );

          if (data2?.raspunsuri?.length > 0) {
            raspunsuri.push({ f: f.id, m: materie?.materie, p: p });
          }
        }
      }
    }
    setAns(raspunsuri);
  };

  useEffect(() => {
    fetchRaspunsuri();
  }, [profesori, formulare]);
  useEffect(() => {
    setProfesoriDisplay([]);
    let array = JSON.parse(JSON.stringify(profesori));
    setProfesoriDisplay(
      array.filter((el) => {
        if (inputValue === "") {
          return el;
        } else {
          let materiiName = "";
          materii.forEach((materie) => {
            if (el.selectedMaterii.includes(materie.id)) {
              materiiName += materie.numeMaterie + " " + materie.profil + " ";
            }
          });
          return (
            el.prenume +
            " " +
            el.numeDeFamilie +
            " " +
            el.cnp +
            " " +
            materiiName
          )
            .toLowerCase()
            .includes(inputValue);
        }
      })
    );
  }, [profesori, inputValue]);

  const materii = useSelector((state) => state.materii);
  return (
    <div>
      <h1 style={{ fontSize: "30px" }}>Profesorii Mei</h1>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "2vw",
          paddingTop: "2vh",
        }}
      ></div>

      {user?.clasaMea?.materii.map((m) => {
        let mat = materii?.find((mm) => mm.id === m.materie);
        return (
          <>
            <div
              style={{
                backgroundColor: "#edf4f5",
                width: "100%",
                border: "1px solid #002140",
              }}
            >
              <br />
              <h1>{mat.numeMaterie + " - " + mat.profil} </h1>
              <br />
              <div className="cards-profiles">
                {m?.profesori?.map((pid, index) => {
                  let prof = profesori.find((p) => p.id === pid);
                  return (
                    <div
                      piled
                      className="card-profile"
                      onClick={() => navigate(`/profesor/${prof.id}`)}
                      style={{ whiteSpace: "break-spaces" }}
                    >
                      {prof?.text}
                      {formulare.length > 0 && (
                        <div>
                          <Space>
                            <h5>Adaugă Feedback</h5>
                            {formulare?.map((f) => {
                              return (
                                <Button
                                  icon={<TrophyOutlined />}
                                  style={{
                                    background: ans.find(
                                      (e) =>
                                        e.f === f?.id &&
                                        e.p === prof?.id &&
                                        e.m === mat?.id
                                    )
                                      ? "green"
                                      : "purple",
                                    color: "white",
                                  }}
                                  onClick={(e) => {
                                    navigate({
                                      pathname: "/raspunde/" + f?.id,
                                      search: createSearchParams({
                                        prof: prof?.id,
                                        materie: mat?.id,
                                      }).toString(),
                                    });
                                    e.stopPropagation();
                                  }}
                                ></Button>
                              );
                            })}
                          </Space>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <br />
            </div>
            <br />
          </>
        );
      })}
    </div>
  );
}

export default ProfesoriElevi;
