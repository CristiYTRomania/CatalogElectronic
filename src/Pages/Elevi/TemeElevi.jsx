import React, { useState, useEffect } from "react";
import { Select, Space, Spin } from "antd";
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
    label: "De Realizat",
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
    const data = await getDataDoc("teme", classData?.id);

    setTemeClasa(data?.teme || []);
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
    if (user) {
      const unsub = onSnapshot(collection(db, user?.uid + "_TEME"), (doc) => {
        fetchData();
      });
    }
  }, [user]);

  const fetchEdit = async (tema) => {
    setLoading(true);
    const data = await getDataDoc(user.uid + "_TEME", tema.id.toString());
    setEditor(data?.editor);
    const array = [];

    const folderRef = ref(storage, "rezolvari" + data.id.toString());
    const folder = await listAll(folderRef);

    const promises = await folder.items
      .map(async (item) => {
        const file = await getMetadata(item);
        const fileRef = ref(storage, item.fullPath);

        const fileBlob = await getDownloadURL(fileRef).then((url) => {
          return fetch(url).then((response) => response?.blob());
        });

        if (fileBlob)
          array.push({
            ...file,
            uid: parseInt(Date.now()).toString(),
            originFileObj: blobToFile(fileBlob, file.name),
          });
      })

      .reduce((acc, curr) => acc.then(() => curr), Promise.resolve());
    setFileList(array);
    setLoading(false);
  };

  useEffect(() => {
    if ((mode || "").slice(0, 4) === "edit") {
      let index = parseInt(mode.substring(4));
      let tema = temeClasa?.[index];
      fetchEdit(tema);
    }
  }, [mode]);

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

  return (
    <div>
      <h1>Temele Mele</h1>
      <Spin type="Loading" size="large" spinning={loading} />
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
          defaultValue={["neterminate", "nenotate", "notate"]}
          onChange={(values) => {
            setTypes(values);
          }}
          options={options}
        />
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
              loading === false && (
                <>
                  <div
                    style={{
                      display: "block",

                      border: "1px solid #002140",
                    }}
                  >
                    <h2 style={{ paddingTop: "10px" }}>{tema.title}</h2>
                    <h4>
                      Materie: &nbsp;
                      {
                        materii?.find((ma) => ma.id === tema.materieId)
                          ?.numeMaterie
                      }
                    </h4>
                    <h3 style={{ color: "red" }}>
                      Termen{" "}
                      {tema?.dates?.[0]
                        ? formatDate(new Date(tema.dates[0]))
                        : ""}{" "}
                      -
                      {tema?.dates?.[1]
                        ? formatDate(new Date(tema.dates[1]))
                        : ""}
                    </h3>
                    <h4> </h4>
                    <br />
                    <div class="hideql">
                      <h5>Descriere:</h5>
                      <Divider />
                      <ReactQuill
                        theme="snow"
                        readOnly={true}
                        toolbar={false}
                        value={tema.editor}
                        placeholder="Nu exista date"
                      />
                    </div>
                    <br />
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
                    </Button>{" "}
                    <Divider></Divider>
                    {mode === "edit" + index ? (
                      loading === true ? (
                        <></>
                      ) : (
                        <>
                          <h3>Editeaza Tema</h3>
                          <ReactQuill
                            theme="snow"
                            modules={modules}
                            placeholder="Poti scrie aici detaliile temei"
                            value={editor}
                            onChange={setEditor}
                          />{" "}
                          <br />
                          <br />
                          <Dragger
                            {...props}
                            onChange={(e) => {
                              //setFileList([e.file]);

                              setFileList(e.fileList);
                            }}
                            fileList={fileList}
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
                              Support for a single or bulk upload. Strictly
                              prohibited from uploading company data or other
                              banned files.
                            </p>
                          </Dragger>{" "}
                          <br />
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
                                try {
                                  let id = Date.now();
                                  try {
                                    await uploadFileDatabse(
                                      fileList.map((f) => {
                                        return f.originFileObj;
                                      }),
                                      "rezolvari" + id
                                    );
                                    await updateDocDatabase(
                                      user.uid + "_TEME",
                                      tema.id.toString(),
                                      {
                                        editor,
                                        id: id,
                                      }
                                    );
                                    await updateDocDatabase(
                                      tema.id.toString() + "_REZOLVARI",
                                      user.uid,
                                      {
                                        editor,
                                        id: id,
                                        name:
                                          user.numeDeFamilie +
                                          " " +
                                          user.prenume,
                                      }
                                    );
                                  } catch (e) {
                                    openErrorNotification(e.message);
                                  }

                                  setMode("view");
                                } catch (e) {
                                  openErrorNotification(e.message);
                                }
                              }}
                            >
                              Adaugă
                            </Button>
                          </div>
                        </>
                      )
                    ) : incarcariElevi.find(
                        (incarcare) => incarcare.idTema === tema.id.toString()
                      ) ? (
                      <Accordion>
                        <Accordion.Title
                          active={activeIndex === 0}
                          index={0}
                          onClick={() => {
                            if (activeIndex === 0) setActiveIndex(3);
                            setActiveIndex(0);
                          }}
                          style={{ backgroundColor: "#f5f5f5" }}
                        >
                          <Icon name="dropdown" />
                          Ai incarcat
                        </Accordion.Title>
                        <Accordion.Content
                          active={activeIndex === 0}
                          style={{ backgroundColor: "#f5f5f5" }}
                        >
                          <>
                            <h1>Ai incarcat</h1>
                            <ReactQuill
                              theme="snow"
                              modules={modules}
                              readOnly={true}
                              placeholder="Poti scrie aici detaliile temei"
                              value={
                                incarcariElevi.find(
                                  (incarcare) =>
                                    incarcare.idTema === tema.id.toString()
                                ).editor
                              }
                            />{" "}
                            <br />
                            <br />
                            <Button
                              onClick={() => {
                                downloadFolderAsZip(
                                  "rezolvari" +
                                    incarcariElevi.find(
                                      (incarcare) =>
                                        incarcare.idTema === tema.id.toString()
                                    ).id,
                                  "rezolvari" +
                                    incarcariElevi.find(
                                      (incarcare) =>
                                        incarcare.idTema === tema.id.toString()
                                    ).id
                                );
                              }}
                            >
                              Descarca fisierele incarcate
                            </Button>
                            <br />
                            <br />
                            <Button
                              type="primary"
                              onClick={() => {
                                setMode("edit" + index);
                              }}
                            >
                              Editeaza Tema
                            </Button>
                            <br /> <br />
                            <Button
                              type="primary"
                              onClick={async () => {
                                await deleteDataDoc(
                                  user.uid + "_TEME",
                                  tema.id.toString()
                                );
                                await deleteDataDoc(
                                  tema.id.toString() + "_REZOLVARI",
                                  user.uid
                                );
                              }}
                              danger
                            >
                              Sterge Tema
                            </Button>
                            <br />
                            <br />
                          </>
                        </Accordion.Content>
                        {(incarcariElevi.find(
                          (incarcare) => incarcare.idTema === tema.id.toString()
                        ).commentNota ||
                          incarcariElevi.find(
                            (incarcare) =>
                              incarcare.idTema === tema.id.toString()
                          )?.nota) && (
                          <Accordion.Title
                            active={activeIndex === 1}
                            index={1}
                            onClick={() => {
                              if (activeIndex === 1) setActiveIndex(3);
                              setActiveIndex(1);
                            }}
                          >
                            <Icon name="dropdown" />

                            <Tag color="green">
                              {" "}
                              Nota{" "}
                              {
                                incarcariElevi.find(
                                  (incarcare) =>
                                    incarcare.idTema === tema.id.toString()
                                )?.nota
                              }
                            </Tag>
                          </Accordion.Title>
                        )}

                        {(incarcariElevi.find(
                          (incarcare) => incarcare.idTema === tema.id.toString()
                        ).commentNota ||
                          incarcariElevi.find(
                            (incarcare) =>
                              incarcare.idTema === tema.id.toString()
                          )?.nota) && (
                          <Accordion.Content active={activeIndex === 1}>
                            <>
                              <Space>
                                <h3>Nota</h3>
                                <p style={{ fontSize: "20px", color: "green" }}>
                                  {
                                    incarcariElevi.find(
                                      (incarcare) =>
                                        incarcare.idTema === tema.id.toString()
                                    )?.nota
                                  }
                                </p>
                              </Space>
                              <br />
                              <br />
                              <ReactQuill
                                theme="snow"
                                modules={modules}
                                readOnly={true}
                                placeholder="Poti scrie aici detaliile temei"
                                value={
                                  incarcariElevi.find(
                                    (incarcare) =>
                                      incarcare.idTema === tema.id.toString()
                                  ).commentNota
                                }
                              />{" "}
                            </>
                          </Accordion.Content>
                        )}
                      </Accordion>
                    ) : (
                      <>
                        {" "}
                        {mode !== index ? (
                          <>
                            {(new Date() <= end || end === false) && (
                              <Button
                                type="primary"
                                onClick={() => setMode(index)}
                              >
                                Incarca
                              </Button>
                            )}

                            <br />
                            <br />
                          </>
                        ) : (
                          <>
                            <h3>Incarca Tema</h3>
                            <ReactQuill
                              theme="snow"
                              modules={modules}
                              placeholder="Poti scrie aici detaliile temei"
                              value={editor}
                              onChange={setEditor}
                            />{" "}
                            <br />
                            <br />
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
                                Support for a single or bulk upload. Strictly
                                prohibited from uploading company data or other
                                banned files.
                              </p>
                            </Dragger>{" "}
                            <br />
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
                                  try {
                                    setLoading(true);
                                    let id = Date.now();
                                    try {
                                      await uploadFileDatabse(
                                        fileList.map((f) => {
                                          return f.originFileObj;
                                        }),
                                        "rezolvari" + id
                                      );
                                      await updateDocDatabase(
                                        user.uid + "_TEME",
                                        tema.id.toString(),
                                        {
                                          editor,
                                          id: id,
                                        }
                                      );
                                      await updateDocDatabase(
                                        tema.id.toString() + "_REZOLVARI",
                                        user.uid,
                                        {
                                          editor,
                                          id: id,
                                          name:
                                            user.numeDeFamilie +
                                            " " +
                                            user.prenume,
                                        }
                                      );
                                      setLoading(false);
                                    } catch (e) {
                                      openErrorNotification(e.message);
                                    }

                                    setMode("view");

                                    setMode("view");
                                  } catch (e) {
                                    openErrorNotification(e.message);
                                  }
                                }}
                              >
                                Adaugă
                              </Button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <br />
                </>
              )
            );
        })}
    </div>
  );
}

export default TemeElevi;
