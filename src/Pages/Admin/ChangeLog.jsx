import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Select } from "antd";
import { DatePicker } from "antd";
import { getDataDoc } from "../../database";
import {
  TableRow,
  TableHeaderCell,
  TableHeader,
  TableCell,
  TableBody,
  Icon,
  Table,
} from "semantic-ui-react";
function ChangeLog() {
  const [clas, setClass] = useState(null);
  const clase = useSelector((state) => state.clase);
  const [date, setDate] = useState(null);
  const materii = useSelector((state) => state.materii);
  const [changelog, setChangeLog] = useState([]);
  const [elevi, setElevi] = useState([]);
  const formatDate = (today) => {
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;

    return dd + "." + mm;
  };
  const fetchChangelog = async () => {
    let onejan = new Date(date.getFullYear(), 0, 1);
    let week = Math.ceil(
      ((date.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
    );

    const changelog = await getDataDoc("changelog", clas + "week" + week);
    const elevi = await getDataDoc("claseData", clas);
    setElevi(elevi.elevi);
    setChangeLog(changelog);
  };

  useEffect(() => {
    if (clas && date) fetchChangelog();
  }, [clas, date]);

  return (
    <>
      {" "}
      <Select
        placeholder="Clasa"
        value={clas}
        onChange={setClass}
        style={{
          width: "100%",
        }}
        options={clase.map((item) => ({
          value: item.id,
          label: item.anClasa + item.identificator,
        }))}
      />
      <DatePicker
        picker="week"
        onChange={(e, v) => {
          setDate(e.toDate());
        }}
      />
      <Table celled>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Autor</TableHeaderCell>
            <TableHeaderCell>Data</TableHeaderCell>
            <TableHeaderCell>Tip Actiune</TableHeaderCell>
            <TableHeaderCell>Elev</TableHeaderCell>
            <TableHeaderCell>Materie</TableHeaderCell>
            <TableHeaderCell>Detalii</TableHeaderCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          {changelog?.changelog?.map((c) => {
            return (
              <TableRow
                positive={c.sterge === false}
                negative={c.sterge === true}
              >
                <TableCell>{c.author}</TableCell>
                <TableCell>
                  {new Date(c.time).toLocaleDateString("ro-RO") +
                    " " +
                    new Date(c.time).toLocaleTimeString("ro-RO")}
                </TableCell>
                <TableCell>
                  {c.sterge === true && c?.nota?.tip === "inchidere_medie"
                    ? "a redeschis media"
                    : c.sterge !== true && c?.nota?.tip === "inchidere_medie"
                    ? "a inchis media"
                    : c.sterge === true && c.scutire
                    ? "sters document"
                    : c.sterge === true && c.nota
                    ? "sters nota/absenta"
                    : c.scutire
                    ? "adaugat document"
                    : "adaugat nota/absenta/comentariu"}
                </TableCell>
                <TableCell>
                  {elevi?.find((a) => a.id === c.elevId)?.numeDeFamilie +
                    " " +
                    elevi?.find((a) => a.id === c.elevId)?.prenume}
                </TableCell>
                <TableCell>
                  {c?.nota?.materieId &&
                    materii?.find(
                      (m) => m.id === (c?.nota?.materieId || c?.materieId)
                    )?.numeMaterie}
                </TableCell>
                <TableCell>
                  {c.nota
                    ? c?.nota?.tip === "inchidere_medie"
                      ? "Medie: " +
                        c.nota.inchidere_medie +
                        " " +
                        (c.motiv || "")
                      : c?.nota?.tip == "nota"
                      ? c?.nota?.nota +
                        "/" +
                        formatDate(new Date(c?.nota?.date)) +
                        " " +
                        (c.motiv || "")
                      : c?.nota?.tip == "absenta"
                      ? "abs/" +
                        formatDate(new Date(c?.nota?.date)) +
                        " " +
                        (c.motiv || "")
                      : c?.nota?.comentariu
                    : c.scutire?.ranges?.map(
                        (range) =>
                          " " +
                          formatDate(new Date(range.start)) +
                          " - " +
                          formatDate(new Date(range.end))
                      ) +
                      " " +
                      (c?.motiv || "")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

export default ChangeLog;
