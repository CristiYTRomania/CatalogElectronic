import React, { useEffect, useState } from "react";
import { Tabs, Select } from "antd";
import { Feed } from "semantic-ui-react";

import { useParams } from "react-router-dom";
import { getDataDoc } from "../../database";
import "./Class.css";
import { useSelector } from "react-redux";
import { db } from "../../database/firebase";
import Lectii from "./Lectii";
import ModalSettingsClass from "./ModalSettingsClass";
import { RetriveImageUrl } from "../../utils";
import { useDispatch } from "react-redux";
import { Spin } from "antd";
import OrarClasa from "../../Components/OrarClasa";
import { testSlice } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import CatalogComponent from "../../Components/Catalog";
import Teme from "./Teme";
import { SettingOutlined, StarOutlined } from "@ant-design/icons";
import withErrorBoundary from "../../Components/withErrorComponent";
const { actions } = testSlice;
const { GET_LOADING } = actions;

function Class() {
  const classId = useParams().id;
  const [classData, setClassData] = useState(null);
  const user = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const settings = useSelector((state) => state.settings);
  const navigate = useNavigate();
  const [modul, setModul] = useState(
    (settings?.module || []).find((mod) => mod.open === true)?.modul
  );
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [tabKey, setTabKey] = useState("Catalog");
  const [permision, setPermision] = useState(false);

  const onChange = (key) => {
    setTabKey(key);
  };
  const getData = async () => {
    setLoading(true);
    let dataClass = await getDataDoc("claseData", classId);

    let perm = false;
    if (
      user.uid === dataClass?.diriginte ||
      user.type === "admin" ||
      user.uid === dataClass?.diriginte_step
    )
      perm = true;
    if (
      user.uid &&
      !dataClass?.materii?.find((m) =>
        m.profesori?.find((p) => p === user.uid)
      ) &&
      !(
        dataClass.diriginte == user.uid || dataClass.diriginte_step !== user.uid
      ) &&
      user.type !== "admin"
    )
      navigate("/");
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
    else
      setClassData({
        ...dataClass,
        ore: (dataClass?.ore || []).map((el) => {
          return {
            ...el,
            startDate: new Date(el.startDate),
            endDate: new Date(el.endDate),
          };
        }),
        materii: dataClass?.materii?.filter(
          (ma) =>
            ma?.profesori?.find((p) => p === user.id) ||
            (settings?.showPurtare === true &&
              (ma?.materie?.includes("Purtare") ||
                ma?.materie?.includes("purtare")))
        ),
      });
    setPermision(perm);
    setLoading(false);
  };

  useEffect(() => {
    getData();
    const unsub = onSnapshot(doc(db, "claseData", classId), (doc) => {
      getData();
    });
    return () => unsub();
  }, [classId, user]);

  return (
    <>
      <Spin tip="Loading" size="large" spinning={loading} />
      {loading === false && (
        <div>
          <ModalSettingsClass
            open={open}
            setOpen={setOpen}
            clasa={classData}
            confirmLoading={confirmLoading}
            setConfirmLoading={setConfirmLoading}
            setClassData={setClassData}
          />
          <div
            style={{
              width: "100%",
              height: "300px",
              background: `linear-gradient(to top, rgba(0, 0, 0, 0.85), transparent),url(${RetriveImageUrl(
                classData?.poza
              )})`,
              transition: "background-image 1s",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <h2
              style={{
                color: "white",

                fontWeight: "bold",
                fontSize: "30px",
                float: "left",
                paddingLeft: "5%",
                paddingTop: "200px",
              }}
            >
              {classData?.anClasa === "Pregătitoare" ||
              classData?.anClasa === "I"
                ? classData?.anClasa + " " + classData?.identificator
                : "a " +
                  classData?.anClasa +
                  "-a" +
                  " " +
                  classData?.identificator}{" "}
            </h2>
          </div>
          <Tabs
            tabBarStyle={{
              width: "100%",
              fontWeight: "bold",
              backgroundColor: "#f5f5f5",
            }}
            tabBarExtraContent={
              user.type === "admin" && window.screen.width > 750 ? (
                <SettingOutlined
                  style={{ fontSize: "20px", fontWeight: "bold" }}
                  onClick={() => {
                    setOpen(true);
                  }}
                />
              ) : (
                <></>
              )
            }
            size="large"
            onChange={onChange}
            activeKey={tabKey}
            style={{}}
            items={[
              {
                label: `Catalog`,
                key: "Catalog",
                children: (
                  <>
                    <CatalogComponent
                      classData={classData}
                      setClassData={setClassData}
                      permision={permision}
                    />
                  </>
                ),
              },
              {
                label: `Orar`,
                key: "Orar",
                children: (
                  <OrarClasa
                    classData={classData}
                    setClassData={setClassData}
                  />
                ),
              },

              {
                label: `Teme`,
                key: "Teme",
                children: <Teme classData={classData} />,
              },
              {
                label: `Lecții`,
                key: "Lecții",
                children: <Lectii classData={classData} />,
              },
            ]}
          />
        </div>
      )}
    </>
  );
}

export default withErrorBoundary(Class);

//https://drive.google.com/drive/folders/1SPNrBLKX1yh-ATtZeZLeg1odY_OTrKqB?usp=sharing
