import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Select, Input, Button } from "antd";
import { DatePicker } from "antd";
import { getDataDoc } from "../../database";
import { getDocs, collection, onSnapshot } from "firebase/firestore";
import { db } from "../../database/firebase";
import { formatDate } from "../../utils/index";
import { downloadFolderAsZip, updateDocDatabase } from "../../database";
import { Modal } from "antd";
import { Spin } from "antd";
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
  const [scutiri, setScutiri] = useState();
  const clase = useSelector((state) => state.clase);
  const [isModalVisible, setModalVisible] = useState();
  const [motiv, setMotiv] = useState("");
  const [cObject, setCObject] = useState({});
  const [loading, setLoading] = useState(false);
  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(db, "no-verify-scutiri"));

    let array = [];
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots

      array.push({
        ...doc.data(),
      });
    });
    setScutiri(array);
  };

  useEffect(() => {
    fetchData();
    const unsub3 = onSnapshot(collection(db, "no-verify-scutiri"), (doc) => {
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

          await updateDocDatabase("no-verify-scutiri", c.id_scutire, {
            verified: "denied",
          });
          const scutiriElev = await getDataDoc("eleviDocumente", c.elevId);
          const docsElev = [
            ...(scutiriElev.docsElev || []).filter(
              (scutire) => scutire.id !== c.id_scutire
            ),
            {
              ...(scutiriElev.docsElev || []).find(
                (scutire) => scutire.id === c.id_scutire
              ),
              verified: "denied",
              motiv,
            },
          ];
          await updateDocDatabase("eleviDocumente", c.elevId, {
            docsElev,
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
      <h2>Administrator scutiri</h2>
      <br />
      <h3>Acceptă scutiri sau respinge scutiri</h3>
      <br />
      {loading === true ? (
        <Spin spinning={loading} size="large" />
      ) : (
        <Table celled>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Elev</TableHeaderCell>

              <TableHeaderCell>Clasa</TableHeaderCell>
              <TableHeaderCell>Tip scutire</TableHeaderCell>
              <TableHeaderCell>Titlu</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Încarcată</TableHeaderCell>
              <TableHeaderCell>Detalii</TableHeaderCell>
              <TableHeaderCell>Descarcă fișier</TableHeaderCell>
              <TableHeaderCell>Aceptă sau respinge</TableHeaderCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {scutiri
              ?.sort((a, b) => {
                const statusOrder = {
                  waiting: 0,
                  denied: 1,
                  accepted: 2,
                };

                if (statusOrder[a.verified] === statusOrder[b.verified]) {
                  return b.uploaded - a.uploaded;
                }
                return statusOrder[a.verified] - statusOrder[b.verified];
              })
              ?.map((c) => {
                return (
                  <TableRow
                    positive={c.verified === "accepted"}
                    negative={c.verified === "denied"}
                    warning={c.verified === "waiting"}
                  >
                    <TableCell>{c.numeElev}</TableCell>
                    <TableCell>
                      {" "}
                      {clase.find((cls) => cls.id === c.classId)?.anClasa +
                        clase.find((cls) => cls.id === c.classId)
                          ?.identificator}
                    </TableCell>
                    <TableCell>
                      <p
                        style={{
                          width: "50%",
                          fontSize: "16px",
                          color: "black",
                        }}
                      >
                        {c.subType === "alte_motivari"
                          ? "Alte Motivări"
                          : c.subType === "profesor"
                          ? "Motivare Concurs"
                          : c.tip === "scutire"
                          ? "Scutire medicală"
                          : "Motivare părinte"}
                        <br />
                        <p style={{ fontSize: "12px" }}>
                          {c.tip === "scutire"
                            ? "Nu scade din cele 40 de abs."
                            : "Scade din cele 40 de abs."}
                        </p>
                      </p>
                    </TableCell>
                    <TableCell>{c.nume}</TableCell>
                    <TableCell>
                      {c?.ranges?.map((range) => (
                        <div>
                          {formatDate(new Date(range.start)) +
                            " - " +
                            formatDate(new Date(range.end))}
                          <br />
                          <br />
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>{formatDate(new Date(c.uploaded))}</TableCell>
                    <TableCell>
                      <TextArea
                        value={c.details}
                        style={{ width: "100%", outline: "none" }}
                      />
                    </TableCell>

                    <Table.Cell>
                      <Button
                        type="primary"
                        onClick={() => {
                          downloadFolderAsZip(
                            "documente" + c.id_scutire + "_" + c.uploaded,
                            c.nume + "_document" + c.id
                          );
                        }}
                      >
                        Descarca Documente
                      </Button>
                    </Table.Cell>
                    <Table.Cell>
                      <Select
                        style={{ width: "100%" }}
                        onChange={async (e) => {
                          setLoading(true);
                          if (e === "denied") {
                            setCObject(c);
                            setModalVisible(true);
                            setLoading(false);
                            return;
                          }
                          await updateDocDatabase(
                            "no-verify-scutiri",
                            c.id_scutire,
                            {
                              verified: e,
                            }
                          );
                          const scutiriElev = await getDataDoc(
                            "eleviDocumente",
                            c.elevId
                          );
                          const docsElev = [
                            ...(scutiriElev.docsElev || []).filter(
                              (scutire) => scutire.id !== c.id_scutire
                            ),
                            {
                              ...(scutiriElev.docsElev || []).find(
                                (scutire) => scutire.id === c.id_scutire
                              ),
                              verified: e,
                              motiv: "",
                            },
                          ];

                          await updateDocDatabase("eleviDocumente", c.elevId, {
                            docsElev,
                          });
                          let dataElev = await getDataDoc("users", c.elevId);
                          if (e === "accepted")
                            await updateDocDatabase(
                              "mail",
                              "docs" + Date.now(),
                              {
                                to: [
                                  dataElev.adresaEmail,
                                  ...(dataElev.parintii || []),
                                ],
                                message: {
                                  subject:
                                    "Elevului " +
                                    dataElev.numeDeFamilie +
                                    " " +
                                    dataElev.prenume +
                                    " i-a fost adaugată o nouă  scutire ",
                                  text: `
                           Scutirea acopera datele:
                           ${c.ranges?.map(
                             (range) =>
                               formatDate(new Date(range.start)) +
                               " - " +
                               formatDate(new Date(range.end)) +
                               "; "
                           )}.`,
                                },
                              }
                            );
                          setLoading(false);
                        }}
                        value={c.verified}
                      >
                        <Select.Option value="waiting">
                          În așteptare
                        </Select.Option>
                        <Select.Option value="accepted">Acceptat</Select.Option>
                        <Select.Option value="denied">Respins</Select.Option>
                      </Select>
                    </Table.Cell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      )}
    </>
  );
}

export default ChangeLog;
