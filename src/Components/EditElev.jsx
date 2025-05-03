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
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { getDataDoc, updateDocDatabase } from "../database";
import dayjs from "dayjs";
import { openErrorNotification } from "./Notifications/errorNotification";
import { query, collection, getDocs, where } from "firebase/firestore";
import { DatePicker, Space } from "antd";
import { db } from "../database/firebase";
import ModalTransfer from "./ModalTransfer";
import { useSelector } from "react-redux";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  updateProfile,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import {
  useWindowSize,
  useWindowWidth,
  useWindowHeight,
} from "@react-hook/window-size";

function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000);
}
function EditElev({ elevData, setMode, clase, colors, setElevData, id }) {
  const [numeDeFamilie, setNumeDeFamilie] = useState();
  const [prenume, setPrenume] = useState();
  const [adresaEmail, setAdresaEmail] = useState();
  const onlyWidth = useWindowWidth();
  const [clasa, setClasa] = useState();
  const [numarMatricol, setNumarMatricol] = useState();
  const [open, setOpen] = useState(false);
  const [parintii, setParintii] = useState();
  const [promiss, setPromiss] = useState();
  const [numarTelefon, setNumarTelefon] = useState();
  const [profindr, setProfindr] = useState();
  const [insprin, setInsprin] = useState();
  const [scutitMedical, setScutitMedical] = useState("");
  const [dataExpirareMedical, setDataExpirareMedical] = useState("");
  const [ces, setCes] = useState("");

  const [religie, setReligie] = useState("da");
  const [inssec, setInssec] = useState();
  const profesori = useSelector((state) => state.profesori);
  const [cnp, setCnp] = useState("");
  const [loculNasteri, setLoculNasteri] = useState("");
  const [tata, setTata] = useState("");
  const [mama, setMama] = useState("");
  const [domiciliu, setDomiciliu] = useState("");
  const [details, setDetails] = useState("");

  const [materiiSpecialitate, setMateriiSpecialitate] = useState([]);
  const materiiRedux = useSelector((state) => state.materii);
  const [bursa, setBursa] = useState("-");
  const [initiala, setInitiala] = useState("");
  useEffect(() => {
    setNumeDeFamilie(elevData.numeDeFamilie || "");
    setPrenume(elevData.prenume || "");
    setAdresaEmail(elevData.adresaEmail || "");
    setNumarMatricol(elevData.numarMatricol || "");
    setNumarTelefon(elevData.numarTelefon || "");
    setParintii(elevData.parintii || []);
    setClasa(elevData.clasa || "N/A");
    setCnp(elevData.cnp || "");
    setDetails(elevData.details || "");
    setLoculNasteri(elevData.loculNasteri || "");
    setMama(elevData.mama || "");
    setTata(elevData.tata || "");
    setInitiala(elevData.initiala || "");
    setDomiciliu(elevData.domiciliu || "");
    setProfindr(elevData.profindr || "");
    setInsprin(elevData.insprin || "");
    setInssec(elevData.inssec || "");
    setBursa(elevData.bursa || "");
    setScutitMedical(elevData.scutitMedical || "nu");
    setMateriiSpecialitate(elevData.materiiSpecialitate || []);
    setDataExpirareMedical(
      elevData.dataExpirareMedical ? new Date(elevData.dataExpirareMedical) : ""
    );
    setCes(elevData.ces || "nu");
    setReligie(elevData.religie || "da");
  }, [elevData]);

  const getUserIdByEmail = async (email) => {
    try {
      // Creează o interogare pentru a căuta documentul utilizatorului după email
      const q = query(
        collection(db, "users"),
        where("emailParinte", "==", email)
      );

      // Execută interogarea
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Dacă există un document, returnăm `uid` din primul document găsit
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        console.log("User ID găsit:", userDoc.id); // `userDoc.id` este `uid` al utilizatorului
        return userDoc.id; // Returnăm `userId` (document ID)
      } else {
        console.log("Nu am găsit niciun utilizator cu acest email.");
        return null;
      }
    } catch (error) {
      console.error("Eroare la căutarea utilizatorului:", error);
      return null;
    }
  };

  const onSave = async () => {
    try {
      let elevData = await getDataDoc("elevi", id);
      const firebaseConfig = {
        apiKey: "AIzaSyCNeic3g7sGVCz0rI2TewmRu9NTi2H6Giw",
        authDomain: "catalog-cce7f.firebaseapp.com",
        projectId: "catalog-cce7f",
        storageBucket: "catalog-cce7f.appspot.com",
        messagingSenderId: "1050076419786",
        appId: "1:1050076419786:web:066fde7513bc7b91430633",
        measurementId: "G-QKL46BL0DV",
      };
      if (adresaEmail !== elevData.email) {
        const firebaseConfig = {
          apiKey: "AIzaSyCNeic3g7sGVCz0rI2TewmRu9NTi2H6Giw",
          authDomain: "catalog-cce7f.firebaseapp.com",
          projectId: "catalog-cce7f",
          storageBucket: "catalog-cce7f.appspot.com",
          messagingSenderId: "1050076419786",
          appId: "1:1050076419786:web:066fde7513bc7b91430633",
          measurementId: "G-QKL46BL0DV",
        };
        let Secondary = initializeApp(firebaseConfig, "secondary");
        let auth2 = getAuth(Secondary);
      }

      let docBoss = await getDataDoc("elevi", id);
      if (docBoss?.parintii) {
        // Iterează prin lista de părinți din documentul elevului
        for await (let parinte of docBoss.parintii) {
          if (!parintii.find((p) => p === parinte)) {
            // Găsește userId-ul pe baza emailului părintelui
            const userId = await getUserIdByEmail(parinte);

            if (userId) {
              // Obține documentul utilizatorului
              const dataParinte = await getDataDoc("users", userId);

              if (dataParinte?.copii) {
                // Filtrează câmpul copii pentru a elimina elevul
                const copiiActualizati = dataParinte?.copii?.filter(
                  (copil) => copil.idElev !== id
                );
                const eleviA = dataParinte?.elevi?.filter(
                  (copil) => copil !== id
                );

                // Actualizează documentul utilizatorului în Firestore
                await updateDocDatabase("users", userId, {
                  copii: copiiActualizati || [],
                  elevi: eleviA || [],
                });

                console.log(
                  `Elevul ${id} a fost eliminat din documentul părintelui ${userId}.`
                );
              }
            }
          }
        }
      }

      setElevData({
        ...elevData,
        numeDeFamilie,
        prenume,
        adresaEmail,
        numarMatricol,
        numarTelefon,
        displayName: numeDeFamilie + " " + initiala + " " + prenume,
        parintii,
        clasa,

        cnp,
        details,
        materiiSpecialitate,
        initiala,
        insprin,
        inssec,
        profindr,
        loculNasteri,
        mama,
        tata,
        domiciliu,
        bursa,
        scutitMedical,
        dataExpirareMedical: dataExpirareMedical
          ? dataExpirareMedical.getTime()
          : "",
        ces,
        religie,
      });
      await updateDocDatabase("elevi", id, {
        ...elevData,
        numeDeFamilie,
        prenume,
        adresaEmail,
        numarMatricol,
        numarTelefon,
        displayName: numeDeFamilie + " " + initiala + " " + prenume,
        parintii,
        initiala,
        insprin,
        inssec,
        profindr,
        details,
        materiiSpecialitate,
        clasa,
        cnp,
        loculNasteri,
        mama,
        tata,
        domiciliu,
        bursa,
        scutitMedical,
        dataExpirareMedical: dataExpirareMedical
          ? dataExpirareMedical.getTime()
          : "",
        ces,
        religie,
      });
      await updateDocDatabase("users", id, {
        numeDeFamilie,
        prenume,
        displayName: numeDeFamilie + " " + initiala + " " + prenume,
      });
      const data = await getDataDoc("claseData", elevData.clasa);
      let elevi = (data?.elevi || [])?.filter((el) => el.id !== id);
      const { transferuri } = await getDataDoc("elevi", id);

      await updateDocDatabase("claseData", elevData.clasa, {
        elevi: [
          ...elevi,
          {
            id,
            numeDeFamilie,
            prenume,
            adresaEmail,
            parintii,
            initiala,
            scutitMedical,
            dataExpirareMedical: dataExpirareMedical
              ? dataExpirareMedical.getTime()
              : "",
            ces,
            details,
            materiiSpecialitate,
            religie,
            transferuri: transferuri || [],
          },
        ],
      });

      const note = await getDataDoc("catalog", id);
      const docs = await getDataDoc("eleviDocumente", id);
      if (clasa !== elevData.clasa) {
        await updateDocDatabase("claseData", elevData.clasa, {
          elevi: [
            ...elevi.filter((el) => el.id !== id),
            {
              id,
              numeDeFamilie,
              prenume,
              adresaEmail,
              parintii,
              initiala,
              scutitMedical,
              dataExpirareMedical: dataExpirareMedical
                ? dataExpirareMedical.getTime()
                : "",
              ces,
              religie,
              transferuri,
              mutat: true,
              gradesFrozen: note?.note || [],
              docsFrozen: docs || [],
            },
          ],
        });
        const data = await getDataDoc("claseData", clasa);
        let newelevi = data?.elevi || [];
        await updateDocDatabase("claseData", clasa, {
          elevi: [
            ...newelevi,
            {
              id,
              numeDeFamilie,
              prenume,
              adresaEmail,
              parintii,
              initiala,
              clasaVeche: elevData.clasa,
            },
          ],
        });
      }

      for await (let email of parintii) {
        let pass = generateSixDigitCode();

        let Secondary = initializeApp(firebaseConfig, "secondary");
        let auth2 = getAuth(Secondary);
        try {
          await createUserWithEmailAndPassword(auth2, email, pass).then(
            async (userCredentials) => {
              const user = userCredentials.user;
              await updateDocDatabase("mail", "parinte" + pass + Date.now(), {
                to: [email],
                message: {
                  subject:
                    "Ai fost inregistrat ca abonat al elevului " +
                    numeDeFamilie +
                    " " +
                    prenume,

                  text:
                    "Intra pe " +
                    process.env.REACT_APP_LINK +
                    " logheaza-te cu " +
                    email +
                    " si parola " +
                    pass +
                    " ." +
                    " Nu uita ca vei fi obligat sa schimbi parola.",
                },
              });
              await updateProfile(user, { emailVerified: true });
              signOut(auth2);
              await updateDocDatabase("users", user?.uid, {
                reset: true,
                type: "parinte",
                uid: user?.uid,
                emailParinte: email,
                copii: [
                  {
                    adresaEmail,
                    idElev: id,
                    prenume,
                    displayName: numeDeFamilie + " " + initiala + " " + prenume,
                    numeDeFamilie,
                  },
                ],
                elevi: [id],
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
          if (data === undefined) {
            // openErrorNotification("nu am gasit cont parinte");
          }
          if (data?.uid)
            await updateDocDatabase("users", data.uid, {
              copii: [
                ...(data.copii || []).filter((e) => e.idElev !== id),
                {
                  adresaEmail,
                  idElev: id,
                  prenume,
                  displayName: numeDeFamilie + " " + initiala + " " + prenume,
                  scutitMedical,
                  dataExpirareMedical: dataExpirareMedical
                    ? dataExpirareMedical.getTime()
                    : "",
                  ces,
                  religie,
                  numeDeFamilie,
                },
              ],
              elevi: [...(data.elevi || []).filter((e) => e !== id), id],
            });
        }
      }
    } catch (e) {
      openErrorNotification(e.message);
    }
  };

  return (
    <>
      <ModalTransfer
        open={open}
        setOpen={setOpen}
        elevData={elevData}
        promiss={promiss}
        id={id}
        setClasa={setClasa}
      />
      <Descriptions
        bordered
        layout={"vertical"}
        column={1}
        title={
          (elevData.numeDeFamilie + " " + initiala + " ",
          elevData.prenume +
            " - " +
            clase?.find((cls) => cls.id === elevData.clasa)?.anClasa +
            " " +
            clase?.find((cls) => cls.id === elevData.clasa)?.identificator)
        }
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
        <Descriptions.Item label="Initiala">
          {" "}
          <Input
            value={initiala}
            onChange={(e) => {
              setInitiala(e.target.value);
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Clase">
          <Select
            value={clasa}
            style={{ width: "100%" }}
            onChange={(e, value) => {
              setPromiss(value.value);
              setOpen(true);
            }}
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
        </Descriptions.Item>
        <Descriptions.Item label="Nr. Matricol (nr/vol/p)">
          <Input
            value={numarMatricol}
            onChange={(e) => {
              setNumarMatricol(e.target.value);
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
        <Descriptions.Item label="CNP">
          <Input
            value={cnp}
            onChange={(e) => {
              setCnp(e.target.value);
            }}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Locul Nasterii">
          <Input
            value={loculNasteri}
            onChange={(e) => {
              setLoculNasteri(e.target.value);
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Domiciliu">
          <Input
            value={domiciliu}
            onChange={(e) => {
              setDomiciliu(e.target.value);
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Prenume Mama">
          <Input
            value={mama}
            onChange={(e) => {
              setMama(e.target.value);
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Tata">
          <Input
            value={tata}
            onChange={(e) => {
              setTata(e.target.value);
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Scutit medical">
          <Input
            value={scutitMedical}
            onChange={(e) => {
              setScutitMedical(e.target.value);
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Scutit medical">
          <DatePicker
            value={dataExpirareMedical ? dayjs(dataExpirareMedical) : null}
            format={"DD/MM/YYYY"}
            onChange={(e) => {
              setDataExpirareMedical(e.toDate());
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="CES">
          <Select
            value={ces}
            onChange={(e) => {
              setCes(e);
            }}
            options={[
              { label: "NU", value: "nu" },
              { label: "DA", value: "da" },
            ]}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Cerere retragere Religie">
          <Input
            value={religie}
            onChange={(e) => {
              setReligie(e.target.value);
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Bursa">
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
        </Descriptions.Item>

        <Descriptions.Item label="Abonati">
          <Select
            mode="tags"
            value={parintii || []}
            onChange={(e) => setParintii(e.map((item) => item.trim()))}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Detalii" span={"filled"}>
          <Input
            value={details}
            onChange={(e) => {
              setDetails(e.target.value);
            }}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Materii specialitate">
          <span>
            {materiiSpecialitate.map((materie, index) => {
              return (
                <>
                  <div
                    style={{
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
                      onChange={(value) => {
                        let subjects = JSON.parse(
                          JSON.stringify(materiiSpecialitate)
                        );
                        subjects[index].materie = value;
                        setMateriiSpecialitate(subjects);
                      }}
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input?.toLowerCase())
                      }
                      filterSort={(optionA, optionB) =>
                        (optionA?.label ?? "")
                          .toLowerCase()
                          .localeCompare((optionB?.label ?? "").toLowerCase())
                      }
                      options={materiiRedux.map((mat) => {
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
                      optionFilterProp="children"
                      value={materie.profesori}
                      onChange={(value) => {
                        let subjects = JSON.parse(
                          JSON.stringify(materiiSpecialitate)
                        );
                        subjects[index].profesori = value;
                        setMateriiSpecialitate(subjects);
                      }}
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input?.toLowerCase())
                      }
                      filterSort={(optionA, optionB) =>
                        (optionA?.label ?? "")
                          .toLowerCase()
                          .localeCompare((optionB?.label ?? "").toLowerCase())
                      }
                      options={(
                        materiiRedux.find((mat) => mat.id === materie?.materie)
                          ?.profesori || []
                      ).map((profID) => {
                        let prof = profesori.find((pf) => pf.id === profID);
                        return {
                          label: prof?.numeDeFamilie + "-" + prof?.prenume,
                          value: prof?.id,
                        };
                      })}
                    />
                    <Button
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => {
                        setMateriiSpecialitate(
                          materiiSpecialitate.filter(
                            (ma) => ma.materie !== materie?.materie
                          )
                        );
                      }}
                    />
                  </div>
                  <br />
                </>
              );
            })}
            <Button
              onClick={() => {
                setMateriiSpecialitate([
                  ...materiiSpecialitate,
                  { materie: "" },
                ]);
              }}
            >
              <PlusOutlined />
            </Button>
          </span>
        </Descriptions.Item>
      </Descriptions>
      <Button
        type="primary"
        style={{ width: "100%" }}
        onClick={() => {
          onSave();
          setMode("view");
        }}
      >
        Save
      </Button>
    </>
  );
}

export default EditElev;
