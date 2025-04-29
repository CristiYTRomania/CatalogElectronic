import React, { useEffect, useMemo } from "react";
import { Button, Modal, Select, DatePicker, Input, Popconfirm } from "antd";
import { useRef, useState } from "react";
import Draggable from "react-draggable";
import dayjs from "dayjs";
import { InputNumber } from "antd";
import { getDataDoc, updateDocDatabase } from "../database/index";
import { openErrorNotification } from "./Notifications/errorNotification";
import { useSelector } from "react-redux";
import { paddingTopIcon } from "@progress/kendo-svg-icons";

import { openSuccesNotification } from "./Notifications/succesNotification";
import { calculeaza_medie_materie } from "../utils/calculare_medie";
import CatalogElev from "../Pages/Elevi/CatalogElev";
const dateFormat = "DD/MM/YYYY";
const { TextArea } = Input;
function ModalAddGrade({
  open,
  setOpen,
  eleviData,
  elevId,
  setElevId,
  materii,
  gradesElevi,
  fullAcces,
  dupaTermen,
  scutiri,
  classData,
  classId,
  diriginteEmail,
}) {
  const draggleRef = useRef(null);
  const user = useSelector((state) => state.user);
  const [date, setDate] = useState(dayjs(new Date()));
  const [materieId, setMaterieId] = useState(materii?.[0]?.id);
  const [tip, setTip] = useState("absenta");
  const [tezaNota, setTezaNota] = useState(null);
  const [inchidere, setInchidere] = useState(0);
  const [corigenta, setCorigenta] = useState();
  const [nota, setNota] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comentariu, setComentariu] = useState("");
  const [teza, setTeza] = useState([]);
  const materiiRedux = useSelector((state) => state.materii);
  const [examenFinal, setExamenFinal] = useState(null);
  const settings = useSelector((state) => state.settings);
  const [disabled, setDisabled] = useState(true);
  const [notare, setNotare] = useState(true);
  const [inchereMedie, setInchereMedie] = useState([]);
  const memorizedMateriiLimited = useMemo(
    () => [materieId || "undefined"],
    [materieId]
  );

  const memorizedElevId = useMemo(() => elevId, [elevId]);

  const digits_only = (string) =>
    [...string].every((c) => "0123456789".includes(c));
  const comentariii =
    process.env.REACT_APP_RESTRICT !== "enable"
      ? [
          {
            label: "Comentariu",
            value: "comentariu",
          },
        ]
      : [];
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const showModal = () => {
    setOpen(true);
  };
  useEffect(() => {
    setNotare(
      materii?.find((ma) => ma.id === materieId)?.notare === undefined
        ? true
        : materii?.find((ma) => ma.id === materieId)?.notare
    );
  }, [materieId]);
  const addGrade = async () => {
    try {
      setLoading(true);
      if (!(materieId?.length > 0)) {
        setLoading(false);
        openErrorNotification("Selectează o materie");
        return;
      }

      if (tip === "comentariu" && !comentariu.length > 0) {
        setLoading(false);
        openErrorNotification("Nu poti trimite comentariu gol");
        return;
      }
      if (tip === "comentariu" && digits_only(comentariu)) {
        setLoading(false);
        openErrorNotification(
          "Nu poti trimite note in comentarii. Daca vrei sa trimiti un punctaj ca comentariu scrie si un text informativ"
        );
        return;
      }

      if (
        (gradesElevi[elevId]?.note || [])?.find(
          (n) => n.materieId === materieId && n.tip === "inchidere_medie"
        ) &&
        !(tip === "absenta" || tip === "comentariu")
      ) {
        setLoading(false);
        openErrorNotification("A fost deja inchisă media");
        return;
      }

      if (date.isValid() === false) {
        setLoading(false);
        openErrorNotification("Data este invalida");
        return;
      }
      let updateObj = {
        date: date.valueOf(),
        tip,
        id: Date.now() + "dd",
        timestamp: Date.now(),
        comentariu,
        materieId,
        authorId: user.uid,
        author: user.displayName,
        displayName: user.numeDeFamilie + " " + user.prenume,
        photoURL: user.photoLink || "",
      };
      if (tip === "nota") {
        if (!(nota > 0 && nota <= 10) && notare === true) {
          setLoading(false);
          openErrorNotification("Nota nu este valabila");
          return;
        }
        if (
          !(nota === "FB" || nota === "I" || nota === "B" || nota === "S") &&
          notare === false
        ) {
          setLoading(false);
          openErrorNotification("Nota nu este valabila");
          return;
        }
        updateObj["nota"] = nota;
      }
      if (tip === "examen_final") {
        if (!(examenFinal > 0 && examenFinal <= 10) && notare === true) {
          setLoading(false);
          openErrorNotification("Nota nu este valabila");
          return;
        }
        if (tip === "examen_final" && notare === false) {
          if (
            !(
              examenFinal === "FB" ||
              examenFinal === "B" ||
              examenFinal === "S" ||
              examenFinal === "I"
            )
          ) {
            setLoading(false);
            openErrorNotification("Nota nu este valabila");
            return;
          }
        }
        if (
          (gradesElevi[elevId]?.note || [])?.find(
            (n) => n.materieId === materieId && n.tip === "examen_final"
          )
        ) {
          setLoading(false);
          openErrorNotification("Examenul  a fost pus deja");
          return;
        }
        updateObj["examen_final"] = examenFinal;
      }
      if (tip === "inchidere_medie") {
        updateObj["inchidere_medie"] = inchidere;
        if (
          (gradesElevi[elevId]?.note || [])?.filter(
            (n) => n.materieId === materieId && n.tip === "nota"
          ).length <
          (classData.ore.filter((o) => o.materieId === materieId).length || 1) +
            3
        ) {
          setLoading(false);
          openErrorNotification(
            "Note insuficiente, numar minim de note " +
              ((classData.ore.filter(
                (o) =>
                  o.materieId === materieId &&
                  o.startDate >= new Date("2024-09-01")
              ).length || 1) +
                3)
          );
          return;
        }
        if (
          inchidere === "nu exista note" ||
          inchidere === "Alege calificativ" ||
          inchidere === 0
        ) {
          setLoading(false);
          openErrorNotification("Nu poti inchide media, fară note in catalog");
          setOpen(false);
          return;
        }
      }
      if (tip === "corigenta") {
        updateObj["corigenta"] = corigenta;
      }
      await updateDocDatabase("catalog", elevId, {
        note: [
          ...(gradesElevi[elevId]?.note || []),
          {
            ...updateObj,
          },
        ],
      });
      let now = new Date();
      let onejan = new Date(now.getFullYear(), 0, 1);
      let week = Math.ceil(
        ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) /
          7
      );

      let changelogGet = await getDataDoc(
        "changelog",
        classData.id + "week" + week
      );
      let previous = [];
      if (changelogGet) previous = changelogGet;
      await updateDocDatabase("changelog", classData.id + "week" + week, {
        changelog: [
          ...(previous.changelog || []),
          {
            author: user.displayName,
            time: Date.now(),
            classId,
            elevId,
            nota: updateObj,
          },
        ],
      });

      let dataElev = await getDataDoc("elevi", elevId);

      if (tip === "nota") {
        await updateDocDatabase("mail", elevId + Date.now(), {
          to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
          message: {
            subject:
              dataElev.numeDeFamilie +
              " " +
              dataElev.prenume +
              " a primit o noua nota in catalog",

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
              <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Nota</th>
              <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Data</th>
              <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Detalii</th>
            </tr>
            <tr >
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                dataElev.numeDeFamilie + " " + dataElev.prenume
              }</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                materii?.find((ma) => ma.id === materieId).numeMaterie
              }</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${nota}</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${date
                .toDate()
                .toLocaleDateString("ro-RO")}</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${comentariu}</td>
            </tr>
            
          </table>
          <br/>
          <br/>
          <br/>
       
          </body></code>`,
          },
        });
      }
      if (tip === "examen_final") {
        await updateDocDatabase("mail", elevId + Date.now(), {
          to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
          message: {
            subject:
              dataElev.numeDeFamilie +
              " " +
              dataElev.prenume +
              " a primit nota la testul final",

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
              <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Nota</th>
              <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Data</th>
              <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Detalii</th>
            </tr>
            <tr >
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                dataElev.numeDeFamilie + " " + dataElev.prenume
              }</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                materii?.find((ma) => ma.id === materieId).numeMaterie
              }</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${examenFinal}</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${date
                .toDate()
                .toLocaleDateString("ro-RO")}</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${comentariu}</td>
            </tr>
            
          </table>
          <br/>
          <br/>
          <br/>
          <p style="font-size:10px; text-align:center">
          
          </p>
          </body></code>`,
          },
        });
      }
      if (tip === "absenta") {
        await updateDocDatabase("mail", elevId + Date.now(), {
          to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
          message: {
            subject:
              dataElev.numeDeFamilie +
              " " +
              dataElev.prenume +
              " a primit o absență in catalog",

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
              <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Detalii</th>
            </tr>
            <tr>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                dataElev.numeDeFamilie + " " + dataElev.prenume
              }</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                materii?.find((ma) => ma.id === materieId).numeMaterie
              }</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${date
                .toDate()
                .toLocaleDateString("ro-RO")}</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${comentariu}</td>
            </tr>
            
          </table>
          <br/>
          <br/>
          <br/>
        
         
          </body></code>`,
          },
        });
      }
      if (tip === "comentariu") {
        await updateDocDatabase("mail", elevId + Date.now(), {
          to: [
            dataElev.adresaEmail,
            ...(dataElev.parintii || []),
            diriginteEmail,
          ],
          message: {
            subject:
              dataElev.numeDeFamilie +
              " " +
              dataElev.prenume +
              " a primit un comentariu de la " +
              user.displayName,

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
              <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Detalii</th>
            </tr>
            <tr>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                dataElev.numeDeFamilie + " " + dataElev.prenume
              }</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                materii?.find((ma) => ma.id === materieId).numeMaterie
              }</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${date
                .toDate()
                .toLocaleDateString("ro-RO")}</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${comentariu}</td>
            </tr>
            
          </table>
          <br/>
          <br/>
          <br/>
         
          </body></code>`,
          },
        });
      }
      if (tip === "inchidere_medie") {
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
              
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${date
                .toDate()
                .toLocaleDateString("ro-RO")}</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${inchidere}</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${comentariu}</td>
            </tr>
            
          </table>
          </body></code>`,
          },
        });
      }
      if (tip === "corigenta") {
        await updateDocDatabase("mail", elevId + Date.now(), {
          to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
          message: {
            subject:
              dataElev.numeDeFamilie +
              " " +
              dataElev.prenume +
              " a primit corigenta  ",

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
              <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Corigenta</th>
              <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Detalii</th>
            </tr>
            <tr>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                dataElev.numeDeFamilie + " " + dataElev.prenume
              }</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                materii?.find((ma) => ma.id === materieId).numeMaterie
              }</td>
              
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${date
                .toDate()
                .toLocaleDateString("ro-RO")}</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${corigenta}</td>
              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${comentariu}</td>
            </tr>
            
          </table>
          </body></code>`,
          },
        });
      }
      openSuccesNotification("SUCCES!");
      setLoading(false);
    } catch (err) {
      console.log(err);
      openErrorNotification(err.message);
      setLoading(false);
    }
  };

  const handleOk = async (e) => {
    await addGrade();
    setInchidere(0);
    setOpen(false);
  };
  const handleCancel = (e) => {
    setInchidere(0);
    setOpen(false);
  };

  useEffect(() => {
    const teza = [];
    if (materii?.find((ma) => ma?.id === materieId)?.teza === true) {
      teza.push({ label: "Teza", value: "teza" });
    }
    setTeza(teza);
  }, [materieId]);
  useEffect(() => {
    if (!materieId) return;
    let array = (gradesElevi[elevId]?.note || [])
      ?.filter((n) => n.materieId === materieId)
      .map((el) => {
        return { label: el.nota, value: el.nota };
      });

    let uniquearray = [];
    array?.forEach((element) => {
      if (uniquearray?.find((el) => el.value === element.value) === undefined) {
        uniquearray.push(element);
      }
    });

    setInchereMedie(uniquearray);
    const calificative = {
      FB: 1,
      B: 2,
      S: 3,
      I: 4,
    };
    let freq = {};
    let notaFinala = 0,
      frv = 0;
    if (notare === false) {
      notaFinala = "Alege calificativ";
    } else {
      notaFinala = calculeaza_medie_materie(
        gradesElevi[elevId]?.note,
        materii?.find((ma) => ma.id === materieId),
        scutiri[elevId]
      ).medie;
    }

    setInchidere(notaFinala || 0);
  }, [elevId, gradesElevi, materieId, materii, notare, tip]);
  return (
    <div>
      <Modal
        confirmLoading={loading}
        title={
          <div
            style={{
              width: "100%",
              cursor: "move",
            }}
            // fix eslintjsx-a11y/mouse-events-have-key-events
            // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
            onFocus={() => {}}
            onBlur={() => {}}
            // end
          >
            Adaugă în Catalog
          </div>
        }
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <div style={{ margin: "auto", textAlign: "center" }}>
          <Select
            placeholder="Elev"
            style={{
              width: "100%",
              border: "1px solid red",
            }}
            className="sentry-mask"
            value={elevId}
            onChange={(e, data) => {
              setElevId(e);
            }}
            options={eleviData.map((el) => {
              return {
                label: el.numeDeFamilie + " " + el.initiala + " " + el.prenume,
                value: el?.id,
              };
            })}
          />
          <Select
            style={{
              width: "100%",
              marginTop: "2%",
            }}
            value={materieId}
            onChange={(e, data) => {
              setMaterieId(e);
            }}
            options={materii?.map((ma) => {
              return { label: ma?.numeMaterie, value: ma?.id };
            })}
          />{" "}
          <br />
        </div>
        <div style={{ marginTop: "15px" }}>
          <CatalogElev
            materiiLimited={[materieId || "undefined"]}
            elevIdPassed={elevId}
            open={open}
          />
        </div>

        <div style={{ margin: "auto", textAlign: "center" }}>
          <h3 style={{ marginTop: "15px" }}>Adaug in catalog</h3>
          <Select
            placeholder="Tip"
            style={{
              width: "100%",
              marginTop: "2%",
            }}
            value={tip}
            onChange={(e, data) => {
              setTip(e);
            }}
            options={[
              ...comentariii,
              { label: "Nota", value: "nota" },
              { label: "Absență", value: "absenta" },

              ...teza,
              { label: "Examen Final Vocational", value: "examen_final" },
              { label: "Incheie Medie", value: "inchidere_medie" },
              { label: "Corigenta", value: "corigenta" },
            ]}
          />
          <br />
          {tip === "nota" && notare === true && (
            <InputNumber
              min={1}
              value={nota}
              max={10}
              placeholder="NOTA"
              style={{
                border: "1px solid red",
                width: "30%",
                marginTop: "5px",
              }}
              onChange={(value) => {
                setNota(value);
              }}
            />
          )}
          {tip === "nota" && notare === false && (
            <Select
              placeholder="Calificativ"
              style={{
                width: "100%",
                marginTop: "2%",
                border: "1px solid red",
              }}
              value={nota}
              onChange={(e, data) => {
                setNota(e);
              }}
              options={[
                { label: "Foarte Bine", value: "FB" },
                { label: "Bine", value: "B" },
                { label: "Suficient", value: "S" },
                { label: "Insuficient", value: "I" },
              ]}
            />
          )}{" "}
          {tip === "teza" && (
            <InputNumber
              min={1}
              value={tezaNota}
              max={10}
              placeholder="NOTA"
              style={{
                border: "1px solid red",
                width: "100%",
                marginTop: "2%",
              }}
              onChange={(value) => {
                setTezaNota(value);
              }}
            />
          )}
          {tip === "corigenta" && notare === false && (
            <Select
              placeholder="Calificativ"
              style={{
                width: "100%",
                border: "1px solid red",
                marginTop: "2%",
              }}
              value={corigenta}
              onChange={(e, data) => {
                setCorigenta(e);
              }}
              options={[
                { label: "Foarte Bine", value: "FB" },
                { label: "Bine", value: "B" },
                { label: "Suficient", value: "S" },
                { label: "Insuficient", value: "I" },
              ]}
            />
          )}
          {tip === "corigenta" && notare !== false && (
            <InputNumber
              min={1}
              value={corigenta}
              placeholder="NOTA"
              style={{ border: "1px solid red", marginTop: "2%" }}
              max={10}
              onChange={(value) => {
                setCorigenta(value);
              }}
            />
          )}
          {tip === "inchidere_medie" && notare === false && (
            <Select
              placeholder="Calificativ"
              style={{
                width: "100%",
                border: "1px solid red",
                marginTop: "2%",
              }}
              value={inchidere}
              onChange={(e, data) => {
                setInchidere(e);
              }}
              options={[
                { label: "Foarte Bine", value: "FB" },
                { label: "Bine", value: "B" },
                { label: "Suficient", value: "S" },
                { label: "Insuficient", value: "I" },
              ]}
            />
          )}
          {tip === "examen_final" && notare === true && (
            <InputNumber
              style={{
                width: "100%",
                border: "1px solid red",
                marginTop: "2%",
              }}
              min="1"
              max="10"
              step="0.01"
              onChange={(e, data) => {
                setExamenFinal(e);
              }}
            />
          )}
          {tip === "examen_final" && notare === false && (
            <Select
              placeholder="Calificativ"
              style={{
                width: "100%",
                border: "1px solid red",
                marginTop: "2%",
              }}
              value={examenFinal}
              options={[
                { value: "FB", label: "FB" },
                { value: "B", label: "B" },
                { label: "S", value: "S" },
                { label: "I", value: "I" },
              ]}
              onChange={(e, data) => {
                setExamenFinal(e);
              }}
            />
          )}
          <p
            style={{ fontSize: "15px", marginBottom: "3px", marginTop: "3px" }}
          >
            la data de
          </p>
          <DatePicker
            placeholder="Data"
            format={dateFormat}
            disabledDate={(current) => {
              // Verificăm dacă data curentă este sâmbătă sau duminică
              const isOver21Days = (date) => {
                const today = dayjs();
                const diffInDays = today.diff(date, "day");
                const isFuture = dayjs(date).isAfter(today, "day");

                return (
                  (process.env.REACT_APP_LIMIT_DATE === "enable" &&
                    diffInDays > 21) ||
                  isFuture
                );
              };
              return (
                current &&
                (current.day() === 0 ||
                  current.day() === 6 ||
                  (isOver21Days(current) &&
                    user?.type !== "admin" &&
                    fullAcces !== true &&
                    dupaTermen !== true &&
                    settings?.treiSapt !== true &&
                    user?.treiSapt !== true))
              );
            }}
            value={dayjs(date, dateFormat)}
            onChange={(e, data) => {
              setDate(dayjs(data, dateFormat));
            }}
            style={{ textAlign: "center" }}
          />{" "}
        </div>
        <br />

        <div
          style={{
            margin: "auto",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <TextArea
            placeholder="COMENTARIU"
            rows={2}
            style={{ margin: "auto", width: "80%" }}
            value={comentariu}
            onChange={(e, value) => {
              setComentariu(e.target.value);
            }}
          />
        </div>
        <br />
        <br />
        <p style={{ color: "red", textAlign: "center", fontSize: "14px" }}>
          Urmează să pui {tip}
        </p>
      </Modal>
    </div>
  );
}

export default ModalAddGrade;
