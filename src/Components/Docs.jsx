import { Button, Card, Input, Tag } from "antd";
import React, { useEffect, useState } from "react";
import { Accordion, Icon, Label } from "semantic-ui-react";
import ModalAddDocument from "./ModalAddDocument";
import { db } from "../database/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { renderClassName } from "../utils";
import ModalTransfer from "./ModalTransfer";
import {
  getDataDoc,
  downloadFolderAsZip,
  updateDocDatabase,
} from "../database";
import { useSelector } from "react-redux";
import { openErrorNotification } from "./Notifications/errorNotification";
import { openSuccesNotification } from "./Notifications/succesNotification";
import Clase from "../Pages/Admin/Clase";
import withErrorBoundary from "./withErrorComponent";
const { TextArea } = Input;
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

const Docs = ({
  elevId,
  numeElev,
  classId,
  retras = false,
  modeOf = "edit",
  openAll = undefined,
  elevData,
  transferuri = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [open, setOpen] = useState(false);
  const user = useSelector((state) => state.user);
  const [editTransfer, setEditTransfer] = useState(false);
  const [idTransfer, setIdTransfer] = useState("");
  const [promiss, setPromiss] = useState("");
  const [clasaVeche, setClasaVeche] = useState("");
  const [mode, setMode] = useState(null);
  const [docsElev, setDocsElev] = useState([]);
  const clase = useSelector((state) => state.clase);
  const handleClick = (e, titleProps) => {
    const { index } = titleProps;

    const newIndex = activeIndex === index ? -1 : index;

    setActiveIndex(newIndex);
  };

  const fetch = async () => {
    try {
      const data = await getDataDoc("eleviDocumente", elevId);

      setDocsElev(data?.docsElev);
    } catch (err) {
      openErrorNotification(err.message);
    }
  };
  useEffect(() => {
    if (!elevId) return;

    const unsub = onSnapshot(doc(db, "eleviDocumente", elevId), (doc) => {
      const source = doc.metadata.hasPendingWrites ? "Local" : "Server";
      setDocsElev(doc.data()?.docsElev);
    });
    return unsub;
  }, [elevId]);
  useEffect(() => {
    if (!elevId) return;
    fetch();
  }, [elevId]);

  return (
    <div>
      <ModalTransfer
        open={editTransfer}
        setOpen={setEditTransfer}
        id={elevId}
        idTransfer={idTransfer}
        elevData={elevData}
        promiss={promiss}
        clasaVeche={clasaVeche}
      />

      {retras !== true && modeOf !== "view" && transferuri === false && (
        <Button
          type="primary"
          style={{ width: "100%" }}
          onClick={() => {
            setOpen(true);
          }}
        >
          Adaugă Document
        </Button>
      )}
      {modeOf !== "view" && transferuri === false && (
        <ModalAddDocument
          open={open}
          setOpen={setOpen}
          elevId={elevId}
          docsElev={docsElev}
          setDocsElev={setDocsElev}
          mode={mode}
          classId={classId}
          setMode={setMode}
          numeElev={numeElev}
        />
      )}
      {transferuri === false && (
        <Accordion fluid styled>
          {docsElev
            ?.sort((a, b) => {
              const statusOrder = {
                waiting: 0,
                denied: 2,
                accepted: 2,
                undefined: 3,
              };

              if (
                statusOrder[a.verified || "undefined"] ===
                statusOrder[b.verified || "undefined"]
              ) {
                return b.id - a.id;
              }

              return (
                statusOrder[a.verified || "undefined"] -
                statusOrder[b.verified || "undefined"]
              );
            })
            .filter((doc) => doc.verified === "accepted" || mode !== "view")
            ?.map((doc, index) => {
              return (
                <div style={{ pageBreakInside: "avoid" }}>
                  <Accordion.Title
                    active={activeIndex === index}
                    index={index}
                    onClick={handleClick}
                  >
                    {" "}
                    <Icon name="dropdown" />
                    {doc.nume}
                    {" - "}{" "}
                    {doc.subType === "profesor" ? "Motivare profesor" : doc.tip}
                    {doc.tip === "scutire" || doc.tip === "bilet"
                      ? " #" +
                        doc?.ranges?.map(
                          (range) =>
                            " " +
                            formatDate(new Date(range.start)) +
                            " - " +
                            formatDate(new Date(range.end))
                        )
                      : " #" + formatDate(new Date(doc.uploaded))}
                    &nbsp; &nbsp; &nbsp;
                    {doc.verified === "waiting" && (
                      <Tag color="yellow">Scutire în curs de validare</Tag>
                    )}
                    {doc.verified === "accepted" && (
                      <Tag color="green"> Validat</Tag>
                    )}
                    {doc.verified === "denied" && (
                      <Tag color="red"> Scutire Respinsă - {doc.motiv}</Tag>
                    )}
                  </Accordion.Title>

                  <Accordion.Content active={openAll || activeIndex === index}>
                    {" "}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-around",
                      }}
                    >
                      <div>
                        Nume &nbsp;
                        {doc.nume}
                      </div>
                      <div>
                        Tip &nbsp;
                        {doc.subType === "profesor"
                          ? "Motivare profesor"
                          : doc.tip === "scutire"
                          ? "Scutire medicala/oficiala"
                          : doc.tip === "bilet"
                          ? "Bilet de voie"
                          : doc.tip}
                      </div>
                      {(doc.tip === "scutire" || doc.tip === "bilet") && (
                        <div>
                          Interval: &nbsp;
                          {doc?.ranges?.map(
                            (range) =>
                              formatDate(new Date(range.start)) +
                              " - " +
                              formatDate(new Date(range.end)) +
                              "; "
                          )}
                        </div>
                      )}

                      <div>
                        Incarcat in &nbsp;
                        {formatDate(new Date(doc.uploaded))}
                      </div>
                    </div>
                    <br />
                    <TextArea
                      value={doc.details}
                      style={{ width: "50%", outline: "none" }}
                    />
                    <br />
                    <br />
                    {doc.download && (
                      <Button
                        type="primary"
                        onClick={() => {
                          downloadFolderAsZip(
                            "documente" + doc.id + "_" + doc.uploaded,
                            numeElev + "_document" + doc.nume
                          );
                        }}
                      >
                        Descarca Documente
                      </Button>
                    )}
                    <br />
                    <br />
                    {modeOf !== "view" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          margin: "auto",
                          justifyContent: "center",
                        }}
                      >
                        {user.type === "admin" && (
                          <Button
                            danger
                            style={{ width: "25%" }}
                            onClick={async () => {
                              await updateDocDatabase(
                                "eleviDocumente",
                                elevId,
                                {
                                  docsElev: docsElev.filter(
                                    (d) => d.id !== doc.id
                                  ),
                                }
                              ).then(() => {
                                openSuccesNotification("Ai sters documentul");
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
                              await updateDocDatabase(
                                "changelog",
                                classId + "week" + week,
                                {
                                  changelog: [
                                    ...(previous.changelog || []),
                                    {
                                      author: user.displayName,
                                      time: Date.now(),
                                      classId,
                                      elevId,
                                      sterge: true,
                                      scutire: doc,
                                    },
                                  ],
                                }
                              );
                            }}
                          >
                            Sterge
                          </Button>
                        )}

                        <Button
                          type="dashed"
                          style={{ width: "25%" }}
                          onClick={() => {
                            setMode({
                              type: "edit",
                              values: {
                                nume: doc.nume,
                                tip: doc.tip,
                                details: doc.details,
                                ranges: doc.ranges,
                                uploaded: doc.uploaded,
                                lastId: doc.id,
                                tip_scutire: doc.tip_scutire,
                                id: doc.id,
                              },
                            });
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </Accordion.Content>
                </div>
              );
            })}
        </Accordion>
      )}

      {transferuri === true && elevData?.transferuri?.length > 0 && (
        <>
          <h3 style={{ textAlign: "center" }}>Transferuri</h3>
          {elevData?.transferuri?.map((t) => {
            return (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                  }}
                >
                  <div>
                    Clasa Veche:{" "}
                    {renderClassName(clase.find((c) => c.id === t.clasaVeche))}
                  </div>
                  <div>
                    Clasa Noua:{" "}
                    {renderClassName(clase.find((c) => c.id === t.clasaNoua))}
                  </div>

                  <div>Din data de: {formatDate(new Date(t.dataTransfer))}</div>
                </div>
                <br />
                <TextArea
                  value={t.details}
                  style={{ width: "50%", outline: "none" }}
                />
                <br />
                <br />
                <br />
                {modeOf !== "view" && (
                  <>
                    <Button
                      onClick={() => {
                        setPromiss(t.clasaNoua);
                        setClasaVeche(t.clasaVeche);
                        setIdTransfer(t.id);
                        setEditTransfer(true);
                      }}
                    >
                      Modifica transfer
                    </Button>
                    <Button
                      style={{ marginLeft: "10px" }}
                      danger
                      onClick={async () => {
                        let transferuri = elevData.transferuri.filter(
                          (a) => a.id !== t.id
                        );

                        await updateDocDatabase("elevi", elevData.id, {
                          transferuri: transferuri,
                        });
                        window.location.reload();
                      }}
                    >
                      Sterge Transfer
                    </Button>
                  </>
                )}
                <br /> <br />
                <br />
              </>
            );
          })}
        </>
      )}

      <br />
      <br />
    </div>
  );
};
export default withErrorBoundary(Docs);
