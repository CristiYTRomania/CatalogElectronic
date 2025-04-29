import React, { useEffect, useState } from "react";
import {
  Image,
  Button,
  Descriptions,
  Divider,
  Tag,
  Tabs,
  Select,
  Table,
  Form,
  Input,
  Popconfirm,
} from "antd";
import { getDataDoc, updateDocDatabase } from "../database";
import {
  useWindowSize,
  useWindowWidth,
  useWindowHeight,
} from "@react-hook/window-size";
import { db } from "../database/firebase";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { openErrorNotification } from "./Notifications/errorNotification";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { testSlice } from "../redux/store";
import { onSnapshot, doc } from "firebase/firestore";
const { actions } = testSlice;
const { ADD_MATERIE } = actions;

function EditProfesor({
  profesorData,
  setMode,
  setProfesorData,
  id,
  userData,
  otpDefault = false,
}) {
  const [numeDeFamilie, setNumeDeFamilie] = useState();
  const [prenume, setPrenume] = useState();
  const [adresaEmail, setAdresaEmail] = useState();
  const [clasa, setClasa] = useState();
  const onlyWidth = useWindowWidth();
  const [otp, setOtp] = useState(otpDefault);
  const [selectedMaterii, setSelectedMaterii] = useState();
  const dispatch = useDispatch();
  const [numarMatricol, setNumarMatricol] = useState();
  const materii = useSelector((state) => state.materii);

  const [numarTelefon, setNumarTelefon] = useState();

  useEffect(() => {
    setNumeDeFamilie(profesorData.numeDeFamilie);
    setPrenume(profesorData.prenume);
    setAdresaEmail(profesorData.adresaEmail);
    setNumarMatricol(profesorData.numarMatricol);
    setOtp(otpDefault);
    setNumarTelefon(profesorData.numarTelefon);
    setClasa(profesorData.clasa);
    setSelectedMaterii(profesorData.selectedMaterii);
  }, [profesorData]);
  const onSave = async () => {
    try {
      if (adresaEmail !== profesorData.email) {
        const firebaseConfig = {
          apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
          authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
          storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.REACT_APP_FIREBASE_APP_ID,
        };
        let Secondary = initializeApp(firebaseConfig, "secondary");
        let auth2 = getAuth(Secondary);
      }
      await updateDocDatabase("users", profesorData.id, {
        prenume: prenume,
        numeDeFamilie: numeDeFamilie,
        displayName: numeDeFamilie + " " + prenume,
      });
      let profData = await getDataDoc("profesori", id);
      await updateDocDatabase("profesori", id, {
        ...profData,
        numeDeFamilie,
        prenume,
        adresaEmail,
        selectedMaterii,
        numarTelefon,
      });
      const editate = [];
      for (let materieId of selectedMaterii) {
        if (
          !(materii?.find((ma) => ma.id === materieId).profesori || [])?.find(
            (m) => m === profesorData.id
          )
        ) {
          let materie = materii?.find((ma) => ma.id === materieId);
          editate.push({
            ...materie,
            profesori: [...(materie.profesori || []), profesorData.id],
          });
          dispatch(
            ADD_MATERIE([
              ...materii.filter((mat) => mat.id !== materieId),
              {
                ...materie,
                profesori: [...(materie.profesori || []), profesorData.id],
              },
            ])
          );
        }
      }

      for (let materie of materii) {
        if (
          (materie.profesori || [])?.find((prof) => prof === profesorData.id) &&
          selectedMaterii?.find((id) => materie.id === id) === undefined
        ) {
          editate.push({
            ...materie,
            profesori: [
              ...(materie.profesori || []).filter(
                (id) => profesorData.id !== id
              ),
            ],
          });
        }
      }
      for await (let materie of editate) {
        await updateDocDatabase("materii", materie.id, {
          ...materie,
        });
      }
    } catch (e) {
      openErrorNotification(e.message);
    }
  };
  return (
    <>
      {" "}
      <Descriptions
        layout={onlyWidth < 900 ? "vertical" : "horizontal"}
        bordered
        title={<>{profesorData?.numeDeFamilie + " " + profesorData?.prenume}</>}
        extra={[
          <Button
            onClick={() => {
              setMode("view");
            }}
            style={{ marginRight: "10px", color: "red" }}
          >
            Cancel
          </Button>,

          <Button
            type="primary"
            onClick={() => {
              onSave();
              setMode("view");
            }}
          >
            Save
          </Button>,
        ]}
      >
        <Descriptions.Item label="Nume">
          <Input
            value={numeDeFamilie}
            onChange={(e) => {
              setNumeDeFamilie(e.target.value);
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Prenume">
          {" "}
          <Input
            value={prenume}
            onChange={(e) => {
              setPrenume(e.target.value);
            }}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Nr. Telefon">
          <Input
            value={numarTelefon}
            onChange={(e) => {
              setNumarTelefon(e.target.value);
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="OTP">
          <Select
            value={otp}
            options={[
              { value: false, label: "NU" },
              { value: true, label: "DA" },
            ]}
            onChange={setOtp}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Materii">
          <Select
            mode="multiple"
            placeholder="Materii"
            defaultValue={[]}
            onChange={(value) => {
              setSelectedMaterii(value);
            }}
            value={selectedMaterii}
            style={{ width: "100%" }}
            filterOption={(input, option) =>
              (option?.label.toLowerCase() ?? "").includes(input.toLowerCase())
            }
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
            options={materii.map((mat) => {
              return {
                label: mat.numeMaterie + " - " + mat.profil,
                value: mat.id,
              };
            })}
          />
        </Descriptions.Item>
      </Descriptions>
      <br />
      {!userData?.treiSapt ? (
        <Popconfirm
          title="Dezactiveaza restrictia de 3 saptamani"
          description="Dezactiveaza restrictia de 3 saptamani"
          onConfirm={async () => {
            await updateDocDatabase("users", id, { treiSapt: true });
          }}
          okText="Da"
          cancelText="Nu"
        >
          <Button>Dezactiveaza restrictia de 3 saptamani </Button>
        </Popconfirm>
      ) : (
        <Popconfirm
          title="Activeaza restrictia de 3 saptamani"
          description="Activeaza restrictia de 3 saptamani"
          onConfirm={async () => {
            await updateDocDatabase("users", id, { treiSapt: false });
          }}
          okText="Da"
          cancelText="Nu"
        >
          <Button>Activeaza restrictia de 3 saptamani</Button>
        </Popconfirm>
      )}
      {userData?.type === "admin" ? (
        <Popconfirm
          title="Scoate Administrator?"
          description="Esti sigur ca il retragi din Administrare?"
          onConfirm={() => {
            updateDocDatabase("users", id, { type: "profesor" });
          }}
          okText="Da"
          cancelText="Nu"
        >
          <Button>Retrage din Administrare</Button>
        </Popconfirm>
      ) : (
        <Popconfirm
          title="Administrator?"
          description="Esti sigur ca il promovezi ca Administrator?"
          onConfirm={() => {
            updateDocDatabase("users", id, { type: "admin" });
          }}
          okText="Da"
          cancelText="Nu"
        >
          <Button>Promoveaza ca Administrator</Button>
        </Popconfirm>
      )}
    </>
  );
}

export default EditProfesor;
