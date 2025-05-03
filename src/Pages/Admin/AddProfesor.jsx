import React, { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../database/firebase";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  updateProfile,
} from "firebase/auth";
import { useSelector, useDispatch } from "react-redux";
import { getDataDoc, updateDocDatabase } from "../../database";
import { testSlice } from "../../redux/store";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
import { initializeApp } from "firebase/app";
import {
  Button,
  Cascader,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Divider,
  Switch,
} from "antd";
import { openSuccesNotification } from "../../Components/Notifications/succesNotification";

const { TextArea } = Input;
const { actions } = testSlice;
const { GET_TEACHER, ADD_MATERIE } = actions;
function AddProfesor({
  setOpen,
  open,
  confirmLoading,
  setConfirmLoading,
  materiiDefault = [],
  pregatiriDefault = [],
  liceuDefault = "",
  numeDeFamilieDefault = "",
  prenumeDefault = "",
  anDefault = "",
  ziDefault = "",
  typeFacturaDefault = "fizica",
  lunaDefault = "",
  localitateDefault = "",
  clasaDefault = "",

  numeFirmaDefault = "",
  cifFirmaDefault = "",
  numarRegComDefault = "",

  numeFacturaDefault = "",
  numarTelefonDefault = "",
  adresaEmailDafault = "",
}) {
  function generateSixDigitCode() {
    return Math.floor(100000 + Math.random() * 900000);
  }

  const [numeDeFamilie, setNumeDeFamilie] = useState(numeDeFamilieDefault);
  const [prenume, setPrenume] = useState(prenumeDefault);
  const dispatch = useDispatch();
  const [clasa, setClasa] = useState(clasaDefault);
  const [an, setAn] = useState(anDefault);
  const [numarTelefon, setNumarTelefon] = useState(numarTelefonDefault);
  const [adresaEmail, setAdresaEmail] = useState(adresaEmailDafault);

  const materii = useSelector((state) => state.materii);
  const [selectedMaterii, setSelectedMaterii] = useState([]);
  const profesori = useSelector((state) => state.profesori);

  const handleOk = async () => {
    setConfirmLoading(true);
    if (numeDeFamilie.length === 0) {
      openErrorNotification("Numele de familie nu poate fi gol");
      return;
    }
    if (prenume.length === 0) {
      openErrorNotification("Prenumele nu poate fi gol");
      return;
    }
    if (adresaEmail.length === 0) {
      openErrorNotification("Adresa Email nu este valida");
      return;
    }
    if (selectedMaterii.length === 0) {
      openErrorNotification("Materia nu este valida");
      return;
    }
    setConfirmLoading(true);
    try {
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
      let pass = generateSixDigitCode();

      createUserWithEmailAndPassword(auth2, adresaEmail, pass)
        .then(async (userCredentials) => {
          const user = userCredentials.user;
          await updateDocDatabase("mail", "mail" + pass + Date.now(), {
            to: [adresaEmail],
            message: {
              subject:
                numeDeFamilie +
                " " +
                prenume +
                " a fost inregistrat ca profesor in catalogul scolii",
              text:
                "Bună ziua! Ați fost adaugat ca și profesor în catalogul școlii. Intrați pe " +
                process.env.REACT_APP_LINK +
                " introduceți " +
                adresaEmail +
                " si parola " +
                pass +
                " ." +
                "Nu uitați că va trebui să schimbați parola.",
            },
          });
          let id = user.uid;
          await updateProfile(user, { emailVerified: true });
          signOut(auth2);
          updateDocDatabase("users", user.uid, {
            reset: true,
            required: true,
            otp: false,
            type: "profesor",
            uid: user.uid,
            adresaEmail,
            emailParinte: adresaEmail,
            prenume,
            displayName: numeDeFamilie + " " + prenume,
            numeDeFamilie,
          });

          await updateDocDatabase("profesori", id, {
            numeDeFamilie,
            prenume,

            id: id,
            adresaEmail,
            displayName: numeDeFamilie + " " + prenume,
            numarTelefon,

            selectedMaterii,
          });

          selectedMaterii.forEach(async (materie) => {
            let data = await getDataDoc("materii", materie);

            let profs = data?.profesori || [];

            await updateDocDatabase("materii", materie, {
              profesori: [...profs, id],
            });

            dispatch(
              ADD_MATERIE([
                ...materii.filter((mat) => mat.id !== materie),
                {
                  ...materii?.find((mat) => mat.id === materie),
                  profesori: [...profs, id],
                },
              ])
            );
          });
          dispatch(
            GET_TEACHER([
              {
                numeDeFamilie,
                prenume,

                adresaEmail,
                numarTelefon,

                selectedMaterii,
                id: id,
                text: prenume + " " + numeDeFamilie,
              },
              ...profesori,
            ])
          );
        })
        .catch((err) => openErrorNotification(err.message));
    } catch (e) {
      openErrorNotification(e.toString());
    }
    setConfirmLoading(false);
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };
  return (
    <Modal
      title="Adaugă Profesor"
      open={open}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      onCancel={handleCancel}
    >
      <Form
        labelCol={{
          span: 5,
        }}
        wrapperCol={{
          span: 18,
        }}
        layout="horizontal"
        onValuesChange={() => {}}
      >
        <Form.Item label="Nume">
          <Input
            value={numeDeFamilie}
            onChange={(e) => {
              setNumeDeFamilie(e.target.value);
            }}
          />
        </Form.Item>
        <Form.Item label="Prenume">
          <Input
            value={prenume}
            onChange={(e) => {
              setPrenume(e.target.value);
            }}
          />
        </Form.Item>

        <Form.Item label="Adresa email">
          <Input
            value={adresaEmail}
            onChange={(e) => {
              setAdresaEmail(e.target.value);
            }}
          />
        </Form.Item>
        <Form.Item label="Telefon">
          <Input
            value={numarTelefon}
            onChange={(e) => {
              setNumarTelefon(e.target.value);
            }}
          />
        </Form.Item>

        <Form.Item label="Materii">
          <Select
            mode="multiple"
            placeholder="Materii"
            defaultValue={[]}
            onChange={(value) => {
              setSelectedMaterii(value);
            }}
            style={{ width: "100%" }}
            filterOption={(input, option) =>
              (option?.label?.toLowerCase() ?? "").includes(
                input?.toLowerCase()
              )
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
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AddProfesor;
