import React, { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { auth, db } from "../../database/firebase";
import { doc, getDoc } from "firebase/firestore";

import { Modal } from "antd";
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
import {
  getStorage,
  query,
  collection,
  getDocs,
  where,
} from "firebase/firestore";
import { openSuccesNotification } from "../../Components/Notifications/succesNotification";
import { validCNP } from "../../utils/cnpValidator";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  updateProfile,
} from "firebase/auth";
import { useSelector } from "react-redux";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
import { getDataDoc, updateDocDatabase } from "../../database";
import { initializeApp } from "firebase/app";
const { TextArea } = Input;
function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000);
}
function AddElev({
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
  meditatiiDefault = [],
  numeFirmaDefault = "",
  cifFirmaDefault = "",
  numarRegComDefault = "",
  numeFacturaDefault = "",
  numarTelefonDefault = "",
  adresaEmailDafault = "",
  serieBuletinFacturaDefault = "",
  orasFacturaDefault = "",
  stradaFacturaDefault = "",
  numarBuletinFacturaDefault = "",
  numarAdresaFacturaDefault = "",
  blocFacturaDefault = "",
  apartamentFacturaDefault = "",
  judetFacturaDefault = "",
  facturiNeplatite = [],
  sedinteNeplatite = [],

  numarFacturi = 0,
  contDefault = 0,
  numarMatricolDefault = "",
  id = "",

  parintiDefault = [],
}) {
  const [numeDeFamilie, setNumeDeFamilie] = useState(numeDeFamilieDefault);
  const [prenume, setPrenume] = useState(prenumeDefault);
  const clase = useSelector((state) => {
    let newClass = JSON.parse(JSON.stringify(state.clase));
    newClass.sort((a, b) => {
      if (
        a.anClasa < b.anClasa ||
        (a.anClasa === b.anClasa && a.identificator < b.identificator)
      )
        return -1;
      else return 1;
    });

    return newClass;
  });
  const [clasa, setClasa] = useState(null);
  const [an, setAn] = useState(anDefault);
  const [numarTelefon, setNumarTelefon] = useState(numarTelefonDefault);
  const [adresaEmail, setAdresaEmail] = useState(adresaEmailDafault);
  const [insprin, setInsprin] = useState("");
  const [inssec, setInssec] = useState("");
  const [numarMatricol, setNumarMatricol] = useState(numarMatricolDefault);
  const [profindr, setProfIndr] = useState("");
  const [initiala, setInitiala] = useState("");
  const [parintii, setParintii] = useState(parintiDefault);
  const [cnp, setCnp] = useState("");
  const [loculNasteri, setLoculNasteri] = useState("");
  const [mama, setMama] = useState("");
  const [tata, setTata] = useState("");

  const [domiciliu, setDomiciliu] = useState("");
  const [detalii, setDetalii] = useState("");
  const [bursa, setBursa] = useState("-");

  const handleOk = async () => {
    if (clasa === null) {
      openErrorNotification("clasa nu poate fi nula");
      return;
    }
    if (adresaEmail?.length === 0) {
      openErrorNotification("adresa email nu poate fi nula");
      return;
    }
    if (prenume?.length === 0) {
      openErrorNotification("prenumele nu poate fi nula");
      return;
    }
    if (numeDeFamilie?.length === 0) {
      openErrorNotification("numele de familie nu poate fi nula");
      return;
    }
    try {
      setConfirmLoading(true);
      const firebaseConfig = {
        apiKey: "AIzaSyCNeic3g7sGVCz0rI2TewmRu9NTi2H6Giw",
        authDomain: "catalog-cce7f.firebaseapp.com",
        projectId: "catalog-cce7f",
        storageBucket: "catalog-cce7f.appspot.com",
        messagingSenderId: "1050076419786",
        appId: "1:1050076419786:web:066fde7513bc7b91430633",
        measurementId: "G-QKL46BL0DV",
      };
      let pass = generateSixDigitCode();

      let Secondary = initializeApp(firebaseConfig, "secondary");
      let auth2 = getAuth(Secondary);
      let idElev = "";
      await createUserWithEmailAndPassword(auth2, adresaEmail, pass)
        .then(async (userCredentials) => {
          const user = userCredentials.user;
          idElev = user.uid;
          await updateProfile(user, { emailVerified: true });
          signOut(auth2);

          await updateDocDatabase("mail", "elev" + pass + Date.now(), {
            to: [adresaEmail],
            message: {
              subject:
                numeDeFamilie +
                " " +
                prenume +
                " a fost inregistrat in catalogul scolii",
              text:
                "Intra pe " +
                "https://catalog-electronic.vercel.app/" +
                " logheaza-te cu " +
                adresaEmail +
                " si parola " +
                pass +
                " .",
            },
          });
          await updateDocDatabase("users", user.uid, {
            reset: true,
            type: "elevi",
            uid: user.uid,
            prenume,
            displayName: numeDeFamilie + " " + initiala + " " + prenume,
            profindr,
            insprin,
            initiala,
            numeDeFamilie,
            inssec,
          });
          await updateDocDatabase("elevi", user.uid, {
            prenume,
            numeDeFamilie,
            numarMatricol,
            adresaEmail,
            numarTelefon,
            displayName: numeDeFamilie + " " + initiala + " " + prenume,
            profindr,
            initiala,
            insprin,
            clasa,
            cnp,
            loculNasteri,
            mama,
            tata,
            domiciliu,
            details: detalii,
            bursa,
            venitNou: new Date() >= new Date('10/1/24"'),
            inregistrat: Date.now(),
            parintii,
            inssec,
          });
          const elevi = await getDataDoc("claseData", clasa || "faraclasa");

          await updateDocDatabase("claseData", clasa || "faraclasa", {
            elevi: [
              ...(elevi?.elevi || []),
              {
                id: user.uid,
                prenume,
                numeDeFamilie,
                adresaEmail,
                parintii,
                initiala,
              },
            ],
          });
          for await (let email of parintii) {
            let pass = generateSixDigitCode();

            let auth2 = getAuth(Secondary);
            try {
              await createUserWithEmailAndPassword(auth2, email, pass).then(
                async (userCredentials) => {
                  const user = userCredentials.user;
                  await updateProfile(user, { emailVerified: true });
                  await updateDocDatabase("mail", "mail" + pass + Date.now(), {
                    to: [email],
                    message: {
                      subject:
                        "Ai fost inregistrat ca abonat al elevului " +
                        numeDeFamilie +
                        " " +
                        prenume,
                      text:
                        "Intra pe " +
                        "https://catalog-electronic.vercel.app/" +
                        " logheaza-te cu " +
                        email +
                        " si parola " +
                        pass +
                        " ." +
                        " Nu uita ca vei fi obligat sa schimbi parola.",
                    },
                  });
                  signOut(auth2);
                  await updateDocDatabase("users", user.uid, {
                    reset: true,
                    type: "parinte",
                    emailParinte: email,
                    uid: user.uid,
                    copii: [
                      {
                        adresaEmail,
                        idElev,
                        prenume,
                        displayName: numeDeFamilie + " " + prenume,
                        numeDeFamilie,
                      },
                    ],
                    elevi: [idElev],
                  });
                }
              );
            } catch (err) {
              const q = query(
                collection(db, "users"),
                where("emailParinte", "==", email)
              );
              let data = undefined;

              const querySnapshot = await getDocs(q);
              querySnapshot.forEach((doc) => {
                data = doc.data();
              });
              if (data?.uid)
                await updateDocDatabase("users", data.uid, {
                  copii: [
                    ...data.copii,
                    {
                      adresaEmail,
                      idElev,
                      prenume,
                      displayName:
                        numeDeFamilie + " " + initiala + " " + prenume,
                      numeDeFamilie,
                    },
                  ],
                  elevi: [...(data.elevi || []), idElev],
                });
            }
          }
          openSuccesNotification("Elevul a fost adaugat");
        })
        .catch((err) => {
          openErrorNotification(err.message);
          setConfirmLoading(false);
        });

      setOpen(false);

      setConfirmLoading(false);
    } catch (err) {
      openErrorNotification(err.message);
      setConfirmLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Modal
      title="Adaugă Elev"
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
        <Form.Item label="Initiala">
          <Input
            value={initiala}
            onChange={(e) => {
              setInitiala(e.target.value);
            }}
          />
        </Form.Item>

        <Form.Item label="Nr. Matricol">
          <Input
            value={numarMatricol}
            onChange={(e) => {
              setNumarMatricol(e.target.value);
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
        <Form.Item label="CNP">
          <Input
            value={cnp}
            onChange={(e) => {
              setCnp(e.target.value);
            }}
          />
        </Form.Item>
        <Form.Item label="Locul Nasterii">
          <Input
            value={loculNasteri}
            onChange={(e) => {
              setLoculNasteri(e.target.value);
            }}
          />
        </Form.Item>

        <Form.Item label="Domiciliu">
          <Input
            value={domiciliu}
            onChange={(e) => {
              setDomiciliu(e.target.value);
            }}
          />
        </Form.Item>
        <Form.Item label="Prenume Mama">
          <Input
            value={mama}
            onChange={(e) => {
              setMama(e.target.value);
            }}
          />
        </Form.Item>
        <Form.Item label="Prenume Tata">
          <Input
            value={tata}
            onChange={(e) => {
              setTata(e.target.value);
            }}
          />
        </Form.Item>
        <Form.Item label="Bursa">
          <Select
            value={bursa}
            onChange={(e) => {
              setBursa(e);
            }}
            options={[
              { label: "-", value: "-" },
              { label: "nebursier", value: "nebursier" },
              { label: "merit", value: "merit" },
              { label: "sociala", value: "sociala" },
              { label: "performanta", value: "performanta" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Clasa" required>
          <Select
            onChange={(e, value) => setClasa(value.value)}
            options={[
              ...clase.map((cls) => {
                return {
                  label: cls.anClasa + cls.identificator,
                  value: cls.id,
                };
              }),
              { label: "N/A", value: "faraclasa" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Email Abon.">
          <Select
            mode="tags"
            style={{
              width: "100%",
            }}
            placeholder="Parinti"
            onChange={(e) => setParintii(e.map((item) => item.trim()))}
            options={[]}
          />
        </Form.Item>
        <Form.Item label="Detalii">
          <Input
            value={detalii}
            onChange={(e) => {
              setDetalii(e.target.value);
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AddElev;
