import React, { useEffect, useState } from "react";
import {
  getDataDoc,
  updateDocDatabase,
  uploadFileDatabse,
  downloadFolderAsZip,
} from "../../database";
import { db } from "../../database/firebase";
import { doc, onSnapshot, getDocs, collection } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { Table, Button, Tabs, Input } from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RollbackOutlined } from "@ant-design/icons";
const modules = {
  toolbar: [
    [{ font: [] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    ["blockquote", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }, { align: [] }],
    ["link", "image", "video"],
    ["clean"],
  ],
};
function Submisii() {
  const { id } = useParams();
  const [incarcariElevi, setIncarcariElevi] = useState([]);
  const [mode, setMode] = useState("view");
  const [dataTema, setDataTema] = useState({});
  const navigate = useNavigate();

  const fetchData = async () => {
    const incarcari = [];
    const querySnapshot = await getDocs(collection(db, id + "_REZOLVARI"));
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots

      incarcari.push({
        ...doc.data(),
        idElev: doc.id,
        nume: doc.data().name,
        nota: doc.data().nota || "",
      });
    });

    setIncarcariElevi(incarcari);
  };

  useEffect(() => {
    fetchData();
    if (id) {
      const unsub = onSnapshot(collection(db, id + "_REZOLVARI"), (doc) => {
        fetchData();
      });
    }
  }, [id]);

  const Submisie = ({ tema }) => {
    const materii = useSelector((state) => state.materii);
    return (
      <>
        {" "}
        <>
          <h1>{tema.name} a incarcat</h1>
          <ReactQuill
            theme="snow"
            readOnly={true}
            placeholder="Poti scrie aici detaliile temei"
            value={tema.editor}
          />{" "}
          <br />
          <br />
          <Button
            onClick={() => {
              downloadFolderAsZip("rezolvari" + tema.id, "rezolvari" + tema.id);
            }}
          >
            Descarca fisierele incarcate
          </Button>
          <br />
          <br />
        </>
      </>
    );
  };
  const Notare = ({ tema, temaData }) => {
    const [nota, setNota] = useState("");
    const [editor, setEditor] = useState("");
    const materii = useSelector((state) => state.materii);

    const fetchData = async () => {
      let data = await getDataDoc(id + "_REZOLVARI", tema);

      setNota(data.nota);
      setEditor(data.commentNota);
    };
    useEffect(() => {
      fetchData();
      const unsub = onSnapshot(doc(db, id + "_REZOLVARI", tema), (doc) => {
        fetchData();
      });
    }, [tema]);

    return (
      <>
        Nota
        <br />
        <Input
          value={nota}
          onChange={(e) => {
            setNota(e.target.value);
          }}
          style={{ width: "50px" }}
        />
        <br />
        <br />
        <ReactQuill
          theme="snow"
          modules={modules}
          placeholder="Comentariu"
          value={editor}
          onChange={setEditor}
        />
        <Button
          onClick={async () => {
            await updateDocDatabase(id + "_REZOLVARI", tema, {
              nota: nota,
              commentNota: editor,
            });
            await updateDocDatabase(temaData.idElev + "_TEME", id, {
              nota: nota,
              commentNota: editor,
            });
            let elev = await getDataDoc("elevi", temaData.idElev);
            await updateDocDatabase("mail", temaData.idElev + Date.now(), {
              to: [elev.adresaEmail, ...(elev.parintii || [])],
              message: {
                subject:
                  elev.numeDeFamilie +
                  " " +
                  elev.prenume +
                  " a primit nota " +
                  nota +
                  " la tema incarcata",
                text:
                  elev.numeDeFamilie +
                  " " +
                  elev.prenume +
                  " a primit nota " +
                  nota +
                  " la tema incarcata.",
              },
            });
          }}
        >
          Salveaza
        </Button>
      </>
    );
  };
  const items = [
    {
      key: "1",
      label: `Rezolvare`,
      children: <Submisie tema={dataTema} />,
    },
    {
      key: "2",
      label: `Notare`,
      children: <Notare tema={mode} temaData={dataTema} />,
    },
  ];
  const columns = [
    {
      title: "nume",
      dataIndex: "nume",
      key: "nume",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Nota",
      dataIndex: "nota",
      key: "nota",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Tema",
      dataIndex: "tema",
      key: "tema",
      width: "100",
      render: (e, data) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            type="primary"
            onClick={() => {
              setMode(data.idElev);
              setDataTema(data);
            }}
          >
            Vezi Tema
          </Button>
        </div>
      ),
    },
  ];
  return (
    <div>
      {window.screen.width < 750 && (
        <Button
          style={{ width: "100%" }}
          icon={<RollbackOutlined />}
          onClick={() => navigate(-1)}
        />
      )}
      {mode === "view" ? (
        <>
          <h1>Incarcari</h1>
          <Table
            columns={columns}
            dataSource={incarcariElevi}
            pagination={false}
          />
        </>
      ) : (
        <>
          <Button
            icon={<RollbackOutlined />}
            onClick={() => {
              setMode("view");
            }}
            style={{ float: "left" }}
          />
          <Tabs defaultActiveKey="1" items={items} tabPosition="left" />
        </>
      )}
    </div>
  );
}

export default Submisii;
