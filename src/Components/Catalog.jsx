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
import { saveAs } from "file-saver";
import template from "./instiintare parinti 2024 completat.docx";
import CatalogPrint from "./CatalogPrint";
import {
  useWindowSize,
  useWindowWidth,
  useWindowHeight,
} from "@react-hook/window-size";
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
  const auditRef2 = useRef();
  const [profileElevi, setProfileElevi] = useState({});
  const [sumar, setSumar] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const banned = [
    "Teorie-solfegiu-dicteu",
    "Armonie",
    "Etnografie și folclor muzical",
    "Forme muzicale",
    "Muzică vocală tradițională românească",
    "Artă vocală interpretativă",
    "Corepetiție",
    "Instrument principal - Pian",
    "Instrument principal - Vioară",
    "Instrument principal - Chitară",
    "Instrument principal - Clarinet",
    "Instrument principal - Flaut",
    "Instrument principal - Contrabas",
    "Pian complementar",
    "Instrument la alegere - Vioară",
    "Instrument la alegere - Chitară",
    "Instrument la alegere - Clarinet",
    "Instrument la alegere - Flaut",
    "Instrument la alegere - Contrabas",
    "Instrument auxiliar - Vioară",
    "Instrument auxiliar - Chitară",
    "Instrument auxiliar - Clarinet",
    "Instrument auxiliar - Flaut",
    "Ansamblu coral/Ansamblu instrumental",
    "Acompaniament",
    "Ansamblu orchestral/Ansamblu instrumental/coral",
    "Ansamblu folcloric",
    "Muzică de cameră",
  ];

  const pref = [
    "Limba și literatura română",
    "Limba Engleză",
    "Limba Italiană",
    "Matematică",
    "Fizică",
    "Chimie",
    "Biologie",
    "Istorie",
    "Geografie",
    "Logică",
    "Religie",
    "Arte vizuale și abilități practice",
    "Educație fizică",
    "Teorie-solfegiu-dicteu",
    "Tehnologia informației și a comunicațiilor",
    "Etnografie și folclor muzical",
    "Muzică vocală tradițională românească",
    "Instrument la alegere - Vioară",
    "Instrument la alegere - Chitară",
    "Instrument la alegere - Clarinet",
    "Instrument la alegere - Flaut",
    "Instrument la alegere - Contrabas",
    "Corepetiție",
    "Ansamblu folcloric",
    "Istoria Muzicii",
    "Psihologie",
    "Educație Anteprenorială",
    "Economie",
    "Armonie",
    "Forme muzicale",
    "Muzică de cameră",
    "Consiliere și orientare / Purtare",
  ];
  const handlePrint = useReactToPrint({
    content: () => auditRef.current,
  });
  const handlePrint2 = useReactToPrint({
    content: () => auditRef2.current,
  });

  async function generateDocument(resume, templatePath) {
    try {
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.arrayBuffer();

      if (data.byteLength === 0) {
        throw new Error("Template data is empty!");
      }

      let zip;
      try {
        zip = new PizZip(data);
      } catch (error) {
        throw new Error("Error reading ZIP data: " + error.message);
      }

      let templateDoc;
      try {
        templateDoc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });
      } catch (error) {
        throw new Error("Error loading docxtemplater: " + error.message);
      }

      templateDoc.render(resume);

      const base64 = templateDoc.getZip().generate({
        type: "base64",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      return base64;
    } catch (error) {
      console.error("Error generating document: " + error.message);
      return null;
    }
  }

  const styleD = () => {
    if (onlyWidth < 700) return "auto";
    if (onlyWidth < 1000) return "auto auto ";
    if (onlyWidth < 1200) return "auto auto auto ";
    return "auto auto auto  ";
  };

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
  const exportToExcel = () => {
    const worksheetData = [];

    // Determinăm numărul maxim de note
    let maxNotes = 0;
    eleviData.forEach((elev) => {
      const noteElev = gradesElevi?.[elev.id]?.note?.filter(
        (n) =>
          n.tip === "nota" &&
          new Date(n.date) <= new Date("2024/12/21") &&
          classData.materii.find((m) => m.materie === n.materieId)
      );
      maxNotes = Math.max(maxNotes, noteElev?.length || 0);
    });

    // Header row
    const headerRow = [
      "Elev",
      ...Array.from({ length: maxNotes }, (_, i) => `Nota ${i + 1}`),
    ];
    worksheetData.push(headerRow);

    // Data rows
    eleviData
      .sort((a, b) => a?.nume?.localeCompare(b.nume, "ro"))
      .forEach((elev) => {
        const row = [elev.nume];
        const noteElev =
          gradesElevi?.[elev.id].note
            .filter(
              (n) =>
                n.tip === "nota" &&
                new Date(n.date) <= new Date("2024/12/21") &&
                classData.materii.find((m) => m.materie === n.materieId)
            )
            .sort((a, b) =>
              classData.materii.findIndex((m) => m.materie === a.materieId) <
              classData.materii.findIndex((m) => m.materie === b.materieId)
                ? -1
                : classData.materii.findIndex(
                    (m) => m.materie === a.materieId
                  ) ===
                  classData.materii.findIndex((m) => m.materie === b.materieId)
                ? a.date - b.date
                : 1
            )
            ?.filter(
              (n) =>
                n.tip === "nota" &&
                new Date(n.date) <= new Date("2024/12/21") &&
                new Date(n.date) >= new Date("2024/09/09") &&
                classData.materii.find((m) => m.materie === n.materieId)
            ) || [];
        let total = 0;
        let count = 0;

        // Adăugăm notele elevului
        noteElev.forEach((nota) => {
          row.push(nota.nota);
        });

        // Completăm cu 0 dacă numărul de note este mai mic decât `maxNotes`
        for (let i = noteElev.length; i < maxNotes; i++) {
          row.push("");
        }

        worksheetData.push(row);
      });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Catalog");
    XLSX.writeFile(workbook, `Catalog ${renderClassName(classData)}.xlsx`);
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
      {/* <Button
        onClick={async () => {
          //DANGER, aceasta secventa de cod trebuie dusa la upgrade
          let cnt = 0;
          for await (let elev of classData.elevi) {
            let elevId = elev.id;


            let elevData = await getDataDoc("elevi", elevId);
            if (elevData.retras === true) continue;
            let globalMotivate = [];

            gradesElevi?.[elevId]?.note

              ?.filter((n) => n.tip === "absenta")
              .forEach((nota) => {
                if (
                  (scutiri[elevId] || [])?.find(
                    (scut) =>
                      scut.interval[0] <= nota.date &&
                      scut.interval[1] >= nota.date
                  ) &&
                  (scutiri[elevId] || [])?.find(
                    (scut) =>
                      scut.interval[0] <= nota.date &&
                      scut.interval[1] >= nota.date &&
                      scut.tip_scutire !== "bilet"
                  ) === undefined &&
                  globalMotivate.length < Limit
                )
                  globalMotivate.push(nota);
              });

            let nrNemotivate = (gradesElevi?.[elevId]?.note || []).filter((n) => {
              let motivat = false;

              if (n.tip !== "absenta") return false;
              let scutiriElev = scutiri[elev.id];

              if (
                (scutiriElev || [])?.find(
                  (scut) =>
                    scut.interval[0] <= n?.date &&
                    scut.interval[1] >= n?.date &&
                    scut.tip_scutire !== "bilet"
                ) ||
                globalMotivate.find((nota1) => nota1 == n)
              )
                motivat = true;

              return motivat === false && n.tip === "absenta";
            }).length;
            let nrMotivate = (gradesElevi?.[elevId]?.note || []).filter((n) => {
              let motivat = false;

              if (n.tip !== "absenta") return false;
              let scutiriElev = scutiri[elev.id];

              if (
                (scutiriElev || [])?.find(
                  (scut) =>
                    scut.interval[0] <= n?.date &&
                    scut.interval[1] >= n?.date &&
                    scut.tip_scutire !== "bilet"
                ) ||
                globalMotivate.find((nota1) => nota1 == n)
              )
                motivat = true;

              return motivat === true && n.tip === "absenta";
            }).length;

            let classData = await getDataDoc("claseData", elevData.clasa);
            let nrElevi = classData.elevi.length;
            let medii = [];

            function sortFloat(a, b) {
              return b - a;
            }
            medii.sort(sortFloat);
            for await (let e of classData.elevi) {
              medii.push(
                parseFloat(calculare_medii(gradesElevi?.[e.id]?.note || []),materii,scutiriElev[e.id])
              );
            }
            medii.sort(sortFloat);
            function findElementPosition(arr, element) {
              // Găsește indexul elementului în array (0-based)
              const index = arr.indexOf(element);

              // Dacă elementul este găsit, returnează poziția 1-based, altfel returnează -1
              return index === -1 ? -1 : index + 1;
            }
            
            let resume = {
              nume: elevData.numeDeFamilie,
              prenume: elevData.prenume,
              class: classData.anClasa + classData.identificator,
              profil:
                classData.identificator === "B" ? "PEDAGOGIC" : "ARTISTIC",
              medie:
                classData.anClasa <= 4
                  ? ""
                  : calculare_medii(gradesElevi?.[elevId]?.note || [],materii, scutiriElev[elevId]),
              total_absente: nrMotivate + nrNemotivate,
              nemotivate: nrNemotivate,
              motivate: nrMotivate,
              diriginte:
                profesori.find((p) => p.id === classData.diriginte)
                  .numeDeFamilie +
                " " +
                profesori.find((p) => p.id === classData.diriginte).prenume,
              place: findElementPosition(
                medii,
                parseFloat(calculare_medii(gradesElevi?.[elevId]?.note || []))
              ),
              nr_elevi: nrElevi,
              discipline: (gradesElevi?.[elevId]?.note || [])
                .filter((n) => n.tip === "inchidere_medie")
                .filter(
                  (n) =>
                    n.inchidere_medie < 8 ||
                    n.inchidere_medie === "S" ||
                    n.inchidere_medie === "I"
                )
                .reduce((acc, n) => {
                  return (
                    acc +
                    materii?.find((materie) => materie.id === n.materieId)?.numeMaterie +
                    ", "
                  );
                }, "")
                ?.slice(0, -2),
            };

            let to = [elevData.adresaEmail, ...(elevData.parintii || [])];
            let doc = await generateDocument(resume, template);

            setTimeout(async () => {
              await updateDocDatabase(
                "mail",
                "instiintare" + String(Date.now()),
                {
                  to: to,
                  message: {
                    subject:
                      "Înștiințare privind situaţia la învățătură în anul şcolar 2023-2024. ",

                    text:
                      "Bună ziua, vă lăsăm ca atașament situația la învățătură a elevului " +
                      elevData.numeDeFamilie +
                      " " +
                      elevData.prenume +
                      " " +
                      "în anul şcolar 2023-2024.",
                    attachments: [
                      {
                        content: doc,
                        filename: `${elevData.numeDeFamilie} ${elevData.prenume} instiintare.docx`,
                        disposition: "attachment",
                        encoding: "base64",
                        contentId: "mydocument",
                      },
                    ],
                  },
                }
              );
            }, [cnt * 5000]);
            cnt++;
          }
        }}
      >
        Trimite email-uri
      </Button> */}
      {/* {inchideMediiAutomat === false && (
        <Button
          onClick={() => {
            setInchideMediiAutomat(true);
          }}
        >
          Inchide medii automat
        </Button>
      )} */}

      {user.type === "admin" && (
        <Button
          onClick={() => {
            setAudit(true);
            // handlePrint();
          }}
          type="primary"
          danger
        >
          Avansat
        </Button>
      )}

      {audit === true && (
        <>
          <br />
          <br />
          <Select
            mode="multiple"
            showSearch
            placeholder="Materii Alese"
            style={{ minWidth: "80%" }}
            optionFilterProp="children"
            value={activeMaterii}
            onChange={(value) => {
              setActiveMaterii(value);
            }}
            filterOption={(input, option) =>
              (option?.label?.toLowerCase() ?? "").includes(input.toLowerCase())
            }
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
            options={classData?.materii?.map((m) => {
              return {
                label: materii.find((ma) => ma.id === m.materie)?.numeMaterie,
                value: m.materie,
              };
            })}
          />
          <div
            ref={auditRef}
            style={{ textAlign: "center", paddingTop: "100px" }}
          >
            <h2>Clasa: {renderClassName(classData)}</h2>
            {eleviData.filter((e) => {
              if (e.mutat === true || e.retras === true) return false;
              if (
                gradesElevi?.[e.id]?.absente?.absente_dupa_motivari?.length >
                Math.floor(
                  ((classData.ore.length - 1) *
                    Math.floor(
                      (new Date() - new Date("2024-09-09")) /
                        (1000 * 60 * 60 * 24 * 7)
                    ) -
                    1) /
                    5
                )
              )
                return true;
              else return false;
            }).length > 0 && (
              <>
                {" "}
                <h3 style={{ textAlign: "center" }}>
                  Elevii care au absentat mai mult de 20%
                </h3>
                {eleviData
                  .filter((e) => {
                    if (e.mutat === true || e.retras === true) return false;

                    if (
                      gradesElevi?.[e.id]?.absente?.absente_dupa_motivari
                        ?.length >
                      Math.floor(
                        ((classData.ore.length - 2) *
                          Math.floor(
                            (new Date() - new Date("2024-09-09")) /
                              (1000 * 60 * 60 * 24 * 7)
                          ) -
                          1) /
                          5
                      )
                    )
                      return true;
                    else return false;
                  })
                  .sort((a, b) => {
                    return a?.nume?.localeCompare(b.nume, "ro");
                  })

                  .map((e, index) => {
                    return (
                      <p>
                        {e.nume} :{" "}
                        {
                          gradesElevi?.[e.id]?.absente?.absente_dupa_motivari
                            .length
                        }{" "}
                        absente
                      </p>
                    );
                  })}
              </>
            )}
            <h3 style={{ textAlign: "center" }}>
              Elevii care au prea putine note
            </h3>
            {eleviData
              .filter((e) => {
                if (e.mutat === true || e.retras === true) return false;
                return true;
              })
              .sort((a, b) => {
                return a?.nume?.localeCompare(b.nume, "ro");
              })

              .map((e, index) => {
                let profesoriDeVerificat = profesori.filter((p) => {
                  return (
                    (p?.ore || [])?.find(
                      (o) =>
                        o.classId === classData.id &&
                        !o?.rule?.includes("COUNT")
                    ) || (p?.orePrivat || []).find((o) => o.elev === e.id)
                  );
                });

                let profesoriVinovati = profesoriDeVerificat.filter(
                  (profesorData) => {
                    if (
                      (profesorData.selectedMaterii.find((m) =>
                        m.includes("RP")
                      ) &&
                        (!e.religie || e.religie === "da")) ||
                      (profesorData.selectedMaterii.find((m) =>
                        m.includes("Religie")
                      ) &&
                        e.religie !== "da" &&
                        e?.religie?.length > 0)
                    )
                      return false;
                    let note = gradesElevi?.[e.id]?.note
                      .filter((n) => n.tip === "nota")
                      .filter(
                        (n) =>
                          n.author === profesorData.displayName ||
                          n.authorId === profesorData.id ||
                          n.author === profesorData.id ||
                          n.materieId ===
                            (profesorData?.ore || [])?.find(
                              (o) =>
                                o.classId === classData.id &&
                                !o?.rule?.includes("COUNT")
                            )?.materieId
                      );

                    if (note.length === 0) {
                      return true;
                    }
                  }
                );
                if (profesoriVinovati.length === 0) return <></>;
                return (
                  <div>
                    {profesoriVinovati.map((p) => {
                      return (
                        <p>
                          {e.nume} :{p.displayName}
                        </p>
                      );
                    })}
                  </div>
                );
              })}
          </div>
          <Button
            onClick={() => {
              handlePrint();
            }}
          >
            Descarcă
          </Button>
        </>
      )}
      {inchideMediiAutomat === true &&
        classData?.materii
          ?.filter((m) => {
            if (user.type === "admin") return true;
            if (m?.profesori?.find((p) => p === user.id) || !m?.profesori)
              return true;
            return false;
          })
          ?.map((matID) => {
            return materii?.find((ma) => ma.id === matID.materie);
          })
          .filter(
            (m) => m.notare === true && !banned.find((a) => a === m.numeMaterie)
          )
          .map((materie) => {
            return (
              <Popconfirm
                onConfirm={() => {
                  eleviData.forEach(async (elev) => {
                    let elevId = elev.id;
                    let notaFinala = "";
                    let materieId = materie.id;

                    if (
                      (gradesElevi?.[elevId]?.note || [])?.find(
                        (n) =>
                          n.materieId === materieId &&
                          n.tip === "inchidere_medie"
                      )
                    )
                      return;
                    let sum = (gradesElevi?.[elevId]?.note || [])
                      .filter(
                        (n) => n.materieId === materieId && n.tip === "nota"
                      )
                      .reduce((acc, curent) => {
                        return acc + curent.nota;
                      }, 0);

                    if (sum === 0 || elev?.retras === true) return;
                    let medieFinala = 0;
                    if (
                      (gradesElevi?.[elevId]?.note || [])?.find(
                        (n) =>
                          n.materieId === materieId && n.tip === "examen_final"
                      ) === undefined
                    ) {
                      medieFinala = Math.round(
                        sum /
                          (gradesElevi?.[elevId]?.note || []).filter(
                            (n) => n.materieId === materieId && n.tip === "nota"
                          )?.length || 1
                      );
                    } else if (
                      (gradesElevi?.[elevId]?.note || [])?.find(
                        (n) =>
                          n.materieId === materieId && n.tip === "examen_final"
                      )
                    ) {
                      let ef = (gradesElevi?.[elevId]?.note || [])?.find(
                        (n) =>
                          n.materieId === materieId && n.tip === "examen_final"
                      ).examen_final;

                      medieFinala = Math.round(
                        sum /
                          (gradesElevi?.[elevId]?.note || [])?.filter(
                            (n) => n.materieId === materieId && n.tip === "nota"
                          )?.length || 1
                      );

                      medieFinala =
                        Math.round(
                          (((parseFloat(medieFinala) + parseFloat(ef)) / 2) *
                            1000) /
                            10
                        ) / 100;
                    }
                    if (sum === 0) medieFinala = undefined;
                    notaFinala = medieFinala;
                    let updateObj = {
                      date: Date.now(),

                      id: Date.now() + "dd",
                      comentariu: "",
                      materieId: materie.id,
                      author: user.displayName,
                      displayName: user.numeDeFamilie + " " + user.prenume,
                      photoURL: user.photoLink || "",
                      tip: "inchidere_medie",
                      inchidere_medie: notaFinala,
                    };
                    await updateDocDatabase("catalog", elevId, {
                      note: [
                        ...(gradesElevi?.[elevId]?.note || []),
                        {
                          ...updateObj,
                        },
                      ],
                    });

                    let now = new Date();
                    let onejan = new Date(now.getFullYear(), 0, 1);
                    let week = Math.ceil(
                      ((now.getTime() - onejan.getTime()) / 86400000 +
                        onejan.getDay() +
                        1) /
                        7
                    );

                    let changelogGet = await getDataDoc(
                      "changelog",
                      classData.id + "week" + week
                    );
                    let previous = [];
                    if (changelogGet) previous = changelogGet;
                    await updateDocDatabase(
                      "changelog",
                      classData.id + "week" + week,
                      {
                        changelog: [
                          ...(previous.changelog || []),
                          {
                            author: user.displayName,
                            time: Date.now(),
                            classId: classData.id,
                            elevId,
                            nota: updateObj,
                          },
                        ],
                      }
                    );
                    let dataElev = elev;
                    await updateDocDatabase("mail", elevId + Date.now(), {
                      to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
                      message: {
                        subject:
                          dataElev.numeDeFamilie +
                          " " +
                          dataElev.prenume +
                          " a primit inchidere de medie  ",

                        html: `<code>
                      <head>
           <style>
           table {
            font-family: arial, sans-serif;
            border-collapse: collapse;
            width: 100%;
          }
          
          td, th {
            border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;
          }
          
          tr:nth-child(even) {
            background-color: #dddddd;
          }
           </style>
          </head>
          <body>
                      <table style="font-family: arial, sans-serif; border-collapse: collapse; width: 100%;">
                      <tr>
                        <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Nume</th>
                        <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Materie</th>
                        <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Data</th>
                        <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Medie Materie</th>
                        <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Detalii</th>
                      </tr>
                      <tr>
                        <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                          dataElev.numeDeFamilie + " " + dataElev.prenume
                        }</td>
                        <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                          materii?.find((ma) => ma.id === materieId).numeMaterie
                        }</td>
                        
                        <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${new Date().toLocaleDateString(
                          "ro-RO"
                        )}</td>
                        <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${notaFinala}</td>
                        <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;"></td>
                      </tr>
                      
                    </table>
                    </body></code>`,
                      },
                    });
                  });

                  openSuccesNotification("Ai inchis toate mediile!");
                }}
                description="Confirm că am verificat toate mediile că sunt calculate corect."
              >
                <Button style={{ marginLeft: "2px" }}>
                  Inchide toate mediile la {materie?.numeMaterie}
                </Button>
              </Popconfirm>
            );
          })}

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
              if (process.env.REACT_APP_NAME !== "LMTJ") return true;
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
                if (new Date() < new Date("2025-05-01")) return true;
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

                    {new Date() > new Date("2024-10-01") &&
                      (user.type === "admin" ||
                        (user.id || user.uid) === classData.diriginte) &&
                      gradesElevi?.[e.id]?.absente?.absente_dupa_motivari
                        .length >
                        Math.floor(
                          (classData.ore.length *
                            Math.floor(
                              (new Date() - new Date("2024-09-09")) /
                                (1000 * 60 * 60 * 24 * 7)
                            )) /
                            5
                        ) &&
                      classData?.ore?.length > 0 && (
                        <>
                          {" "}
                          <p style={{ color: "red", fontSize: "15px" }}>
                            Elevul a absentat la mai mult de 20% din ore
                          </p>
                        </>
                      )}
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
                                                //activeaza doar daca vrei sa arati ca nu sunt suficiente note
                                                // (
                                                //   gradesElevi?.[e.id]?.note ||
                                                //   []
                                                // ).filter(
                                                //   (n) =>
                                                //     n.tip === "nota" &&
                                                //     n.materieId === m.materie
                                                // ).length > 0 &&
                                                // (
                                                //   gradesElevi?.[e.id]?.note ||
                                                //   []
                                                // ).filter(
                                                //   (n) =>
                                                //     n.tip === "nota" &&
                                                //     n.materieId === m.materie
                                                // ).length < 4 &&
                                                // (
                                                //   gradesElevi?.[e.id]?.note ||
                                                //   []
                                                // ).filter(
                                                //   (n) =>
                                                //     n.tip === "corigenta" &&
                                                //     n.materieId === m.materie
                                                // ).length === 0
                                                //   ? "#eb9371"
                                                //   : "unset",
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

      {window.screen.width > 750 && user.type === "admin" && (
        <Button
          onClick={() => {
            setDisplay(true);
            //handlePrint();
          }}
          type="primary"
          danger
        >
          Printează
        </Button>
      )}
      <Button
        onClick={() => {
          setSumar(true);
        }}
      >
        Genereaza Sumar clasa
      </Button>

      {sumar === true && (
        <>
          <div style={{ display: "none" }}>
            <div ref={auditRef2} className="print">
              {" "}
              <div style={{ pageBreakAfter: "always" }}>
                <br /> <br />
                <br />
                <br />
                <br />
                <h1 style={{ textAlign: "center" }}>
                  Catalogul clasei{" "}
                  {classData?.anClasa + " " + classData?.identificator}
                </h1>
                <h4 style={{ textAlign: "center" }}>
                  Instituție școlară: {settings?.numeInstitutie}
                  <br />
                  Anul școlar 2024-2025
                  <br />
                  Diriginte/Învățător:{" "}
                  {profesori?.find((p) => p.id === classData?.diriginte)
                    ?.numeDeFamilie +
                    " " +
                    profesori?.find((p) => p.id === classData?.diriginte)
                      ?.prenume}
                  <br />
                </h4>
                <h5 style={{ paddingLeft: "50px" }}>
                  Materii înscrise în catalog
                </h5>
                <table border="1" style={{ width: "90%", marginLeft: "5%" }}>
                  <thead>
                    <tr>
                      <th>Materie</th>
                      <th>Profesori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classData?.materii.map((m) => {
                      return (
                        <tr
                          style={{
                            pageBreakInside: "avoid",
                            pageBreakAfter: "auto",
                          }}
                        >
                          <td>
                            <p style={{ paddingLeft: "10px" }}>
                              {
                                materii?.find((ma) => ma.id === m.materie)
                                  ?.numeMaterie
                              }
                            </p>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "auto auto  ",
                                paddingLeft: "10px",
                                pageBreakInside: "avoid",
                                pageBreakAfter: "auto",
                              }}
                            >
                              {m?.profesori?.map((idp) => (
                                <p>
                                  {profesori?.find((p) => p.id === idp)
                                    ?.numeDeFamilie +
                                    " " +
                                    profesori?.find((p) => p.id === idp)
                                      ?.prenume}
                                </p>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <br />
                <br />
              </div>
              {eleviData
                .sort((a, b) => a?.nume?.localeCompare(b.nume, "ro"))
                .map((c) => {
                  return (
                    <div style={{ pageBreakBefore: "always" }}>
                      <h1
                        style={{ paddingTop: "30px", textAlign: "center" }}
                        className="sentry-mask"
                      >
                        {c.numeDeFamilie + " " + c.initiala + " " + c.prenume}
                      </h1>
                      <h2>{profileElevi?.[c.id]?.cnp}</h2>
                      <div style={{ padding: "20px" }}>
                        <CatalogElev
                          elevIdPassed={c.id || c.idElev}
                          materiiLimited={
                            activeMaterii.length === 0 ? [] : activeMaterii
                          }
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <Button
            onClick={() => {
              handlePrint2();
            }}
          >
            Printeza Export Sumar
          </Button>
        </>
      )}
      <br />
      <br />

      {display === true && (
        <CatalogPrint classData={classData} mode="edit" permision={permision} />
      )}

      {/* {window.screen.width > 750 && (
            <Button
              onClick={async () => {
                await exportExcel(
                  eleviData
                    .sort((a, b) => {
                      return a?.nume?.localeCompare(b.nume, "ro");
                    })
                    .map((e, index) => {
                      // let nrNemotivate = (gradesElevi?.[e.id]?.note || []).filter(
                      //   (n) => {
                      //     let motivat = false;
                      //     if (n.tip !== "absenta") return false;
                      //     let scutiriElev = scutiri[e.id];

                      //     if (
                      //       (scutiriElev || [])?.find(
                      //         (scut) =>
                      //           new Date(scut.interval[0]) <=
                      //             new Date(n?.date) &&
                      //           new Date(scut.interval[1]) >= new Date(n?.date)
                      //       )
                      //     )
                      //       motivat = true;

                      //     return motivat === false && n.tip === "absenta";
                      //   }
                      // ).length;
                      // let nrMotivate = (gradesElevi?.[e.id]?.note || []).filter(
                      //   (n) => {
                      //     let motivat = false;
                      //     if (n.tip !== "absenta") return false;
                      //     let scutiriElev = scutiri[e.id];

                      //     if (
                      //       (scutiriElev || [])?.find(
                      //         (scut) =>
                      //           new Date(scut.interval[0]) <=
                      //             new Date(n?.date) &&
                      //           new Date(scut.interval[1]) >= new Date(n?.date)
                      //       )
                      //     )
                      //       motivat = true;

                      //     return motivat === true && n.tip === "absenta";
                      //   }
                      // ).length;
                      // let nrtotal = (gradesElevi?.[e.id]?.note || []).filter(
                      //   (n) => {
                      //     let motivat = false;
                      //     if (n.tip !== "absenta") return false;
                      //     let scutiriElev = scutiri[e.id];

                      //     if (
                      //       (scutiriElev || [])?.find(
                      //         (scut) =>
                      //           new Date(scut.interval[0]) <=
                      //             new Date(n?.date) &&
                      //           new Date(scut.interval[1]) >= new Date(n?.date)
                      //       )
                      //     )
                      //       motivat = true;

                      //     return n.tip === "absenta";
                      //   }
                      // ).length;
                      return {
                        Nume: e.nume,
                        ...classData?.materii
                          .sort((a, b) => {
                            if (
                              pref.findIndex(
                                (x) =>
                                  x ===
                                  materii?.find((m) => m.id === a.materie)?.numeMaterie
                              ) === -1
                            )
                              return 1;
                            if (
                              pref.findIndex(
                                (x) =>
                                  x ===
                                  materii?.find((m) => m.id === a.materie)?.numeMaterie
                              ) <
                              pref.findIndex(
                                (x) =>
                                  x ===
                                  materii?.find((m) => m.id === b.materie)?.numeMaterie
                              )
                            )
                              return -1;
                            return 1;
                          })
                          .reduce((obj, m) => {
                            let inchis = (gradesElevi?.[e.id]?.note || []).find(
                              (n) =>
                                n.materieId === m.materie &&
                                n.tip === "inchidere_medie"
                            );
                            const materie = materii?.find(
                              (ma) => ma.id === m.materie
                            );
                            const calificative = {
                              FB: 1,
                              B: 2,
                              S: 3,
                              I: 4,
                            };
                            let freq = {};
                            let notaFinala = 0,
                              frv = 0;
                            if (materie?.notare === false) {
                              for (const num of (
                                gradesElevi?.[e.id]?.note || []
                              ).filter(
                                (n) =>
                                  n.materieId === m.materie && n.tip === "nota"
                              )) {
                                freq[calificative[num.nota]] = freq[
                                  calificative[num.nota]
                                ]
                                  ? freq[calificative[num.nota]] + 1
                                  : 1;
                              }

                              if (frv < freq[1]) {
                                frv = freq[1];
                                notaFinala = "FB";
                              }
                              if (frv < freq[2]) {
                                frv = freq[2];
                                notaFinala = "B";
                              }
                              if (frv < freq[3]) {
                                frv = freq[3];
                                notaFinala = "S";
                              }
                              if (frv < freq[4]) {
                                frv = freq[4];
                                notaFinala = "I";
                              }
                            }

                            let sum = (gradesElevi?.[e.id]?.note || [])
                              .filter(
                                (n) =>
                                  n.materieId === m.materie && n.tip === "nota"
                              )
                              .reduce((acc, curent) => {
                                return acc + curent.nota;
                              }, 0);
                            let medieFinala = 0;
                            if (
                              (gradesElevi?.[e.id]?.note || []).find(
                                (n) =>
                                  n.materieId === m.materie &&
                                  n.tip === "examen_final"
                              ) === undefined
                            ) {
                              medieFinala = Math.round(
                                sum /
                                  ((gradesElevi?.[e.id]?.note || []).filter(
                                    (n) =>
                                      n.materieId === m.materie &&
                                      n.tip === "nota"
                                  )?.length || 1)
                              );
                            } else if (
                              (gradesElevi?.[e.id]?.note || []).find(
                                (n) =>
                                  n.materieId === m.materie &&
                                  n.tip === "examen_final"
                              )
                            ) {
                              let ef = (gradesElevi?.[e.id]?.note || []).find(
                                (n) =>
                                  n.materieId === m.materie &&
                                  n.tip === "examen_final"
                              ).examen_final;

                              medieFinala =
                                sum /
                                ((gradesElevi?.[e.id]?.note || []).filter(
                                  (n) =>
                                    n.materieId === m.materie &&
                                    n.tip === "nota"
                                )?.length || 1);

                              let rawNumber =
                                (parseFloat(medieFinala) + parseFloat(ef)) / 2;
                              let roundedNumber =
                                Math.round(rawNumber * 1000) / 1000; // Pas intermediar pentru a influența rotunjirea

                              roundedNumber =
                                Math.round(
                                  Math.round(roundedNumber * 1000) / 10
                                ) / 100; // Rotunjire la două zecimale cu influența zecimalei a treia

                              medieFinala = roundedNumber;
                            }
                            let corigenta = (
                              gradesElevi?.[e.id]?.note || []
                            ).find(
                              (n) =>
                                n.materieId === m.materie &&
                                n.tip === "corigenta"
                            );

                            let newObject = {};
                            if (
                              (gradesElevi?.[e.id]?.note || []).filter(
                                (n) =>
                                  n.materieId === m.materie && n.tip === "nota"
                              )?.length === 0 &&
                              !materii
                                .find((n) => n.id === m.materie)?.numeMaterie.includes("Purtare")
                            )
                              newObject[
                                materii?.find(
                                  (ma) => ma.id === m.materie
                                )?.numeMaterie
                              ] = "-";
                            else
                              newObject[
                                materii?.find(
                                  (ma) => ma.id === m.materie
                                )?.numeMaterie
                              ] =
                                corigenta ??
                                materii?.find((ma) => ma.id === m.materie)
                                  ?.notare === false
                                  ? inchis?.inchidere_medie || notaFinala
                                  : inchis?.inchidere_medie || medieFinala;
                            return { ...obj, ...newObject };
                          }, {}),

                        "Medie Generala": calculare_medii(
                          gradesElevi?.[e.id]?.note || [],
                          
                          materii,
                          scutiri[e.id]
                        ),
                      };
                    }),
                  classData.anClasa +
                    classData.identificator +
                    " - " +
                    "Statistica Materii"
                );
              }}
              type="primary"
            >
              Excel Materii + Medie
            </Button>
          )} */}

      {permision === true && (
        <Button type="primary" onClick={exportToExcel}>
          Exportă în Excel
        </Button>
      )}
    </>
  );
}

export default withErrorBoundary(Catalog);
