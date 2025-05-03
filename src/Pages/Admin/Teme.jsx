import React, { useEffect, useState } from "react";
import { Button, Select } from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { DatePicker, Space, Input } from "antd";
import { useSelector } from "react-redux";
import { storage } from "../../database/firebase";
import { useDispatch } from "react-redux";
import { blobToFile } from "../../utils";
import { db } from "../../database/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { testSlice } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  getMetadata,
  listAll,
} from "firebase/storage";
import {
  getDataDoc,
  updateDocDatabase,
  uploadFileDatabse,
  downloadFolderAsZip,
} from "../../database";
import dayjs from "dayjs";
import {
  InboxOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { message, Upload } from "antd";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
const { Dragger } = Upload;
const { actions } = testSlice;
const { GET_LOADING } = actions;
const { RangePicker } = DatePicker;
const formatDate = (today) => {
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  return dd + "/" + mm;
};

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
function Teme({ classData }) {
  const [dates, setDates] = useState([]);
  const [temeClasa, setTemeClasa] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const materii = useSelector((state) => state.materii);
  const [title, setTitle] = useState("");
  const [materieId, setMaterieId] = useState();
  const dispatch = useDispatch();
  const fetchData = async () => {
    const data = await getDataDoc("teme", classData.id);
    setTemeClasa(data?.teme || []);
  };
  useEffect(() => {
    fetchData();
  }, [classData.id]);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "teme", classData.id), (doc) => {
      setTemeClasa(doc.data()?.teme || []);
    });
    return unsub;
  }, []);

  const onRangeChange = (dates, dateStrings) => {
    if (dates) {
      setDates(dates.map((d) => d.valueOf()));
    } else {
      setDates([]);
    }
  };
  const rangePresets = [
    {
      label: "O saptamana",
      value: [dayjs(), dayjs().add(7, "d")],
    },
    {
      label: "2 saptamani",
      value: [dayjs(), dayjs().add(14, "d")],
    },
    {
      label: "O luna",
      value: [dayjs(), dayjs().add(30, "d")],
    },
  ];
  const props = {
    name: "file",
    multiple: true,
    action: "https://www.mocky.io/v2/5cc8019d300000980a055e76",
    onChange(info) {
      const { status } = info.file;
      if (status !== "uploading") {
      }
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };
  const [mode, setMode] = useState("view");
  const [fileList, setFileList] = useState([]);
  const [editor, setEditor] = useState("");

  const fetchEditImags = async (tema) => {
    const array = [];
    const folderRef = ref(storage, "teme" + tema.id.toString());
    const folder = await listAll(folderRef);

    const promises = await (folder.items || [])
      .map(async (item) => {
        const file = await getMetadata(item);
        const fileRef = ref(storage, item.fullPath);

        const fileBlob = await getDownloadURL(fileRef).then((url) => {
          return fetch(url).then((response) => response?.blob());
        });

        array.push({
          ...file,
          uid: parseInt(Date.now()).toString(),
          originFileObj: blobToFile(fileBlob, file.name),
        });
      })

      ?.reduce((acc, curr) => acc.then(() => curr), Promise.resolve());
    setFileList(array);
    setLoading(false);
  };

  useEffect(() => {
    if (mode.type === "edit") {
      setLoading(true);
      fetchEditImags(mode.tema);
      setEditor(mode.tema.editor);
      setTitle(mode.tema.title);
      setDates(mode.tema.dates);
      setMaterieId(mode.tema.materieId);
    }
  }, [mode]);

  return (
    <div>
      <Spin tip="Loading" size="large" spinning={loading} />
      {mode === "add" && loading === false ? (
        <div
          style={{
            display: "block",
            backgroundColor: "#F5F5F5",
          }}
        >
          {" "}
          <div style={{ paddingTop: "10px" }}>
            <h5>Alege Materia</h5>
            <Select
              style={{
                width: 250,
              }}
              value={materieId}
              onChange={(e, data) => {
                setMaterieId(e);
              }}
              options={(classData?.materii || [])?.map((matID) => {
                return {
                  label: materii?.find((ma) => ma.id === matID.materie)
                    ?.numeMaterie,
                  value: materii?.find((ma) => ma.id === matID.materie)?.id,
                };
              })}
            />
          </div>
          <div style={{ paddingTop: "10px" }}>
            <h5>Alege intervalul de valabilitate</h5>
            <RangePicker presets={rangePresets} onChange={onRangeChange} />
          </div>
          <br />
          <Input
            placeholder="Titlul Temei"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
          <ReactQuill
            theme="snow"
            modules={modules}
            placeholder="Poti scrie aici detaliile temei"
            value={editor}
            onChange={setEditor}
          />
          <h3>Adaugă Fisiere</h3>
          <Dragger
            {...props}
            onChange={(e) => {
              //setFileList([e.file]);

              setFileList(e.fileList);
            }}
            beforeUpload={(file) => {
              return false;
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Apasa sau trage</p>
          </Dragger>
          <br />
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              type="primary"
              danger
              style={{ width: "49.5%" }}
              onClick={() => {
                setMode("view");
              }}
            >
              Anuleaza
            </Button>
            <Button
              type="primary"
              style={{ width: "49.5%" }}
              onClick={async () => {
                let id = Date.now();
                if (loading === true) return;
                try {
                  if (!materieId?.length) {
                    openErrorNotification("selecteaza materie");
                    return;
                  }
                  if (!title?.length) {
                    openErrorNotification("pune titlu");
                    return;
                  }
                  setLoading(true);
                  await uploadFileDatabse(
                    fileList.map((f) => {
                      return f.originFileObj;
                    }),
                    "teme" + id
                  );

                  await updateDocDatabase("teme", classData.id, {
                    teme: [
                      {
                        id,
                        dates,
                        editor,
                        title,
                        materieId,
                        download: fileList.length > 0,
                      },
                      ...temeClasa,
                    ],
                  });
                  await updateDocDatabase("mail", "tema" + Date.now(), {
                    to: classData?.elevi?.reduce(
                      (acc, e) => [
                        ...acc,
                        e.adresaEmail,
                        ...(e?.parintii || []),
                      ],
                      []
                    ),
                    message: {
                      subject:
                        "A fost postata tema " +
                        title +
                        " la " +
                        materii?.find((ma) => ma.id === materieId).numeMaterie,
                      text: `
                      Poti sa incarci intre: 
                      ${dates?.[0] ? formatDate(new Date(dates[0])) : ""} - ${
                        dates?.[1] ? formatDate(new Date(dates[1])) : ""
                      }`,
                    },
                  });
                  setLoading(false);
                  setMode("view");
                } catch (e) {
                  openErrorNotification(e.message);
                }
              }}
            >
              Adaugă
            </Button>
          </div>
        </div>
      ) : mode === "view" && loading === false ? (
        <>
          <Button
            type="primary"
            style={{ width: "100%" }}
            onClick={() => {
              setMode("add");
            }}
          >
            Adaugă Tema
          </Button>
          <br />
          <br />
          {temeClasa
            .filter((tema) =>
              classData.materii?.find((ma) => ma.materie === tema.materieId)
            )
            ?.map((tema, index) => {
              return (
                <>
                  <div
                    style={{
                      display: "block",
                      backgroundColor: "#F5F5F5",
                      border: "1px solid black",
                      width: "100%",
                      height: "auto",
                    }}
                  >
                    {" "}
                    <div
                      style={{
                        display: "flex",
                        marginTop: "20px",
                        paddingRight: "10px",
                        gap: "10px",
                        float: "right",
                      }}
                    >
                      <Button
                        shape="circle"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={async () => {
                          await updateDocDatabase("teme", classData.id, {
                            teme: temeClasa.filter(
                              (t) => parseInt(t.id) !== parseInt(tema.id)
                            ),
                          });
                        }}
                      />

                      <Button
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={async () => {
                          setMode({ type: "edit", tema: tema });
                        }}
                        type="primary"
                      />
                      <Button
                        shape="circle"
                        icon={<FolderOpenOutlined />}
                        onClick={async () => {
                          navigate("/submisi-tema/" + tema.id);
                        }}
                      />
                    </div>{" "}
                    <br />
                    <br />
                    <h2 style={{ textAlign: "center" }}>{tema.title}</h2>
                    <h3>Materie</h3>
                    <h4 style={{ color: "red" }}>
                      {
                        materii?.find((ma) => ma.id === tema.materieId)
                          ?.numeMaterie
                      }
                    </h4>
                    <h3>Termen</h3>
                    <h4 style={{ color: "red" }}>
                      {" "}
                      {tema?.dates?.[0]
                        ? formatDate(new Date(tema.dates[0]))
                        : ""}{" "}
                      -
                      {tema?.dates?.[1]
                        ? formatDate(new Date(tema.dates[1]))
                        : ""}
                    </h4>
                    <br />
                    <ReactQuill
                      theme="snow"
                      readOnly={true}
                      placeholder="Poti scrie aici detaliile temei"
                      value={tema.editor}
                    />
                    <br />
                    {tema.download && (
                      <Button
                        style={{ marginBottom: "10px" }}
                        onClick={() => {
                          downloadFolderAsZip(
                            "teme" + tema.id,
                            "tema_" + tema.title
                          );
                        }}
                      >
                        Descarca Documentele{" "}
                      </Button>
                    )}
                  </div>
                  <br />
                </>
              );
            })}
        </>
      ) : (
        loading === false && (
          <div
            style={{
              display: "block",
              backgroundColor: "#F5F5F5",
            }}
          >
            {" "}
            <div style={{ paddingTop: "10px" }}>
              <h5>Alege Materia</h5>
              <Select
                style={{
                  width: 250,
                }}
                value={materieId}
                onChange={(e, data) => {
                  setMaterieId(e);
                }}
                options={(classData?.materii || [])?.map((matID) => {
                  return {
                    label: materii?.find((ma) => ma.id === matID.materie)
                      ?.numeMaterie,
                    value: materii?.find((ma) => ma.id === matID.materie)?.id,
                  };
                })}
              />
            </div>
            <div style={{ paddingTop: "10px" }}>
              <h5>Alege intervalul de valabilitate</h5>
              <RangePicker
                presets={rangePresets}
                onChange={onRangeChange}
                value={dates.map((d) => dayjs(new Date(d)))}
              />
            </div>
            <br />
            <Input
              placeholder="Titlul Temei"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
            />
            <ReactQuill
              theme="snow"
              modules={modules}
              placeholder="Poti scrie aici detaliile temei"
              value={editor}
              onChange={setEditor}
            />
            <h3>Adaugă Fisiere</h3>
            <Dragger
              {...props}
              fileList={fileList}
              onChange={(e) => {
                //setFileList([e.file]);

                setFileList(e.fileList);
              }}
              beforeUpload={(file) => {
                return false;
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Apasa sau trage</p>
            </Dragger>
            <br />
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                type="primary"
                danger
                style={{ width: "49.5%" }}
                onClick={() => {
                  setMode("view");
                }}
              >
                Anuleaza
              </Button>
              <Button
                type="primary"
                style={{ width: "49.5%" }}
                onClick={async () => {
                  let id = mode.tema.id;
                  let newId = new Date().getTime();
                  if (loading === true) return;
                  try {
                    if (!materieId?.length) {
                      openErrorNotification("selecteaza materie");
                      return;
                    }
                    if (!title?.length) {
                      openErrorNotification("pune titlu");
                      return;
                    }
                    setLoading(true);
                    await uploadFileDatabse(
                      fileList.map((f) => {
                        return f.originFileObj;
                      }),
                      "teme" + newId
                    );

                    await updateDocDatabase("teme", classData.id, {
                      teme: [
                        {
                          id: newId,
                          dates,
                          editor,
                          title,
                          materieId,
                          download: fileList.length > 0,
                        },
                        ...temeClasa.filter((t) => t.id !== id),
                      ],
                    });
                    await updateDocDatabase("mail", "tema" + Date.now(), {
                      to: classData?.elevi?.reduce(
                        (acc, e) => [
                          ...acc,
                          e.adresaEmail,
                          ...(e?.parintii || []),
                        ],
                        []
                      ),
                      message: {
                        subject:
                          "A fost editata tema " +
                          title +
                          " la " +
                          materii?.find((ma) => ma.id === materieId)
                            .numeMaterie,
                        text: `
                        Poti sa incarci intre: 
                        ${formatDate(new Date(dates[0]))} - ${formatDate(
                          new Date(dates[1])
                        )}`,
                      },
                    });
                    setMode("view");
                    setLoading(false);
                  } catch (e) {
                    openErrorNotification(e.message);
                  }
                }}
              >
                Salveaza
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default Teme;
