import React, { useEffect } from "react";
import { Button, Modal, Select, DatePicker, Input, Popconfirm } from "antd";
import { useRef, useState } from "react";
import Draggable from "react-draggable";
import { deleteDataDoc, updateDocDatabase } from "../database";
import { useSelector } from "react-redux";
import { openErrorNotification } from "./Notifications/errorNotification";
import { getDataDoc } from "../database";
import userEvent from "@testing-library/user-event";

import { openSuccesNotification } from "./Notifications/succesNotification";
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

const { TextArea } = Input;
function ModalViewGrade({
  open,
  setOpen,
  eleviData,
  elevId,
  gradesElevi,
  teza,
  materieId,
  edit = null,
  tip,
  nota,
  entity,
  author,
  comentariu,

  id,
  date,
  classId,
  allData,
  deleted = "",
  materiiClasa,
  scutiri,
}) {
  const draggleRef = useRef(null);
  const user = useSelector((state) => state.user);
  const [disabled, setDisabled] = useState(true);
  const materiiRedux = useSelector((state) => state.materii);
  const materii = materiiClasa || materiiRedux;
  const [openDelete, setOpenDelete] = useState(false);
  const profesori = useSelector((state) => state.profesori);
  const [motiv, setMotiv] = useState("");

  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const showModal = () => {
    setOpen(true);
  };

  const handleOk = async (e) => {
    setOpen(false);
  };
  const handleCancel = (e) => {
    setOpen(false);
  };
  const onStart = (_event, uiData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  return (
    <div>
      <Modal
        title={
          <div
            style={{
              width: "100%",
              cursor: "move",
            }}
            onMouseOver={() => {
              if (disabled) {
                setDisabled(false);
              }
            }}
            onMouseOut={() => {
              setDisabled(true);
            }}
            // fix eslintjsx-a11y/mouse-events-have-key-events
            // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
            onFocus={() => {}}
            onBlur={() => {}}
            // end
          >
            Sterge nota
          </div>
        }
        footer={[
          edit === null &&
          deleted === "" &&
          (materii
            .find((m) => m.id === materieId)
            ?.profesori?.find((p) => p === (user.uid || user.id)) ||
            (user.type === "admin" && user.subType === "director")) ? (
            <Popconfirm
              onConfirm={async () => {
                if (
                  (gradesElevi[elevId]?.note || []).find(
                    (n) =>
                      n.materieId === materieId && n.tip === "inchidere_medie"
                  )
                ) {
                  openErrorNotification("A fost deja inchisa media");
                  return;
                }

                if (!motiv) {
                  openErrorNotification("Trebuie sa precisezi un motiv");
                  return;
                }
                setOpenDelete(false);
                let dataElev = await getDataDoc("elevi", elevId);
                //       if (tip === "nota") {
                //         await updateDocDatabase("mail", elevId + Date.now(), {
                //           to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
                //           message: {
                //             subject:
                //               "S-a sters elevului " +
                //               dataElev.numeDeFamilie +
                //               " " +
                //               dataElev.prenume +
                //               " o nota din catalog",

                //             html: `<code>
                //             <head>
                //  <style>
                //  table {
                //   font-family: arial, sans-serif;
                //   border-collapse: collapse;
                //   width: 100%;
                // }

                // td, th {
                //   border: 1px solid #dddddd;
                //   text-align: left;
                //   padding: 8px;
                // }

                // tr:nth-child(even) {
                //   background-color: #dddddd;
                // }
                //  </style>
                // </head>
                // <body>
                //             <table style="font-family: arial, sans-serif; border-collapse: collapse; width: 100%;">
                //             <tr>
                //               <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Nume</th>
                //               <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Materie</th>
                //               <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Nota</th>
                //               <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Data</th>
                //               <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Detalii</th>
                //             </tr>
                //             <tr >
                //               <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                //                 dataElev.numeDeFamilie + " " + dataElev.prenume
                //               }</td>
                //               <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                //                 materii?.find((ma) => ma.id === materieId).numeMaterie
                //               }</td>
                //               <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${nota}</td>
                //               <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${date.toLocaleDateString(
                //                 "ro-RO"
                //               )}</td>
                //               <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${motiv}</td>
                //             </tr>

                //           </table>
                //           <br/>
                //           <br/>
                //           <br/>

                //           </body></code>`,
                //           },
                //         });
                //       }

                //       if (tip === "absenta") {
                //         await updateDocDatabase("mail", elevId + Date.now(), {
                //           to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
                //           message: {
                //             subject:
                //               "S-a sters elevului " +
                //               dataElev.numeDeFamilie +
                //               " " +
                //               dataElev.prenume +
                //               " o absenta din catalog",

                //             html: `<code>
                //             <head>
                //  <style>
                //  table {
                //   font-family: arial, sans-serif;
                //   border-collapse: collapse;
                //   width: 100%;
                // }

                // td, th {
                //   border: 1px solid #dddddd;
                //   text-align: left;
                //   padding: 8px;
                // }

                // tr:nth-child(even) {
                //   background-color: #dddddd;
                // }
                //  </style>
                // </head>
                // <body>
                //             <table style="font-family: arial, sans-serif; border-collapse: collapse; width: 100%;">
                //             <tr>
                //               <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Nume</th>
                //               <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Materie</th>
                //               <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Data</th>
                //               <th style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Detalii</th>
                //             </tr>
                //             <tr>
                //               <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                //                 dataElev.numeDeFamilie + " " + dataElev.prenume
                //               }</td>
                //               <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                //                 materii?.find((ma) => ma.id === materieId).numeMaterie
                //               }</td>
                //               <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${date.toLocaleDateString(
                //                 "ro-RO"
                //               )}</td>
                //               <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${motiv}</td>
                //             </tr>

                //           </table>
                //           <br/>
                //           <br/>
                //           <br/>

                //           </body></code>`,
                //           },
                //         });
                //       }
                let grade = (gradesElevi[elevId]?.note || []).find(
                  (n) => n.id === id
                );

                await updateDocDatabase("catalog", elevId, {
                  note: (gradesElevi[elevId]?.note || []).map((n) =>
                    n.id === id
                      ? {
                          ...n,
                          ...grade,
                          delete: "waiting",
                        }
                      : n
                  ),
                });

                await updateDocDatabase("no-verify-stergeri", id, {
                  delete: "waiting",
                  motiv,
                  authorUser: {
                    subType: user.subType || "",
                    displayName: user.displayName || "",
                  },
                  author: user.uid,
                  classId,
                  elevId,
                  when: Date.now(),
                  allData: {
                    ...allData,
                    numeElev:
                      eleviData?.find((elev) => elev?.id === elevId)?.nume ||
                      eleviData?.find((elev) => elev?.id === elevId)
                        ?.numeDeFamilie +
                        " " +
                        eleviData?.find((elev) => elev?.id === elevId)
                          ?.initiala +
                        " " +
                        eleviData?.find((elev) => elev?.id === elevId)?.prenume,
                  },
                });
                let now = new Date();
                let onejan = new Date(now.getFullYear(), 0, 1);
                let week = Math.ceil(
                  ((now.getTime() - onejan.getTime()) / 86400000 +
                    onejan.getDay() +
                    1) /
                    7
                );

                setMotiv("");
                setOpenDelete(false);
              }}
              onCancel={() => {}}
              title="Sigur ca stergi?"
              description="Esti sigur ca stergi nota?"
            >
              {" "}
              <Button type="primary" danger style={{ marginRight: "10px" }}>
                Sterge
              </Button>
            </Popconfirm>
          ) : (
            <></>
          ),

          <Button
            key="back"
            onClick={() => {
              setOpenDelete(false);
              setMotiv("");
            }}
          >
            Renunt
          </Button>,
        ]}
        open={openDelete}
        onOk={handleOk}
        onCancel={handleCancel}
        modalRender={(modal) => (
          <Draggable
            disabled={disabled}
            bounds={bounds}
            onStart={(event, uiData) => onStart(event, uiData)}
          >
            <div ref={draggleRef}>{modal}</div>
          </Draggable>
        )}
      >
        <TextArea
          rows={4}
          style={{ margin: "auto", width: "80%" }}
          value={motiv}
          placeholder="Precizează motivul, acesta va fi văzut de către conducere."
          onChange={(e, v) => {
            setMotiv(e.target.value);
          }}
        />
      </Modal>
      <Modal
        title={
          <div
            style={{
              width: "100%",
              cursor: "move",
            }}
            onMouseOver={() => {
              if (disabled) {
                setDisabled(false);
              }
            }}
            onMouseOut={() => {
              setDisabled(true);
            }}
            // fix eslintjsx-a11y/mouse-events-have-key-events
            // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
            onFocus={() => {}}
            onBlur={() => {}}
            // end
          >
            Vizualizeaza nota
          </div>
        }
        footer={[
          edit === null &&
          deleted === "" &&
          (materii
            .find((m) => m.id === materieId)
            ?.profesori?.find((p) => p === (user.uid || user.id)) ||
            (user.type === "admin" && user.subType === "director")) ? (
            <Popconfirm
              onConfirm={async () => {
                if (
                  (gradesElevi[elevId]?.note || []).find(
                    (n) =>
                      n.materieId === materieId && n.tip === "inchidere_medie"
                  )
                ) {
                  openErrorNotification("A fost deja inchisa media");
                  return;
                }
                setOpen(false);
                setOpenDelete(true);
              }}
              onCancel={() => {}}
              title="Sigur ca stergi?"
              description="Esti sigur ca stergi din catalog?. Elevul va fi anunțat"
            >
              {" "}
              <Button type="primary" danger style={{ marginRight: "10px" }}>
                Sterge
              </Button>
            </Popconfirm>
          ) : (
            <></>
          ),

          <Button key="back" onClick={handleCancel}>
            OK
          </Button>,
        ]}
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        modalRender={(modal) => (
          <Draggable
            disabled={disabled}
            bounds={bounds}
            onStart={(event, uiData) => onStart(event, uiData)}
          >
            <div ref={draggleRef}>{modal}</div>
          </Draggable>
        )}
      >
        {deleted === "waiting" && (
          <p style={{ color: "red", fontSize: "20px", textAlign: "center" }}>
            Nota este în verificare pentru stergere
          </p>
        )}
        {deleted === "waiting" &&
          edit === null &&
          (materii
            .find((m) => m.id === materieId)
            ?.profesori?.find((p) => p === (user.uid || user.id)) ||
            (user.type === "admin" && user.subType === "director")) && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                style={{ margin: "auto" }}
                danger
                onClick={async () => {
                  let grade = (gradesElevi[elevId]?.note || []).find(
                    (n) => n.id === id
                  );

                  await updateDocDatabase("catalog", elevId, {
                    note: (gradesElevi[elevId]?.note || []).map((n) =>
                      n.id === id
                        ? {
                            ...n,
                            ...grade,
                            delete: "",
                          }
                        : n
                    ),
                  });

                  await deleteDataDoc("no-verify-stergeri", id);
                  setOpen(false);
                  openSuccesNotification("Anularea stergeri a fost realizata");
                }}
              >
                Anulează ștergerea
              </Button>
            </div>
          )}

        <br />
        <div style={{}}>
          <div
            style={{
              textTransform: "capitalize",
              fontWeight: "bold",
              fontSize: "16px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, color: "#1c90ff" }}>Nume</p>
            {eleviData?.find((elev) => elev?.id === elevId)?.nume ||
              eleviData?.find((elev) => elev?.id === elevId)?.numeDeFamilie +
                " " +
                eleviData?.find((elev) => elev?.id === elevId)?.initiala +
                " " +
                eleviData?.find((elev) => elev?.id === elevId)?.prenume}{" "}
          </div>
          <div
            style={{
              textTransform: "capitalize",
              fontWeight: "bold",
              fontSize: "16px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, color: "#1c90ff" }}>Data</p>

            {date?.toLocaleDateString("ro")}
          </div>
          <div
            style={{
              textTransform: "capitalize",
              fontWeight: "bold",
              fontSize: "16px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, color: "#1c90ff" }}>Materie</p>

            {materii?.find((mat) => mat?.id === materieId)?.numeMaterie}
          </div>
          <div
            style={{
              textTransform: "capitalize",
              fontWeight: "bold",
              fontSize: "16px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, color: "#1c90ff" }}>Tip</p>
            {tip === "absenta" && entity?.motivat === true ? (
              <div
                style={{
                  color: "green",
                  border: "1px solid green",
                  borderRadius: "2px",
                  textTransform: "capitalize",
                  fontWeight: "bold",
                  fontSize: "16px",
                  textAlign: "center",
                }}
              >
                {" "}
                {tip}
                <p style={{ color: "green" }}>
                  Motivat:{" "}
                  {entity?.scutire?.ranges?.map(
                    (range) =>
                      formatDate(new Date(range.start)) +
                      " - " +
                      formatDate(new Date(range.end)) +
                      "; "
                  ) || "Întârziat"}
                </p>
              </div>
            ) : tip === "absenta" ? (
              <p
                style={{
                  color: "red",
                  textTransform: "capitalize",
                  fontWeight: "bold",
                  fontSize: "16px",
                  textAlign: "center",
                }}
              >
                {" "}
                {tip}
              </p>
            ) : (
              <>{tip}</>
            )}
          </div>
          {tip === "nota" && (
            <div
              style={{
                textTransform: "capitalize",
                fontWeight: "bold",
                fontSize: "16px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0, color: "#1c90ff" }}>Nota</p>

              {nota}
            </div>
          )}
          {tip === "examen_final" && (
            <div
              style={{
                textTransform: "capitalize",
                fontWeight: "bold",
                fontSize: "16px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0, color: "#1c90ff" }}>Nota</p>

              {nota}
            </div>
          )}
        </div>
        <br />
        <p style={{ textAlign: "center" }}>
          Autor:{" "}
          {author?.includes(" ")
            ? author
            : profesori?.find((p) => p.id === author)?.numeDeFamilie +
              " " +
              profesori?.find((p) => p.id === author)?.prenume}
        </p>
        <div
          style={{
            margin: "auto",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {comentariu && (
            <TextArea
              rows={4}
              style={{ margin: "auto", width: "80%" }}
              value={comentariu}
            />
          )}
        </div>
        <br />

        {user?.id === allData?.authorId &&
          Date.now() - allData?.timestamp <= 60 * 60 * 1000 &&
          tip === "absenta" &&
          edit === null &&
          entity?.motivat !== true && (
            <Button
              style={{
                backgroundColor: "#ccb60e",
                color: "white",
                fontSize: "16px",
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
                width: "100px",
              }}
              onClick={async () => {
                let dataElev = await getDataDoc("elevi", elevId);
                const { note } = await getDataDoc("catalog", elevId);
                await updateDocDatabase("catalog", elevId, {
                  note: (note || []).map((n) =>
                    n.id === id
                      ? {
                          ...n,

                          intarziat: true,
                        }
                      : n
                  ),
                });
                await updateDocDatabase("mail", elevId + Date.now(), {
                  to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
                  message: {
                    subject:
                      "Elevul " +
                      dataElev.numeDeFamilie +
                      " " +
                      dataElev.prenume +
                      " a fost marcat ca întârziat",

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
                      <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${date.toLocaleDateString(
                        "ro-RO"
                      )}</td>
                      <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">Absenta a fost motivată</td>
                    </tr>
                    
                  </table>
                  <br/>
                  <br/>
                  <br/>
                 
                  </body></code>`,
                  },
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
                  classId + "week" + week
                );
                let previous = [];
                if (changelogGet) previous = changelogGet;
                await updateDocDatabase("changelog", classId + "week" + week, {
                  changelog: [
                    ...(previous.changelog || []),
                    {
                      author:
                        user.subType === "director"
                          ? "Director Unitate"
                          : user.displayName,
                      time: Date.now(),
                      classId,
                      motiv: "Întârziat",
                      elevId,
                      nota: { tip, nota: nota || "fara", date: date.getTime() },
                      sterge: true,
                    },
                  ],
                });

                await updateDocDatabase("no-verify-stergeri", id, {
                  delete: "accepted",
                  motiv: "Întârziat",
                  authorUser: {
                    subType: user.subType || "",
                    displayName: user.displayName || "",
                  },
                  author: user.uid,
                  classId,
                  elevId,
                  when: Date.now(),
                  allData: {
                    ...allData,
                    numeElev:
                      eleviData?.find((elev) => elev?.id === elevId)?.nume ||
                      eleviData?.find((elev) => elev?.id === elevId)
                        ?.numeDeFamilie +
                        " " +
                        eleviData?.find((elev) => elev?.id === elevId)
                          ?.initiala +
                        " " +
                        eleviData?.find((elev) => elev?.id === elevId)?.prenume,
                  },
                });

                setOpen(false);
                openSuccesNotification("Ai marcat cu succes ca intarziat");
              }}
            >
              Întârziat
            </Button>
          )}
      </Modal>
    </div>
  );
}

export default ModalViewGrade;
