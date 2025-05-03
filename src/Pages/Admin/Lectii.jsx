import React, { useEffect, useState } from "react";
import { Button, Select } from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { DatePicker, Space, Input } from "antd";
import { useSelector } from "react-redux";
import { storage } from "../../database/firebase";
import { blobToFile } from "../../utils";
import { db } from "../../database/firebase";
import { useDispatch } from "react-redux";
import { doc, onSnapshot } from "firebase/firestore";
import { testSlice } from "../../redux/store";
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
import { InboxOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { message, Upload } from "antd";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
const { actions } = testSlice;
const { GET_LOADING } = actions;
const { Dragger } = Upload;
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
function Lectii({ classData }) {
  const [lectiiClasa, setLectiiClasa] = useState([]);
  const materii = useSelector((state) => state.materii);
  const [title, setTitle] = useState("");
  const dispatch = useDispatch();
  const [materieId, setMaterieId] = useState();
  const fetchData = async () => {
    const data = await getDataDoc("lectii", classData.id);
    setLectiiClasa(data?.lectii || []);
  };
  useEffect(() => {
    fetchData();
  }, [classData.id]);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "lectii", classData.id), (doc) => {
      setLectiiClasa(doc.data()?.lectii || []);
    });
    return unsub;
  }, []);

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
  const [loading, setLoading] = useState(false);

  const fetchEditImags = async (lectie) => {
    const array = [];
    const folderRef = ref(storage, "lectii" + lectie.id.toString());
    const folder = await listAll(folderRef);

    const promises = ((await folder.items) || [])
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
      fetchEditImags(mode.lectie);
      setEditor(mode.lectie.editor);
      setTitle(mode.lectie.title);

      setMaterieId(mode.lectie.materieId);
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
          <br />
          <Input
            placeholder="Titlul Lectiei"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
          <ReactQuill
            theme="snow"
            modules={modules}
            placeholder="Poti scrie aici detaliile lectiii"
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
            <p className="ant-upload-text">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for a single or bulk upload. Strictly prohibited from
              uploading company data or other banned files.
            </p>
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
                if (!materieId?.length) {
                  openErrorNotification("selecteaza materie");
                  return;
                }
                if (!title?.length) {
                  openErrorNotification("pune titlu");
                  return;
                }
                try {
                  setLoading(true);
                  await uploadFileDatabse(
                    fileList.map((f) => {
                      return f.originFileObj;
                    }),
                    "lectii" + id
                  );

                  await updateDocDatabase("lectii", classData.id, {
                    lectii: [
                      {
                        id,

                        editor,
                        title,
                        materieId,
                        download: fileList.length > 0,
                      },
                      ...lectiiClasa,
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
                        "A fost postata lectia " +
                        title +
                        " la " +
                        materii?.find((ma) => ma.id === materieId).numeMaterie,
                    },
                  });
                  setMode("view");
                  setLoading(false);
                } catch (e) {
                  openErrorNotification(e.message);
                }
              }}
            >
              Adaugă
            </Button>
          </div>
        </div>
      ) : mode === "view" ? (
        <>
          <Button
            type="primary"
            style={{ width: "100%" }}
            onClick={() => {
              setMode("add");
            }}
          >
            Adaugă Lectie
          </Button>
          <br />
          <br />
          {lectiiClasa
            .filter((tema) =>
              classData.materii?.find((ma) => ma.materie === tema.materieId)
            )
            ?.map((lectie, index) => {
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
                          await updateDocDatabase("lectii", classData.id, {
                            lectii: lectiiClasa.filter(
                              (t) => parseInt(t.id) !== parseInt(lectie.id)
                            ),
                          });
                        }}
                      />

                      <Button
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={async () => {
                          setMode({ type: "edit", lectie: lectie });
                        }}
                        type="primary"
                      />
                    </div>{" "}
                    <br />
                    <br />
                    <h2 style={{ textAlign: "center" }}>{lectie.title}</h2>
                    <h3>Materie</h3>
                    <h4 style={{ color: "red" }}>
                      {
                        materii?.find((ma) => ma.id === lectie.materieId)
                          ?.numeMaterie
                      }
                    </h4>
                    <br />
                    <ReactQuill
                      theme="snow"
                      readOnly={true}
                      placeholder="Poti scrie aici detaliile lectiii"
                      value={lectie.editor}
                    />
                    <br />
                    {lectie.download && (
                      <Button
                        style={{ marginBottom: "10px" }}
                        onClick={() => {
                          downloadFolderAsZip(
                            "lectii" + lectie.id,
                            "lectie_" + lectie.title
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
            <br />
            <Input
              placeholder="Titlul Lectiei"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
            />
            <ReactQuill
              theme="snow"
              modules={modules}
              placeholder="Poti scrie aici detaliile lectiii"
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
              <p className="ant-upload-text">
                Click or drag file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for a single or bulk upload. Strictly prohibited from
                uploading company data or other banned files.
              </p>
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
                  let id = mode.lectie.id;
                  if (loading === true) return;
                  let newId = new Date().getTime();
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
                      "lectii" + newId
                    );

                    await updateDocDatabase("lectii", classData.id, {
                      lectii: [
                        {
                          id: newId,

                          editor,
                          title,
                          materieId,
                          download: fileList.length > 0,
                        },
                        ...lectiiClasa.filter((t) => t.id !== id),
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
                          "A fost postata lectia " +
                          title +
                          " la " +
                          materii?.find((ma) => ma.id === materieId)
                            .numeMaterie,
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

export default Lectii;
