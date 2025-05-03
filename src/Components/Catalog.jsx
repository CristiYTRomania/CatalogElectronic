import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  Button,
  Space,
  Divider,
  Switch,
  Popconfirm,
  Select,
} from "antd";
import "./Catalog.css";
import { useSelector } from "react-redux";
import { PlusOutlined } from "@ant-design/icons";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../database/firebase";
import { Accordion, Icon, Popup, Button as BS } from "semantic-ui-react";

import ScutireDisplay from "./ScutireDisplay";
import Docxtemplater from "docxtemplater";
import { motiveazaAbsente } from "../utils/absente";
import { Alert } from "antd";
import PizZip from "pizzip";
import * as XLSX from "xlsx";

import { useWindowSize, useWindowWidth } from "@react-hook/window-size";
import { getDataDoc } from "../database";
import { updateDocDatabase } from "../database";
import ModalAddGrade from "./ModalAddGrade";
import { Table as CatalogTabel } from "semantic-ui-react";
import ModalViewGrade from "./ModalViewGrade";
import { useReactToPrint } from "react-to-print";
import { useNavigate } from "react-router-dom";
import { openSuccesNotification } from "../Components/Notifications/succesNotification";
import {
  calculare_medii,
  calculeaza_medie_materie,
} from "../utils/calculare_medie";
import { exportExcel } from "./excelexport";
import { openErrorNotification } from "./Notifications/errorNotification";
import { renderClassName } from "../utils";
import CatalogElev from "../Pages/Elevi/CatalogElev";
import withErrorBoundary from "./withErrorComponent";

function Catalog({ classData, setClassData, mode = "edit", permision }) {
  const [eleviData, setEleviData] = useState([]);
  const componentRef = useRef();
  const onlyWidth = useWindowWidth();
  const [open, setOpen] = useState(false);
  const [gradesElevi, setGradesElevi] = useState([]);
  const [elevId, setElevId] = useState();
  const [elevId2, setElevId2] = useState();
  const [audit, setAudit] = useState(false);
  const [teza, setTeza] = useState();
  const materiiRedux = useSelector((state) => state.materii);
  const [materieId, setMaterieId] = useState();
  const [nota, setNota] = useState();
  const [inchideMediiAutomat, setInchideMediiAutomat] = useState(false);
  const [allData, setAllData] = useState({});
  const profesori = useSelector((state) => state.profesori);
  const settings = useSelector((state) => state.settings);
  const Limit = 40;
  const [deleted, setDeleted] = useState("");
  const [motivStergereMedie, setMotivStergereMedie] = useState("");
  const [notePrint, setNotePrint] = useState([]);
  const [author, setAuthor] = useState("");
  const navigate = useNavigate();
  const [comentariu, setComentariu] = useState();
  const [edit, setEdit] = useState(false);

  const [faraNote, setFaraNote] = useState(false);
  const [activeMaterii, setActiveMaterii] = useState([]);
  const windowSize = useRef(window.innerWidth);
  const [data, setData] = useState();
  const auditRef = useRef();
  const user = useSelector((state) => state.user);

  const [tip, setTip] = useState();
  const [entity, setEntity] = useState({});
  const [scutiri, setScutiri] = useState({});
  const [display, setDisplay] = useState(false);

  const [id, setId] = useState("");
  const [profileElevi, setProfileElevi] = useState({});
  const [open2, setOpen2] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const fetchData = async () => {
    let newArray = [];
    let scutiriElevi = {};
    let note = {};
    let NotePrint = [];

    for (let elev of classData?.elevi || []) {
      const docs = await getDataDoc("eleviDocumente", elev.id);

      scutiriElevi[elev.id] = docs?.docsElev.filter(
        (doc) => doc.tip === "scutire" || doc.tip === "bilet"
      );
    }

    for await (let elev of classData?.elevi || []) {
      let obj = {};
      const notes = await getDataDoc("catalog", elev.id);
      if (elev.mutat === true) {
        note[elev.id] = {
          note: elev.gradesFrozen,
          absente: motiveazaAbsente(
            elev.gradesFrozen,
            elev?.docsFrozen?.docsElev
          ),
        };
      } else
        note[elev.id] = {
          note: notes?.note,
          absente: motiveazaAbsente(notes?.note, scutiriElevi[elev.id]),
        };

      newArray.push({
        ...elev,
        key: elev.id,
        nume: elev.numeDeFamilie + " " + elev.initiala + " " + elev.prenume,
      });

      classData?.materii?.forEach((materieId) => {
        obj[materieId.materie] = { note: [], absente: [] };
      });

      notes?.note?.forEach((n) => {
        obj[n.materieId]?.note?.push(n);
      });
      motiveazaAbsente(
        notes?.note,
        scutiriElevi[elev.id]
      ).absente_dupa_motivari.forEach((n) => {
        obj[n.materieId]?.absente?.push(n);
      });

      NotePrint.push({
        notes: Object.entries(obj),
        absente: motiveazaAbsente(notes?.note, scutiriElevi[elev.id]),
        name: elev.numeDeFamilie + " " + elev.initiala + " " + elev.prenume,
        id: elev.id,
        retras: elev.retras,
        ces: elev.ces,
        details: elev.details,
        ...elev,
      });
    }

    setNotePrint(NotePrint);

    setScutiri(scutiriElevi);
    setEleviData([
      ...newArray
        .filter(
          (a) =>
            !(
              a.venitNou ||
              (a.transferuri?.length > 0 && !a.mutat && !a.retras)
            )
        )
        .sort((a, b) => a.nume.localeCompare(b.nume, "ro")),
      ...newArray
        .filter(
          (a) =>
            a.venitNou || (a.transferuri?.length > 0 && !a.mutat && !a.retras)
        )
        .sort((a, b) => a.nume.localeCompare(b.nume, "ro")),
    ]);

    setGradesElevi(note);
  };
  const decideNumber = () => {
    if (audit === true) return onlyWidth < 700 ? 1 : 2;
    if (onlyWidth < 700) return 1;
    if (onlyWidth < 900) return 2;
    if (onlyWidth < 1500) return 3;

    return 4;
  };
  const groupArray = (array) => {
    let newArray = [[]];
    let index = 0;
    (array || []).forEach((e) => {
      if (newArray[index].length < decideNumber()) newArray[index].push(e);
      else newArray[++index] = [e];
    });
    return newArray;
  };

  const formatDate = (today) => {
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;

    return dd + "." + mm;
  };
  useEffect(() => {
    fetchData();
    // setActiveMaterii(
    //   classData?.materii?.map((m) => {
    //     return m.materie;
    //   })
    // );
  }, [classData]);
  useEffect(() => {
    let array = [];
    for (let elev of classData?.elevi || []) {
      const unsub = onSnapshot(doc(db, "catalog", elev.id), (doc) => {
        fetchData();
      });
      const unsub2 = onSnapshot(doc(db, "eleviDocumente", elev.id), (doc) => {
        fetchData();
      });
      array.push(unsub);
      array.push(unsub2);
    }
  }, []);

  const fetchProfiles = async () => {
    let profileElevi = {};
    for await (let elev of classData?.elevi || []) {
      const profilElev = await getDataDoc("elevi", elev.id);
      profileElevi[elev.id] = profilElev;
    }
    setProfileElevi(profileElevi);
  };
  useEffect(() => {
    if (display === true) {
      fetchProfiles();
    }
  }, [display]);

  const materii = useSelector((state) => state.materii);

  return (
    <>
      {Object.keys(scutiri || {}).find((key) => {
        if (
          scutiri[key]?.find(
            (s) =>
              s.verified === "denied" &&
              (new Date() - new Date(s.uploaded)) / (1000 * 60 * 60 * 24) <= 30
          )
        )
          return true;
        return false;
      }) &&
        (user.type === "admin" ||
          user.id === classData.diriginte ||
          user.id === classData.diriginte_step) && (
          <Alert
            type="error"
            message={
              "Elevii " +
              (eleviData || []).reduce((acc, elev) => {
                let key = elev.key;

                if (
                  scutiri[key]?.find(
                    (s) =>
                      s.verified === "denied" &&
                      (new Date() - new Date(s.uploaded)) /
                        (1000 * 60 * 60 * 24) <=
                        30
                  )
                )
                  return acc + " " + elev.nume + "; ";
                return acc;
              }, "") +
              " au scutiri respinse de către conducere. Te rugăm să verifci."
            }
          />
        )}

      <ModalAddGrade
        open={open}
        setOpen={setOpen}
        eleviData={eleviData}
        elevId={elevId}
        classData={classData}
        scutiri={scutiri}
        gradesElevi={gradesElevi}
        permision={permision}
        setElevId={setElevId}
        diriginteEmail={
          profesori?.find(
            (p) =>
              p?.id === classData?.diriginte ||
              p?.id === classData?.diriginte_step
          )?.adresaEmail || ""
        }
        classId={classData?.id}
        fullAcces={
          classData?.diriginteAcces === true &&
          ((user.id || user.uid) === classData.diriginte ||
            user.type === "admin")
        }
        dupaTermen={classData?.dupaTermen || false}
        materii={
          classData?.diriginteAcces === true &&
          ((user.id || user.uid) === classData.diriginte ||
            user.type === "admin")
            ? classData?.materii?.map((m) =>
                materiiRedux.find((c) => c.id === m?.materie)
              )
            : (classData?.materii || [])
                .filter((m) => {
                  if (m?.profesori?.find((p) => p === user.id)) return true;
                  if (
                    settings?.showPurtare === true &&
                    m?.materie.includes("Purtare")
                  )
                    return true;
                  return false;
                })
                ?.map((matID) => {
                  return materii?.find((ma) => ma.id === matID.materie);
                })
        }
      />
      <ModalViewGrade
        open={open2}
        deleted={deleted || ""}
        setOpen={setOpen2}
        eleviData={eleviData}
        mode={mode}
        elevId={elevId2}
        allData={allData}
        id={id}
        gradesElevi={gradesElevi}
        author={author}
        entity={entity}
        permision={permision}
        setElevId={setElevId}
        classId={classData?.id}
        materiiClasa={classData?.materii?.map((matID) => {
          return {
            ...(materii?.find((ma) => ma.id === matID.materie) || {}),
            profesori: matID.profesori,
          };
        })}
        materieId={materieId}
        tip={tip}
        nota={nota}
        teza={teza}
        comentariu={comentariu}
        date={data}
        scutiri={scutiri}
      />

      <CatalogTabel celled>
        <CatalogTabel.Header>
          <CatalogTabel.Row>
            <CatalogTabel.HeaderCell>Nume</CatalogTabel.HeaderCell>
            <CatalogTabel.HeaderCell>Materii</CatalogTabel.HeaderCell>
          </CatalogTabel.Row>
        </CatalogTabel.Header>

        <CatalogTabel.Body>
          {eleviData
            .filter((e) => {
              // if (e.mutat === true || e.retras === true) return false; //show transferati

              if (
                (user?.orePrivat?.length === 0 || user?.orePrivat) &&
                (!user?.ore || user?.ore?.length === 0)
              )
                return true;
              if (
                (user.type === "profesor" &&
                  user?.ore?.find((o) => o.classId === classData.id)) ||
                user?.orePrivat?.find((o) => o.elev === e.id)
              )
                return true;
              if (user.type === "admin") return true;
              return false;
            })
            .sort((a, b) => {
              return a?.nume?.localeCompare(b.nume, "ro");
            })

            .map((e, index) => {
              let materiiCuMediaDeschisa = classData?.materii?.filter((m) => {
                if (new Date() < new Date("2025-06-01")) return true;
                let inchis = (gradesElevi?.[e.id]?.note || []).find(
                  (n) =>
                    n.materieId === m.materie && n.tip === "inchidere_medie"
                );
                if (inchis) return false;
                if (
                  gradesElevi?.[e.id]?.note?.filter(
                    (n) => n.materieId === m.materie
                  ).length > 0
                )
                  return true;
                else return false;
              });

              return (
                <CatalogTabel.Row>
                  <CatalogTabel.Cell
                    style={{
                      position: "relative",
                      whiteSpace: "break-spaces",

                      textAlign: "center",
                    }}
                  >
                    <a
                      onClick={() => {
                        navigate(`/elev/${e.id}`);
                      }}
                      className="sentry-mask"
                      style={{
                        textAlign: "center",
                        display: "flex",
                        justifyContent: "center",
                        border:
                          materiiCuMediaDeschisa?.length === 0 ||
                          e.incheie === true
                            ? "1px solid purple"
                            : "none",
                      }}
                    >
                      {index + 1}. {e.nume}
                      {e?.retras === true || e?.mutat === true
                        ? " - transferat"
                        : ""}
                      {gradesElevi?.[e.id]?.note?.find(
                        (n) =>
                          n.tip == "nota" &&
                          !classData.materii?.find(
                            (a) => a.materie === n.materieId
                          )
                      ) &&
                        user.type === "admin" && (
                          <h1>
                            Imporatant elevul are note in plus:{" "}
                            {gradesElevi?.[e.id]?.note
                              ?.filter(
                                (n) =>
                                  n.tip == "nota" &&
                                  !classData.materii?.find(
                                    (a) => a.materie === n.materieId
                                  )
                              )
                              .map((n) => n.id)}
                          </h1>
                        )}
                    </a>
                    {e?.ces === "da" && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "red",
                          padding: 0,
                          margin: 0,
                        }}
                      >
                        Cerințe educaționale speciale
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: "12px",
                        color: "red",
                      }}
                    >
                      {(e.details || "") +
                        "\n" +
                        (e.transferuri || []).reduce(
                          (acc, cur) => acc + cur.details + "\n",
                          ""
                        )}
                    </p>

                    {e.retras !== true &&
                      e.mutat !== true &&
                      classData.freeze !== true && (
                        <Button
                          style={{ backgroundColor: "#1677FE", color: "white" }}
                          onClick={() => {
                            setOpen(true);
                            setElevId(e.id);
                          }}
                        >
                          <PlusOutlined />
                        </Button>
                      )}
                  </CatalogTabel.Cell>
                  <CatalogTabel.Cell>
                    <Accordion>
                      <Accordion.Title
                        active={activeIndex === index}
                        index={index}
                        onClick={() => {
                          if (index === activeIndex) setActiveIndex(-1);
                          else setActiveIndex(index);
                        }}
                        style={{ textAlign: "center" }}
                      >
                        {window.screen.width < 750 ? (
                          <>
                            {" "}
                            <Icon name="dropdown" />
                            Note
                          </>
                        ) : (
                          <></>
                        )}
                      </Accordion.Title>
                      <Accordion.Content
                        active={
                          window.screen.width < 750 &&
                          classData?.materii?.length > 3
                            ? activeIndex === index
                            : true
                        }
                      >
                        {groupArray(
                          classData?.materii?.filter(
                            (a) =>
                              activeMaterii.length === 0 ||
                              activeMaterii.find((s) => s == a.materie)
                          )
                        ).map((group) => {
                          return (
                            <CatalogTabel attached celled fixed>
                              <CatalogTabel.Header>
                                <CatalogTabel.Row>
                                  {group.map((m) => {
                                    return (
                                      <CatalogTabel.HeaderCell>
                                        {
                                          materii?.find(
                                            (ma) => ma.id === m.materie
                                          )?.numeMaterie
                                        }
                                      </CatalogTabel.HeaderCell>
                                    );
                                  })}
                                </CatalogTabel.Row>
                              </CatalogTabel.Header>
                              <CatalogTabel.Body>
                                <CatalogTabel.Row>
                                  {group.map((m) => {
                                    let medie = calculeaza_medie_materie(
                                      gradesElevi?.[e.id]?.note,
                                      materii?.find((n) => n.id == m.materie),
                                      scutiri[e.id]
                                    );
                                    let { corigenta, inchis } = medie;

                                    return (
                                      <CatalogTabel.Cell>
                                        <CatalogTabel attached celled fixed>
                                          <CatalogTabel.Body>
                                            <CatalogTabel.Row
                                              style={{
                                                borderBottom: "1px solid black",
                                                backgroundColor: "unset",
                                              }}
                                            >
                                              <CatalogTabel.Cell>
                                                <div
                                                  style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                      "auto auto auto ",
                                                  }}
                                                >
                                                  {(
                                                    gradesElevi?.[e.id]?.note ||
                                                    []
                                                  )
                                                    .filter(
                                                      (n) =>
                                                        n.tip === "nota" &&
                                                        n.materieId ===
                                                          m.materie
                                                    )
                                                    .map((nota) => (
                                                      <p
                                                        style={{
                                                          fontSize: "18px",
                                                          color:
                                                            nota?.delete ===
                                                            "waiting"
                                                              ? "grey"
                                                              : "#1c90ff",
                                                        }}
                                                        onClick={() => {
                                                          setAllData(nota);
                                                          setNota(nota.nota);
                                                          setMaterieId(
                                                            nota.materieId
                                                          );
                                                          setTip(nota.tip);
                                                          setDeleted(
                                                            nota?.delete
                                                          );
                                                          setAuthor(
                                                            nota.author || ""
                                                          );
                                                          setComentariu(
                                                            nota.comentariu
                                                          );
                                                          setId(nota.id);
                                                          setData(
                                                            new Date(nota.date)
                                                          );
                                                          setElevId2(e.id);
                                                          setOpen2(true);
                                                        }}
                                                      >
                                                        {audit === true ? (
                                                          <div
                                                            style={{
                                                              display: "flex",
                                                            }}
                                                          >
                                                            <p
                                                              style={{
                                                                fontSize:
                                                                  "18px",
                                                              }}
                                                            >
                                                              {nota.nota} /
                                                            </p>

                                                            <p
                                                              style={{
                                                                fontSize:
                                                                  "14px",
                                                                paddingTop:
                                                                  "5px",
                                                                color: "black",
                                                              }}
                                                            >
                                                              {" "}
                                                              {formatDate(
                                                                new Date(
                                                                  nota.date
                                                                )
                                                              )}
                                                            </p>
                                                          </div>
                                                        ) : (
                                                          nota.nota
                                                        )}
                                                      </p>
                                                    ))}
                                                </div>
                                                {(
                                                  gradesElevi?.[e.id]?.note ||
                                                  []
                                                ).find(
                                                  (n) =>
                                                    n.materieId === m.materie &&
                                                    n.tip === "examen_final"
                                                ) && (
                                                  <p
                                                    style={{
                                                      color:
                                                        (
                                                          gradesElevi?.[e.id]
                                                            ?.note || []
                                                        ).find(
                                                          (n) =>
                                                            n.materieId ===
                                                              m.materie &&
                                                            n.tip ===
                                                              "examen_final"
                                                        )?.delete === "waiting"
                                                          ? "grey"
                                                          : "purple",
                                                    }}
                                                    onClick={() => {
                                                      const nota = (
                                                        gradesElevi?.[e.id]
                                                          ?.note || []
                                                      ).find(
                                                        (n) =>
                                                          n.materieId ===
                                                            m.materie &&
                                                          n.tip ===
                                                            "examen_final"
                                                      );
                                                      setAllData(nota);
                                                      setNota(
                                                        nota.examen_final
                                                      );
                                                      setMaterieId(
                                                        nota.materieId
                                                      );
                                                      setTip(nota.tip);
                                                      setDeleted(nota.delete);
                                                      setAuthor(
                                                        nota.author || ""
                                                      );
                                                      setComentariu(
                                                        nota.comentariu
                                                      );
                                                      setId(nota.id);
                                                      setData(
                                                        new Date(nota.date)
                                                      );
                                                      setElevId2(e.id);
                                                      setOpen2(true);
                                                    }}
                                                  >
                                                    Ex.Final:
                                                    {
                                                      (
                                                        gradesElevi?.[e.id]
                                                          ?.note || []
                                                      ).find(
                                                        (n) =>
                                                          n.materieId ===
                                                            m.materie &&
                                                          n.tip ===
                                                            "examen_final"
                                                      ).examen_final
                                                    }
                                                  </p>
                                                )}
                                                {corigenta && (
                                                  <p
                                                    style={{
                                                      fontSize: "14px",
                                                      color: "delete =",
                                                      paddingTop: "5px",
                                                      borderTop:
                                                        "1px solid black",
                                                    }}
                                                  >
                                                    Media intiala:{" "}
                                                    {medie.medieInitiala}
                                                  </p>
                                                )}
                                                {corigenta && (
                                                  <p
                                                    style={{
                                                      fontSize: "14px",

                                                      paddingTop: "5px",
                                                      borderTop:
                                                        "1px solid black",
                                                      color:
                                                        nota?.delete ===
                                                        "waiting"
                                                          ? "grey"
                                                          : "purple",
                                                    }}
                                                    onClick={() => {
                                                      setAllData(nota);
                                                      setNota(
                                                        corigenta?.corigenta
                                                      );
                                                      setMaterieId(
                                                        corigenta?.materieId
                                                      );
                                                      setTip(corigenta?.tip);
                                                      setDeleted(nota.delete);
                                                      setAuthor(
                                                        corigenta?.author || ""
                                                      );
                                                      setComentariu(
                                                        corigenta?.comentariu
                                                      );
                                                      setId(corigenta?.id);
                                                      setData(
                                                        new Date(
                                                          corigenta?.date
                                                        )
                                                      );
                                                      setElevId2(e.id);
                                                      setOpen2(true);
                                                    }}
                                                  >
                                                    {medie.noteInsuficiente
                                                      ? "Medie neîncheiat:"
                                                      : "Media corigenta:"}{" "}
                                                    {corigenta.corigenta}
                                                  </p>
                                                )}
                                                <Space>
                                                  {materii
                                                    .find(
                                                      (ma) =>
                                                        ma.id === m?.materie
                                                    )
                                                    ?.numeMaterie?.includes(
                                                      "Educație fizică"
                                                    ) &&
                                                    e?.scutitMedical?.length >
                                                      0 &&
                                                    e?.scutitMedical?.length >
                                                      0 &&
                                                    (e?.dataExpirareMedical
                                                      ? new Date() <=
                                                        new Date(
                                                          e.dataExpirareMedical
                                                        )
                                                      : true) &&
                                                    e.scutitMedical !==
                                                      "nu" && (
                                                      <p
                                                        style={{
                                                          color: "red",
                                                          fontSize: "12px",
                                                        }}
                                                      >
                                                        -scutit medical conform{" "}
                                                        {e.scutitMedical}-
                                                      </p>
                                                    )}
                                                  {materii.find(
                                                    (ma) => ma.id === m?.materie
                                                  )?.numeMaterie ===
                                                    "Religie" &&
                                                    e?.religie?.length > 0 &&
                                                    e?.religie !== "da" && (
                                                      <p
                                                        style={{
                                                          color: "red",
                                                          fontSize: "12px",
                                                        }}
                                                      >
                                                        -retras religie conform{" "}
                                                        {e?.religie}-
                                                      </p>
                                                    )}
                                                  Medie:
                                                  {inchis ? (
                                                    <>
                                                      {edit !== inchis?.id ? (
                                                        <>
                                                          <p
                                                            style={{
                                                              border:
                                                                "1px solid purple",
                                                              width: "auto",
                                                              fontSize: "20px",
                                                              textAlign:
                                                                "center",
                                                              display: "flex",
                                                              justifyContent:
                                                                "center",
                                                            }}
                                                            onClick={() => {
                                                              if (
                                                                user.type ===
                                                                "admin"
                                                                //   ||
                                                                // user.id ===
                                                                //   classData.diriginte
                                                              )
                                                                setEdit(
                                                                  inchis?.id
                                                                );
                                                            }}
                                                          >
                                                            {
                                                              inchis.inchidere_medie
                                                            }
                                                          </p>
                                                        </>
                                                      ) : (
                                                        <div>
                                                          <p>
                                                            Vrei sa redeschizi
                                                            media?
                                                          </p>

                                                          <Button
                                                            danger
                                                            onClick={() => {
                                                              setEdit(null);
                                                            }}
                                                          >
                                                            Nu
                                                          </Button>
                                                          <Popconfirm
                                                            description={
                                                              <div
                                                                style={{
                                                                  width:
                                                                    "300px",
                                                                }}
                                                              >
                                                                Preciseaza
                                                                motivul
                                                                <br />
                                                                <input
                                                                  value={
                                                                    motivStergereMedie
                                                                  }
                                                                  style={{
                                                                    border:
                                                                      "1px solid grey",
                                                                    width:
                                                                      "80%",
                                                                    height:
                                                                      "50px",
                                                                  }}
                                                                  onChange={(
                                                                    e
                                                                  ) =>
                                                                    setMotivStergereMedie(
                                                                      e.target
                                                                        .value
                                                                    )
                                                                  }
                                                                />
                                                              </div>
                                                            }
                                                            onConfirm={async () => {
                                                              if (
                                                                motivStergereMedie.length ===
                                                                  0 ||
                                                                motivStergereMedie ==
                                                                  ""
                                                              ) {
                                                                openErrorNotification(
                                                                  "Trebuie sa precisezi un motiv"
                                                                );
                                                                return;
                                                              }
                                                              let now =
                                                                new Date();
                                                              let onejan =
                                                                new Date(
                                                                  now.getFullYear(),
                                                                  0,
                                                                  1
                                                                );
                                                              let week =
                                                                Math.ceil(
                                                                  ((now.getTime() -
                                                                    onejan.getTime()) /
                                                                    86400000 +
                                                                    onejan.getDay() +
                                                                    1) /
                                                                    7
                                                                );
                                                              let changelogGet =
                                                                await getDataDoc(
                                                                  "changelog",
                                                                  classData.id +
                                                                    "week" +
                                                                    week
                                                                );
                                                              let previous = [];
                                                              if (changelogGet)
                                                                previous =
                                                                  changelogGet;

                                                              await updateDocDatabase(
                                                                "changelog",
                                                                classData.id +
                                                                  "week" +
                                                                  week,
                                                                {
                                                                  changelog: [
                                                                    ...(previous.changelog ||
                                                                      []),
                                                                    {
                                                                      author:
                                                                        user.displayName,
                                                                      time: Date.now(),
                                                                      classId:
                                                                        classData.id,
                                                                      materieId:
                                                                        inchis.materieId,
                                                                      motiv:
                                                                        "Am redeschis media pentru că: " +
                                                                        motivStergereMedie,
                                                                      elevId:
                                                                        e.id,
                                                                      nota: {
                                                                        tip: "inchidere_medie",
                                                                        inchidere_medie:
                                                                          inchis.inchidere_medie,
                                                                        materieId:
                                                                          inchis.materieId,
                                                                      },
                                                                      sterge: true,
                                                                    },
                                                                  ],
                                                                }
                                                              );

                                                              setMotivStergereMedie(
                                                                ""
                                                              );

                                                              await updateDocDatabase(
                                                                "catalog",
                                                                e.id,
                                                                {
                                                                  note: [
                                                                    ...(
                                                                      gradesElevi?.[
                                                                        e.id
                                                                      ]?.note ||
                                                                      []
                                                                    ).filter(
                                                                      (n) =>
                                                                        n.id !==
                                                                        inchis.id
                                                                    ),
                                                                  ],
                                                                }
                                                              ).then(() => {
                                                                openSuccesNotification(
                                                                  "Ai redeschis media"
                                                                );
                                                              });
                                                              setOpen(false);
                                                              setEdit(null);
                                                            }}
                                                          >
                                                            <Button type="primary">
                                                              DA
                                                            </Button>
                                                          </Popconfirm>
                                                        </div>
                                                      )}
                                                    </>
                                                  ) : (
                                                    <>
                                                      {corigenta ? (
                                                        <p
                                                          style={{
                                                            color: "green",
                                                            textAlign: "center",
                                                            fontSize: "20px",
                                                          }}
                                                          onClick={() => {
                                                            setAllData(nota);
                                                            setNota(
                                                              corigenta?.corigenta
                                                            );
                                                            setMaterieId(
                                                              corigenta?.materieId
                                                            );
                                                            setTip(
                                                              corigenta?.tip
                                                            );
                                                            setDeleted(
                                                              nota?.delete
                                                            );
                                                            setAuthor(
                                                              corigenta?.author ||
                                                                ""
                                                            );
                                                            setComentariu(
                                                              corigenta?.comentariu
                                                            );
                                                            setId(
                                                              corigenta?.id
                                                            );
                                                            setData(
                                                              new Date(
                                                                corigenta?.date
                                                              )
                                                            );
                                                            setElevId2(e.id);
                                                            setOpen2(true);
                                                          }}
                                                        >
                                                          {corigenta.corigenta}
                                                        </p>
                                                      ) : (
                                                        <p
                                                          style={{
                                                            fontSize: "30px",
                                                            textAlign: "center",
                                                            display: "flex",
                                                            justifyContent:
                                                              "center",
                                                          }}
                                                        >
                                                          {medie.medie}
                                                        </p>
                                                      )}
                                                    </>
                                                  )}
                                                </Space>
                                              </CatalogTabel.Cell>
                                              <CatalogTabel.Cell>
                                                <div
                                                  style={{
                                                    display: "grid",

                                                    gridTemplateColumns:
                                                      "auto auto ",
                                                  }}
                                                >
                                                  {gradesElevi?.[
                                                    e.id
                                                  ]?.absente?.absente_dupa_motivari
                                                    .filter(
                                                      (abs) =>
                                                        abs.materieId ===
                                                        m.materie
                                                    )
                                                    ?.map((nota) => {
                                                      let date = new Date(
                                                        nota.date
                                                      );
                                                      return nota.motivat ===
                                                        false ? (
                                                        <p
                                                          style={{
                                                            fontSize: "15px",
                                                            color:
                                                              nota?.delete ===
                                                              "waiting"
                                                                ? "grey"
                                                                : "red",
                                                          }}
                                                          onClick={() => {
                                                            setAllData(nota);
                                                            setId(nota.id);
                                                            setMaterieId(
                                                              nota.materieId
                                                            );
                                                            setTip(nota.tip);
                                                            setDeleted(
                                                              nota?.delete
                                                            );
                                                            setAuthor(
                                                              nota.author || ""
                                                            );
                                                            setComentariu(
                                                              nota.comentariu
                                                            );
                                                            setData(
                                                              new Date(
                                                                nota.date
                                                              )
                                                            );
                                                            setElevId2(e.id);
                                                            setEntity(nota);
                                                            setOpen2(true);
                                                          }}
                                                        >
                                                          {formatDate(date)}
                                                        </p>
                                                      ) : (
                                                        <p
                                                          style={{
                                                            fontSize: "15px",

                                                            border:
                                                              nota?.scutire
                                                                ?.tip ===
                                                              "bilet"
                                                                ? "2.5px solid #a3eb07"
                                                                : "1px solid green",

                                                            borderStyle:
                                                              nota?.scutire
                                                                ?.tip ===
                                                              "bilet"
                                                                ? "dotted"
                                                                : "solid",

                                                            wordBreak:
                                                              "keep-all",
                                                            borderRadius: "2px",
                                                            maxWidth: "40px",
                                                            color:
                                                              nota?.delete ===
                                                              "waiting"
                                                                ? "grey"
                                                                : "green",
                                                          }}
                                                          onClick={() => {
                                                            setAllData(nota);
                                                            setMaterieId(
                                                              nota.materieId
                                                            );
                                                            setTip(nota.tip);
                                                            setDeleted(
                                                              nota?.delete
                                                            );

                                                            setAuthor(
                                                              nota.author || ""
                                                            );
                                                            setId(nota.id);
                                                            setComentariu(
                                                              nota.comentariu
                                                            );
                                                            setData(
                                                              new Date(
                                                                nota.date
                                                              )
                                                            );
                                                            setElevId2(e.id);
                                                            setOpen2(true);
                                                            setEntity(nota);
                                                          }}
                                                        >
                                                          {formatDate(date)}
                                                        </p>
                                                      );
                                                    })}
                                                </div>
                                              </CatalogTabel.Cell>
                                            </CatalogTabel.Row>
                                          </CatalogTabel.Body>
                                        </CatalogTabel>
                                      </CatalogTabel.Cell>
                                    );
                                  })}
                                </CatalogTabel.Row>
                              </CatalogTabel.Body>
                            </CatalogTabel>
                          );
                        })}
                      </Accordion.Content>
                    </Accordion>
                  </CatalogTabel.Cell>
                  {permision === true && (
                    <CatalogTabel.Cell style={{ textAlign: "center" }}>
                      {true === true ? (
                        <p style={{ textAlign: "center" }}>
                          Absențe
                          <br />{" "}
                          <p style={{ padding: 0, margin: 0 }}>
                            Total:
                            {
                              gradesElevi?.[e.id]?.absente
                                ?.absente_dupa_motivari?.length
                            }
                          </p>
                          <p style={{ color: "green", padding: 0, margin: 0 }}>
                            Motivate:
                            {
                              gradesElevi?.[e.id]?.absente?.absente_motivate
                                .length
                            }
                          </p>
                          <p style={{ color: "red", padding: 0, margin: 0 }}>
                            Nemotivate:
                            {
                              gradesElevi?.[e.id]?.absente.absente_nemotivate
                                .length
                            }
                          </p>
                        </p>
                      ) : (
                        <p
                          style={{
                            color: "red",
                            textAlign: "center",
                          }}
                        >
                          Abs
                          <br />{" "}
                          {
                            gradesElevi?.[e.id]?.absente.absente_nemotivate
                              .length
                          }
                        </p>
                      )}
                      <p style={{ textAlign: "center" }}>
                        Medie <br />
                        {calculare_medii(
                          gradesElevi?.[e.id]?.note || [],
                          materii,
                          scutiri[e.id]
                        )}
                        <br />
                        {e?.retreas !== true && (
                          <Popup
                            content={
                              <div>
                                Materii cu media deschisa:
                                <br />
                                {materiiCuMediaDeschisa?.map(
                                  (m) =>
                                    materii?.find((ma) => ma.id === m.materie)
                                      ?.numeMaterie + "; "
                                )}
                              </div>
                            }
                            on="click"
                            trigger={
                              <BS
                                content="Materii deschise"
                                style={{ fontSize: "10px" }}
                              />
                            }
                          />
                        )}
                      </p>
                    </CatalogTabel.Cell>
                  )}
                </CatalogTabel.Row>
              );
            })}
        </CatalogTabel.Body>
      </CatalogTabel>
    </>
  );
}

export default withErrorBoundary(Catalog);
