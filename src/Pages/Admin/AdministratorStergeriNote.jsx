import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Select, Input, Button } from "antd";
import { DatePicker } from "antd";
import { getDataDoc } from "../../database";
import { getDocs, collection, onSnapshot } from "firebase/firestore";
import { db } from "../../database/firebase";
import { formatDate } from "../../utils/index";
import { Spin } from "antd";
import { downloadFolderAsZip, updateDocDatabase } from "../../database";
import { Modal } from "antd";
import {
  TableRow,
  TableHeaderCell,
  TableHeader,
  TableCell,
  TableBody,
  Icon,
  Table,
} from "semantic-ui-react";
import Clase from "./Clase";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";

const { TextArea } = Input;

function ChangeLog() {
  const acceptaStergere = async (c) => {
    setLoading(true);
    const { note } = await getDataDoc("catalog", c.elevId);
    await updateDocDatabase("no-verify-stergeri", c.id, {
      delete: "accepted",
    });
    let now = new Date();
    let onejan = new Date(now.getFullYear(), 0, 1);
    let week = Math.ceil(
      ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
    );
    let changelogGet = await getDataDoc("changelog", c.classId + "week" + week);
    let previous = [];
    if (changelogGet) previous = changelogGet;
    await updateDocDatabase("changelog", c.classId + "week" + week, {
      changelog: [
        ...(previous.changelog || []),
        {
          author:
            c?.authorUser?.subType === "director"
              ? "Director Unitate"
              : c?.authorUser?.displayName,
          time: c.when,
          classId: c.classId,
          motiv: c.motiv,
          elevId: c.elevId,
          nota: {
            ...c.allData,
            tip: c?.allData?.tip,
            nota: c?.allData?.nota || "fara",
            date: c?.allData?.date,
          },
          sterge: true,
        },
      ],
    });
    await updateDocDatabase("catalog", c.elevId, {
      note: (note || []).filter((n) => n.id !== c.id),
    });

    let dataElev = await getDataDoc("elevi", c.elevId);
    if (c?.allData?.tip === "nota") {
      await updateDocDatabase("mail", "stergere" + c.elevId + Date.now(), {
        to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
        message: {
          subject:
            "S-a sters elevului " +
            dataElev.numeDeFamilie +
            " " +
            dataElev.prenume +
            " o nota din catalog",

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
                                materii?.find(
                                  (ma) => ma.id === c?.allData?.materieId
                                ).numeMaterie
                              }</td>
                              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                                c?.allData?.nota
                              }</td>
                              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${new Date(
                                parseInt(c?.allData?.date)
                              ).toLocaleDateString("ro-RO")}</td>
                              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                                c.motiv
                              }</td>
                            </tr>

                          </table>
                          <br/>
                          <br/>
                          <br/>

                          </body></code>`,
        },
      });
    }

    if (c?.allData?.tip === "absenta") {
      await updateDocDatabase("mail", "stergere" + c?.elevId + Date.now(), {
        to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
        message: {
          subject:
            "S-a sters elevului " +
            dataElev.numeDeFamilie +
            " " +
            dataElev.prenume +
            " o absenta din catalog",

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
                                materii?.find(
                                  (ma) => ma.id === c?.allData?.materieId
                                ).numeMaterie
                              }</td>
                              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${new Date(
                                parseInt(c?.allData?.date)
                              ).toLocaleDateString("ro-RO")}</td>
                              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                                c?.motiv
                              }</td>
                            </tr>

                          </table>
                          <br/>
                          <br/>
                          <br/>

                          </body></code>`,
        },
      });
    }
  };
  const [stergeri, setStergeri] = useState();
  const clase = useSelector((state) => state.clase);
  const [isModalVisible, setModalVisible] = useState();
  const [motiv, setMotiv] = useState("");
  const [cObject, setCObject] = useState({});
  const materii = useSelector((state) => state.materii);
  const [loading, setLoading] = useState(false);

  const profesori = useSelector((state) => state.profesori);
  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(db, "no-verify-stergeri"));

    let array = [];
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots

      array.push({
        ...doc.data(),
        id: doc.id,
      });
    });
    setStergeri(array);
  };

  useEffect(() => {
    fetchData();
    const unsub3 = onSnapshot(collection(db, "no-verify-stergeri"), (doc) => {
      fetchData();
    });
    return unsub3;
  }, []);

  return (
    <>
      <Modal
        title="Motivul respingerii"
        open={isModalVisible}
        onOk={async () => {
          if (!motiv) {
            openErrorNotification("Scrie de ce respingi această scutire");

            return;
          }

          setLoading(true);
          let c = cObject;
          const { note } = await getDataDoc("catalog", c.elevId);

          await updateDocDatabase("catalog", c.elevId, {
            note: (note || []).map((n) =>
              n.id === c.id
                ? {
                    ...n,
                    ...c.allData,
                    delete: "",
                  }
                : n
            ),
          });
          await updateDocDatabase("no-verify-stergeri", c.id, {
            delete: "denied",
            motiv: c.motiv + " ------> Respins deoarece: " + motiv,
          });
          setMotiv("");
          setCObject({});
          setModalVisible(false);
          setLoading(false);
        }}
        onCancel={() => {
          setModalVisible(false);
          setMotiv("");
          setCObject({});
        }}
      >
        <TextArea
          value={motiv}
          onChange={(e) => setMotiv(e.target.value)}
          placeholder="Introdu motivul respingerii..."
          rows={4}
        />
      </Modal>
      <br />
      <h2>Administrator stergeri catalog</h2>
      <br />
      <h3>Acceptă sau respinge stergerile din catalog</h3>
      <br />
      {loading === true ? (
        <Spin spinning={loading} size="large" />
      ) : (
        <>
          {stergeri?.find((s) => s.delete === "waiting") && (
            <Button
              onClick={async () => {
                setLoading(true);
                try {
                  const deSters = stergeri.filter(
                    (s) => s.delete === "waiting"
                  );

                  // Rulează toate operațiile asincrone în paralel și așteaptă finalizarea lor
                  await Promise.all(
                    deSters.map(async (s) => {
                      // Înlocuiește cu funcția ta async reală pentru ștergere
                      await acceptaStergere(s);
                    })
                  );

                  // Opțional: Actualizează starea după ștergere
                } catch (error) {
                  openErrorNotification("Eroare la ștergere:" + error);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Accepta toate stergerile
            </Button>
          )}
          <Table celled>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Când</TableHeaderCell>
                <TableHeaderCell>Profesorul</TableHeaderCell>
                <TableHeaderCell>Elev</TableHeaderCell>
                <TableHeaderCell>Clasa</TableHeaderCell>
                <TableHeaderCell>Materia</TableHeaderCell>
                <TableHeaderCell>Tip</TableHeaderCell>
                <TableHeaderCell>Motiv</TableHeaderCell>
                <TableHeaderCell>Aceptă sau respinge</TableHeaderCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {stergeri
                ?.sort((a, b) => {
                  const statusOrder = {
                    waiting: 0,
                    denied: 1,
                    accepted: 2,
                  };

                  if (statusOrder[a.delete] === statusOrder[b.delete]) {
                    return b.uploaded - a.uploaded;
                  }
                  return statusOrder[a.delete] - statusOrder[b.delete];
                })
                ?.map((c) => {
                  return (
                    <TableRow
                      positive={c.delete === "accepted"}
                      negative={c.delete === "denied"}
                      warning={c.delete === "waiting"}
                    >
                      <TableCell>
                        {new Date(parseInt(c.when)).toLocaleDateString(
                          "ro-RO"
                        ) +
                          " " +
                          new Date(parseInt(c.when)).toLocaleTimeString(
                            "ro-RO"
                          )}
                      </TableCell>
                      <TableCell>
                        {(profesori?.find((p) => p.id === c.author)
                          ?.numeDeFamilie || "Administrator") +
                          " " +
                          (profesori?.find((p) => p.id === c.author)?.prenume ||
                            "Catalog")}
                      </TableCell>
                      <TableCell>{c?.allData?.numeElev}</TableCell>
                      <TableCell>
                        {clase.find((ca) => ca.id === c?.classId)?.anClasa ===
                        "I"
                          ? clase.find((ca) => ca.id === c?.classId).anClasa +
                            " " +
                            clase.find((ca) => ca.id === c?.classId)
                              ?.identificator
                          : "a " +
                            clase.find((ca) => ca.id === c?.classId)?.anClasa +
                            "-a" +
                            (clase.find((ca) => ca.id === c?.classId)
                              ?.identificator.length > 0 &&
                            clase.find((ca) => ca.id === c?.classId)
                              .identificator !== " "
                              ? " " +
                                clase.find((ca) => ca.id === c?.classId)
                                  ?.identificator
                              : "")}
                      </TableCell>
                      <TableCell>
                        {
                          materii.find((m) => m.id === c?.allData?.materieId)
                            ?.numeMaterie
                        }
                      </TableCell>
                      <TableCell>
                        {(c?.allData?.nota ||
                          (c?.allData?.tip === "absenta"
                            ? "abs"
                            : c?.allData?.tip === "examen_final"
                            ? "Examen Final: " + c?.allData.examen_final
                            : c?.allData?.tip === "corigenta"
                            ? "Corigenta: " + c?.allData.corigenta
                            : c?.allData?.tip)) +
                          " / " +
                          formatDate(new Date(c?.allData?.date))}
                      </TableCell>
                      <TableCell>{c.motiv}</TableCell>

                      <Table.Cell>
                        <Select
                          style={{ width: "100%" }}
                          onChange={async (e) => {
                            setLoading(true);
                            const { note } = await getDataDoc(
                              "catalog",
                              c.elevId
                            );
                            if (e === "waiting") {
                              setLoading(false);
                              openErrorNotification(
                                "Ai raspuns deja la aceasta cerere"
                              );
                              return;
                            }
                            if (e === "denied") {
                              if (c.delete === "accepted") {
                                openErrorNotification(
                                  "Ai acceptat deja stergerea, trebuie sa o restergeti din clasa"
                                );
                                return;
                              }
                              setCObject(c);
                              setModalVisible(true);
                              setLoading(false);
                              return;
                            }
                            await updateDocDatabase(
                              "no-verify-stergeri",
                              c.id,
                              {
                                delete: e,
                              }
                            );
                            if (e === "accepted") {
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
                                c.classId + "week" + week
                              );
                              let previous = [];
                              if (changelogGet) previous = changelogGet;
                              await updateDocDatabase(
                                "changelog",
                                c.classId + "week" + week,
                                {
                                  changelog: [
                                    ...(previous.changelog || []),
                                    {
                                      author:
                                        c?.authorUser?.subType === "director"
                                          ? "Director Unitate"
                                          : c?.authorUser?.displayName,
                                      time: c.when,
                                      classId: c.classId,
                                      motiv: c.motiv,
                                      elevId: c.elevId,
                                      nota: {
                                        ...c.allData,
                                        tip: c?.allData?.tip,
                                        nota: c?.allData?.nota || "fara",
                                        date: c?.allData?.date,
                                      },
                                      sterge: true,
                                    },
                                  ],
                                }
                              );
                              await updateDocDatabase("catalog", c.elevId, {
                                note: (note || []).filter((n) => n.id !== c.id),
                              });

                              let dataElev = await getDataDoc(
                                "elevi",
                                c.elevId
                              );
                              if (c?.allData?.tip === "nota") {
                                await updateDocDatabase(
                                  "mail",
                                  "stergere" + c.elevId + Date.now(),
                                  {
                                    to: [
                                      dataElev.adresaEmail,
                                      ...(dataElev.parintii || []),
                                    ],
                                    message: {
                                      subject:
                                        "S-a sters elevului " +
                                        dataElev.numeDeFamilie +
                                        " " +
                                        dataElev.prenume +
                                        " o nota din catalog",

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
                                materii?.find(
                                  (ma) => ma.id === c?.allData?.materieId
                                ).numeMaterie
                              }</td>
                              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                                c?.allData?.nota
                              }</td>
                              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${new Date(
                                parseInt(c?.allData?.date)
                              ).toLocaleDateString("ro-RO")}</td>
                              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                                c.motiv
                              }</td>
                            </tr>

                          </table>
                          <br/>
                          <br/>
                          <br/>

                          </body></code>`,
                                    },
                                  }
                                );
                              }

                              if (c?.allData?.tip === "absenta") {
                                await updateDocDatabase(
                                  "mail",
                                  "stergere" + c?.elevId + Date.now(),
                                  {
                                    to: [
                                      dataElev.adresaEmail,
                                      ...(dataElev.parintii || []),
                                    ],
                                    message: {
                                      subject:
                                        "S-a sters elevului " +
                                        dataElev.numeDeFamilie +
                                        " " +
                                        dataElev.prenume +
                                        " o absenta din catalog",

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
                                materii?.find(
                                  (ma) => ma.id === c?.allData?.materieId
                                ).numeMaterie
                              }</td>
                              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${new Date(
                                parseInt(c?.allData?.date)
                              ).toLocaleDateString("ro-RO")}</td>
                              <td style="border: 1px solid #dddddd;text-align: left;padding: 8px;">${
                                c?.motiv
                              }</td>
                            </tr>

                          </table>
                          <br/>
                          <br/>
                          <br/>

                          </body></code>`,
                                    },
                                  }
                                );
                              }
                            } else {
                              openErrorNotification(
                                "Nu o poti pune in asteptare, doar respingere/aprobare"
                              );
                            }
                            setLoading(false);
                          }}
                          value={c.delete}
                        >
                          <Select.Option value="waiting">
                            În așteptare
                          </Select.Option>
                          <Select.Option value="accepted">
                            Acceptat
                          </Select.Option>
                          <Select.Option value="denied">Respins</Select.Option>
                        </Select>
                      </Table.Cell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </>
      )}
    </>
  );
}

export default ChangeLog;
