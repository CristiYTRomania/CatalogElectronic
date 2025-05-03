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
import { db } from "../../database/firebase";
import { useReactToPrint } from "react-to-print";
import { Button } from "antd";
import { calculeaza_medie_materie } from "../../utils/calculare_medie";
import { motiveazaAbsente, motiveaza_absenta } from "../../utils/absente";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const StatisticiReligie = ({ clase }) => {
  const [eleviSelected, setEleviSelected] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      let array = [];
      let scutiriElevi = {};
      let note = {};
      let materii = [];
      const eleviRef = collection(db, "elevi");
      const q = query(eleviRef, where("religie", "!=", null)); // Verifică existența câmpului `religie`
      try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
          const elev = doc.data();
          if (
            elev.mutat !== true &&
            elev.retras !== true &&
            elev.religie !== "da"
          )
            array.push({
              nume:
                elev.numeDeFamilie + " " + elev.initiala + " " + elev.prenume,
              id: doc.id,
              ...elev,
            });
        });
      } catch (error) {
        console.error("Eroare la preluarea datelor: ", error);
      }

      setEleviSelected(
        array.sort((a, b) => {
          if (a.nume < b.nume) return -1;
          return 1;
        })
      );
    };
    fetchData();
  }, []);
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
              onClick={() => {}}
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
              style={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {clase.find((c) => c.id === data.class)?.anClasa +
                clase.find((c) => c.id === data.class)?.identificator}
            </a>
          );
        };
        const religie = (e) => {
          return e.religie;
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p>Nume: {name()}</p>
            <p>Clasa: {clasa()}</p>
            <p>Religie: {religie()}</p>
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
              console.log({ e, data });
              navigate("/elev/" + data.id);
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
            onClick={() => {}}
            style={{
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {clase?.find((c) => c.id === data.clasa)?.anClasa +
              clase?.find((c) => c.id === data.clasa)?.identificator}
          </a>
        );
      },
    },
    {
      title: "Religie",
      dataIndex: "religie",
      responsive: ["sm"],
      render: (e, data) => {
        return data.religie;
      },
    },
  ];

  return (
    <>
      <Table pagination={false} columns={columns} dataSource={eleviSelected} />
    </>
  );
};

async function getFilteredElevi() {
  const eleviRef = collection(db, "elevi");

  // Definim interogările individuale
  const queries = [
    query(eleviRef, where("mutat", "==", true)),
    query(eleviRef, where("deleted", "==", true)),
    query(eleviRef, where("retras", "==", true)),
    query(eleviRef, where("transferuri", "!=", null)),
  ];

  // Executăm toate interogările simultan
  const snapshots = await Promise.all(queries.map((q) => getDocs(q)));

  // Stocăm rezultatele într-un Map pentru a evita duplicatele
  const uniqueElevi = new Map();

  snapshots.forEach((snapshot) => {
    snapshot.forEach((doc) => {
      console.log("intru");
      uniqueElevi.set(doc.id, { idElev: doc.id, ...doc.data() });
    });
  });

  // Convertim Map-ul într-un array de obiecte și returnăm
  return Array.from(uniqueElevi.values());
}
const StatisticiTransferuri = ({ clase }) => {
  const [eleviSelected, setEleviSelected] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      let array = [];
      let scutiriElevi = {};
      let note = {};
      let materii = [];
      const eleviRef = collection(db, "elevi");
      const q = query(eleviRef, where("transferuri", "!=", null)); // Verifică existența câmpului `religie`
      try {
        const elevi = await getFilteredElevi();

        for (let elev of elevi)
          if (
            elev?.mutat == true ||
            elev?.deleted == true ||
            elev?.retras == true ||
            elev?.transferuri
          )
            array.push({
              nume:
                elev.numeDeFamilie + " " + elev.initiala + " " + elev.prenume,

              ...elev,
              id: elev.idElev,
            });
      } catch (error) {
        console.error("Eroare la preluarea datelor: ", error);
      }

      setEleviSelected(
        array.sort((a, b) => {
          if (a.nume < b.nume) return -1;
          return 1;
        })
      );
    };
    fetchData();
  }, []);
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
              onClick={() => {}}
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
              onClick={() => {}}
              style={{
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {clase.find((c) => c.id === data.class)?.anClasa +
                clase.find((c) => c.id === data.class)?.identificator}
            </a>
          );
        };
        const religie = (e) => {
          return e.religie;
        };
        return (
          <div style={{ textAlign: "center" }}>
            <p>Nume: {name()}</p>
            <p>Clasa: {clasa()}</p>
            {/* <p>Religie: {religie()}</p> */}
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
        console.log(data);
        return (
          <a
            onClick={() => {}}
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
            onClick={() => {}}
            style={{
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {clase?.find((c) => c.id === data.clasa)?.anClasa +
              clase?.find((c) => c.id === data.clasa)?.identificator}
          </a>
        );
      },
    },
    {
      title: "Religie",
      dataIndex: "religie",
      responsive: ["sm"],
      render: (e, data) => {
        return data.religie;
      },
    },
  ];

  return (
    <>
      <Table pagination={false} columns={columns} dataSource={eleviSelected} />
    </>
  );
};
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

  const [loading, setLoading] = useState(false);

  //   useEffect(() => {
  //     setLoading(true);
  //     fetchData();
  //   }, [claseSelected]);

  const items = [
    {
      key: "1",
      label: `Religie`,
      children: <StatisticiReligie clase={clase || []} />,
    },
    {
      key: "2",
      label: `Transferuri`,
      children: <StatisticiTransferuri clase={clase || []} />,
    },
  ];
  const handlePrint = useReactToPrint({
    content: () => ref.current,
  });
  return (
    <div ref={ref}>
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
