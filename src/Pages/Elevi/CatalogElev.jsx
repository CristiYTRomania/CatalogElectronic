import React, { useEffect, useState } from "react";

import { Divider, Table, Space } from "antd";

import { useParams } from "react-router-dom";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../database/firebase";
import {
  useWindowSize,
  useWindowWidth,
  useWindowHeight,
} from "@react-hook/window-size";
import { useNavigate } from "react-router-dom";
import { calculeaza_medie_materie } from "../../utils/calculare_medie";
import { motiveazaAbsente } from "../../utils/absente";
import { useDispatch } from "react-redux";
import { testSlice } from "../../redux/store";

import { useSelector } from "react-redux";
import { calculare_medii } from "../../utils/calculare_medie";
import { getDataDoc } from "../../database";

import ModalViewGrade from "../../Components/ModalViewGrade";
import withErrorBoundary from "../../Components/withErrorComponent";

const { actions } = testSlice;
const { GET_LOADING } = actions;

const Note = ({
  columns,
  note,
  materiiLimited,
  materii,
  scutiri,
  id,
  absenteStatistici,
}) => {
  return (
    <>
      <Table
        columns={columns}
        dataSource={note}
        bordered
        size="small"
        pagination={false}
        style={{ padding: "10px", margin: "auto" }}
      />
      {materiiLimited.length === 0 && (
        <>
          {" "}
          <h3
            style={{
              justifyContent: "center",
              display: "flex",
              textAlign: "center",
            }}
          >
            Medie Finala:
            {calculare_medii(
              note?.reduce((acc, cur) => [...acc, ...cur[1].note], []),
              materii,
              scutiri[id]
            )}
            {}
          </h3>
          <h3
            style={{
              justifyContent: "center",
              display: "flex",
              textAlign: "center",
            }}
          >
            {" "}
            Nr absente cu bilet rămase:
            {absenteStatistici.absenteBiletRamase}
          </h3>
          {absenteStatistici.critic === false && (
            <h3
              style={{
                fontSize: "20px",
                color: "purple",
                display: "flex",
                justifyContent: "center",
                borderRadius: "2px",
                marginBottom: "30px",
              }}
            >
              Numar Absențe: {absenteStatistici.absente_nemotivate.length}
            </h3>
          )}
          {absenteStatistici.critic && (
            <h3
              style={{
                fontSize: "20px",
                color: "red",
                display: "flex",
                justifyContent: "center",
                marginBottom: "30px",
              }}
            >
              Numar Absențe: {absenteStatistici.absente_nemotivate.length}
            </h3>
          )}
        </>
      )}
    </>
  );
};

function CatalogElev({
  elevIdPassed = null,
  materiiLimited = [],
  open = false,
}) {
  const idUser = useSelector((state) => state.user.uid);
  const id = elevIdPassed || idUser;
  const user = useSelector((state) => state.user);
  const [elevData, setElevData] = useState({});
  const clase = useSelector((state) => state.clase);
  const [note, setNote] = useState([]);
  const [current, setCurrent] = useState("mail");
  const onlyWidth = useWindowWidth();
  const dispatch = useDispatch();
  const [tabKey, setTabKey] = useState("CHAT");
  const [classData, setClassData] = useState([]);
  const [author, setAuthor] = useState("");
  const Limit = 40;
  const [gradesElevi, setGradesElevi] = useState([]);
  const [elevId, setElevId] = useState();
  const [scutiri, setScutiri] = useState({});
  const [elevId2, setElevId2] = useState();
  const [absenteStatistici, setAbsenteStatistici] = useState({});
  const [materieId, setMaterieId] = useState();
  const [nota, setNota] = useState();
  const [comentariu, setComentariu] = useState();
  const [data, setData] = useState();
  const [tip, setTip] = useState();
  const [entity, setEntity] = useState({});

  const [open2, setOpen2] = useState(false);
  const [permission, setPermission] = useState(false);

  const formatDate = (today) => {
    const romaniaTime = new Date(
      today.toLocaleString("en-US", { timeZone: "Europe/Bucharest" })
    );

    const yyyy = romaniaTime.getFullYear();
    let mm = romaniaTime.getMonth() + 1; // Months start at 0!
    let dd = romaniaTime.getDate();
    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;

    return dd + "." + mm;
  };

  const fetchData = async () => {
    let data = await getDataDoc("elevi", id);
    setElevData(data);
    const not = await getDataDoc("catalog", id);

    let dataClass = await getDataDoc("claseData", data?.clasa || "faraclasa");
    if (data?.deleted === true) {
      dataClass = await getDataDoc(
        "claseData",
        data?.clasaVeche || "faraclasa"
      );
    }

    const docs = await getDataDoc("eleviDocumente", id);
    let scutiriElevi = {};
    scutiriElevi[id] = docs?.docsElev.filter(
      (doc) => doc.tip === "scutire" || doc.tip === "bilet"
    );
    setScutiri(scutiriElevi);
    let obj = {};
    dataClass?.materii
      ?.filter((materie) => {
        if (materiiLimited.length > 0) {
          if (materiiLimited.find((m) => m === materie.materie)) return true;
          return false;
        }

        if (
          dataClass?.diriginte === user?.uid ||
          dataClass?.diriginte_step === user?.uid ||
          user?.type === "admin" ||
          user?.uid === id
        )
          return true;

        if ((materie.profesori || []).includes(user.uid)) return true;
        return false;
      })
      ?.forEach((materieId) => {
        obj[materieId.materie] = { note: [], absente: [] };
      });
    setAbsenteStatistici(motiveazaAbsente(not?.note, scutiriElevi[id]));
    motiveazaAbsente(not?.note, scutiriElevi[id]).absente_dupa_motivari.forEach(
      (n) => {
        obj[n.materieId]?.absente?.push(n);
      }
    );
    not?.note?.forEach((n) => {
      obj[n.materieId]?.note?.push(n);
    });
    setNote(Object.entries(obj));
    setClassData({
      ...dataClass,
      ore: (dataClass?.ore || []).map((el) => {
        return {
          ...el,
          startDate: new Date(el.startDate),
          endDate: new Date(el.endDate),
        };
      }),
    });
  };

  const materii = useSelector((state) => state.materii);
  const styleD = () => {
    if (materiiLimited.length > 0) return "auto auto";
    if (onlyWidth < 700) return "auto";
    if (onlyWidth < 1000) return "auto auto auto";
    if (onlyWidth < 1200) return "auto auto auto auto";
    return "auto auto auto auto auto";
  };
  const columns = [
    {
      title: "Materie",
      dataIndex: "telefon",
      width: "20vw",
      key: "telefon",
      render: (e, data) => {
        const calculate_medie = () => {
          let medie = calculeaza_medie_materie(
            [...data[1]?.note, ...absenteStatistici.absente_dupa_motivari],
            materii?.find((m) => m.id === data[0]),
            scutiri[id]
          );
          let { inchis, corigenta } = medie;

          if (inchis) {
            return (
              <>
                {corigenta && (
                  <p
                    style={{
                      borderBottom: "1px solid purple",
                      width: "auto",
                      fontSize: "16px",
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    Media intiala: {medie.medieInitiala}
                  </p>
                )}
                {corigenta && (
                  <p
                    style={{
                      borderBottom: "1px solid purple",
                      width: "auto",

                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    Corigenta: {corigenta.corigenta}
                  </p>
                )}

                <p
                  style={{
                    border: "1px solid purple",
                    width: "auto",

                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  Medie: {inchis.inchidere_medie}
                </p>
              </>
            );
          }

          return (
            <>
              {corigenta && (
                <p
                  style={{
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  Corigenta: {corigenta.corigenta}
                </p>
              )}
              <p
                style={{
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: "purple",
                }}
              >
                Medie: {medie.medie}
              </p>
            </>
          );
        };
        return (
          <div style={{ textAlign: "center", fontSize: "15px" }}>
            <p style={{ fontWeight: "bold", fontSize: "15px" }}>
              {materii?.find((mat) => mat.id === data?.[0])?.numeMaterie}
              {materii.find((mat) => mat.id === data?.[0])?.numeMaterie ==
                "Religie" &&
                elevData?.religie?.length > 0 &&
                elevData.religie === "nu" && (
                  <p style={{ color: "red", fontSize: "12px" }}>
                    -retras Religie conform {elevData.religie}-
                  </p>
                )}
              {materii
                .find((mat) => mat.id === data?.[0])
                ?.numeMaterie.includes("Educație fizică") &&
                elevData?.scutitMedical?.length > 0 &&
                elevData.scutitMedical !== "nu" &&
                elevData?.scutitMedical?.length > 0 &&
                (elevData?.dataExpirareMedical
                  ? new Date() <= new Date(elevData.dataExpirareMedical)
                  : true) && (
                  <p
                    style={{
                      color: "red",
                      fontSize: "12px",
                    }}
                  >
                    -scutit medical conform {elevData.scutitMedical}-
                  </p>
                )}
            </p>

            <br />
            {calculate_medie()}
          </div>
        );
      },
      responsive: ["xs"],
    },
    {
      title: "Materie",
      dataIndex: "materie",
      width: "20vw",
      key: "materie",
      render: (e, data) => {
        return (
          <>
            <p style={{ fontWeight: "bold", fontSize: "20px" }}>
              {materii?.find((mat) => mat.id === data?.[0])?.numeMaterie}
            </p>
            {materii
              .find((mat) => mat.id === data?.[0])
              ?.numeMaterie.includes("Educație fizică") &&
              elevData?.scutitMedical?.length > 0 &&
              elevData.scutitMedical !== "nu" &&
              (elevData?.dataExpirareMedical
                ? new Date() <= new Date(elevData.dataExpirareMedical)
                : true) && (
                <p
                  style={{
                    color: "red",
                    fontSize: "17px",
                  }}
                >
                  -scutit medical conform {elevData.scutitMedical}-
                </p>
              )}
            {materii.find((mat) => mat.id === data?.[0])?.numeMaterie ==
              "Religie" &&
              elevData?.religie?.length > 0 &&
              elevData.religie !== "da" && (
                <p style={{ color: "red", fontSize: "17px" }}>
                  -retras Religie conform {elevData.religie}-
                </p>
              )}
          </>
        );
      },
      responsive: ["sm"],
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      width: "15vw",
      render: (e, data) => {
        return (
          <>
            {" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: styleD(),
              }}
            >
              {data?.[1].note
                ?.filter((n) => n.tip === "nota")
                .map((nota) => {
                  return (
                    <p
                      style={{
                        fontSize: "14px",
                        display: "flex",
                        fontWeight: "bold",
                        color:
                          nota?.delete === "waiting" &&
                          (user.type === "admin" || user.type === "profesor")
                            ? "grey"
                            : "#1c90ff",
                      }}
                      onClick={() => {
                        setNota(nota.nota);
                        setMaterieId(nota.materieId);
                        setTip(nota.tip);
                        setComentariu(nota.comentariu);
                        setAuthor(nota.author || "");
                        setData(new Date(nota.date));

                        setOpen2(true);
                      }}
                    >
                      {nota.nota}
                      {materiiLimited.length === 0 && (
                        <p
                          style={{
                            fontStyle: "italic",
                            fontSize: "14px",
                            fontWeight: "lighter",
                          }}
                        >
                          {" /" + formatDate(new Date(nota.date))}
                        </p>
                      )}
                    </p>
                  );
                })}
            </div>
            <br />
            {(data?.[1].note || []).find(
              (n) => n.materieId === data?.[0] && n.tip === "examen_final"
            ) && (
              <p
                style={{
                  color:
                    nota?.delete === "waiting" &&
                    (user.type === "admin" || user.type === "profesor")
                      ? "grey"
                      : "purple",
                }}
                onClick={() => {
                  const nota = (data?.[1].note || []).find(
                    (n) => n.materieId === data?.[0] && n.tip === "examen_final"
                  );
                  setNota(nota.examen_final);
                  setMaterieId(nota.materieId);
                  setTip(nota.tip);
                  setAuthor(nota.author || "");
                  setComentariu(nota.comentariu);

                  setData(new Date(nota.date));

                  setOpen2(true);
                }}
              >
                Examen Final:&nbsp;
                {
                  (data?.[1].note || []).find(
                    (n) => n.materieId === data?.[0] && n.tip === "examen_final"
                  ).examen_final
                }{" "}
              </p>
            )}
          </>
        );
      },
    },
    {
      title: "Absente",
      dataIndex: "absente",
      key: "absente",
      width: "16vw",
      render: (e, data) => {
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: styleD(),
            }}
          >
            {data?.[1].absente.map((nota) => {
              let date = new Date(nota.date);

              return nota.motivat === false ? (
                <p
                  style={{
                    fontSize: "13px",
                    color:
                      nota?.delete === "waiting" &&
                      (user.type === "admin" || user.type === "profesor")
                        ? "grey"
                        : "red",
                  }}
                  onClick={() => {
                    setNota(nota.nota);
                    setMaterieId(nota.materieId);
                    setTip(nota.tip);
                    setAuthor(nota.author || "");
                    setEntity(nota);
                    setComentariu(nota.comentariu);
                    setData(new Date(nota.date));
                    setElevId2(data.id);
                    setOpen2(true);
                  }}
                >
                  {formatDate(date)}
                </p>
              ) : (
                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      color:
                        nota?.delete === "waiting" &&
                        (user.type === "admin" || user.type === "profesor")
                          ? "grey"
                          : "green",
                      border: nota.scutire
                        ? "2.5px solid #a3eb07"
                        : "1px solid green",

                      borderStyle:
                        nota.scutire.tip === "bilet" ? "dotted" : "solid",

                      borderRadius: "2px",
                      wordBreak: "keep-all",

                      height: "auto",
                      maxWidth: "40px",
                    }}
                    onClick={() => {
                      setNota(nota.nota);
                      setMaterieId(nota.materieId);
                      setTip(nota.tip);
                      setAuthor(nota.author || "");
                      setEntity(nota);
                      setComentariu(nota.comentariu);
                      setData(new Date(nota.date));
                      setElevId2(data.id);
                      setOpen2(true);
                    }}
                  >
                    {formatDate(date)}
                  </p>
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Medie",
      dataIndex: "medie",
      key: "medie",
      width: "7vw",

      render: (e, data) => {
        let medie = calculeaza_medie_materie(
          [...data?.[1].note, ...absenteStatistici.absente_dupa_motivari],
          materii?.find((ma) => ma.id === data?.[0]),
          scutiri[id]
        );
        let { inchis, corigenta } = medie;

        if (inchis) {
          return (
            <>
              {corigenta && (
                <p
                  style={{
                    borderBottom: "1px solid purple",
                    width: "auto",
                    fontSize: "20px",
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  Media intiala: {medie.medieInitiala}
                </p>
              )}
              {corigenta && (
                <p
                  style={{
                    borderBottom: "1px solid purple",
                    width: "auto",
                    fontSize: "30px",
                    textAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  Corigenta: {corigenta.corigenta}
                </p>
              )}

              <p
                style={{
                  border: "1px solid purple",
                  width: "auto",
                  fontSize: "30px",
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {inchis.inchidere_medie}
              </p>
            </>
          );
        }

        return (
          <>
            {corigenta ? (
              <p
                style={{
                  fontSize: "30px",
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                Corigenta: {corigenta.corigenta}
              </p>
            ) : (
              <p
                style={{
                  fontSize: "30px",
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {medie.medie}
              </p>
            )}
          </>
        );
      },
      responsive: ["sm"],
    },
  ];

  useEffect(() => {
    fetchData();
  }, [id]);
  useEffect(() => {
    if (materiiLimited.length > 0) fetchData();
  }, [user, id, elevIdPassed, materiiLimited, open]);

  const onChange = (key) => {
    setTabKey(key);
  };

  return (
    <div style={{ margin: "auto" }}>
      {materiiLimited.length === 0 && (
        <>
          <ModalViewGrade
            open={open2}
            edit={false}
            setOpen={setOpen2}
            eleviData={[{ ...elevData, id }]}
            elevId={id}
            author={author}
            entity={entity}
            gradesElevi={gradesElevi}
            setElevId={setElevId}
            materii={classData?.materii?.map((matID) => {
              return materii?.find((ma) => ma.id === matID.materie);
            })}
            setGradesElevi={setGradesElevi}
            materieId={materieId}
            tip={tip}
            nota={nota}
            comentariu={comentariu}
            date={data}
            scutiri={scutiri}
          />
          <br />
          <Divider style={{ borderBlockStart: "0px" }} />
        </>
      )}

      <Note
        columns={columns}
        note={note}
        materiiLimited={materiiLimited}
        materii={materii}
        scutiri={scutiri}
        id={id}
        absenteStatistici={absenteStatistici}
      />
    </div>
  );
}

export default withErrorBoundary(CatalogElev);
