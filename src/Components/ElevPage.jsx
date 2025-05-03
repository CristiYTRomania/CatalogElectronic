import React, { useEffect, useState, useRef } from "react";
import ProfileImageAnonymus from "../assets/profile-elev.webp";
import {
  Image,
  Button,
  Descriptions,
  Divider,
  Tag,
  Input,
  Tabs,
  Table,
  Popconfirm,
} from "antd";
import { Accordion, Icon, Label } from "semantic-ui-react";
import CatalogElev from "../Pages/Elevi/CatalogElev";
import { DeleteOutlined } from "@ant-design/icons";
import ModalStergere from "./ModalStergere";
import ModalChangePassword from "./ModalSchimbareParola";
import { Select } from "antd";
import { useParams } from "react-router-dom";
import Comentarii from "./Comentarii";
import { useNavigate } from "react-router-dom";
import { calculare_medii } from "../utils/calculare_medie";
import { useReactToPrint } from "react-to-print";
import { RollbackOutlined } from "@ant-design/icons";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";

import {
  useWindowSize,
  useWindowWidth,
  useWindowHeight,
} from "@react-hook/window-size";
import Docs from "./Docs";
import {
  AppstoreOutlined,
  MailOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { testSlice } from "../redux/store";
import { Menu } from "antd";
import { listAll, getDownloadURL, ref } from "firebase/storage";
import { useSelector } from "react-redux";
import { storage } from "../database/firebase";
import { deleteDataDoc } from "../database";
import { getDataDoc, updateDocDatabase, uploadFileDatabse } from "../database";
import ModalViewGrade from "./ModalViewGrade";
import "./ElevPage.css";
import { openErrorNotification } from "./Notifications/errorNotification";
import OrarElev from "./OrarElev";
import "./ProfesorPage.css";
import EditElev from "./EditElev";
import { limit } from "firebase/firestore";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../database/firebase";

import { motiveazaAbsente } from "../utils/absente";
import withErrorBoundary from "./withErrorComponent";
const { actions } = testSlice;

const { GET_LOADING } = actions;
const { TextArea } = Input;

const colors = [
  "magenta",
  "red",
  "volcano",
  "orange",
  "gold",
  "lime",
  "green",
  "cyan",
  "blue",
  "geekblue",
  "purple",
];
function ElevPage() {
  const { id } = useParams();
  const [elevData, setElevData] = useState({});
  const clase = useSelector((state) => state.clase);
  const [note, setNote] = useState([]);
  const [current, setCurrent] = useState("mail");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reff = useRef();
  const [tabKey, setTabKey] = useState("Note");
  const [author, setAuthor] = useState("");
  const [classData, setClassData] = useState([]);
  const [eleviData, setEleviData] = useState([]);
  const settings = useSelector((state) => state.settings);
  const [idOfElev, setIdOfElev] = useState("");
  const [mode, setMode] = useState("view");
  const user = useSelector((state) => state.user);
  const [modalStergere, setModalStergere] = useState(false);
  const [modalSchimbareParola, setModalSchimbaParola] = useState(false);
  const [emailToChange, setEmailToChange] = useState("");

  const [open, setOpen] = useState(false);
  const [gradesElevi, setGradesElevi] = useState([]);
  const [elevId, setElevId] = useState();
  const profesori = useSelector((state) => state.profesori);
  const [scutiri, setScutiri] = useState([]);
  const [docsElev, setDocsElev] = useState([]);
  const [permision, setPermision] = useState(false);
  const [notePrint, setNotePrint] = useState([]);
  const [elevId2, setElevId2] = useState();
  const onlyWidth = useWindowWidth();
  const [materieId, setMaterieId] = useState();
  const [nota, setNota] = useState();
  const [comentariu, setComentariu] = useState();
  const [data, setData] = useState();
  const [tip, setTip] = useState();
  const [open2, setOpen2] = useState(false);
  const [absenteConcluzii, setAbsenteConcluzii] = useState([]);
  const Limit = 40;

  console.log({ settings });
  const onClick = (e) => {
    setCurrent(e.key);
  };
  console.log({ elevData });
  const formatDate = (today) => {
    const romaniaTime = new Date(
      today.toLocaleString("en-US", { timeZone: "Europe/Bucharest" })
    );

    const yyyy = romaniaTime.getFullYear();
    let mm = romaniaTime.getMonth() + 1; // Months start at 0!
    let dd = romaniaTime.getDate();
    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;

    return dd + "/" + mm;
  };

  const fetchData = async () => {
    let data = await getDataDoc("elevi", id);
    if (data) setElevData({ ...data, id });
    if (!data) return;
    const not = await getDataDoc("catalog", id);

    let dataClass = await getDataDoc("claseData", data?.clasa || "faraclasa");

    if (
      user.uid &&
      !dataClass?.materii?.find((m) =>
        m.profesori?.find((p) => p === user.uid)
      ) &&
      !(
        dataClass?.diriginte == user.uid ||
        dataClass?.diriginte_step == user.uid
      ) &&
      user.type !== "admin"
    )
      navigate("/");
    if (data.deleted === true) {
      dataClass = await getDataDoc(
        "claseData",
        data?.clasaVeche || "faraclasa"
      );
    }

    const docs = await getDataDoc("eleviDocumente", id);
    let scutiriElevi = [];
    setScutiri(docs?.docsElev);
    let obj = {};

    let perm = false;
    if (
      user.uid === dataClass?.diriginte ||
      user.uid === dataClass?.diriginte_step ||
      user.type === "admin"
    )
      perm = true;

    dataClass?.materii?.forEach((materieId) => {
      if (perm === false) {
        if (
          dataClass?.materii
            ?.filter((ma) => ma?.profesori?.find((p) => p === user.id))
            .find((m) => m.materie === materieId.materie)
        )
          obj[materieId.materie] = { note: [] };
      } else obj[materieId.materie] = { note: [] };
    });
    not?.note?.forEach((n) => {
      if (obj[n.materieId]?.note) obj[n.materieId]?.note?.push(n);
    });
    setNote(Object.entries(obj));
    if (perm === true)
      setClassData({
        ...dataClass,
        ore: (dataClass?.ore || []).map((el) => {
          return {
            ...el,
            startDate: new Date(el.startDate),
            endDate: new Date(el.endDate),
          };
        }),
      });
    else {
      setClassData({
        ...dataClass,
        ore: (dataClass?.ore || []).map((el) => {
          return {
            ...el,
            startDate: new Date(el.startDate),
            endDate: new Date(el.endDate),
          };
        }),
        materii: dataClass?.materii?.filter((ma) =>
          ma?.profesori?.find((p) => p === user.id)
        ),
      });
    }
    setPermision(perm);
    const NotePrint = [];
    NotePrint.push({
      notes: Object.entries(obj),
      name: data.numeDeFamilie + " " + data.initiala + " " + data.prenume,
      id: data.id,
    });
    setNotePrint(NotePrint);
  };
  console.log(elevData.numarMatricol);

  const materii = useSelector((state) => state.materii);
  const styleD = () => {
    if (onlyWidth < 700) return "auto";
    if (onlyWidth < 1000) return "auto auto auto ";
    if (onlyWidth < 1200) return "auto auto auto auto";
    return "auto auto auto auto auto";
  };
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "eleviDocumente", id), (doc) => {
      const source = doc.metadata.hasPendingWrites ? "Local" : "Server";
      setDocsElev(doc.data()?.docsElev);
    });
    return unsub;
  }, []);
  useEffect(() => {
    const absente = [];

    const noteDeschis = note?.reduce((acc, c) => {
      return [...acc, ...c[1].note];
    }, []);
    setAbsenteConcluzii(motiveazaAbsente(noteDeschis, scutiri));
  }, [note, scutiri]);

  useEffect(() => {
    fetchData();
  }, [id]);
  const onChange = (key) => {
    setTabKey(key);
  };

  const RaportScolar = () => {
    return (
      <div className="print" ref={reff}>
        <div>
          <br /> <br />
          <h1 style={{ textAlign: "center" }}>Situație școlară</h1>
          <h3 style={{ textAlign: "center" }}>
            {elevData.numeDeFamilie +
              " " +
              elevData.initiala +
              " " +
              elevData.prenume}
            {" " + classData.anClasa + " " + classData.identificator}
          </h3>
          <h4 style={{ textAlign: "center" }}>
            Instituție școlară: {settings?.numeInstitutie}
            <br />
            Anul școlar 2024-2025
            <br />
            Diriginte/Învățător:{" "}
            {profesori.find((p) => p.id === classData.diriginte)
              ?.numeDeFamilie +
              " " +
              profesori.find((p) => p.id === classData.diriginte)?.prenume}
            <br />
            {classData.diriginte_step &&
              classData.diriginte_step !== "N/A" &&
              ", alături de, " +
                profesori.find((p) => p.id === classData.diriginte_step)
                  ?.numeDeFamilie +
                " " +
                profesori.find((p) => p.id === classData.diriginte_step)
                  ?.prenume}
            <br /> Export realizat din catalogul digital, găzduit de PFA
            Dobricean Ioan Dorian. <br />
            CUI: 46952301
          </h4>
          <h5 style={{ paddingLeft: "50px" }}>Materii înscrise în catalog</h5>
          <table border="1" style={{ width: "90%", marginLeft: "5%" }}>
            <thead>
              <tr>
                <th>Materie</th>
                <th>Profesori</th>
              </tr>
            </thead>
            <tbody>
              {classData?.materii?.map((m) => {
                return (
                  <tr
                    style={{
                      pageBreakInside: "avoid",
                      pageBreakAfter: "auto",
                    }}
                  >
                    <td>
                      <p style={{ paddingLeft: "10px" }}>
                        {
                          materii?.find((ma) => ma.id === m.materie)
                            ?.numeMaterie
                        }
                      </p>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "auto auto  ",
                          paddingLeft: "10px",
                          pageBreakInside: "avoid",
                          pageBreakAfter: "auto",
                        }}
                      >
                        {m?.profesori?.map((idp) => (
                          <p>
                            {profesori?.find((p) => p.id === idp)
                              ?.numeDeFamilie +
                              " " +
                              profesori?.find((p) => p.id === idp)?.prenume}
                          </p>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <br />
          <br />
        </div>
        <br />
        <br />
        <div style={{ pageBreakBefore: "always" }}>
          <br />
          <br />
          <CatalogElev elevIdPassed={id} />
        </div>
        <br />
        <br />
        <div>
          <h1 style={{ textAlign: "center" }}>Scutiri</h1>
          <Docs
            elevId={id}
            numeElev={elevData.prenume + " " + elevData.numeDeFamilie}
            classId={elevData?.clasa}
            modeOf={"view"}
            elevData={elevData}
            openAll={true}
          />
        </div>
      </div>
    );
  };
  const handlePrint = useReactToPrint({
    content: () => reff.current,
  });
  async function generateDocument(resume, templatePath) {
    try {
      let response = await fetch(templatePath);

      let data = await response.arrayBuffer();

      let zip = PizZip(data);
      let templateDoc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      templateDoc.render(resume);
      let generatedDoc = templateDoc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
      });

      saveAs(generatedDoc, `${resume.nume}, adeverinta absente.docx`);
    } catch (error) {}
  }

  return (
    <div>
      {" "}
      <ModalChangePassword
        open={modalSchimbareParola}
        email={emailToChange}
        setOpen={setModalSchimbaParola}
        id={idOfElev}
        setId={setIdOfElev}
      />
      <ModalStergere
        open={modalStergere}
        setOpen={setModalStergere}
        elevData={{ ...elevData }}
      />
      {window.screen.width < 750 && (
        <Button
          style={{ width: "100%" }}
          icon={<RollbackOutlined />}
          onClick={() => navigate(-1)}
        />
      )}
      <div style={{ display: "none" }}>
        <RaportScolar />
      </div>
      <ModalViewGrade
        open={open2}
        edit={false}
        setOpen={setOpen2}
        eleviData={[{ ...elevData, id }]}
        elevId={id}
        gradesElevi={gradesElevi}
        setElevId={setElevId}
        materii={classData.materii?.map((matID) => {
          return materii?.find((ma) => ma.id === matID.materie);
        })}
        author={author}
        setGradesElevi={setGradesElevi}
        materieId={materieId}
        tip={tip}
        nota={nota}
        comentariu={comentariu}
        date={data}
        scutiri={scutiri}
      />
      <div className="mode-view">
        {elevData?.deleted === true && (
          <h1 style={{ color: "red" }}>
            ELEV transferat, clasa veche{" "}
            {clase?.find((cls) => cls.id === elevData.clasaVeche)?.anClasa +
              " " +
              clase?.find((cls) => cls.id === elevData.clasaVeche)
                ?.identificator}
          </h1>
        )}

        <div className="layout-prof" style={{ marginTop: "5%" }}>
          <br />
          <Image
            src={elevData?.photoLink || ProfileImageAnonymus}
            height={200}
            width={200}
            style={{ marginTop: "5px" }}
          />
          <br />
          <br />
          {mode === "edit" && (
            <>
              {" "}
              <input
                type="file"
                id="file-input"
                onChange={async (e) => {
                  try {
                    let links = await uploadFileDatabse(
                      [e.target.files[0]],
                      "usersProfiles"
                    );
                    updateDocDatabase("elevi", id, { photoLink: links[0] });
                    updateDocDatabase("users", id, { photoLink: links[0] });
                    //       setElevData({ ...elevData, photoLink: links[0] });
                    setMode("view");
                  } catch (e) {
                    openErrorNotification(e.message);
                  }
                }}
              />
              <label className="blue" for="file-input">
                <i class="fa-solid fa-arrow-up-from-bracket"></i>
                &nbsp; Choose Files To Upload
              </label>
            </>
          )}
        </div>

        <div className="layout-prof2">
          <div>
            {mode === "view" ? (
              <Descriptions
                layout={onlyWidth < 900 ? "vertical" : "horizontal"}
                column={onlyWidth < 900 ? 1 : 2}
                bordered
                title={
                  elevData.numeDeFamilie +
                  " " +
                  elevData.initiala +
                  " " +
                  elevData.prenume +
                  " - " +
                  (clase?.find((cls) => cls.id === elevData.clasa)?.anClasa ||
                    " ") +
                  " " +
                  (clase?.find((cls) => cls.id === elevData.clasa)
                    ?.identificator || " ") +
                  (elevData.retras === true ? " - transferat" : "")
                }
                extra={(() => {
                  // Verificare pentru ștergere (doar admin și elevul nu este șters)
                  const canDelete =
                    user.type === "admin" && elevData?.deleted !== true;

                  // Verificare pentru editare (admin sau diriginte)
                  const canEdit =
                    user.type === "admin" ||
                    user.uid === classData?.diriginte ||
                    user.uid === classData?.diriginte_step;

                  const actions = [];

                  // Adăugare buton de ștergere dacă are permisiuni
                  if (canDelete) {
                    actions.push(
                      <Popconfirm
                        title="Ștergi Elevul?"
                        onConfirm={async () => {
                          setModalStergere(true);
                        }}
                        onCancel={() => {}}
                      >
                        <Button
                          shape="circle"
                          icon={<DeleteOutlined />}
                          style={{ marginRight: "10px" }}
                        />
                      </Popconfirm>
                    );
                  }

                  // Adăugare buton de editare dacă are permisiuni
                  if (canEdit) {
                    actions.push(
                      <Button
                        color="default"
                        variant="outlined"
                        style={{ margin: "2px" }}
                        onClick={() => {
                          console.log("Schimba Parola");
                          setModalSchimbaParola(true);
                          setIdOfElev(elevData.id);
                          setEmailToChange(elevData.adresaEmail);
                        }}
                      >
                        Schimba Parola
                      </Button>
                    );
                    actions.push(
                      <Button
                        type="primary"
                        onClick={() => {
                          setMode("edit");
                        }}
                      >
                        Edit
                      </Button>
                    );
                  }

                  return actions;
                })()}
              >
                <Descriptions.Item label="Nume">
                  {elevData.numeDeFamilie}
                </Descriptions.Item>
                <Descriptions.Item label="Prenume">
                  {elevData.prenume}
                </Descriptions.Item>

                <Descriptions.Item label="Initiala">
                  {elevData.initiala}
                </Descriptions.Item>

                <Descriptions.Item label="Clase">
                  {(clase?.find((cls) => cls.id === elevData.clasa)?.anClasa ||
                    "-") +
                    " " +
                    (clase?.find((cls) => cls.id === elevData.clasa)
                      ?.identificator || "-")}
                </Descriptions.Item>
                <Descriptions.Item label="Abs. ramase Bilet">
                  {absenteConcluzii.absenteBiletRamase}
                </Descriptions.Item>

                <Descriptions.Item label="Nr. Matricol">
                  {elevData.numarMatricol}
                </Descriptions.Item>

                <Descriptions.Item label="Nr. Telefon">
                  {elevData.numarTelefon}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {elevData.adresaEmail}
                </Descriptions.Item>

                <Descriptions.Item label="CNP">
                  {elevData.cnp}
                </Descriptions.Item>
                <Descriptions.Item label="Locul Nasterii">
                  {elevData.loculNasteri}
                </Descriptions.Item>

                <Descriptions.Item label="Domiciliu">
                  {elevData.domiciliu}
                </Descriptions.Item>
                <Descriptions.Item label="Prenume mamă">
                  {elevData.mama}
                </Descriptions.Item>
                <Descriptions.Item label="Prenume tată">
                  {elevData.tata}
                </Descriptions.Item>
                {elevData.scutitMedical && (
                  <Descriptions.Item label="Scutit medical">
                    {elevData.scutitMedical}
                  </Descriptions.Item>
                )}
                {elevData.dataExpirareMedical && (
                  <Descriptions.Item label="Data Expirare Medical">
                    {elevData.dataExpirareMedical
                      ? new Date(
                          elevData.dataExpirareMedical
                        ).toLocaleDateString("ro-RO")
                      : "-"}
                  </Descriptions.Item>
                )}

                {elevData.religie && elevData.religie !== "da" && (
                  <Descriptions.Item label="Cerere retragere Religie">
                    {elevData.religie}
                  </Descriptions.Item>
                )}

                <Descriptions.Item label="CES">
                  {elevData.ces === "da" ? "DA" : "NU"}
                </Descriptions.Item>
                <Descriptions.Item label="Bursa">
                  {elevData.bursa}
                </Descriptions.Item>

                <Descriptions.Item label="Email-uri abonate">
                  {(elevData?.parintii || []).map((e) => (
                    <Tag
                      onClick={() => {
                        const canEdit =
                          user.type === "admin" ||
                          user.uid === classData?.diriginte ||
                          user.uid === classData?.diriginte_step;
                        if (canEdit) {
                          setModalSchimbaParola(true);
                          setIdOfElev(undefined);
                          setEmailToChange(e);
                        }
                      }}
                    >
                      {e}
                    </Tag>
                  ))}
                </Descriptions.Item>

                {permision === true && (
                  <Descriptions.Item label="Documente">
                    <div>
                      <Button
                        type="primary"
                        onClick={() => {
                          handlePrint();
                        }}
                        style={{}}
                      >
                        Descarca Situatie Scolara
                      </Button>
                      {settings?.adeverintaAbsente && (
                        <Button
                          type="primary"
                          onClick={async () => {
                            let url = settings.adeverintaAbsente;
                            //fetch the url
                            const clas = clase.find(
                              (c) => c.id === elevData.clasa
                            );
                            if (url) {
                              generateDocument(
                                {
                                  nume:
                                    elevData.numeDeFamilie +
                                    " " +
                                    elevData.initiala +
                                    " " +
                                    elevData.prenume,
                                  clasa:
                                    clas?.anClasa === "Pregătitoare" ||
                                    clas?.anClasa === "I"
                                      ? clas?.anClasa +
                                        " " +
                                        clas?.identificator
                                      : "a " +
                                        clas?.anClasa +
                                        "-a" +
                                        (clas?.identificator.length > 0 &&
                                        clas.identificator !== " "
                                          ? " " + clas?.identificator
                                          : ""),
                                  absente:
                                    absenteConcluzii.absente_dupa_motivari
                                      .length,
                                  motivate:
                                    absenteConcluzii.absente_motivate.length,
                                  nemotivate:
                                    absenteConcluzii.absente_nemotivate.length,
                                },
                                url
                              );
                            }
                          }}
                          style={{ marginTop: "5px" }}
                        >
                          Descarca Adeverinta absente
                        </Button>
                      )}
                      {settings?.adeverintaApartenenta && (
                        <Button
                          type="primary"
                          onClick={async () => {
                            let url = settings.adeverintaApartenenta;
                            //fetch the url
                            const clas = clase.find(
                              (c) => c.id === elevData.clasa
                            );
                            if (url) {
                              generateDocument(
                                {
                                  nume:
                                    elevData.numeDeFamilie +
                                    " " +
                                    elevData.initiala +
                                    " " +
                                    elevData.prenume,
                                  cnp: elevData.cnp,
                                  clasa:
                                    clas?.anClasa === "Pregătitoare" ||
                                    clas?.anClasa === "I"
                                      ? clas?.anClasa +
                                        " " +
                                        clas?.identificator
                                      : "a " +
                                        clas?.anClasa +
                                        "-a" +
                                        (clas?.identificator.length > 0 &&
                                        clas.identificator !== " "
                                          ? " " + clas?.identificator
                                          : ""),
                                  numarMatricol: elevData.numarMatricol,
                                },
                                url
                              );
                            }
                          }}
                          style={{ marginTop: "5px" }}
                        >
                          Descarca Adeverinta de apartanenta
                        </Button>
                      )}
                    </div>
                  </Descriptions.Item>
                )}
                {elevData.details && (
                  <Descriptions.Item label="Detalii catalog">
                    {elevData.details}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Materii specialitate">
                  <span>
                    {elevData?.materiiSpecialitate?.map((materie, index) => {
                      return (
                        <>
                          <div
                            style={{
                              paddingTop: "20px",
                              display: "block",
                              gap: "10px",
                              width: "100%",
                            }}
                          >
                            <Select
                              showSearch
                              style={{ width: "90%" }}
                              placeholder="Materie"
                              optionFilterProp="children"
                              value={materie.materie}
                              disabled={true}
                              filterOption={(input, option) =>
                                (option?.label?.toLowerCase() ?? "").includes(
                                  input?.toLowerCase()
                                )
                              }
                              filterSort={(optionA, optionB) =>
                                (optionA?.label ?? "")
                                  .toLowerCase()
                                  .localeCompare(
                                    (optionB?.label ?? "").toLowerCase()
                                  )
                              }
                              options={materii.map((mat) => {
                                return {
                                  label: mat?.numeMaterie + "-" + mat?.profil,
                                  value: mat?.id,
                                };
                              })}
                            />
                            <Select
                              mode="multiple"
                              style={{ width: "90%" }}
                              showSearch
                              placeholder="Profesor"
                              disabled={true}
                              optionFilterProp="children"
                              value={materie.profesori}
                              filterOption={(input, option) =>
                                (option?.label?.toLowerCase() ?? "").includes(
                                  input?.toLowerCase()
                                )
                              }
                              filterSort={(optionA, optionB) =>
                                (optionA?.label ?? "")
                                  .toLowerCase()
                                  .localeCompare(
                                    (optionB?.label ?? "").toLowerCase()
                                  )
                              }
                              options={(
                                materii.find(
                                  (mat) => mat.id === materie?.materie
                                )?.profesori || []
                              ).map((profID) => {
                                let prof = profesori.find(
                                  (pf) => pf.id === profID
                                );
                                return {
                                  label:
                                    prof?.numeDeFamilie + "-" + prof?.prenume,
                                  value: prof?.id,
                                };
                              })}
                            />
                          </div>
                          <br />
                        </>
                      );
                    })}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <EditElev
                elevData={elevData}
                setMode={setMode}
                setElevData={setElevData}
                clase={clase}
                colors={colors}
                id={id}
              />
            )}
          </div>
        </div>
      </div>
      <br />
      <Divider style={{ borderBlockStart: "0px" }} />
      <Tabs
        tabBarStyle={{
          width: "100%",
          fontWeight: "bold",
          backgroundColor: "#f5f5f5",
        }}
        size="large"
        onChange={onChange}
        activeKey={tabKey}
        style={{}}
        items={[
          {
            label: `Note`,
            key: "Note",
            children: <CatalogElev elevIdPassed={id} />,
          },

          {
            label: `Comentarii`,
            key: "Comentarii",
            children: <Comentarii elevData={elevData} id={id} note={note} />,
          },

          permision === true
            ? {
                label: `Documente Școlare`,
                key: "docs",
                children: (
                  <Docs
                    elevId={id}
                    retras={elevData.retras}
                    classId={classData?.id}
                    numeElev={elevData.numeDeFamilie + " " + elevData.prenume}
                    elevData={elevData}
                  />
                ),
              }
            : {},
          user.type === "admin"
            ? {
                label: `Transferuri`,
                key: "transferuri",
                children: (
                  <Docs
                    elevId={id}
                    retras={elevData.retras}
                    classId={classData?.id}
                    numeElev={elevData.numeDeFamilie + " " + elevData.prenume}
                    elevData={elevData}
                    transferuri={true}
                  />
                ),
              }
            : {},
        ]}
      />
    </div>
  );
}

export default withErrorBoundary(ElevPage);
