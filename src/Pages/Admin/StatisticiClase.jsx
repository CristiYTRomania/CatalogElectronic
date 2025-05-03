import React, { useEffect, useState } from "react";
import { Tabs, Tag } from "antd";
import { useSelector } from "react-redux";
import { Select } from "antd";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { Table, Spin } from "antd";
import { getDataDoc } from "../../database";
import { Chart } from "react-google-charts";
import { calculare_medii } from "../../utils/calculare_medie";
import { DatePicker } from "antd";
import { useReactToPrint } from "react-to-print";
import { Button } from "antd";
import { calculeaza_medie_materie } from "../../utils/calculare_medie";
import { motiveazaAbsente, motiveaza_absenta } from "../../utils/absente";
function Statistici() {
  const [claseSelected, setClaseSelected] = useState([]);
  const [eleviSelected, setEleviSelected] = useState([]);
  const [materiiTotal, setMateriiTotal] = useState([]);
  const ref = useRef();
  const [materiiAlese, setMateriiAlese] = useState([]);
  const [gradesElevi, setGradesElevi] = useState([]);
  const [startDate, setStartDate] = useState(undefined);
  const [endDate, setEndDate] = useState(undefined);
  const [scutiri, setScutiri] = useState({});
  const clase = useSelector((state) => state.clase);
  const user = useSelector((state) => state.user);
  const materii = useSelector((state) => state.materii);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const calculate_medie_materie = (noteElev = [], materie) => {
    let medie = calculeaza_medie_materie(
      noteElev,
      materii?.find((ma) => ma.id === materie)
    );
    return medie.medie;
  };
  const fetchData = async () => {
    let array = [];
    let scutiriElevi = {};
    let note = {};
    let materii = [];
    for await (let cls of claseSelected) {
      let classData = await getDataDoc("claseData", cls);
      materii = [
        ...(classData?.materii || []).map((m) => m.materie),
        ...materii,
      ];
      for await (let elev of classData?.elevi || []) {
        const notes = await getDataDoc("catalog", elev.id);
        const docs = await getDataDoc("eleviDocumente", elev.id);
        const dataElev = await getDataDoc("elevi", elev.id);
        let obj = {};
        note[elev.id] = { note: notes?.note };

        scutiriElevi[elev.id] = docs?.docsElev?.filter(
          (doc) => doc.tip === "scutire" || doc.tip === "bilet"
        );
        notes?.note?.forEach((n) => {
          obj[n.materieId]?.note?.push(n);
        });
        if (elev.mutat !== true && elev.retras !== true)
          array.push({
            nume: elev.numeDeFamilie + " " + elev.initiala + " " + elev.prenume,
            id: elev.id,
            class: cls,
            gen: dataElev.gen,
            grades: notes?.note,
            medieFinala: parseFloat(
              calculare_medii(notes?.note || [], materii, scutiri[elev.id])
            ),
            materiiCorigenta: classData.materii.reduce((arr, m) => {
              if (
                calculate_medie_materie(notes?.note, m.materie) !== 0 &&
                calculate_medie_materie(notes?.note, m.materie) < 5
              )
                return [...arr, m.materie];
              return arr;
            }, []),
          });
      }
    }
    setMateriiTotal(
      materii.filter((item, index) => materii.indexOf(item) === index)
    );
    setEleviSelected(
      array.sort((a, b) => {
        if (a.nume < b.nume) return -1;
        return 1;
      })
    );
    setScutiri(scutiriElevi);
    setGradesElevi(note);
  };

  useEffect(() => {
    setLoading(true);
    fetchData();

    setLoading(false);
  }, [claseSelected]);
  const StatisticiAbsente = () => {
    const columns = [
      {
        title: "Absente",
        dataIndex: "Phone",
        key: "phone",
        responsive: ["xs"],
        render: (e, data) => {
          const name = () => {
            return (
              <a
                onClick={() => {
                  navigate(`/elev/${data.id}`);
                }}
                style={{
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {data.nume}
              </a>
            );
          };
          const clasa = () => {
            return (
              <a
                onClick={() => {
                  navigate(`/elev/${data.id}`);
                }}
                style={{
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {clase.find((c) => c.id === data.class).anClasa +
                  clase.find((c) => c.id === data.class).identificator}
              </a>
            );
          };
          const absmot = () => {
            let absente = motiveazaAbsente(
              data.note.filter((n) => {
                if (
                  startDate !== undefined &&
                  endDate !== undefined &&
                  !(n.date >= startDate && n.date <= endDate)
                )
                  return false;
                return true;
              }),
              scutiri[data.id]
            );

            return (
              <p style={{ fontSize: "20", color: "green" }}>
                {absente.absente_motivate.length}
              </p>
            );
          };
          const absne = () => {
            let absente = motiveazaAbsente(
              data.note.filter((n) => {
                if (
                  startDate !== undefined &&
                  endDate !== undefined &&
                  !(n.date >= startDate && n.date <= endDate)
                )
                  return false;
                return true;
              }),
              scutiri[data.id]
            );

            return (
              <p style={{ fontSize: "20", color: "red" }}>
                {absente.absente_nemotivate.length}
              </p>
            );
          };
          const abs = () => {
            let absente = motiveazaAbsente(
              data.note.filter((n) => {
                if (
                  startDate !== undefined &&
                  endDate !== undefined &&
                  !(n.date >= startDate && n.date <= endDate)
                )
                  return false;
                return true;
              }),
              scutiri[data.id]
            );
            return (
              <p style={{ fontSize: "20" }}>
                {" "}
                {absente.absente_dupa_motivari.length}
              </p>
            );
          };

          return (
            <div style={{ textAlign: "center" }}>
              <p>Nume: {name()}</p>
              <p>Clasa: {clasa()}</p>
              <p>Absente Motiv: {absmot()}</p>
              <p>Absente Nemotiv: {absne()}</p>
              <p>Total abs: {abs()}</p>
            </div>
          );
        },
      },
      {
        title: "Nume",
        dataIndex: "nume",
        key: "nume",
        responsive: ["sm"],
        onFilter: (value, record) => record.name.indexOf(value) === 0,
        render: (e, data) => {
          return (
            <a
              onClick={() => {
                navigate(`/elev/${data.id}`);
              }}
              style={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {data.nume}
            </a>
          );
        },
      },
      {
        title: "Clasa",
        dataIndex: "class",
        key: "class",
        responsive: ["sm"],

        onFilter: (value, record) => record.name.indexOf(value) === 0,
        render: (e, data) => {
          return (
            <a
              onClick={() => {
                navigate(`/elev/${data.id}`);
              }}
              style={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {clase.find((c) => c.id === data.class).anClasa +
                clase.find((c) => c.id === data.class).identificator}
            </a>
          );
        },
      },
      {
        title: "Absente Mot",
        dataIndex: "motivate",
        responsive: ["sm"],
        sorter: (a, b) => {
          let data = a;
          let scutiriElev = scutiri[data.id];

          let cnt1 = motiveazaAbsente(
            data.note.filter((n) => {
              if (
                startDate !== undefined &&
                endDate !== undefined &&
                !(n.date >= startDate && n.date <= endDate)
              )
                return false;
              return true;
            }),
            scutiriElev
          ).absente_motivate.length;
          data = b;
          scutiriElev = scutiri[data.id];

          let cnt2 = motiveazaAbsente(
            data.note.filter((n) => {
              if (
                startDate !== undefined &&
                endDate !== undefined &&
                !(n.date >= startDate && n.date <= endDate)
              )
                return false;
              return true;
            }),
            scutiriElev
          ).absente_motivate.length;
          return cnt2 - cnt1;
        },
        render: (e, data) => {
          let scutiriElev = scutiri[data.id];
          let cnt = motiveazaAbsente(
            data.note.filter((n) => {
              if (
                startDate !== undefined &&
                endDate !== undefined &&
                !(n.date >= startDate && n.date <= endDate)
              )
                return false;
              return true;
            }),
            scutiriElev
          ).absente_motivate.length;
          scutiriElev = scutiri[data.id];

          return <p style={{ fontSize: "20", color: "green" }}>{cnt}</p>;
        },
      },
      {
        title: "Abs NemMot",
        dataIndex: "nemotivate",
        responsive: ["sm"],
        sorter: (a, b) => {
          let data = a;
          let scutiriElev = scutiri[data.id];

          let cnt1 = motiveazaAbsente(
            data.note.filter((n) => {
              if (
                startDate !== undefined &&
                endDate !== undefined &&
                !(n.date >= startDate && n.date <= endDate)
              )
                return false;
              return true;
            }),
            scutiriElev
          ).absente_nemotivate.length;
          data = b;
          scutiriElev = scutiri[data.id];

          let cnt2 = motiveazaAbsente(
            data.note.filter((n) => {
              if (
                startDate !== undefined &&
                endDate !== undefined &&
                !(n.date >= startDate && n.date <= endDate)
              )
                return false;
              return true;
            }),
            scutiriElev
          ).absente_nemotivate.length;
          return cnt2 - cnt1;
        },
        render: (e, data) => {
          let scutiriElev = scutiri[data.id];
          let cnt = motiveazaAbsente(
            data.note.filter((n) => {
              if (
                startDate !== undefined &&
                endDate !== undefined &&
                !(n.date >= startDate && n.date <= endDate)
              )
                return false;
              return true;
            }),
            scutiriElev
          ).absente_nemotivate.length;

          return <p style={{ fontSize: "20", color: "red" }}>{cnt}</p>;
        },
      },
      {
        title: "Abs ",
        dataIndex: "abs",
        responsive: ["sm"],
        sorter: (a, b) => {
          let data = a;
          let scutiriElev = scutiri[data.id];

          let cnt1 = motiveazaAbsente(
            data.note.filter((n) => {
              if (
                startDate !== undefined &&
                endDate !== undefined &&
                !(n.date >= startDate && n.date <= endDate)
              )
                return false;
              return true;
            }),
            scutiriElev
          ).absente_dupa_motivari.length;
          data = b;
          scutiriElev = scutiri[data.id];

          let cnt2 = motiveazaAbsente(
            data.note.filter((n) => {
              if (
                startDate !== undefined &&
                endDate !== undefined &&
                !(n.date >= startDate && n.date <= endDate)
              )
                return false;
              return true;
            }),
            scutiriElev
          ).absente_dupa_motivari.length;
          return cnt2 - cnt1;
        },
        render: (e, data) => {
          let cnt =
            (
              (data.note || []).filter((n) => {
                if (
                  startDate !== undefined &&
                  endDate !== undefined &&
                  !(n.date >= startDate && n.date <= endDate)
                )
                  return false;
                return true;
              }) || []
            )?.filter((n) => n.tip === "absenta").length || 0;

          return <p style={{ fontSize: "20" }}>{cnt}</p>;
        },
      },
    ];

    return (
      <>
        <Table
          pagination={false}
          columns={columns}
          dataSource={eleviSelected?.map((el) => {
            return { ...el, note: gradesElevi[el.id]?.note || [] };
          })}
        />
        <h3>
          Total Absente :&nbsp;
          {eleviSelected?.reduce((acc, el) => {
            return (
              acc +
              (gradesElevi[el.id]?.note || [])
                .filter((n) => {
                  if (
                    startDate !== undefined &&
                    endDate !== undefined &&
                    !(n.date >= startDate && n.date <= endDate)
                  )
                    return false;
                  return true;
                })
                ?.filter((n) => n.tip === "absenta").length
            );
          }, 0)}
        </h3>
        <h3 style={{ color: "green" }}>
          Total Absente Motivate: &nbsp;
          {eleviSelected?.reduce((acc, el) => {
            return (
              acc +
              (gradesElevi[el.id]?.note || [])
                .filter((n) => {
                  if (
                    startDate !== undefined &&
                    endDate !== undefined &&
                    !(n.date >= startDate && n.date <= endDate)
                  )
                    return false;
                  return true;
                })
                ?.filter((n) => n.tip === "absenta")
                ?.filter((nota) => {
                  let scutiriElev = scutiri[el.id];
                  if (
                    (scutiriElev || [])?.find((scut) =>
                      motiveaza_absenta(nota, scut)
                    )
                  )
                    return true;
                  return false;
                }).length
            );
          }, 0)}
        </h3>
        <h3 style={{ color: "red" }}>
          Total Absente Nemotivate:&nbsp;
          {eleviSelected?.reduce((acc, el) => {
            return (
              acc +
              (gradesElevi[el.id]?.note || [])
                .filter((n) => {
                  if (
                    startDate !== undefined &&
                    endDate !== undefined &&
                    !(n.date >= startDate && n.date <= endDate)
                  )
                    return false;
                  return true;
                })
                ?.filter((n) => n.tip === "absenta")
                ?.filter((nota) => {
                  let scutiriElev = scutiri[el.id];
                  if (
                    (scutiriElev || [])?.find((scut) =>
                      motiveaza_absenta(nota, scut)
                    )
                  )
                    return false;
                  return true;
                }).length
            );
          }, 0)}
        </h3>
        <br />
        <Chart
          chartType="Bar"
          width="100%"
          options={{ colors: ["red", "green", "blue"] }}
          data={[
            ["Clasa", "Abs Nemotiv", "Abs Motiv", "Abs"],
            ...claseSelected.map((c) => {
              let clasaData = clase.find((cls) => cls.id === c);

              let nemotivate = (
                eleviSelected.filter((el) => el.class === clasaData.id) || []
              ).reduce((acc, el) => {
                return (
                  acc +
                  (gradesElevi[el.id]?.note || [])
                    .filter((n) => {
                      if (
                        startDate !== undefined &&
                        endDate !== undefined &&
                        !(n.date >= startDate && n.date <= endDate)
                      )
                        return false;
                      return true;
                    })
                    ?.filter((n) => n.tip === "absenta")
                    ?.filter((nota) => {
                      let scutiriElev = scutiri[el.id];
                      if (
                        (scutiriElev || [])?.find((scut) =>
                          motiveaza_absenta(nota, scut)
                        )
                      )
                        return false;
                      return true;
                    }).length
                );
              }, 0);
              let motivate = (
                eleviSelected.filter((el) => el.class === clasaData.id) || []
              ).reduce((acc, el) => {
                return (
                  acc +
                  (gradesElevi[el.id]?.note || [])
                    .filter((n) => {
                      if (
                        startDate !== undefined &&
                        endDate !== undefined &&
                        !(n.date >= startDate && n.date <= endDate)
                      )
                        return false;
                      return true;
                    })
                    ?.filter((n) => n.tip === "absenta")
                    ?.filter((nota) => {
                      let scutiriElev = scutiri[el.id];
                      if (
                        (scutiriElev || [])?.find((scut) =>
                          motiveaza_absenta(nota, scut)
                        )
                      )
                        return true;
                      return false;
                    }).length
                );
              }, 0);
              let total = (
                eleviSelected.filter((el) => el.class === clasaData.id) || []
              ).reduce((acc, el) => {
                return (
                  acc +
                  (gradesElevi[el.id]?.note || [])
                    .filter((n) => {
                      if (
                        startDate !== undefined &&
                        endDate !== undefined &&
                        !(n.date >= startDate && n.date <= endDate)
                      )
                        return false;
                      return true;
                    })
                    ?.filter((n) => n.tip === "absenta")?.length
                );
              }, 0);
              return [
                clasaData?.anClasa + clasaData?.identificator,
                nemotivate,
                motivate,
                total,
              ];
            }),
          ]}
        />
      </>
    );
  };
  const StatisticiNote = () => {
    const columns = [
      {
        title: "Elevi",
        dataIndex: "phone",
        key: "phone",
        responsive: ["xs"],
        render: (e, data) => {
          const name = () => {
            return (
              <a
                onClick={() => {
                  navigate(`/elev/${data.id}`);
                }}
                style={{
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {clase.find((c) => c.id === data.class).anClasa +
                  clase.find((c) => c.id === data.class).identificator}
              </a>
            );
          };
          const clasa = () => {
            return (
              <a
                onClick={() => {
                  navigate(`/elev/${data.id}`);
                }}
                style={{
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {clase.find((c) => c.id === data.class).anClasa +
                  clase.find((c) => c.id === data.class).identificator}
              </a>
            );
          };
          const medieFinala = () => {
            return data.medieFinala;
          };
          const gen = () => {
            return data.gen;
          };
          const corigente = () => {
            return (
              <>
                {data.materiiCorigenta.map((e) => (
                  <Tag>
                    {
                      materii?.find((m) => {
                        return m.id === e;
                      })?.numeMaterie
                    }
                  </Tag>
                ))}{" "}
              </>
            );
          };
          return (
            <div style={{ textAlign: "center" }}>
              <p>Nume: {name()}</p>
              <p>Clasa: {clasa()}</p>
              <p>Medie: {medieFinala()}</p>

              <p>Corigente: {corigente()}</p>
            </div>
          );
        },
      },
      {
        title: "Nume",
        dataIndex: "nume",
        key: "nume",
        responsive: ["sm"],
        onFilter: (value, record) => record.name.indexOf(value) === 0,
        render: (e, data) => {
          return (
            <a
              onClick={() => {
                navigate(`/elev/${data.id}`);
              }}
              style={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {data.nume}
            </a>
          );
        },
      },
      {
        title: "Clasa",
        dataIndex: "class",
        key: "class",
        responsive: ["sm"],
        onFilter: (value, record) => record.name.indexOf(value) === 0,
        render: (e, data) => {
          return (
            <a
              onClick={() => {
                navigate(`/elev/${data.id}`);
              }}
              style={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {clase.find((c) => c.id === data.class).anClasa +
                clase.find((c) => c.id === data.class).identificator}
            </a>
          );
        },
      },
      {
        title: "Medie",
        dataIndex: "medieFinala",
        key: "medieFinala",
        responsive: ["sm"],
        sorter: (a, b) => a.medieFinala - b.medieFinala,
      },

      {
        title: "Materii Corigente",
        data: "corigente",
        key: "corigente",
        responsive: ["sm"],
        render: (e, data) => {
          return (
            <>
              {data.materiiCorigenta.map((e) => (
                <Tag>
                  {
                    materii?.find((m) => {
                      return m.id === e;
                    })?.numeMaterie
                  }
                </Tag>
              ))}{" "}
            </>
          );
        },
      },
    ];
    let elevi = eleviSelected.filter((el) => el.medieFinala > 0);
    let colors = ["red", "blue", "yellow", "green", "purple", "brown"];

    return (
      <>
        <Table
          pagination={false}
          columns={columns}
          dataSource={eleviSelected}
        />
        <h3>
          Medie Cumulata:{" "}
          {parseFloat(
            parseFloat(
              elevi.reduce((acc, cur) => acc + parseFloat(cur.medieFinala), 0) /
                (elevi?.length || 1)
            ).toFixed(2)
          )}
        </h3>

        <h3>Corigente</h3>
        <p>
          La o disciplina:{" "}
          {eleviSelected.filter((e) => e.materiiCorigenta.length === 1).length}
        </p>
        <p>
          La 2 discipline:{" "}
          {eleviSelected.filter((e) => e.materiiCorigenta.length === 2).length}
        </p>
        <p>
          La 3 discipline:{" "}
          {eleviSelected.filter((e) => e.materiiCorigenta.length === 3).length}
        </p>
        <p>
          La 4 discipline:{" "}
          {eleviSelected.filter((e) => e.materiiCorigenta.length === 4).length}
        </p>
        <p>
          La mai mult de 4 discipline:{" "}
          {eleviSelected.filter((e) => e.materiiCorigenta.length > 4).length}
        </p>
        <h3></h3>

        <Chart
          chartType="PieChart"
          width="100%"
          data={[
            ["Categorie", "Total"],
            [
              "Promovati",
              eleviSelected.filter((el) => el.medieFinala >= 5).length,
            ],
            [
              "Nepromovati",
              eleviSelected.filter((el) => el.medieFinala < 5).length,
            ],
          ]}
        />
        <h2>Distributia Selectiei</h2>

        <Chart
          chartType="BarChart"
          width="100%"
          options={{
            hAxis: { format: "0" },
            colors: [colors[1 % colors.length]],
          }}
          data={[
            ["Medie", "Numar Elevi"],
            [
              "5-5.99",
              eleviSelected.filter(
                (el) => el.medieFinala >= 5.0 && el.medieFinala <= 5.99
              ).length,
            ],
            [
              "6-6.99",
              eleviSelected.filter(
                (el) => el.medieFinala >= 6.0 && el.medieFinala <= 6.99
              ).length,
            ],
            [
              "7-7.99",
              eleviSelected.filter(
                (el) => el.medieFinala >= 7.0 && el.medieFinala <= 7.99
              ).length,
            ],
            [
              "8-8.99",
              eleviSelected.filter(
                (el) => el.medieFinala >= 8.0 && el.medieFinala <= 8.99
              ).length,
            ],
            [
              "9-9.99",
              eleviSelected.filter(
                (el) => el.medieFinala >= 9.0 && el.medieFinala <= 9.99
              ).length,
            ],
            [
              "10",
              eleviSelected.filter(
                (el) => el.medieFinala >= 10 && el.medieFinala <= 10
              ).length,
            ],
          ]}
        />
        <h2>Media Claselor</h2>
        <Chart
          chartType="ColumnChart"
          width="100%"
          data={[
            ["Clasa", "Media Clasei"],
            ...claseSelected.map((cls) => {
              let eleviiClasei = elevi.filter((e) => e.class === cls);
              let textClas =
                clase.find((c) => c.id === cls).anClasa +
                clase.find((c) => c.id === cls).identificator;
              return [
                textClas,
                parseFloat(
                  parseFloat(
                    eleviiClasei.reduce(
                      (acc, cur) => acc + cur.medieFinala,
                      0
                    ) / eleviiClasei.length
                  ).toFixed(2)
                ),
              ];
            }),
          ]}
        />
        <h2>Distributiile notelor pe clase</h2>
        {claseSelected.map((cls, index) => {
          let textClas =
            clase.find((c) => c.id === cls).anClasa +
            clase.find((c) => c.id === cls).identificator;
          let eleviiClasei = eleviSelected.filter((e) => e.class === cls);
          return (
            <>
              <Chart
                chartType="BarChart"
                width="100%"
                options={{
                  title: textClas,
                  hAxis: { format: "0" },
                  colors: [colors[index % colors.length]],
                }}
                data={[
                  ["Medie", "Numar Elevi"],
                  [
                    "5-5.99",
                    eleviiClasei.filter(
                      (el) => el.medieFinala >= 5.0 && el.medieFinala <= 5.99
                    ).length,
                  ],
                  [
                    "6-6.99",
                    eleviiClasei.filter(
                      (el) => el.medieFinala >= 6.0 && el.medieFinala <= 6.99
                    ).length,
                  ],
                  [
                    "7-7.99",
                    eleviiClasei.filter(
                      (el) => el.medieFinala >= 7.0 && el.medieFinala <= 7.99
                    ).length,
                  ],
                  [
                    "8-8.99",
                    eleviiClasei.filter(
                      (el) => el.medieFinala >= 8.0 && el.medieFinala <= 8.99
                    ).length,
                  ],
                  [
                    "9-10",
                    eleviiClasei.filter(
                      (el) => el.medieFinala >= 9.0 && el.medieFinala <= 10
                    ).length,
                  ],
                ]}
              />
              <br />
            </>
          );
        })}
      </>
    );
  };
  const StatisticiMaterii = () => {
    const columns = [
      {
        title: "Nume",
        dataIndex: "nume",
        key: "nume",

        onFilter: (value, record) => record.name.indexOf(value) === 0,
        render: (e, data) => {
          return (
            <a
              onClick={() => {
                navigate(`/elev/${data.id}`);
              }}
              style={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {data.nume}
            </a>
          );
        },
      },
      {
        title: "Clasa",
        dataIndex: "class",
        key: "class",
        responsive: ["sm"],
        onFilter: (value, record) => record.name.indexOf(value) === 0,
        render: (e, data) => {
          return (
            <a
              onClick={() => {
                navigate(`/elev/${data.id}`);
              }}
              style={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {clase.find((c) => c.id === data.class).anClasa +
                clase.find((c) => c.id === data.class).identificator}
            </a>
          );
        },
      },
      ...materiiAlese.map((m) => {
        return {
          title: materii?.find((a) => a.id === m).numeMaterie,
          dataIndex: m,
          key: m,
          sorter: (a, b) =>
            (a.grades || [])
              .filter((n) => {
                if (
                  startDate !== undefined &&
                  endDate !== undefined &&
                  !(n.date >= startDate && n.date <= endDate)
                )
                  return false;
                return true;
              })
              ?.filter((g) => g.tip === "nota" && g.materieId === m).length -
            (b.grades || [])?.filter(
              (g) => g.tip === "nota" && g.materieId === m
            ).length,
          render: (e, data) => {
            return (
              <div
                onClick={() => {
                  navigate(`/elev/${data.id}`);
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto auto auto ",
                }}
              >
                {(data?.grades || [])
                  .filter((n) => {
                    if (
                      startDate !== undefined &&
                      endDate !== undefined &&
                      !(n.date >= startDate && n.date <= endDate)
                    )
                      return false;
                    return true;
                  })
                  ?.filter((g) => g.tip === "nota" && g.materieId === m)
                  .map((g) => (
                    <p>{g.nota}</p>
                  ))}
              </div>
            );
          },
        };
      }),
    ];
    return (
      <>
        <Select
          mode="multiple"
          placeholder="Materii"
          value={materiiAlese}
          onChange={setMateriiAlese}
          style={{
            width: "100%",
          }}
          options={materiiTotal.map((item) => ({
            value: item,
            label: materii?.find((m) => m.id === item)?.numeMaterie,
          }))}
        />
        <Table
          pagination={false}
          columns={columns}
          dataSource={eleviSelected}
        />
      </>
    );
  };
  const items = [
    {
      key: "1",
      label: `Absente`,
      children: <StatisticiAbsente />,
    },
    {
      key: "3",
      label: `Medie`,
      children: <StatisticiNote />,
    },
    {
      key: "2",
      label: `Materii`,
      children: <StatisticiMaterii />,
    },
  ];
  const handlePrint = useReactToPrint({
    content: () => ref.current,
  });
  return (
    <div ref={ref}>
      <Select
        mode="multiple"
        placeholder="Clase"
        value={claseSelected}
        onChange={setClaseSelected}
        style={{
          width: "100%",
        }}
        options={clase
          .filter((c) => {
            if (user.type === "admin") return true;
            else if (c.diriginte === user.uid) return true;
            else if (c.diriginte_step === user.uid) return true;
          })
          .map((item) => ({
            value: item.id,
            label: item.anClasa + item.identificator,
          }))}
      />
      <br /> <br />
      <DatePicker.RangePicker
        placeholder={["Start", "Final"]}
        onChange={(e) => {
          setStartDate(
            (e || [])?.map((d, index) => {
              d.valueOf();
              let newDate = d.toDate();
              if (index === 0) newDate.setHours(0, 0, 0, 0);
              else newDate.setHours(23, 59, 59, 59);
              return newDate.getTime();
            })?.[0] || undefined
          );
          setEndDate(
            (e || [])?.map((d, index) => {
              d.valueOf();
              let newDate = d.toDate();
              if (index === 0) newDate.setHours(0, 0, 0, 0);
              else newDate.setHours(23, 59, 59, 59);
              return newDate.getTime();
            })?.[1] || undefined
          );
        }}
      />
      <br />
      <br />
      <Spin tip="Loading" size="large" spinning={loading} />
      {loading === false && <Tabs defaultActiveKey="1" items={items} />}
      <br />
      <br />
      <Button onClick={() => handlePrint()}>Print</Button>
    </div>
  );
}

export default Statistici;
