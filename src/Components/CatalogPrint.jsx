import React, { useEffect, useState, useRef } from "react";
import { Table, Button, Space, Divider, Switch, Popconfirm } from "antd";
import "./Catalog.css";
import { useSelector } from "react-redux";
import { getFunctions, httpsCallable } from "firebase/functions";
import { PlusOutlined } from "@ant-design/icons";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../database/firebase";
import { Accordion, Icon, Popup, Button as BS } from "semantic-ui-react";

import Docxtemplater from "docxtemplater";
import { renderClassName } from "../utils";
import catalogGimanziuCoperta from "./catalog_gimnaziu_coperta.docx";
import catalogGimanziuFinal from "./catalog_slim_final.docx";
import catalogGimanziuRubrica from "./catalog_slim_rubrica_nou.docx";
import { motiveazaAbsente } from "../utils/absente";
import { Alert } from "antd";

import PizZip from "pizzip";
import { saveAs } from "file-saver";
import template from "./instiintare parinti 2024 completat.docx";

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
  calculare_medii_incheire_cursuri,
  calculeaza_medie_materie,
} from "../utils/calculare_medie";
import { exportExcel } from "./excelexport";
import { openErrorNotification } from "./Notifications/errorNotification";
import { maxHeightIcon } from "@progress/kendo-svg-icons";

function extractDateFromCNP(cnp) {
  if (!cnp) return "";
  if (cnp?.length !== 13 || !/^\d+$/.test(cnp)) {
    return "";
    throw new Error("CNP invalid!");
  }

  // Extrage informațiile din CNP
  const gender = parseInt(cnp.charAt(0), 10); // Prima cifră
  const year = parseInt(cnp.slice(1, 3), 10); // Anul (ultimele două cifre)
  const month = parseInt(cnp.slice(3, 5), 10); // Luna
  const day = parseInt(cnp.slice(5, 7), 10); // Ziua

  // Determină secolul pe baza primei cifre
  let fullYear;
  if (gender === 1 || gender === 2) {
    fullYear = 1900 + year; // Secolul 20
  } else if (gender === 3 || gender === 4) {
    fullYear = 1800 + year; // Secolul 19
  } else if (gender === 5 || gender === 6) {
    fullYear = 2000 + year; // Secolul 21
  } else {
    throw new Error("CNP invalid: prima cifră nu este validă!");
  }

  // Verifică datele extrase
  const isValidDate = (y, m, d) => {
    const date = new Date(y, m - 1, d);
    return (
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d
    );
  };

  if (!isValidDate(fullYear, month, day)) {
    throw new Error("CNP invalid: data nu este validă!");
  }

  // Formatul final dd/mm/yyyy
  const formattedDate = `${String(day).padStart(2, "0")}/${String(
    month
  ).padStart(2, "0")}/${fullYear}`;
  return formattedDate;
}

function parseMatricolNumber(input) {
  // Split the input string by '/'

  const parts = input.split("/");

  // Ensure the format is correct
  if (parts.length !== 3) {
    return input || "";
  }

  // Extract values
  const numarMatricol = parseInt(parts[0], 10);
  const volum = parts[1]; // Volume is in Roman numerals
  const pagina = parseInt(parts[2], 10);

  return {
    numarMatricol,
    volum,
    pagina,
  };
}
function Catalog({ classData, setClassData, mode = "edit", permision }) {
  const [eleviData, setEleviData] = useState([]);
  const componentRef = useRef();
  const onlyWidth = useWindowWidth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gradesElevi, setGradesElevi] = useState([]);
  const [elevId, setElevId] = useState();
  const [elevId2, setElevId2] = useState();
  const [teza, setTeza] = useState();
  const [materieId, setMaterieId] = useState();
  const print = useRef();
  const [nota, setNota] = useState();
  const [inchideMediiAutomat, setInchideMediiAutomat] = useState(false);
  const [allData, setAllData] = useState({});
  const profesoriRedux = useSelector((state) => state.profesori);
  const settings = useSelector((state) => state.settings);
  const Limit = 40;
  const [deleted, setDeleted] = useState("");
  const [motivStergereMedie, setMotivStergereMedie] = useState("");
  const [notePrint, setNotePrint] = useState([]);
  const [author, setAuthor] = useState("");
  const navigate = useNavigate();
  const [comentariu, setComentariu] = useState();
  const [edit, setEdit] = useState(false);
  const clase = useSelector((state) => state.clase);

  const [faraNote, setFaraNote] = useState(false);
  const windowSize = useRef(window.innerWidth);
  const [data, setData] = useState();
  const user = useSelector((state) => state.user);
  const [wordDocuments, setWordDocuments] = useState([]);

  const [tip, setTip] = useState();
  const [entity, setEntity] = useState({});
  const [scutiri, setScutiri] = useState({});
  const [allNotes, setAllNotes] = useState([]);
  const [display, setDisplay] = useState(false);

  const [id, setId] = useState("");
  const [profileElevi, setProfileElevi] = useState({});
  const [open2, setOpen2] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const secondColumn = 12;
  const [profesori, setProfesori] = useState();
  useEffect(() => {
    const fetchAndCombine = async () => {
      const combined = await Promise.all(
        profesoriRedux.map(async (prof) => {
          try {
            const userSnap = await getDataDoc("users", prof.id);

            return {
              ...prof,
              ...userSnap,
            };
          } catch (error) {
            console.error("Eroare la descărcarea user-ului:", error);
            return prof;
          }
        })
      );

      setProfesori(combined);
    };
    if (profesoriRedux?.length) {
      fetchAndCombine();
    }
  }, [profesoriRedux]);
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

  function numarInLitere(numar) {
    if (numar === false) return "";
    if (numar === "" || numar === "undefined" || numar === undefined) return "";
    if (numar === "FB") return "(Foarte bine)";
    if (numar === "B") return "(Bine)";
    if (numar === "I") return "(Insuficient)";
    if (numar === "S") return "(Suficient)";
    if (
      numar < 0 ||
      numar > 10 ||
      !/^(\d+)(\.\d{2})?$/.test(numar.toFixed(2))
    ) {
      return "Număr invalid. Introduceți un număr între 0 și 10 cu două zecimale sau fără.";
    }

    const intregi = [
      "zero",
      "unu",
      "doi",
      "trei",
      "patru",
      "cinci",
      "șase",
      "șapte",
      "opt",
      "nouă",
      "zece",
    ];

    const zecimale = [
      "zero",
      "unu",
      "doi",
      "trei",
      "patru",
      "cinci",
      "șase",
      "șapte",
      "opt",
      "nouă",
    ];

    const [parteaIntreaga, parteaZecimala] = numar.toFixed(2).split(".");

    let rezultat = intregi[parseInt(parteaIntreaga, 10)];

    if (parteaZecimala && parseInt(parteaZecimala) > 0) {
      let zecimaleText = [
        zecimale[parseInt(parteaZecimala[0], 10)],
        zecimale[parseInt(parteaZecimala[1], 10)],
      ];
      rezultat += " și " + zecimaleText.join(" ");
    }

    return "(" + rezultat + ")";
  }
  function containsDate(input) {
    // Regular expression to match two dates in the format dd.mm.yyyy
    const dateRegex = /(\b\d{1,2}\.\d{1,2}\.\d{4}\b)/g;

    // Find all matches in the string
    const matches = input.match(dateRegex);

    // Check if exactly two dates are found
    return matches && matches.length === 2;
  }

  // Exemple de utilizare:

  const generateWordChunck = async (elevi) => {
    let cnt = 0;

    cnt = 0;
    let enct = 0;
    let materiiCatalog = {};

    for (let elev of elevi) {
      ++enct;
      let noReligie = gradesElevi[elev.id]?.note.find(
        (n) =>
          n.materieId.includes("Religie") ||
          n.materieId.includes("RP") ||
          n.materieId.includes("Penticostal")
      );

      cnt = 0;
      let total = classData.materii
        .filter(
          (m) =>
            (noReligie === undefined &&
              m.materie.includes("Religie") &&
              !m.materie.includes("Penticostala") &&
              !m.materie.includes("RP")) ||
            (elev.scutitMedical &&
              materii
                .find((mm) => mm.id === m.materie)
                ?.numeMaterie.includes("Educație fizică")) ||
            gradesElevi[elev.id]?.note.find((n) => n.materieId === m.materie)
        )
        .reduce((acc, m) => {
          ++cnt;
          return {
            ...acc,
            ["e" + enct + "_" + "mat" + cnt]:
              materii.find((mm) => mm.id === m.materie)?.numeMaterie +
              (!noReligie &&
              materii
                .find((mm) => mm.id === m.materie)
                ?.numeMaterie.includes("Religie")
                ? "\n -retras conform: " + elev.religie
                : "") +
              (materii
                .find((mm) => mm.id === m.materie)
                ?.numeMaterie.includes("Educație fizică") &&
              elev?.scutitMedical?.length > 0 &&
              elev.scutitMedical !== "nu" &&
              new Date() <= new Date(elev?.dataExpirareMedical || new Date())
                ? `\n-scutit medical conform ${elev.scutitMedical}${
                    elev?.dataExpirareMedical
                      ? ` până pe data de ${new Date(
                          elev.dataExpirareMedical
                        ).toLocaleDateString()}`
                      : ""
                  }`
                : ""),
          };
        }, {});
      materiiCatalog = { ...materiiCatalog, ...total };
    }
    // console.log({ obj });

    cnt = 0;
    let dateElevi = elevi.reduce((acc, e) => {
      let noReligie = gradesElevi[e.id]?.note.find(
        (n) =>
          n.materieId.includes("Religie") ||
          n.materieId.includes("RP") ||
          n.materieId.includes("Penticostal")
      );

      ++cnt;
      return {
        ...acc,
        ["e" + cnt + "_nf"]: e.numeDeFamilie,
        ["e" + cnt + "_pr"]: e.prenume,
        ["e" + cnt + "_nrmat"]: e.numarMatricol,
        ["e" + cnt + "_nrMatricol"]: parseMatricolNumber(e.numarMatricol)
          .numarMatricol,
        ["e" + cnt + "_v"]: parseMatricolNumber(e.numarMatricol).volum,
        ["e" + cnt + "_p"]: parseMatricolNumber(e.numarMatricol).pagina,
        ["e" + cnt + "_crt"]: cnt,
        ["e" + cnt + "_fullname"]:
          e.numeDeFamilie + " " + e.initiala + " " + e.prenume,
        ["e" + cnt + "_mama"]: "",
        ["e" + cnt + "_tata"]: "",
        ["e" + cnt + "_dom_nr_telefon"]:
          (e.domiciliu || "") + ", " + (e.numarTelefon || ""),
        ["e" + cnt + "_ta"]:
          gradesElevi[e.id].absente.absente_dupa_motivari?.length,
        ["e" + cnt + "_abs_n"]:
          gradesElevi[e.id].absente.absente_nemotivate?.length,
        ["e" + cnt + "_med1"]:
          e.retras === true || e.mutat === true
            ? ""
            : calculare_medii_incheire_cursuri(
                gradesElevi[e.id]?.note || [],
                materii,
                scutiri[e.id]
              ),
        ["e" + cnt + "_med2"]:
          e.retras === true || e.mutat === true
            ? ""
            : calculare_medii(
                gradesElevi[e.id]?.note || [],
                materii,
                scutiri[e.id]
              ),
        ["e" + cnt + "_medg"]:
          e.retras === true || e.mutat === true
            ? ""
            : calculare_medii(
                gradesElevi[e.id]?.note || [],
                materii,
                scutiri[e.id]
              ),
        ["e" + cnt + "_detalii"]:
          (e.ces === "da" ? "Cerințe educaționale speciale\n" : "") +
          (e.details || "") +
          "\n" +
          (e.transferuri || []).reduce(
            (acc, cur) => acc + cur.details + "\n",
            ""
          ),
        ...gradesElevi[e.id].absente.absente_dupa_motivari?.reduce(
          (acc, n) => {
            let indexMaterie =
              classData.materii
                .filter(
                  (m) =>
                    (noReligie === undefined &&
                      m.materie.includes("Religie") &&
                      !m.materie.includes("Penticostala") &&
                      !m.materie.includes("RP")) ||
                    (e.scutitMedical &&
                      materii
                        .find((mm) => mm.id === m.materie)
                        ?.numeMaterie.includes("Educație fizică")) ||
                    gradesElevi[e.id]?.note.find(
                      (n) => n.materieId === m.materie
                    )
                )
                .findIndex((a) => a.materie === n.materieId) + 1;

            let which =
              (gradesElevi[e.id]?.absente?.absente_dupa_motivari
                .sort((a, b) => b.date - a.date)
                .filter((a) => a.materieId === n.materieId)
                .indexOf(n) %
                2) +
              1;

            if (n.tip === "absenta")
              return {
                ...acc,
                ["e" + cnt + "_a" + which + "_m" + indexMaterie]: [
                  ...(acc?.["e" + cnt + "_a" + which + "_m" + indexMaterie] ||
                    []),
                  {
                    text:
                      n.motivat === true
                        ? "abu" + formatDate(new Date(n.date))
                        : "azs" + formatDate(new Date(n.date)),
                  },
                ],
              };
            if (n.tip === "nota")
              return {
                ...acc,
                ["e" + cnt + "_n" + "_m" + indexMaterie]: [
                  ...(acc?.["e" + cnt + "_n" + "_m" + indexMaterie] || []),
                  {
                    text: " ",
                  },
                  {
                    text: n.nota + "/" + formatDate(new Date(n.date)),
                  },
                ],
              };
          },
          {
            ["e" + cnt + "_a" + "_m" + 1]: [],
            ["e" + cnt + "_a" + "_m" + 2]: [],
            ["e" + cnt + "_a" + "_m" + 3]: [],
            ["e" + cnt + "_a" + "_m" + 4]: [],
            ["e" + cnt + "_a" + "_m" + 5]: [],
            ["e" + cnt + "_a" + "_m" + 6]: [],
            ["e" + cnt + "_a" + "_m" + 7]: [],
            ["e" + cnt + "_a" + "_m" + 8]: [],
            ["e" + cnt + "_a" + "_m" + 9]: [],
            ["e" + cnt + "_a" + "_m" + 10]: [],
            ["e" + cnt + "_a" + "_m" + 11]: [],
            ["e" + cnt + "_a" + "_m" + 12]: [],
            ["e" + cnt + "_a" + "_m" + 13]: [],
            ["e" + cnt + "_a" + "_m" + 14]: [],
            ["e" + cnt + "_a" + "_m" + 15]: [],
            ["e" + cnt + "_a" + "_m" + 16]: [],
            ["e" + cnt + "_a" + "_m" + 17]: [],
            ["e" + cnt + "_a" + "_m" + 18]: [],
            ["e" + cnt + "_a" + "_m" + 19]: [],
            ["e" + cnt + "_a" + "_m" + 20]: [],
            ["e" + cnt + "_a" + "_m" + 21]: [],
            ["e" + cnt + "_a" + "_m" + 22]: [],
            ["e" + cnt + "_a" + "_m" + 23]: [],
            ["e" + cnt + "_a" + "_m" + 24]: [],
            ["e" + cnt + "_a" + "_m" + 25]: [],
            ["e" + cnt + "_a" + "_m" + 26]: [],
            ["e" + cnt + "_a" + "_m" + 27]: [],
          }
        ),
        ...gradesElevi[e.id].note?.reduce(
          (acc, n) => {
            let indexMaterie =
              classData.materii
                .filter(
                  (m) =>
                    (noReligie === undefined &&
                      m.materie.includes("Religie") &&
                      !m.materie.includes("Penticostala") &&
                      !m.materie.includes("RP")) ||
                    (e.scutitMedical &&
                      materii
                        .find((mm) => mm.id === m.materie)
                        ?.numeMaterie.includes("Educație fizică")) ||
                    gradesElevi[e.id]?.note.find(
                      (n) => n.materieId === m.materie
                    )
                )
                .findIndex((a) => a.materie === n.materieId) + 1;

            if (n.tip === "nota") {
              return {
                ...acc,
                ["e" + cnt + "_n" + "_m" + indexMaterie]: [
                  ...(acc?.["e" + cnt + "_n" + "_m" + indexMaterie] || []),

                  {
                    text: n.nota + " / ",
                  },
                  { text: formatDate(new Date(n.date)) },
                ],
              };
            }
            return acc;
          },
          {
            ["e" + cnt + "_n" + "_m" + 1]: [],
            ["e" + cnt + "_n" + "_m" + 2]: [],
            ["e" + cnt + "_n" + "_m" + 3]: [],
            ["e" + cnt + "_n" + "_m" + 4]: [],
            ["e" + cnt + "_n" + "_m" + 5]: [],
            ["e" + cnt + "_n" + "_m" + 6]: [],
            ["e" + cnt + "_n" + "_m" + 7]: [],
            ["e" + cnt + "_n" + "_m" + 8]: [],
            ["e" + cnt + "_n" + "_m" + 9]: [],
            ["e" + cnt + "_n" + "_m" + 10]: [],
            ["e" + cnt + "_n" + "_m" + 11]: [],
            ["e" + cnt + "_n" + "_m" + 12]: [],
            ["e" + cnt + "_n" + "_m" + 13]: [],
            ["e" + cnt + "_n" + "_m" + 14]: [],
            ["e" + cnt + "_n" + "_m" + 15]: [],
            ["e" + cnt + "_n" + "_m" + 16]: [],
            ["e" + cnt + "_n" + "_m" + 17]: [],
            ["e" + cnt + "_n" + "_m" + 18]: [],
            ["e" + cnt + "_n" + "_m" + 19]: [],
            ["e" + cnt + "_n" + "_m" + 20]: [],
            ["e" + cnt + "_n" + "_m" + 21]: [],
            ["e" + cnt + "_n" + "_m" + 22]: [],
            ["e" + cnt + "_n" + "_m" + 23]: [],
            ["e" + cnt + "_n" + "_m" + 24]: [],
            ["e" + cnt + "_n" + "_m" + 25]: [],
            ["e" + cnt + "_n" + "_m" + 26]: [],
            ["e" + cnt + "_n" + "_m" + 27]: [],
          }
        ),
        ...classData.materii
          .filter(
            (m) =>
              (noReligie === undefined &&
                m.materie.includes("Religie") &&
                !m.materie.includes("Penticostala") &&
                !m.materie.includes("RP")) ||
              gradesElevi[e.id]?.note.find((n) => n.materieId === m.materie)
          )
          .reduce((acc, m) => {
            return {
              ...acc,
              ["e" +
              cnt +
              "_m" +
              (classData.materii
                .filter(
                  (m) =>
                    (noReligie === undefined &&
                      m.materie.includes("Religie") &&
                      !m.materie.includes("Penticostala") &&
                      !m.materie.includes("RP")) ||
                    (e.scutitMedical &&
                      materii
                        .find((mm) => mm.id === m.materie)
                        ?.numeMaterie.includes("Educație fizică")) ||
                    gradesElevi[e.id]?.note.find(
                      (n) => n.materieId === m.materie
                    )
                )
                .findIndex((f) => f.materie === m.materie) +
                1)]:
                e.retras === true || e.mutat === true
                  ? ""
                  : (calculeaza_medie_materie(
                      gradesElevi[e.id]?.note || [],
                      materii.find((f) => f.id === m.materie),
                      scutiri[e.id]
                    ).medieIntiala ||
                      calculeaza_medie_materie(
                        gradesElevi[e.id]?.note || [],
                        materii.find((f) => f.id === m.materie),
                        scutiri[e.id]
                      ).medie) +
                    numarInLitere(
                      calculeaza_medie_materie(
                        gradesElevi[e.id]?.note || [],
                        materii.find((f) => f.id === m.materie),
                        scutiri[e.id]
                      ).medieIntiala ||
                        calculeaza_medie_materie(
                          gradesElevi[e.id]?.note || [],
                          materii.find((f) => f.id === m.materie),
                          scutiri[e.id]
                        ).medie
                    ),

              ["e" +
              cnt +
              "_mc" +
              (classData.materii
                .filter(
                  (m) =>
                    (noReligie === undefined &&
                      m.materie.includes("Religie") &&
                      !m.materie.includes("Penticostala") &&
                      !m.materie.includes("RP")) ||
                    (e.scutitMedical &&
                      materii
                        .find((mm) => mm.id === m.materie)
                        ?.numeMaterie.includes("Educație fizică")) ||
                    gradesElevi[e.id]?.note.find(
                      (n) => n.materieId === m.materie
                    )
                )
                .findIndex((f) => f.materie === m.materie) +
                1)]:
                ((gradesElevi[e.id]?.note || [],
                materii.find((f) => f.id === m.materie),
                scutiri[e.id])?.corigenta === undefined
                  ? ""
                  : calculeaza_medie_materie(
                      gradesElevi[e.id]?.note || [],
                      materii.find((f) => f.id === m.materie),
                      scutiri[e.id]
                    )?.corigenta?.corigenta) +
                numarInLitere(
                  calculeaza_medie_materie(
                    gradesElevi[e.id]?.note || [],
                    materii.find((f) => f.id === m.materie),
                    scutiri[e.id]
                  )?.corigenta === undefined
                    ? ""
                    : calculeaza_medie_materie(
                        gradesElevi[e.id]?.note || [],
                        materii.find((f) => f.id === m.materie),
                        scutiri[e.id]
                      )?.corigenta?.corigenta
                ),
              ["e" +
              cnt +
              "_a" +
              (classData.materii
                .filter(
                  (m) =>
                    (noReligie === undefined &&
                      m.materie.includes("Religie") &&
                      !m.materie.includes("Penticostala") &&
                      !m.materie.includes("RP")) ||
                    (e.scutitMedical &&
                      materii
                        .find((mm) => mm.id === m.materie)
                        ?.numeMaterie.includes("Educație fizică")) ||
                    gradesElevi[e.id]?.note.find(
                      (n) => n.materieId === m.materie
                    )
                )
                .findIndex((f) => f.materie === m.materie) +
                1)]:
                e.retras === true || e.mutat === true
                  ? ""
                  : (calculeaza_medie_materie(
                      gradesElevi[e.id]?.note || [],
                      materii.find((f) => f.id === m.materie),
                      scutiri[e.id]
                    ).inchis.inchidere_medie || "") +
                    " " +
                    numarInLitere(
                      calculeaza_medie_materie(
                        gradesElevi[e.id]?.note || [],
                        materii.find((f) => f.id === m.materie),
                        scutiri[e.id]
                      ).inchis.inchidere_medie || ""
                    ),
            };
          }, {}),
      };
    }, {});
    cnt = 1;

    const templateArrayBuffer = await fetchTemplateRubrica();
    const zip = new PizZip(templateArrayBuffer);

    const templateDoc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    let generatedObject = {};
    for (let e = 1; e <= 35; e++) {
      for (let m = 1; m <= 30; m++) {
        generatedObject[`e${e}_m${m}`] = "";

        generatedObject[`e${e}_mc${m}`] = "";
        generatedObject[`e${e}_mat${m}`] = "";
        generatedObject[`e${e}_a${m}`] = "";
        generatedObject[`e${e}_ta`] = "";
        generatedObject[`e${e}_abs_n`] = "";
        generatedObject["e" + e + "_crt"] = "";
        generatedObject["e" + e + "_nf"] = "";
        generatedObject["e" + e + "_pr"] = "";
        generatedObject["e" + e + "_ta"] = "";
        generatedObject["e" + e + "_abs_n"] = "";
        generatedObject["e" + e + "_med1"] = "";
        generatedObject["e" + e + "_med2"] = "";
        generatedObject["e" + e + "_medg"] = "";
        generatedObject["e" + e + "_detalii"] = "";
        generatedObject["e" + e + "_nrmat"] = "";
        generatedObject["e" + e + "_fullname"] = "";
        generatedObject["e" + e + "_nastere"] = "";
        generatedObject["e" + e + "_mama"] = "";
        generatedObject["e" + e + "_tata"] = "";
        generatedObject["e" + e + "_dom_nr_telefon"] = "";
        generatedObject["e" + e + "_v"] = "";
        generatedObject["e" + e + "_p"] = "";
        generatedObject["e" + e + "_nrMatricol"] = "";
      }
    }

    const resume = {
      e1_med1: "",
      e1_med2: "",
      e1_medg: "",
      e2_med1: "",
      e2_med2: "",
      e2_medg: "",
      e3_med1: "",
      e3_med2: "",
      e3_medg: "",
      e4_med1: "",
      e4_med2: "",
      e4_medg: "",
      e5_med1: "",
      e5_med2: "",
      e5_medg: "",
      e6_med1: "",
      e6_med2: "",
      e6_medg: "",
      e7_med1: "",
      e7_med2: "",
      e7_medg: "",
      e8_med1: "",
      e8_med2: "",
      e8_medg: "",
      e9_med1: "",
      e9_med2: "",
      e9_medg: "",
      e10_med1: "",
      e10_med2: "",
      e10_medg: "",
      e11_med1: "",
      e11_med2: "",
      e11_medg: "",
      e12_med1: "",
      e12_med2: "",
      e12_medg: "",
      e13_med1: "",
      e13_med2: "",
      e13_medg: "",
      e14_med1: "",
      e14_med2: "",
      e14_medg: "",
      e15_med1: "",
      e15_med2: "",
      e15_medg: "",
      e16_med1: "",
      e16_med2: "",
      e16_medg: "",
      e17_med1: "",
      e17_med2: "",
      e17_medg: "",
      e18_med1: "",
      e18_med2: "",
      e18_medg: "",
      e19_med1: "",
      e19_med2: "",
      e19_medg: "",
      e20_med1: "",
      e20_med2: "",
      e20_medg: "",
      e21_med1: "",
      e21_med2: "",
      e21_medg: "",
      e22_med1: "",
      e22_med2: "",
      e22_medg: "",
      e23_med1: "",
      e23_med2: "",
      e23_medg: "",
      e24_med1: "",
      e24_med2: "",
      e24_medg: "",
      e25_med1: "",
      e25_med2: "",
      e25_medg: "",
      e26_med1: "",
      e26_med2: "",
      e26_medg: "",
      e27_med1: "",
      e27_med2: "",
      e27_medg: "",
      e28_med1: "",
      e28_med2: "",
      e28_medg: "",
      e29_med1: "",
      e29_med2: "",
      e29_medg: "",
      e30_med1: "",
      e30_med2: "",
      e30_medg: "",

      ...{
        m1: "",
        m2: "",
        m3: "",
        m4: "",
        m5: "",
        m6: "",
        m7: "",
        m8: "",
        m9: "",
        m10: "",
        m11: "",
        m12: "",
        m13: "",
        m14: "",
        m15: "",
        m16: "",
        m17: "",
        m18: "",
        m19: "",
        m20: "",
        m21: "",
        m22: "",
        m23: "",
        m24: "",
        m25: "",
        m26: "",
        m27: "",
        m28: "",
        m29: "",
        m30: "",
      },
      ...materiiCatalog,
      ...dateElevi,
    };
    templateDoc.render({
      ...generatedObject,
      ...resume,
      ...dateElevi,
      ...materiiCatalog,
    });

    const generatedDoc = templateDoc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
    });
    const zipFromGeneratedDoc = new PizZip(await generatedDoc.arrayBuffer());

    // Modifică XML-ul documentului
    const modifiedZip = modifyDocumentXML(zipFromGeneratedDoc);

    // Generează documentul final cu modificările aplicate
    const finalGeneratedDoc = modifiedZip.generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
    });

    // Salvează documentul final

    return finalGeneratedDoc;
  };
  const readBlobAsArrayBuffer = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(blob);
    });
  };
  const mergeWordDocuments = async (wordDocuments) => {
    if (wordDocuments.length < 2) {
      alert("Selectează cel puțin două documente.");
      return;
    }

    try {
      // Convertim fișierele în Base64 folosind FileReader
      const base64Files = await Promise.all(
        wordDocuments.map((doc) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(doc);
            reader.onloadend = () => {
              // Eliminăm prefixul "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
              const base64String = reader.result.split(",")[1];
              resolve(base64String);
            };
            reader.onerror = reject;
          });
        })
      );

      // Apelăm funcția Firebase
      const functions = getFunctions();
      const mergeDocs = httpsCallable(functions, "mergeWordDocuments");
      const response = await mergeDocs({ files: base64Files });

      // Decodăm fișierul final
      const mergedBlob = new Blob(
        [
          Uint8Array.from(atob(response.data.mergedFile), (c) =>
            c.charCodeAt(0)
          ),
        ],
        {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
      );

      // Descărcăm documentul final
      saveAs(mergedBlob, "Merged_Documents.docx");
    } catch (error) {
      console.error("Eroare la descărcarea documentului:", error);
    }
  };
  function groupArrayIntoChunks(array, chunkSize = 3) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }

  const fetchTemplateCoperta = async () => {
    const response = await fetch(catalogGimanziuCoperta);
    return await response.arrayBuffer();
  };
  const fetchTemplateFinal = async () => {
    const response = await fetch(catalogGimanziuFinal);
    return await response.arrayBuffer();
  };
  const fetchTemplateRubrica = async () => {
    const response = await fetch(catalogGimanziuRubrica);
    return await response.arrayBuffer();
  };

  function modifyDocumentXML(zip) {
    const xmlPath = "word/document.xml";
    let documentXml = zip.file(xmlPath).asText();

    // Parsează XML-ul într-un DOM
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const xmlDoc = parser.parseFromString(documentXml, "application/xml");

    // Găsește toate nodurile <w:t> (text)
    const textNodes = xmlDoc.getElementsByTagName("w:t");

    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      const textContent = node.textContent;

      if (textContent.startsWith("abu")) {
        // Scoate prefixul "abu"
        const cleanText = textContent.replace("abu", "");

        // Creează un nou nod <w:r> pentru text
        const newRun = xmlDoc.createElement("w:r");
        const runProperties = xmlDoc.createElement("w:rPr");

        // Setează dimensiunea fontului la 8px (16 în unități Word)
        const fontSize = xmlDoc.createElement("w:sz");
        fontSize.setAttribute("w:val", "13");
        runProperties.appendChild(fontSize);

        // Setează culoarea textului la verde închis
        const textColor = xmlDoc.createElement("w:color");
        textColor.setAttribute("w:val", "006400");
        runProperties.appendChild(textColor);

        // Adaugă border pe text
        const textBorder = xmlDoc.createElement("w:bdr");
        textBorder.setAttribute("w:val", "single"); // Linie simplă
        textBorder.setAttribute("w:sz", "4"); // Grosimea borderului
        textBorder.setAttribute("w:space", "1"); // Spațiere minimă
        textBorder.setAttribute("w:color", "006400"); // Verde închis
        runProperties.appendChild(textBorder);

        newRun.appendChild(runProperties);

        const newTextNode = xmlDoc.createElement("w:t");
        newTextNode.textContent = cleanText;
        newRun.appendChild(newTextNode);

        // Creează un paragraf (<w:p>) și adaugă textul formatat
        const newParagraph = xmlDoc.createElement("w:p");
        newParagraph.appendChild(newRun);

        // Înlocuiește doar nodul text original cu noul paragraf
        const originalParent = node.parentNode.parentNode;
        originalParent.parentNode.replaceChild(newParagraph, originalParent);
      }

      if (textContent.startsWith("azs")) {
        // Scoate prefixul "azs"
        const cleanText = textContent.replace("azs", "");

        // Creează un nou nod <w:r> pentru textul fără borduri
        const newRun = xmlDoc.createElement("w:r");
        const runProperties = xmlDoc.createElement("w:rPr");

        // Setează dimensiunea fontului la 8px (16 în unități Word)
        const fontSize = xmlDoc.createElement("w:sz");
        fontSize.setAttribute("w:val", "14");
        runProperties.appendChild(fontSize);

        // Setează culoarea textului la roșu închis
        const textColor = xmlDoc.createElement("w:color");
        textColor.setAttribute("w:val", "8B0000");
        runProperties.appendChild(textColor);
        newRun.appendChild(runProperties);

        const newTextNode = xmlDoc.createElement("w:t");
        newTextNode.textContent = cleanText;
        newRun.appendChild(newTextNode);

        // Creează un paragraf (<w:p>) fără borduri, doar cu text roșu
        const newParagraph = xmlDoc.createElement("w:p");
        newParagraph.appendChild(newRun);

        // Înlocuiește doar nodul text original cu noul paragraf
        const originalParent = node.parentNode.parentNode;
        originalParent.parentNode.replaceChild(newParagraph, originalParent);
      }
    }

    // Serializează XML-ul modificat înapoi într-un string
    documentXml = serializer.serializeToString(xmlDoc);

    // Actualizează fișierul în arhiva ZIP
    zip.file(xmlPath, documentXml);

    return zip;
  }

  async function generateCoperta() {
    let cnt = 0;
    const templateArrayBuffer = await fetchTemplateCoperta();
    const zip = new PizZip(templateArrayBuffer);

    const templateDoc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const getIndex = (materieId) =>
      classData.materii.findIndex((m) => m.materie === materieId);

    const listOfProfesori = allNotes
      .sort((a, b) => getIndex(a.materieId) - getIndex(b.materieId))
      .reduce((acc, nota) => {
        if (
          (profesori.find(
            (p) =>
              p.id === (nota.authorId || nota.author) ||
              p.displayName == (nota.authorId || nota.author)
          )?.type === "admin" ||
            (nota.authorId || nota.author) === classData.diriginte) &&
          !classData.materii.find(
            (m) =>
              m.materie === nota.materieId &&
              m.profesori.find(
                (a) =>
                  a ==
                  profesori.find(
                    (p) =>
                      p.id === (nota.authorId || nota.author) ||
                      p.displayName == (nota.authorId || nota.author)
                  )?.id
              )
          )
        )
          return acc;
        if (
          !profesori.find((p) => p.id === nota.authorId) ||
          acc.find(
            (c) =>
              c.materie ===
                materii.find((m) => m.id === nota.materieId).numeMaterie &&
              c.profesor ===
                (profesori.find((p) => p.id === nota.authorId)
                  ? profesori.find((p) => p.id === nota.authorId)
                      .numeDeFamilie +
                    " " +
                    profesori.find((p) => p.id === nota.authorId).prenume
                  : nota.author)
          )
        )
          return acc;
        else
          return [
            ...acc,
            {
              materie: materii.find((m) => m.id === nota.materieId).numeMaterie,
              profesor: profesori.find((p) => p.id === nota.authorId)
                ? profesori.find((p) => p.id === nota.authorId).numeDeFamilie +
                  " " +
                  profesori.find((p) => p.id === nota.authorId).prenume
                : nota.author,
            },
          ];
      }, []);

    let profesoriTabel = listOfProfesori.reduce(
      (acc, p) => {
        ++cnt;
        return {
          ...acc,
          ["tab_d" + cnt]: p.materie,
          ["tab_p" + cnt]: p.profesor,
        };
      },
      {
        tab_d1: "",
        tab_p1: "",
        tab_d2: "",
        tab_p2: "",
        tab_d3: "",
        tab_p3: "",
        tab_d4: "",
        tab_p4: "",
        tab_d5: "",
        tab_p5: "",
        tab_d6: "",
        tab_p6: "",
        tab_d7: "",
        tab_p7: "",
        tab_d8: "",
        tab_p8: "",
        tab_d9: "",
        tab_p9: "",
        tab_d10: "",
        tab_p10: "",
        tab_d11: "",
        tab_p11: "",
        tab_d12: "",
        tab_p12: "",
        tab_d13: "",
        tab_p13: "",
        tab_d14: "",
        tab_p14: "",
        tab_d15: "",
        tab_p15: "",
        tab_d16: "",
        tab_p16: "",
        tab_d17: "",
        tab_p17: "",
        tab_d18: "",
        tab_p18: "",
        tab_d19: "",
        tab_p19: "",
        tab_d20: "",
        tab_p20: "",
        tab_d21: "",
        tab_p21: "",
        tab_d22: "",
        tab_p22: "",
        tab_d23: "",
        tab_p23: "",
        tab_d24: "",
        tab_p24: "",
        tab_d25: "",
        tab_p25: "",
        tab_d26: "",
        tab_p26: "",
        tab_d27: "",
        tab_p27: "",
        tab_d28: "",
        tab_p28: "",
        tab_d29: "",
        tab_p29: "",
        tab_d30: "",
        tab_p30: "",
      }
    );
    const invatamant = (() => {
      const an = classData.anClasacd?.toUpperCase(); // ca să ne asigurăm că e caps
      if (!an) return "";

      if (["V", "VI", "VII", "VIII"].includes(an)) return "gimnazial";
      if (["IX", "X", "XI", "XII", "XIII"].includes(an)) return "liceal";
      if (["I", "II", "III", "IV"].includes(an)) return "primar";

      return ""; // default sau alt mesaj
    })();
    const resume = {
      invatamant,
      veniti: eleviData.filter((e) => e.venitNou)?.length,
      inscrisi_start: eleviData.filter(
        (e) => !e.venitNou && !e?.transferuri?.length > 0
      )?.length,
      plecati: eleviData.filter((e) => e.mutat == true || e.retras === true)
        ?.length,
      all: eleviData.filter((e) => e.mutat !== true && e.retras !== true)
        ?.length,
      e1_med1: "",
      e1_med2: "",
      e1_medg: "",
      e2_med1: "",
      e2_med2: "",
      e2_medg: "",
      e3_med1: "",
      e3_med2: "",
      e3_medg: "",
      e4_med1: "",
      e4_med2: "",
      e4_medg: "",
      e5_med1: "",
      e5_med2: "",
      e5_medg: "",
      e6_med1: "",
      e6_med2: "",
      e6_medg: "",
      e7_med1: "",
      e7_med2: "",
      e7_medg: "",
      e8_med1: "",
      e8_med2: "",
      e8_medg: "",
      e9_med1: "",
      e9_med2: "",
      e9_medg: "",
      e10_med1: "",
      e10_med2: "",
      e10_medg: "",
      e11_med1: "",
      e11_med2: "",
      e11_medg: "",
      e12_med1: "",
      e12_med2: "",
      e12_medg: "",
      e13_med1: "",
      e13_med2: "",
      e13_medg: "",
      e14_med1: "",
      e14_med2: "",
      e14_medg: "",
      e15_med1: "",
      e15_med2: "",
      e15_medg: "",
      e16_med1: "",
      e16_med2: "",
      e16_medg: "",
      e17_med1: "",
      e17_med2: "",
      e17_medg: "",
      e18_med1: "",
      e18_med2: "",
      e18_medg: "",
      e19_med1: "",
      e19_med2: "",
      e19_medg: "",
      e20_med1: "",
      e20_med2: "",
      e20_medg: "",
      e21_med1: "",
      e21_med2: "",
      e21_medg: "",
      e22_med1: "",
      e22_med2: "",
      e22_medg: "",
      e23_med1: "",
      e23_med2: "",
      e23_medg: "",
      e24_med1: "",
      e24_med2: "",
      e24_medg: "",
      e25_med1: "",
      e25_med2: "",
      e25_medg: "",
      e26_med1: "",
      e26_med2: "",
      e26_medg: "",
      e27_med1: "",
      e27_med2: "",
      e27_medg: "",
      e28_med1: "",
      e28_med2: "",
      e28_medg: "",
      e29_med1: "",
      e29_med2: "",
      e29_medg: "",
      e30_med1: "",
      e30_med2: "",
      e30_medg: "",
      total_absente: eleviData.reduce(
        (acc, c) =>
          acc + gradesElevi[c.id].absente.absente_dupa_motivari?.length,
        0
      ),
      total_absente_nemot: eleviData.reduce(
        (acc, c) => acc + gradesElevi[c.id].absente.absente_nemotivate?.length,
        0
      ),
      ui: settings.numeInstitutie,
      loc: settings.loc,
      judet: settings.judet,
      clasa: renderClassName(clase.find((c) => c.id === classData.id)),
      director: settings.director,
      dir:
        profesori.find((p) => p.id === classData.diriginte).numeDeFamilie +
        " " +
        profesori.find((p) => p.id === classData.diriginte).prenume,
      ...profesoriTabel,
      ...{
        m1: "",
        m2: "",
        m3: "",
        m4: "",
        m5: "",
        m6: "",
        m7: "",
        m8: "",
        m9: "",
        m10: "",
        m11: "",
        m12: "",
        m13: "",
        m14: "",
        m15: "",
        m16: "",
        m17: "",
        m18: "",
        m19: "",
        m20: "",
        m21: "",
        m22: "",
        m23: "",
        m24: "",
        m25: "",
        m26: "",
        m27: "",
        m28: "",
        m29: "",
        m30: "",
      },
    };
    templateDoc.render(resume);

    const generatedDoc = templateDoc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
    });
    const zipFromGeneratedDoc = new PizZip(await generatedDoc.arrayBuffer());

    // Modifică XML-ul documentului

    // Generează documentul final cu modificările aplicate
    const finalGeneratedDoc = zipFromGeneratedDoc.generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
    });

    // Salvează documentul final
    return finalGeneratedDoc;
  }

  async function generateFinal() {
    let cnt = 0;
    const templateArrayBuffer = await fetchTemplateFinal();
    const zip = new PizZip(templateArrayBuffer);

    const templateDoc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    let generatedObject = {};
    for (let e = 1; e <= 35; e++) {
      for (let m = 1; m <= 30; m++) {
        generatedObject[`e${e}_m${m}`] = "\n\n\n\n\n\n ";
        generatedObject[`e${e}_mc${m}`] = "\n\n\n\n";
        generatedObject[`e${e}_a${m}`] = "\n\n\n\n";
        generatedObject[`e${e}_ta`] = "\n\n\n\n";
        generatedObject[`e${e}_abs_n`] = "\n\n\n\n";
        generatedObject["e" + e + "_crt"] = "";
        generatedObject["e" + e + "_nf"] = "";
        generatedObject["e" + e + "_pr"] = "";
        generatedObject["e" + e + "_ta"] = "";
        generatedObject["e" + e + "_abs_n"] = "";
        generatedObject["e" + e + "_med1"] = "";
        generatedObject["e" + e + "_med2"] = "";
        generatedObject["e" + e + "_medg"] = "";
        generatedObject["e" + e + "_detalii"] = "";
        generatedObject["e" + e + "_nrmat"] = "";
        generatedObject["e" + e + "_fullname"] = "";
        generatedObject["e" + e + "_nastere"] = "";
        generatedObject["e" + e + "_mama"] = "";
        generatedObject["e" + e + "_tata"] = "";
        generatedObject["e" + e + "_dom_nr_telefon"] = "";
        generatedObject["e" + e + "_v"] = "";
        generatedObject["e" + e + "_p"] = "";
        generatedObject["e" + e + "_nrMatricol"] = "";
      }
    }
    let dateElevi = eleviData.reduce((acc, e) => {
      ++cnt;
      return {
        ...acc,
        ["e" + cnt + "_nf"]: e.numeDeFamilie,
        ["e" + cnt + "_pr"]: e.prenume,
        ["e" + cnt + "_nrmat"]: e.numarMatricol,
        ["e" + cnt + "_crt"]: cnt,
        ["e" + cnt + "_fullname"]:
          e.numeDeFamilie +
          " " +
          e.initiala +
          " " +
          e.prenume.replace(/-/g, " "),
        ["e" + cnt + "_nastere"]: extractDateFromCNP(e.cnp),
        ["e" + cnt + "_mama"]: e.mama || "",
        ["e" + cnt + "_tata"]: e.tata || "",
        ["e" + cnt + "_dom_nr_telefon"]:
          (e.domiciliu || "") + ", " + (e.numarTelefon || ""),
        ["e" + cnt + "_ta"]:
          gradesElevi[e.id].absente.absente_dupa_motivari?.length,
        ["e" + cnt + "_abs_n"]:
          gradesElevi[e.id].absente.absente_nemotivate?.length,
        ["e" + cnt + "_med1"]: calculare_medii_incheire_cursuri(
          gradesElevi[e.id]?.note || [],
          materii,
          scutiri[e.id]
        ),
        ["e" + cnt + "_med2"]: calculare_medii(
          gradesElevi[e.id]?.note || [],
          materii,
          scutiri[e.id]
        ),
        ["e" + cnt + "_medg"]:
          e.retras === true || e.mutat === true
            ? ""
            : calculare_medii(
                gradesElevi[e.id]?.note || [],
                materii,
                scutiri[e.id]
              ),
        ["e" + cnt + "_detalii"]: e.detalii || "",
        ...gradesElevi[e.id].absente.absente_dupa_motivari?.reduce(
          (acc, n) => {
            let indexMaterie =
              classData.materii.findIndex((a) => a.materie === n.materieId) + 1;
            if (n.tip === "absenta")
              return {
                ...acc,
                ["e" + cnt + "_a" + "_m" + indexMaterie]: [
                  ...(acc?.["e" + cnt + "_a" + "_m" + indexMaterie] || []),
                  {
                    text: " ",
                  },
                  {
                    text:
                      n.motivat === true
                        ? "abu" + formatDate(new Date(n.date))
                        : "azs" + formatDate(new Date(n.date)),
                  },
                ],
              };
            if (n.tip === "nota")
              return {
                ...acc,
                ["e" + cnt + "_n" + "_m" + indexMaterie]: [
                  ...(acc?.["e" + cnt + "_n" + "_m" + indexMaterie] || []),
                  {
                    text: " ",
                  },
                  {
                    text: n.nota + "/" + formatDate(new Date(n.date)),
                  },
                ],
              };
          },
          {
            ["e" + cnt + "_a" + "_m" + 1]: [],
            ["e" + cnt + "_a" + "_m" + 2]: [],
            ["e" + cnt + "_a" + "_m" + 3]: [],
            ["e" + cnt + "_a" + "_m" + 4]: [],
            ["e" + cnt + "_a" + "_m" + 5]: [],
            ["e" + cnt + "_a" + "_m" + 6]: [],
            ["e" + cnt + "_a" + "_m" + 7]: [],
            ["e" + cnt + "_a" + "_m" + 8]: [],
            ["e" + cnt + "_a" + "_m" + 9]: [],
            ["e" + cnt + "_a" + "_m" + 10]: [],
            ["e" + cnt + "_a" + "_m" + 11]: [],
            ["e" + cnt + "_a" + "_m" + 12]: [],
            ["e" + cnt + "_a" + "_m" + 13]: [],
            ["e" + cnt + "_a" + "_m" + 14]: [],
            ["e" + cnt + "_a" + "_m" + 15]: [],
            ["e" + cnt + "_a" + "_m" + 16]: [],
            ["e" + cnt + "_a" + "_m" + 17]: [],
            ["e" + cnt + "_a" + "_m" + 18]: [],
            ["e" + cnt + "_a" + "_m" + 19]: [],
            ["e" + cnt + "_a" + "_m" + 20]: [],
            ["e" + cnt + "_a" + "_m" + 21]: [],
            ["e" + cnt + "_a" + "_m" + 22]: [],
            ["e" + cnt + "_a" + "_m" + 23]: [],
            ["e" + cnt + "_a" + "_m" + 24]: [],
            ["e" + cnt + "_a" + "_m" + 25]: [],
            ["e" + cnt + "_a" + "_m" + 26]: [],
            ["e" + cnt + "_a" + "_m" + 27]: [],
          }
        ),
        ...gradesElevi[e.id].note?.reduce(
          (acc, n) => {
            let indexMaterie =
              classData.materii.findIndex((a) => a.materie === n.materieId) + 1;

            if (n.tip === "nota") {
              return {
                ...acc,
                ["e" + cnt + "_n" + "_m" + indexMaterie]: [
                  ...(acc?.["e" + cnt + "_n" + "_m" + indexMaterie] || []),
                  {
                    text: " ",
                  },
                  {
                    text: n.nota + "/" + formatDate(new Date(n.date)),
                  },
                ],
              };
            }
            return acc;
          },
          {
            ["e" + cnt + "_n" + "_m" + 1]: [],
            ["e" + cnt + "_n" + "_m" + 2]: [],
            ["e" + cnt + "_n" + "_m" + 3]: [],
            ["e" + cnt + "_n" + "_m" + 4]: [],
            ["e" + cnt + "_n" + "_m" + 5]: [],
            ["e" + cnt + "_n" + "_m" + 6]: [],
            ["e" + cnt + "_n" + "_m" + 7]: [],
            ["e" + cnt + "_n" + "_m" + 8]: [],
            ["e" + cnt + "_n" + "_m" + 9]: [],
            ["e" + cnt + "_n" + "_m" + 10]: [],
            ["e" + cnt + "_n" + "_m" + 11]: [],
            ["e" + cnt + "_n" + "_m" + 12]: [],
            ["e" + cnt + "_n" + "_m" + 13]: [],
            ["e" + cnt + "_n" + "_m" + 14]: [],
            ["e" + cnt + "_n" + "_m" + 15]: [],
            ["e" + cnt + "_n" + "_m" + 16]: [],
            ["e" + cnt + "_n" + "_m" + 17]: [],
            ["e" + cnt + "_n" + "_m" + 18]: [],
            ["e" + cnt + "_n" + "_m" + 19]: [],
            ["e" + cnt + "_n" + "_m" + 20]: [],
            ["e" + cnt + "_n" + "_m" + 21]: [],
            ["e" + cnt + "_n" + "_m" + 22]: [],
            ["e" + cnt + "_n" + "_m" + 23]: [],
            ["e" + cnt + "_n" + "_m" + 24]: [],
            ["e" + cnt + "_n" + "_m" + 25]: [],
            ["e" + cnt + "_n" + "_m" + 26]: [],
            ["e" + cnt + "_n" + "_m" + 27]: [],
          }
        ),
        ...classData.materii.reduce((acc, m) => {
          return {
            ...acc,
            ["e" +
            cnt +
            "_m" +
            (classData.materii.findIndex((f) => f.materie === m.materie) + 1)]:
              (calculeaza_medie_materie(
                gradesElevi[e.id]?.note || [],
                materii.find((f) => f.id === m.materie),
                scutiri[e.id]
              ).medieIntiala ||
                calculeaza_medie_materie(
                  gradesElevi[e.id]?.note || [],
                  materii.find((f) => f.id === m.materie),
                  scutiri[e.id]
                ).medie) +
              numarInLitere(
                calculeaza_medie_materie(
                  gradesElevi[e.id]?.note || [],
                  materii.find((f) => f.id === m.materie),
                  scutiri[e.id]
                ).medieIntiala ||
                  calculeaza_medie_materie(
                    gradesElevi[e.id]?.note || [],
                    materii.find((f) => f.id === m.materie),
                    scutiri[e.id]
                  ).medie
              ),

            ["e" +
            cnt +
            "_mc" +
            (classData.materii.findIndex((f) => f.materie === m.materie) + 1)]:
              ((gradesElevi[e.id]?.note || [],
              materii.find((f) => f.id === m.materie),
              scutiri[e.id])?.corigenta === undefined
                ? ""
                : calculeaza_medie_materie(
                    gradesElevi[e.id]?.note || [],
                    materii.find((f) => f.id === m.materie),
                    scutiri[e.id]
                  )?.corigenta?.corigenta) +
              numarInLitere(
                calculeaza_medie_materie(
                  gradesElevi[e.id]?.note || [],
                  materii.find((f) => f.id === m.materie),
                  scutiri[e.id]
                )?.corigenta === undefined
                  ? ""
                  : calculeaza_medie_materie(
                      gradesElevi[e.id]?.note || [],
                      materii.find((f) => f.id === m.materie),
                      scutiri[e.id]
                    )?.corigenta?.corigenta
              ),
            ["e" +
            cnt +
            "_a" +
            (classData.materii.findIndex((f) => f.materie === m.materie) + 1)]:
              (calculeaza_medie_materie(
                gradesElevi[e.id]?.note || [],
                materii.find((f) => f.id === m.materie),
                scutiri[e.id]
              ).medie || "") +
              numarInLitere(
                calculeaza_medie_materie(
                  gradesElevi[e.id]?.note || [],
                  materii.find((f) => f.id === m.materie),
                  scutiri[e.id]
                ).medie || ""
              ),
          };
        }, {}),
      };
    }, {});
    cnt = 0;

    const listOfProfesori = allNotes.reduce((acc, nota) => {
      if (
        (profesori.find((p) => p.id === (nota.authorId || nota.author))
          ?.type === "admin" ||
          (nota.authorId || nota.author) === classData.diriginte) &&
        !classData.materii.find(
          (m) =>
            m.materie === nota.materieId &&
            m.profesori.find(
              (a) =>
                a ==
                profesori.find(
                  (p) =>
                    p.id === (nota.authorId || nota.author) ||
                    p.displayName == (nota.authorId || nota.author)
                )?.id
            )
        )
      )
        return acc;
      if (
        !profesori.find((p) => p.id === nota.authorId) ||
        acc.find(
          (c) =>
            c.materie ===
              materii.find((m) => m.id === nota.materieId).numeMaterie &&
            c.profesor ===
              (profesori.find((p) => p.id === nota.authorId)
                ? profesori.find((p) => p.id === nota.authorId).numeDeFamilie +
                  " " +
                  profesori.find((p) => p.id === nota.authorId).prenume
                : nota.author)
        )
      )
        return acc;
      else
        return [
          ...acc,
          {
            materie: materii.find((m) => m.id === nota.materieId).numeMaterie,
            profesor: profesori.find((p) => p.id === nota.authorId)
              ? profesori.find((p) => p.id === nota.authorId).numeDeFamilie +
                " " +
                profesori.find((p) => p.id === nota.authorId).prenume
              : nota.author,
          },
        ];
    }, []);
    let profesoriTabel = listOfProfesori
      .sort((a, b) => a?.profesor?.localeCompare(b.profesor, "ro"))
      .reduce(
        (acc, p) => {
          ++cnt;
          return {
            ...acc,
            ["tab_d" + cnt]: p.materie,
            ["tab_p" + cnt]: p.profesor,
          };
        },
        {
          tab_d1: "",
          tab_p1: "",
          tab_d2: "",
          tab_p2: "",
          tab_d3: "",
          tab_p3: "",
          tab_d4: "",
          tab_p4: "",
          tab_d5: "",
          tab_p5: "",
          tab_d6: "",
          tab_p6: "",
          tab_d7: "",
          tab_p7: "",
          tab_d8: "",
          tab_p8: "",
          tab_d9: "",
          tab_p9: "",
          tab_d10: "",
          tab_p10: "",
          tab_d11: "",
          tab_p11: "",
          tab_d12: "",
          tab_p12: "",
          tab_d13: "",
          tab_p13: "",
          tab_d14: "",
          tab_p14: "",
          tab_d15: "",
          tab_p15: "",
          tab_d16: "",
          tab_p16: "",
          tab_d17: "",
          tab_p17: "",
          tab_d18: "",
          tab_p18: "",
          tab_d19: "",
          tab_p19: "",
          tab_d20: "",
          tab_p20: "",
          tab_d21: "",
          tab_p21: "",
          tab_d22: "",
          tab_p22: "",
          tab_d23: "",
          tab_p23: "",
          tab_d24: "",
          tab_p24: "",
          tab_d25: "",
          tab_p25: "",
          tab_d26: "",
          tab_p26: "",
          tab_d27: "",
          tab_p27: "",
          tab_d28: "",
          tab_p28: "",
          tab_d29: "",
          tab_p29: "",
          tab_d30: "",
          tab_p30: "",
        }
      );

    const resume = {
      veniti: eleviData.filter((e) => e.venitNou && !e.mutat && !e.mutat)
        ?.length,
      inscrisi_start: eleviData.filter((e) => !e.venitNou)?.length,
      plecati: eleviData.filter((e) => e.mutat == true || e.retras === true)
        ?.length,
      all: eleviData.filter((e) => e.mutat !== true && e.retras !== true)
        ?.length,
      e1_med1: "",
      e1_med2: "",
      e1_medg: "",
      e2_med1: "",
      e2_med2: "",
      e2_medg: "",
      e3_med1: "",
      e3_med2: "",
      e3_medg: "",
      e4_med1: "",
      e4_med2: "",
      e4_medg: "",
      e5_med1: "",
      e5_med2: "",
      e5_medg: "",
      e6_med1: "",
      e6_med2: "",
      e6_medg: "",
      e7_med1: "",
      e7_med2: "",
      e7_medg: "",
      e8_med1: "",
      e8_med2: "",
      e8_medg: "",
      e9_med1: "",
      e9_med2: "",
      e9_medg: "",
      e10_med1: "",
      e10_med2: "",
      e10_medg: "",
      e11_med1: "",
      e11_med2: "",
      e11_medg: "",
      e12_med1: "",
      e12_med2: "",
      e12_medg: "",
      e13_med1: "",
      e13_med2: "",
      e13_medg: "",
      e14_med1: "",
      e14_med2: "",
      e14_medg: "",
      e15_med1: "",
      e15_med2: "",
      e15_medg: "",
      e16_med1: "",
      e16_med2: "",
      e16_medg: "",
      e17_med1: "",
      e17_med2: "",
      e17_medg: "",
      e18_med1: "",
      e18_med2: "",
      e18_medg: "",
      e19_med1: "",
      e19_med2: "",
      e19_medg: "",
      e20_med1: "",
      e20_med2: "",
      e20_medg: "",
      e21_med1: "",
      e21_med2: "",
      e21_medg: "",
      e22_med1: "",
      e22_med2: "",
      e22_medg: "",
      e23_med1: "",
      e23_med2: "",
      e23_medg: "",
      e24_med1: "",
      e24_med2: "",
      e24_medg: "",
      e25_med1: "",
      e25_med2: "",
      e25_medg: "",
      e26_med1: "",
      e26_med2: "",
      e26_medg: "",
      e27_med1: "",
      e27_med2: "",
      e27_medg: "",
      e28_med1: "",
      e28_med2: "",
      e28_medg: "",
      e29_med1: "",
      e29_med2: "",
      e29_medg: "",
      e30_med1: "",
      e30_med2: "",
      e30_medg: "",
      total_absente: eleviData.reduce(
        (acc, c) =>
          acc + gradesElevi[c.id].absente.absente_dupa_motivari?.length,
        0
      ),
      total_absente_nemot: eleviData.reduce(
        (acc, c) => acc + gradesElevi[c.id].absente.absente_nemotivate?.length,
        0
      ),
      ui: settings.numeInstitutie,
      loc: settings.loc,
      judet: settings.judet,
      clasa: renderClassName(clase.find((c) => c.id === classData.id)),
      director: settings.director,
      dir:
        profesori.find((p) => p.id === classData.diriginte).numeDeFamilie +
        " " +
        profesori.find((p) => p.id === classData.diriginte).prenume,
      pozitii:
        eleviData.length % 3 === 0
          ? eleviData.length + 3
          : eleviData.length + (3 - (eleviData.length % 3)),
      comp: eleviData.length,
      necomp:
        (eleviData.length % 3 === 0
          ? eleviData.length + 3
          : eleviData.length + (3 - (eleviData.length % 3))) - eleviData.length,
      ...profesoriTabel,
      ...generatedObject,
      ...{
        m1: "",
        m2: "",
        m3: "",
        m4: "",
        m5: "",
        m6: "",
        m7: "",
        m8: "",
        m9: "",
        m10: "",
        m11: "",
        m12: "",
        m13: "",
        m14: "",
        m15: "",
        m16: "",
        m17: "",
        m18: "",
        m19: "",
        m20: "",
        m21: "",
        m22: "",
        m23: "",
        m24: "",
        m25: "",
        m26: "",
        m27: "",
        m28: "",
        m29: "",
        m30: "",

        ...dateElevi,
      },
    };
    templateDoc.render(resume);

    const generatedDoc = templateDoc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
    });
    const zipFromGeneratedDoc = new PizZip(await generatedDoc.arrayBuffer());

    // Modifică XML-ul documentului

    // Generează documentul final cu modificările aplicate
    const finalGeneratedDoc = zipFromGeneratedDoc.generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
    });

    // Salvează documentul final
    return finalGeneratedDoc;
  }
  async function generateDocument() {
    if (eleviData.length === 0) return 0;
    try {
      let coperta = await generateCoperta();
      let final = await generateFinal();
      let array = [coperta];
      for await (let chunkElevi of groupArrayIntoChunks(eleviData)) {
        let doc = await generateWordChunck(chunkElevi);
        array = [...array, doc];
      }
      array = [...array, final];
      if (array.length > 1) await mergeWordDocuments(array);
    } catch (error) {
      console.error("Error generating document:", error.message);
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
    let allNotes = [];
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
      allNotes = [
        ...allNotes,
        ...(notes?.note || []),
        ...(motiveazaAbsente(notes?.note, scutiriElevi[elev.id])
          .absente_dupa_motivari || []),
      ];
      let dataE = await getDataDoc("elevi", elev.id);
      newArray.push({
        ...elev,
        ...dataE,
        key: elev.id,
        nume: elev.numeDeFamilie + " " + elev.initiala + " " + elev.prenume,
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
    setAllNotes(allNotes);
  };

  const decideNumber = () => {
    if (onlyWidth < 700) return 1;
    if (onlyWidth < 900) return 2;
    if (onlyWidth < 1500) return 3;

    return 4;
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
  const handlePrint = useReactToPrint({
    content: () => print.current,
  });

  return (
    <>
      <h3>Catalogul este gata</h3>
      {loading === true && <p>Se incarca, dureaza aproximativ 1 minut</p>}

      {loading === false && eleviData.length > 0 && (
        <Button
          onClick={async () => {
            setLoading(true);
            let res = await generateDocument();
            if (res === 0) await generateDocument();
            setLoading(false);
          }}
        >
          Print
        </Button>
      )}
    </>
  );
}

export default Catalog;
