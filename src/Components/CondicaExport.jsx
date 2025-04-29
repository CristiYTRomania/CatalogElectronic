import React, { useEffect, useState, useRef } from "react";
import { Space, Table, DatePicker, Button } from "antd";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../database/firebase";
import { useReactToPrint } from "react-to-print";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { vacante1, vacante2, zileLibere } from "./zileLibere";
import { displayName } from "react-quill";
const { RangePicker } = DatePicker;
const formatDate = (today) => {
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  return dd + "." + mm + "." + yyyy;
};
const CondicaExport = ({
  startDate,
  endDate,
  print = false,
  condicaProfi,
  valeaSpinului,
  perCadru,
  vacante,
}) => {
  const [condica, setCondica] = useState([]);
  const componentRef = useRef();
  const [concedii, setConcedii] = useState([]);
  const profesori = useSelector((state) => state.profesori);
  const materii = useSelector((state) => state.materii);
  const clase = useSelector((state) => state.clase);
  const [semnaturi, setSemnaturi] = useState({});
  const settings = useSelector((state) => state.settings);
  const vc = settings.type_vacanta === 2 ? vacante2 : vacante1;
  useEffect(() => {
    let sem = {};
    const fetchSemnaturi = async () => {
      for await (let prof of profesori) {
        if (prof.semnatura) {
          let semnaturaLink = prof.semnatura;
          const response = await fetch(semnaturaLink);
          const blob = await response.blob();

          // Creează un URL local din blob și setează-l în state
          const localUrl = URL.createObjectURL(blob);
          sem[prof.id] = localUrl;
        } else sem[prof.id] = "prezent";
      }
      setSemnaturi(sem);
    };
    fetchSemnaturi();
  }, [profesori]);
  const retriveHourCorectly = (date, type) => {
    if (type === "start") {
      if (date.getHours() < 10 || process.env.REACT_APP_PAUZA_MARE === "no")
        return (date.getHours() < 10 ? "0" : "") + date.getHours() + ":" + "00";
      else return date.getHours() + ":10";
    }
    if (type === "end") {
      if (date.getHours() < 10 || process.env.REACT_APP_PAUZA_MARE === "no")
        return (date.getHours() < 10 ? "0" : "") + date.getHours() + ":" + "50";
      else return date.getHours() + 1 + ":00";
    }
  };
  const fetchDataForMonth = async (year, month) => {
    let array = [];
    for await (let profesorData of profesori) {
      const querySnapshot = await getDocs(
        collection(db, profesorData.id + "condica" + month + "an" + year)
      );

      querySnapshot.forEach((doc) => {
        array.push({
          ...doc.data(),
          uuid: doc.id,
          startDate: new Date(doc.data().startDate),
          endDate: new Date(doc.data().endDate),
          displayName: profesorData.numeDeFamilie + " " + profesorData.prenume,
          profId: profesorData.id,
        });
      });
    }
    setCondica((prevCondica) => [...prevCondica, ...array]);
  };

  const fetchAllData = async () => {
    let current = dayjs(startDate);

    while (current.isBefore(endDate) || current.isSame(endDate, "month")) {
      await fetchDataForMonth(current.year(), current.toDate().getMonth());
      current = current.add(1, "month");
    }

    const querySnapshotConcedii = await getDocs(collection(db, "concedii"));
    let arrayNou = [];
    querySnapshotConcedii.forEach((doc) => {
      arrayNou.push({
        ...doc.data(),
        startDate: new Date(doc.data().startDate),
        endDate: new Date(doc.data().endDate),
        id: doc.id,
      });
    });
    setConcedii(arrayNou);
  };

  useEffect(() => {
    if (startDate && endDate) {
      setCondica([]); // Resetează condica pentru a evita duplicările
      fetchAllData();
    }
  }, [startDate, endDate]);

  const generateDates = (start, end) => {
    const dates = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const zile = generateDates(new Date(startDate), new Date(endDate));

  const formatterLuna = new Intl.DateTimeFormat("ro-RO", { month: "long" });

  const concediu = (data, standalones, profId) => {
    if (typeof data === "number" || typeof data === "string")
      data = new Date(data);

    if (
      (concedii || []).find(
        (c) =>
          c.prof === profId &&
          c.startDate.getTime() <= data &&
          c.endDate.getTime() >= data &&
          (!standalones.getHours ||
            (retriveHourCorectly(standalones, "start") >=
              (c.stringDates?.[0] || "00:00") &&
              retriveHourCorectly(standalones, "start") <=
                (c.stringDates?.[1] || "23:59")))
      )?.text === "CONCEDIU MEDICAL"
    )
      return { color: "red" };
    if (
      (concedii || []).find(
        (c) =>
          c.prof === profId &&
          c.startDate.getTime() <= data &&
          c.endDate.getTime() >= data &&
          (!data.getHours ||
            (retriveHourCorectly(data, "start") >=
              (c.stringDates?.[0] || "00:00") &&
              retriveHourCorectly(data, "start") <=
                (c.stringDates?.[1] || "23:59")))
      )?.text === "CONCEDIU"
    )
      return { color: "green" };
    return {};
  };

  const columns = [
    {
      title: "Data",
      dataIndex: "Data",
      key: "data",
      render: (e, data) => {
        if (data.zi)
          return (
            <p
              style={{
                ...concediu(data.zi, data.startDate, data.profId),
                fontSize: "12px",
                paddingLeft: "2px",
                marginLeft: "2px",
              }}
            >
              {new Date(data.zi).toLocaleDateString("ro-RO")}
            </p>
          );
        return (
          <p
            style={{
              ...concediu(data.zi, data.startDate, data.profId),
              fontSize: "12px",
              padddingLeft: "3px",
            }}
          >
            {data.startDate.toLocaleDateString("ro-RO")}
          </p>
        );
      },
      responsive: ["sm"],
    },
    {
      title: "Interval",
      dataIndex: "interval",
      key: "interval",
      render: (e, data) => {
        if (data.tip === "toataziua")
          return (
            <p
              style={{
                ...concediu(data.zi, data.startDate, data.profId),
                fontSize: "12px",
              }}
            >
              -
            </p>
          );
        return (
          <>
            <p
              style={{
                ...concediu(
                  data.zi || data.startDate,
                  data.startDate,
                  data.profId
                ),
                fontSize: "12px",
              }}
            >
              {retriveHourCorectly(data.startDate, "start")}
            </p>
            <p
              style={{
                ...concediu(
                  data.zi || data.startDate,
                  data.startDate,
                  data.profId
                ),
                fontSize: "12px",
              }}
            >
              {retriveHourCorectly(data.endDate, "end")}
            </p>
          </>
        );
      },
      responsive: ["sm"],
    },
    {
      title: "Clasa",
      dataIndex: "Clasa",
      key: "clasa",
      render: (e, data) => {
        if (data.tip === "toataziua") return <p>-</p>;
        return (
          <>
            {data.tip === "privat" ? (
              <p
                style={{
                  ...concediu(
                    data.zi || data.startDate,
                    data.startDate,
                    data.profId
                  ),
                  fontSize: "12px",
                }}
              >
                {data.classId.split(" - ")[1]}
              </p>
            ) : (
              <p
                style={{
                  ...concediu(
                    data.zi || data.startDate,
                    data.startDate,
                    data.profId
                  ),
                  fontSize: "12px",
                }}
              >
                {clase.find((cls) => cls.id === data.classId)?.anClasa +
                  " " +
                  clase.find((cls) => cls.id === data.classId)?.identificator}
              </p>
            )}
          </>
        );
      },
      responsive: ["sm"],
    },
    {
      title: "Disciplina",
      dataIndex: "Materie",
      key: "Materie",
      render: (e, data) => {
        console.log("uf", { data });
        return (
          <>
            {data.tip === "privat" ? (
              <p
                style={{
                  ...concediu(
                    data.zi || data.startDate,
                    data.startDate,
                    data.profId
                  ),
                  fontSize: "12px",
                }}
              >
                {data.textOra ||
                  data.classId.split(" - ")[0] ||
                  data.materieId ||
                  (data.saptamanaVerde
                    ? "Saptamana verde, conform orarului"
                    : data.saptamanaAtfel
                    ? "Saptamana altfel, conform orarului"
                    : data.vacanta
                    ? "-"
                    : "Activitate în școală")}
              </p>
            ) : (
              <p
                style={{
                  ...concediu(
                    data.zi || data.startDate,
                    data.startDate,
                    data.profId
                  ),
                  fontSize: "12px",
                }}
              >
                {data.saptamanaVerde
                  ? "Saptamana verde"
                  : data.saptamanaAtfel
                  ? "Saptamana altfel"
                  : data.vacanta
                  ? "-"
                  : materii?.find((m) => m.id === data.materieId)
                      ?.numeMaterie || "Activitate în școală"}
              </p>
            )}
          </>
        );
      },
      responsive: ["sm"],
    },
    {
      title: "Nume și prenume",
      dataIndex: "prof",
      key: "prof",
      render: (e, data) => {
        return (
          <>
            <p
              style={{
                ...concediu(
                  data.zi || data.startDate,
                  data.startDate,
                  data.profId
                ),
                fontSize: "12px",
              }}
            >
              {data.displayName}
            </p>
          </>
        );
      },
      responsive: ["sm"],
    },

    {
      title: "Semnătură",
      key: "tip",
      render: (_, data) => {
        if (semnaturi[data.profId] === "prezent")
          return (
            <p
              style={{
                ...concediu(
                  data.zi || data.startDate,
                  data.startDate,
                  data.profId
                ),
                fontSize: "12px",
              }}
            >
              {concedii?.find(
                (c) =>
                  c.prof === data.profId &&
                  c.startDate.getTime() <=
                    (data.zi || data.startDate?.getTime()) &&
                  c.endDate.getTime() >=
                    (data.zi || data.startDate?.getTime()) &&
                  (!data.startDate.getHours ||
                    (retriveHourCorectly(data.startDate, "start") >=
                      (c.stringDates?.[0] || "00:00") &&
                      retriveHourCorectly(data.startDate, "start") <=
                        (c.stringDates?.[1] || "23:59")))
              )?.text ||
                (data.ziLibera
                  ? "Z.L.L"
                  : data.vacanta
                  ? "Concediu de odihnă"
                  : process.env.REACT_APP_NAME !== "SGMVT"
                  ? "prezent"
                  : "    ")}
            </p>
          );
        else {
          if (
            Object.keys(
              concediu(data.zi || data.startDate, data.startDate, data.profId)
            ).length > 0
          ) {
            return (
              <p
                style={{
                  ...concediu(
                    data.zi || data.startDate,
                    data.startDate,
                    data.profId
                  ),
                  fontSize: "12px",
                }}
              >
                {concedii?.find(
                  (c) =>
                    c.prof === data.profId &&
                    c.startDate.getTime() <=
                      (data.zi || data.startDate?.getTime()) &&
                    c.endDate.getTime() >=
                      (data.zi || data.startDate?.getTime()) &&
                    (!data.startDate.getHours ||
                      (retriveHourCorectly(data.startDate, "start") >=
                        (c.stringDates?.[0] || "00:00") &&
                        retriveHourCorectly(data.startDate, "start") <=
                          (c.stringDates?.[1] || "23:59")))
                )?.text ||
                  (process.env.REACT_APP_NAME === "SGMVT"
                    ? "       "
                    : "prezent    ")}
              </p>
            );
          } else
            return (
              <img
                src={semnaturi[data.profId]}
                style={{ width: "100px", height: "30px" }}
              />
            );
        }
      },
      responsive: ["sm"],
    },
  ];

  const columnsAdmin = [
    {
      title: "Data",
      dataIndex: "Data",
      key: "data",
      render: (e, data) => {
        if (data.zi)
          return (
            <p
              style={{
                ...concediu(
                  data.zi || data.startDate,
                  data.startDate,
                  data.profId
                ),
                fontSize: "12px",
              }}
            >
              {new Date(data.zi).toLocaleDateString("ro-RO")}
            </p>
          );
        return (
          <p
            style={{
              ...concediu(
                data.zi || data.startDate,
                data.startDate,
                data.profId
              ),
              fontSize: "12px",
            }}
          >
            {data.startDate.toLocaleDateString("ro-RO")}
          </p>
        );
      },
      responsive: ["sm"],
    },

    {
      title: "Nume și prenume",
      dataIndex: "prof",
      key: "prof",
      render: (e, data) => {
        return (
          <>
            <p
              style={{
                ...concediu(
                  data.zi || data.startDate,
                  data.startDate,
                  data.profId
                ),
                fontSize: "12px",
              }}
            >
              {data.displayName}
            </p>
          </>
        );
      },
      responsive: ["sm"],
    },

    {
      title: "Semnătură",
      key: "tip",
      render: (_, data) => {
        if (semnaturi[data.profId] === "prezent")
          return (
            <p
              style={{
                ...concediu(
                  data.zi || data.startDate,
                  data.startDate,
                  data.profId
                ),
                fontSize: "12px",
              }}
            >
              {concedii?.find(
                (c) =>
                  c.prof === data.profId &&
                  c.startDate.getTime() <=
                    (data.zi || data.startDate?.getTime()) &&
                  c.endDate.getTime() >=
                    (data.zi || data.startDate?.getTime()) &&
                  (!data.startDate.getHours ||
                    (retriveHourCorectly(data.startDate, "start") >=
                      (c.stringDates?.[0] || "00:00") &&
                      retriveHourCorectly(data.startDate, "start") <=
                        (c.stringDates?.[1] || "23:59")))
              )?.text ||
                (data.vacanta
                  ? "Concediu de odihnă"
                  : "prezent " +
                    (profesori?.find((p) => data?.profId == p.id)?.programAdmin
                      ? "în timpul programului de muncă " +
                        profesori?.find((p) => data?.profId == p.id)
                          ?.programAdmin[
                          (new Date(data.startDate).getDay() + 6) % 7
                        ]
                      : ""))}
            </p>
          );
        else {
          if (
            Object.keys(
              concediu(data.zi || data.startDate, data.startDate, data.profId)
            ).length > 0
          ) {
            return (
              <p
                style={{
                  ...concediu(
                    data.zi || data.startDate,
                    data.startDate,
                    data.profId
                  ),
                  fontSize: "12px",
                }}
              >
                {concedii
                  ?.find(
                    (c) =>
                      c.prof === data.profId &&
                      c.startDate.getTime() <=
                        (data.zi || data.startDate?.getTime()) &&
                      c.endDate.getTime() >=
                        (data.zi || data.startDate?.getTime()) &&
                      (!data.startDate.getHours ||
                        (retriveHourCorectly(data.startDate, "start") >=
                          (c.stringDates?.[0] || "00:00") &&
                          retriveHourCorectly(data.startDate, "start") <=
                            (c.stringDates?.[1] || "23:59")))
                  )
                  ?.text(
                    data.vacanta
                      ? "Concediu de odihnă"
                      : "prezent " +
                        profesori.find((p) => data.profId == p.id).programAdmin
                      ? "în timpul programului de muncă " +
                        profesori?.find((p) => data.profId == p.id)
                          ?.programAdmin[
                          ((data.zi || data.startDate).getDate() + 6) % 7
                        ]
                      : ""
                  )}
              </p>
            );
          } else
            return (
              <img
                src={semnaturi[data.profId]}
                style={{ width: "100px", height: "30px" }}
              />
            );
        }
      },
      responsive: ["sm"],
    },
  ];

  function compareDates(a, b) {
    let dayA = a.startDate.getDay();
    let dayB = b.startDate.getDay();

    let hourA = a.startDate.getHours();
    let hourB = b.startDate.getHours();

    let minuteA = a.startDate.getMinutes();
    let minuteB = b.startDate.getMinutes();

    // Comparăm ziua săptămânii
    if (dayA > dayB) {
      return 1;
    } else if (dayA < dayB) {
      return -1;
    }

    // Comparăm ora dacă zilele sunt egale
    if (hourA > hourB) {
      return 1;
    } else if (hourA < hourB) {
      return -1;
    }

    // Comparăm minutele dacă orele sunt egale
    if (minuteA > minuteB) {
      return 1;
    } else if (minuteA < minuteB) {
      return -1;
    }

    // Dacă ziua, ora și minutele sunt egale
    return 0;
  }
  if (condicaProfi && perCadru === true)
    return (
      <div className="condica-export">
        {[
          ...profesori
            .filter((p) => {
              if (
                process.env.REACT_APP_NAME !==
                `Școala Gimnazială "Mihai Eminescu" Năsăud`
              )
                return true;
              if (valeaSpinului) {
                if (
                  !p?.ore?.find(
                    (o) =>
                      !clase
                        .find((c) => c.id === o.classId)
                        ?.identificator.includes("VS")
                  )
                )
                  return true;
              } else if (
                p?.ore?.find(
                  (o) =>
                    !clase
                      .find((c) => c.id === o.classId)
                      ?.identificator.includes("VS")
                )
              )
                return true;
              return false;
            })
            .filter((p) =>
              p?.selectedMaterii?.find((m) => !m.includes("Admin"))
            ),
        ]
          .sort((a, b) => {
            if (a.numeDeFamilie + a.prenume < b.numeDeFamilie + b.prenume)
              return -1;
            else return 1;
          })
          .map((p) => {
            const condicaP = condica.filter((c) => c.profId === p.id);
            return (
              <>
                <h3 style={{ textAlign: "center", pageBreakBefore: "always" }}>
                  {p.numeDeFamilie + " " + p.prenume}
                </h3>
                <h4 style={{ textAlign: "center" }}>
                  {formatDate(new Date(startDate)) +
                    " - " +
                    formatDate(new Date(endDate))}
                </h4>
                <br />
                <br />

                <div ref={componentRef}>
                  <Table
                    columns={columns}
                    dataSource={zile
                      .reduce((acc, current) => {
                        return [
                          ...acc,
                          ...condicaP.filter(
                            (c) =>
                              current.getDate() ===
                                new Date(c.zi || c.startDate).getDate() &&
                              current.getMonth() ===
                                new Date(c.zi || c.startDate).getMonth() &&
                              current.getFullYear() ===
                                new Date(c.zi || c.startDate).getFullYear() &&
                              (vacante === true ||
                                (vacante === false && c.vacanta !== true))
                          ),
                        ];
                      }, [])
                      .sort((a, b) => {
                        if (
                          new Date(
                            a?.zi || a?.startDate.getTime()
                          ).toLocaleDateString() ===
                          new Date(
                            b?.zi || b?.startDate.getTime()
                          ).toLocaleDateString()
                        )
                          return (
                            a?.startDate.getHours() - b?.startDate.getHours()
                          );
                        return (
                          new Date(a?.zi || a?.startDate.getTime()) -
                          new Date(b?.zi || b?.startDate.getTime())
                        );
                      })}
                    pagination={false}
                  />
                </div>
              </>
            );
          })}
      </div>
    );
  else if (perCadru === true)
    return (
      <div className="condica-export">
        {[
          ...profesori.filter((p) =>
            p?.selectedMaterii?.find((m) => m.includes("Admin"))
          ),
        ]
          .sort((a, b) => {
            if (a.numeDeFamilie + a.prenume < b.numeDeFamilie + b.prenume)
              return -1;
            else return 1;
          })
          .map((p) => {
            const condicaP = condica.filter((c) => c.profId === p.id);
            return (
              <>
                <h3 style={{ textAlign: "center", pageBreakBefore: "always" }}>
                  {p.numeDeFamilie + " " + p.prenume}
                </h3>

                <div ref={componentRef}>
                  <Table
                    columns={columnsAdmin}
                    dataSource={zile
                      .reduce((acc, current) => {
                        return [
                          ...acc,
                          ...condicaP.filter(
                            (c) =>
                              current.getDate() ===
                                new Date(c.zi || c.startDate).getDate() &&
                              current.getMonth() ===
                                new Date(c.zi || c.startDate).getMonth() &&
                              current.getFullYear() ===
                                new Date(c.zi || c.startDate).getFullYear()
                          ),
                        ];
                      }, [])
                      .sort((a, b) => {
                        return a.zi - b.zi;
                      })
                      .filter((c) => c?.materieId?.includes("Admin"))}
                    pagination={false}
                  />
                </div>
              </>
            );
          })}
      </div>
    );
  else if (condicaProfi && perCadru === false)
    return (
      <div className="condica-export">
        {zile.map((current, index) => {
          let ziLibera = false;
          if (current.getDay() == 6 || current.getDay() == 0) return <></>;
          if (
            zileLibere.find((C) => {
              return (
                current.getDate() === C.getDate() &&
                current.getMonth() === C.getMonth() &&
                current.getFullYear() === C.getFullYear()
              );
            })
          )
            ziLibera = true;

          return (
            <div key={index} style={{ textAlign: "center" }}>
              <br />
              <br />
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <p>Ziua: {current.getDate()}</p>
                <p>Luna: {formatterLuna.format(current)}</p>
                <p>Anul: {current.getFullYear()}</p>
              </div>
              <br />
              <div ref={componentRef} style={{ padding: "5px" }}>
                <Table
                  columns={columns}
                  dataSource={
                    zileLibere.find((c) => {
                      return (
                        current.getDate() ===
                          new Date(c.zi || c.startDate).getDate() &&
                        current.getMonth() ===
                          new Date(c.zi || c.startDate).getMonth() &&
                        current.getFullYear() ===
                          new Date(c.zi || c.startDate).getFullYear()
                      );
                    }) ||
                    vc.find((d) => {
                      let start = new Date(d.s.getTime());
                      let end = new Date(d.e.getTime());
                      start.setUTCHours(0, 0, 0, 0);
                      end.setUTCHours(0, 0, 0, 0);
                      let dt = current;
                      if (start <= dt && end >= dt) return true;
                      return false;
                    })
                      ? profesori
                          .filter((p) =>
                            condica
                              .filter((c) => !c.materieId?.includes("Admin"))
                              .find((pa) => pa.profId === p.id)
                          )
                          .map((p) => ({
                            id:
                              current.getDate() +
                              "zi" +
                              current.getMonth() +
                              "an" +
                              current.getFullYear(),
                            subiectLectie: "",
                            profId: p.id,

                            displayName: p.displayName,
                            startDate: current,
                            tip: "toataziua",
                            zi: zileLibere.find((c) => {
                              return (
                                current.getDate() ===
                                  new Date(c.zi || c.startDate).getDate() &&
                                current.getMonth() ===
                                  new Date(c.zi || c.startDate).getMonth() &&
                                current.getFullYear() ===
                                  new Date(c.zi || c.startDate).getFullYear()
                              );
                            }),
                            vacanta: true,

                            zi: current,
                            ziLibera,
                          }))
                          .sort((a, b) => {
                            if (a.displayName < b.displayName) return -1;
                            if (a.displayName > b.displayName) return 1;
                            if (compareDates(a, b) === 0) {
                              if (a.displayName === b.displayName) {
                                let classA = clase.find(
                                  (c) => c.id == a.classId
                                );
                                let classB = clase.find(
                                  (c) => c.id == b.classId
                                );
                                if (!a.classId || !b.classId) {
                                  if (a.displayName < b.displayName) return -1;
                                  else return 1;
                                }
                                let AniSort = [
                                  "Pregătitoare",
                                  "I",
                                  "II",
                                  "III",
                                  "IV",
                                  "V",
                                  "VI",
                                  "VII",
                                  "VIII",
                                  "IX",
                                  "X",
                                  "XI",
                                  "XII",
                                ];
                                if (
                                  AniSort.findIndex(
                                    (a) => a === classA.anClasa
                                  ) <
                                  AniSort.findIndex((a) => a === classB.anClasa)
                                )
                                  return -1;
                                else if (
                                  AniSort.findIndex(
                                    (a) => a === classA.anClasa
                                  ) >
                                  AniSort.findIndex((a) => a === classB.anClasa)
                                )
                                  return 1;
                                else
                                  return classA.identificator.localeCompare(
                                    classB.identificator
                                  );
                              }
                              return compareDates(a, b);
                            } else return compareDates(a, b);
                          })
                      : condica

                          .filter(
                            (c) =>
                              current.getDate() ===
                                new Date(c.zi || c.startDate).getDate() &&
                              current.getMonth() ===
                                new Date(c.zi || c.startDate).getMonth() &&
                              current.getFullYear() ===
                                new Date(c.zi || c.startDate).getFullYear() &&
                              (vacante === true ||
                                (vacante === false && c.vacanta !== true))
                          )
                          .sort((a, b) => {
                            if (a.displayName < b.displayName) return -1;
                            if (a.displayName > b.displayName) return 1;
                            if (compareDates(a, b) === 0) {
                              if (a.displayName === b.displayName) {
                                let classA = clase.find(
                                  (c) => c.id == a.classId
                                );
                                let classB = clase.find(
                                  (c) => c.id == b.classId
                                );
                                if (!a.classId || !b.classId) {
                                  if (a.displayName < b.displayName) return -1;
                                  else return 1;
                                }
                                let AniSort = [
                                  "Pregătitoare",
                                  "I",
                                  "II",
                                  "III",
                                  "IV",
                                  "V",
                                  "VI",
                                  "VII",
                                  "VIII",
                                  "IX",
                                  "X",
                                  "XI",
                                  "XII",
                                ];
                                if (
                                  AniSort.findIndex(
                                    (a) => a === classA.anClasa
                                  ) <
                                  AniSort.findIndex((a) => a === classB.anClasa)
                                )
                                  return -1;
                                else if (
                                  AniSort.findIndex(
                                    (a) => a === classA.anClasa
                                  ) >
                                  AniSort.findIndex((a) => a === classB.anClasa)
                                )
                                  return 1;
                                else
                                  return classA.identificator.localeCompare(
                                    classB.identificator
                                  );
                              }
                              return compareDates(a, b);
                            } else return compareDates(a, b);
                          })
                  }
                  pagination={false}
                />
                <p style={{ textAlign: "center", paddingTop: "50px" }}>
                  Director / Director adjunct,
                </p>
              </div>
              <br />
            </div>
          );
        })}
      </div>
    );
  else if (perCadru === false)
    return (
      <div className="condica-export">
        {zile.map((current, index) => {
          if (current.getDay() == 6 || current.getDay() == 0) return <></>;
          else
            return (
              <div
                key={index}
                style={{ pageBreakAfter: "always", textAlign: "center" }}
              >
                <br />
                <br />
                <div
                  style={{ display: "flex", justifyContent: "space-around" }}
                >
                  <p>Ziua: {current.getDate()}</p>
                  <p>Luna: {formatterLuna.format(current)}</p>
                  <p>Anul: {current.getFullYear()}</p>
                </div>
                <br />
                <div ref={componentRef}>
                  <Table
                    columns={columnsAdmin}
                    dataSource={condica
                      .filter((c) => c?.materieId?.includes("Admin"))
                      .filter(
                        (c) =>
                          current.getDate() ===
                            new Date(c.zi || c.startDate).getDate() &&
                          current.getMonth() ===
                            new Date(c.zi || c.startDate).getMonth() &&
                          current.getFullYear() ===
                            new Date(c.zi || c.startDate).getFullYear()
                      )
                      .sort((a, b) => a.startDate - b.startDate)}
                    pagination={false}
                  />
                </div>
                <br />
              </div>
            );
        })}
      </div>
    );
};

export default CondicaExport;
