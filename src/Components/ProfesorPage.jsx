import React, { useState } from "react";
import ProfileImageAnonymus from "../assets/profile-elev.webp";
import {
  Image,
  Button,
  Descriptions,
  Divider,
  Popconfirm,
  Tabs,
  Alert,
} from "antd";
import { SettingOutlined, DeleteOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import EditProfesor from "./EditProfesor";
import { Tag } from "antd";
import ModalSettingsProf from "../Pages/Admin/ModalSettingsProf";
import { useDispatch } from "react-redux";
import { RollbackOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ModalChangePassword from "./ModalSchimbareParola";
import Condica from "../Pages/Profesori/Condica";
import {
  getDataDoc,
  updateDocDatabase,
  uploadFileDatabse,
  deleteDataDoc,
} from "../database";
import { db } from "../database/firebase";
import { onSnapshot, doc } from "firebase/firestore";
import "./ElevPage.css";
import { openErrorNotification } from "./Notifications/errorNotification";

import { getMaterieColor } from "../utils/index";
import "./ProfesorPage.css";
import OrarProfesori from "../Pages/Profesori/OrarProfesori";
import {
  useWindowSize,
  useWindowWidth,
  useWindowHeight,
} from "@react-hook/window-size";
import withErrorBoundary from "./withErrorComponent";
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
function ProfesorPage() {
  const { id } = useParams();
  const [profesorData, setProfesorData] = useState({});
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [tabKey, setTabKey] = useState("Orar");

  const materiiRedux = useSelector((state) => state.materii);
  const [open, setOpen] = useState(false);
  const user = useSelector((state) => state.user);
  const clase = useSelector((state) => state.clase);
  const [docsProf, setDocsProf] = useState();
  const [materiiRes, setMateriiRes] = useState([]);
  const navigate = useNavigate();
  const [modalSchimbareParola, setModalSchimbaParola] = useState(false);
  const dispatch = useDispatch();
  const [resourcesProf, setResourcesProf] = useState([]);
  const [userData, setUserData] = useState({});
  const [classData, setClassData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  const [mode, setMode] = useState("view");

  const fetchData = async () => {
    try {
      let data = await getDataDoc("profesori", id);

      if (
        data &&
        JSON.stringify(profesorData) !==
          JSON.stringify({
            ...data,
            ore: (data?.ore || []).map((el) => {
              return {
                ...el,
                startDate: new Date(el.startDate),
                endDate: new Date(el.endDate),
              };
            }),
            orePrivat: (data?.orePrivat || []).map((el) => {
              return {
                ...el,
                startDate: new Date(el.startDate),
                endDate: new Date(el.endDate),
              };
            }),
          })
      )
        setProfesorData({
          ...data,
          ore: (data?.ore || []).map((el) => {
            return {
              ...el,
              startDate: new Date(el.startDate),
              endDate: new Date(el.endDate),
            };
          }),
          orePrivat: (data?.orePrivat || []).map((el) => {
            return {
              ...el,
              startDate: new Date(el.startDate),
              endDate: new Date(el.endDate),
            };
          }),
        });
    } catch (err) {
      openErrorNotification(err.message);
    }
  };
  const materii = useSelector((state) => state.materii);

  const fetchUserData = async () => {
    const data = await getDataDoc("users", id);
    if (data && JSON.stringify(userData) !== JSON.stringify(data))
      setUserData(data);
  };

  fetchData();
  fetchUserData();
  const unsub = onSnapshot(doc(db, "profesori", id), (doc) => {
    fetchData();
  });
  const unsub2 = onSnapshot(doc(db, "users", id), (doc) => {
    fetchUserData();
  });

  const onChange = (key) => {
    setTabKey(key);
  };
  return (
    <div>
      {window.screen.width < 750 && (
        <Button
          style={{ width: "100%" }}
          icon={<RollbackOutlined />}
          onClick={() => navigate(-1)}
        />
      )}{" "}
      <ModalSettingsProf
        open={open}
        confirmLoading={confirmLoading}
        setConfirmLoading={setConfirmLoading}
        profesorData={profesorData}
        setOpen={setOpen}
        setProfesorData={setProfesorData}
      />
      <ModalChangePassword
        open={modalSchimbareParola}
        email={profesorData.email || profesorData.adresaEmail}
        setOpen={setModalSchimbaParola}
        id={profesorData.id}
        setId={() => {}}
      />
      <div className="mode-view">
        <div className="layout-prof">
          <Image
            src={profesorData?.photoLink || ProfileImageAnonymus}
            height={200}
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
                    updateDocDatabase("profesori", id, { photoLink: links[0] });
                    updateDocDatabase("users", id, { photoLink: links[0] });
                    setProfesorData({ ...profesorData, photoLink: links[0] });
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
              <>
                {process.env.REACT_APP_LIMIT_DATE === "enable" &&
                  userData?.treiSapt === true && (
                    <Alert
                      message={
                        "Profesorul poate pune note mai vechi de 3 saptamani"
                      }
                    />
                  )}

                <Descriptions
                  bordered
                  layout={window.innerWidth < 750 ? "vertical" : "horizontal"}
                  title={
                    <>
                      {profesorData?.numeDeFamilie +
                        " " +
                        profesorData?.prenume}
                    </>
                  }
                  extra={
                    user.type === "admin"
                      ? [
                          <Popconfirm
                            title="Stergi Profesorul?"
                            onConfirm={async () => {
                              await deleteDataDoc("users", id);

                              materiiRedux.forEach((m) => {
                                updateDocDatabase("materii", m.id, {
                                  profesori: (m?.profesori || []).filter(
                                    (i) => i !== id
                                  ),
                                });
                              });
                              await deleteDataDoc("profesori", id);

                              navigate("/profesori");
                            }}
                            onCancel={() => {}}
                          >
                            <Button
                              shape="circle"
                              icon={<DeleteOutlined />}
                              style={{ marginRight: "10px" }}
                            />
                          </Popconfirm>,
                          <Button
                            shape="circle"
                            onClick={() => setOpen(true)}
                            icon={<SettingOutlined />}
                            style={{ marginRight: "10px" }}
                          />,

                          <Button
                            type="primary"
                            onClick={() => {
                              setMode("edit");
                            }}
                          >
                            Edit
                          </Button>,
                          <Button
                            color="default"
                            variant="outlined"
                            style={{ margin: "2px" }}
                            onClick={() => {
                              console.log("Schimba Parola");
                              setModalSchimbaParola(true);
                            }}
                          >
                            Schimba Parola
                          </Button>,
                        ]
                      : []
                  }
                >
                  <Descriptions.Item label="Nume">
                    {profesorData?.numeDeFamilie}
                  </Descriptions.Item>
                  <Descriptions.Item label="Prenume">
                    {profesorData?.prenume}
                  </Descriptions.Item>

                  <Descriptions.Item label="Nr. Telefon">
                    {profesorData?.numarTelefon}
                  </Descriptions.Item>

                  <Descriptions.Item label="Email">
                    {profesorData?.adresaEmail}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tip Cont">
                    {userData?.type}
                  </Descriptions.Item>
                  <Descriptions.Item label="OTP">
                    {userData?.otp === true ? "DA" : "NU"}
                  </Descriptions.Item>
                  <br />
                  <Descriptions.Item label="Materii">
                    {profesorData.selectedMaterii?.map((materie) => (
                      <Tag>
                        {materii?.find((mat) => mat.id === materie)
                          ?.numeMaterie +
                          " - " +
                          materii?.find((mat) => mat.id === materie)?.profil}
                      </Tag>
                    ))}
                  </Descriptions.Item>
                </Descriptions>
              </>
            ) : (
              <EditProfesor
                profesorData={profesorData}
                setMode={setMode}
                setProfesorData={setProfesorData}
                clase={clase}
                colors={colors}
                otpDefault={userData.otp}
                id={id}
                userData={userData}
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
            label: `Orar`,
            key: "Orar",
            children: <OrarProfesori profesorData={{ ...profesorData }} />,
          },
          (user.uid === profesorData.id || user.type === "admin") && {
            label: `Condica`,
            key: "Condica",
            children: <Condica profesorData={profesorData} />,
          },
        ]}
      />
    </div>
  );
}

export default withErrorBoundary(ProfesorPage);
