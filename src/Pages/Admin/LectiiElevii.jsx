import React, { useState, useEffect } from "react";
import { Select, Space } from "antd";
import { deleteDataDoc, getDataDoc, updateDocDatabase } from "../../database";
import { useSelector } from "react-redux";
import ReactQuill from "react-quill";
import { db, storage } from "../../database/firebase";
import { Button, Divider, Tag } from "antd";
import "react-quill/dist/quill.snow.css";
import { getDocs, collection, onSnapshot, doc } from "firebase/firestore";
import { message, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { downloadFolderAsZip } from "../../database";
import { blobToFile } from "../../utils";
import { uploadFileDatabse } from "../../database";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
import { testSlice } from "../../redux/store";
import { Icon, Accordion } from "semantic-ui-react";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  getMetadata,
  listAll,
} from "firebase/storage";
import { useDispatch } from "react-redux";
import { date } from "@progress/kendo-react-dateinputs/dist/npm/messages";
import { type } from "@testing-library/user-event/dist/type";
const { actions } = testSlice;
const { GET_LOADING } = actions;

const { Dragger } = Upload;
const options = [
  {
    value: "neterminate",
    label: "Neterminate",
  },
  {
    value: "nenotate",
    label: "Fară Nota",
  },
  {
    value: "notate",
    label: "Notate",
  },
];
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
const formatDate = (today) => {
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  return dd + "/" + mm;
};
function TemeElevi() {
  const handleChange = (value) => {};
  const user = useSelector((state) => state.user);
  const materii = useSelector((state) => state.materii);
  const [editor, setEditor] = useState("");
  const [mode, setMode] = useState(null);
  const [selectedMaterii, setSelectedMaterii] = useState([]);
  const [incarcariElevi, setIncarcariElevi] = useState([]);
  const dispatch = useDispatch();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const classData = useSelector((state) => state.user.clasaMea);
  const [temeClasa, setTemeClasa] = useState([]);
  const [activeIndex, setActiveIndex] = useState(1);
  const fetchData = async () => {
    const data = await getDataDoc("lectii", classData?.id);

    setTemeClasa(data?.lectii || []);
    const incarcari = [];
    const querySnapshot = await getDocs(collection(db, user.uid + "_TEME"));

    querySnapshot.forEach(async (doc) => {
      incarcari.push({
        ...doc.data(),
        idTema: doc.id,
      });
    });

    setIncarcariElevi(incarcari);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <div>
      <h1>Lecțiile Mele</h1>
      <Space
        style={{
          width: "100%",
        }}
        direction="horizontal"
      >
        <Select
          mode="multiple"
          allowClear
          style={{ minWidth: "200px" }}
          placeholder="Selecteaza"
          onChange={(values) => setSelectedMaterii(values)}
          options={(classData?.materii || []).map((mat) => {
            let materie = materii?.find((ma) => ma.id === mat.materie);
            return { label: materie.numeMaterie, value: materie.id };
          })}
        />
      </Space>
      <br /> <br /> <br /> <br />
      {temeClasa
        .filter((tema) => {
          if (selectedMaterii.length > 0) {
            if (!selectedMaterii.includes(tema.materieId)) return 0;
          }
          if (types.length > 0) {
            let status = 0;

            if (
              incarcariElevi.find(
                (incarcare) => incarcare.idTema === tema.id.toString()
              ) === undefined
            )
              status = "neterminate";
            else if (
              incarcariElevi.find(
                (incarcare) => incarcare.idTema === tema.id.toString()
              )?.nota ||
              incarcariElevi.find(
                (incarcare) => incarcare.idTema === tema.id.toString()
              )?.commentNota
            )
              status = "notate";
            else status = "nenotate";

            if (!types.find((text) => text == status)) return 0;
          }
          return 1;
        })
        ?.map((tema, index) => {
          let end = false;
          let show = true;
          if (tema.dates?.length > 0) {
            let start = new Date(tema.dates[0]);
            start.setHours(0, 0, 0);
            if (new Date() < start) show = false;
            end = new Date(tema.dates[1]);
            end.setHours(23, 59, 59);
          }

          if (show === true)
            return (
              <>
                <div
                  style={{
                    display: "block",

                    border: "1px solid #002140",
                  }}
                >
                  <h2 style={{ paddingTop: "10px" }}>{tema.title}</h2>
                  <h3>
                    Materie:&nbsp;{" "}
                    {
                      materii?.find((ma) => ma.id === tema.materieId)
                        ?.numeMaterie
                    }
                  </h3>
                  <br />
                  <Divider />
                  <div className="hideql">
                    <ReactQuill
                      theme="snow"
                      readOnly={true}
                      placeholder="Poti scrie aici detaliile temei"
                      value={tema.editor}
                    />
                  </div>
                  <br />
                  <Button
                    style={{ marginBottom: "10px" }}
                    onClick={() => {
                      downloadFolderAsZip(
                        "lectii" + tema.id,
                        "lectie_" + tema.title
                      );
                    }}
                  >
                    Descarca Documentele{" "}
                  </Button>{" "}
                  <Divider></Divider>
                </div>
                <br />
              </>
            );
        })}
    </div>
  );
}

export default TemeElevi;
