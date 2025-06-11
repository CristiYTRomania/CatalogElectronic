import React, { useState, useEffect } from "react"; // Importuri esențiale React
import { useParams, useNavigate } from "react-router-dom"; // Importuri pentru rutare
import { useDispatch, useSelector } from "react-redux"; // Importuri pentru Redux

// Importuri componente Ant Design
import {
  Image,
  Button,
  Descriptions,
  Divider,
  Popconfirm,
  Tabs,
  Alert,
  Tag,
  Input,
} from "antd";
import {
  SettingOutlined,
  DeleteOutlined,
  RollbackOutlined,
} from "@ant-design/icons";

// Importuri de imagini și stiluri locale
import ProfileImageAnonymus from "../assets/profile-elev.webp";
import "./ElevPage.css";
import "./ProfesorPage.css";

// Importuri componente locale
import EditProfesor from "./EditProfesor";
import ModalSettingsProf from "../Pages/Admin/ModalSettingsProf";
import ModalChangePassword from "./ModalSchimbareParola";
import OrarProfesori from "../Pages/Profesori/OrarProfesori";
import withErrorBoundary from "./withErrorComponent"; // Componentă Higher-Order pentru gestionarea erorilor

// Importuri utilitare și servicii Firebase
import {
  getDataDoc,
  updateDocDatabase,
  uploadFileDatabse,
  deleteDataDoc,
} from "../database";
import { db } from "../database/firebase";
import { onSnapshot, doc } from "firebase/firestore"; // Listener pentru actualizări în timp real de la Firestore
import { openErrorNotification } from "./Notifications/errorNotification"; // Funcție pentru notificări de eroare
import { getMaterieColor } from "../utils/index"; // Utilitar pentru culorile materiilor (deși nu este folosit direct aici, păstrat pentru coerență)

// Destructurarea componentelor Ant Design
const { TextArea } = Input;

// Culori predefinite pentru etichete (Tags), deși nu sunt folosite direct în acest fișier,
// ar putea fi utile pentru afișarea materiilor sau altor categorii.
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

/**
 * Componenta ProfesorPage afișează și gestionează detaliile unui profesor.
 * Permite vizualizarea, editarea și ștergerea informațiilor profesorului (doar pentru administratori),
 * precum și gestionarea orarului acestuia.
 */
function ProfesorPage() {
  // Obținerea ID-ului profesorului din URL
  const { id } = useParams();

  // Hooks de stare pentru gestionarea datelor și a UI-ului
  const [profesorData, setProfesorData] = useState({}); // Starea pentru datele profesorului
  const [userData, setUserData] = useState({}); // Starea pentru datele de utilizator asociate profesorului
  const [confirmLoading, setConfirmLoading] = useState(false); // Stare pentru a indica încărcarea în timpul unei operații de confirmare
  const [tabKey, setTabKey] = useState("Orar"); // Starea pentru tab-ul activ (Orar, Resurse, etc.)
  const [open, setOpen] = useState(false); // Stare pentru vizibilitatea modalului de setări al profesorului
  const [modalSchimbareParola, setModalSchimbaParola] = useState(false); // Stare pentru vizibilitatea modalului de schimbare a parolei
  const [mode, setMode] = useState("view"); // Modul curent al paginii: 'view' sau 'edit'

  // Hooks Redux pentru accesarea stării globale
  const materiiRedux = useSelector((state) => state.materii); // Toate materiile disponibile
  const materii = useSelector((state) => state.materii); // Re-declarare (poate fi unificată cu materiiRedux)
  const user = useSelector((state) => state.user); // Informațiile utilizatorului logat
  const clase = useSelector((state) => state.clase); // Informațiile despre clase (nu este folosit direct aici, dar e importat)

  // Hooks pentru navigare și dispatch Redux
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /**
   * Funcție asincronă pentru a prelua datele profesorului din baza de date.
   * Procesează datele de orar (ore și orePrivat) convertindu-le în obiecte Date.
   * Actualizează starea `profesorData` doar dacă datele sunt diferite.
   */
  const fetchData = async () => {
    try {
      const data = await getDataDoc("profesori", id);
      if (data) {
        // Convertim string-urile de dată în obiecte Date pentru a fi utilizabile în componentele de calendar/orar
        const processedData = {
          ...data,
          ore: (data?.ore || []).map((el) => ({
            ...el,
            startDate: new Date(el.startDate),
            endDate: new Date(el.endDate),
          })),
          orePrivat: (data?.orePrivat || []).map((el) => ({
            ...el,
            startDate: new Date(el.startDate),
            endDate: new Date(el.endDate),
          })),
        };
        // Actualizăm starea doar dacă datele s-au modificat pentru a evita re-randări inutile
        if (JSON.stringify(profesorData) !== JSON.stringify(processedData)) {
          setProfesorData(processedData);
        }
      }
    } catch (err) {
      openErrorNotification(err.message);
    }
  };

  /**
   * Funcție asincronă pentru a prelua datele utilizatorului asociate profesorului.
   * Actualizează starea `userData` doar dacă datele sunt diferite.
   */
  const fetchUserData = async () => {
    try {
      const data = await getDataDoc("users", id);
      if (data && JSON.stringify(userData) !== JSON.stringify(data)) {
        setUserData(data);
      }
    } catch (err) {
      openErrorNotification(err.message);
    }
  };

  // Efecte secundare (Lifecycle Hooks)
  useEffect(() => {
    // Apelăm funcțiile de fetch la montarea componentei
    fetchData();
    fetchUserData();

    // Setăm listeneri în timp real pentru actualizări din Firestore
    // Acești listeneri se dezabonează automat la demontarea componentei
    const unsubProfesor = onSnapshot(doc(db, "profesori", id), (doc) => {
      fetchData(); // Re-fetch dacă datele profesorului se modifică în Firestore
    });

    const unsubUser = onSnapshot(doc(db, "users", id), (doc) => {
      fetchUserData(); // Re-fetch dacă datele utilizatorului se modifică în Firestore
    });

    // Funcție de cleanup: dezabonare de la listeneri la demontarea componentei
    return () => {
      unsubProfesor();
      unsubUser();
    };
  }, [id]); // Dependența `id` asigură re-rularea efectului dacă ID-ul profesorului se schimbă

  /**
   * Funcție apelată la schimbarea tab-ului.
   * Setează cheia tab-ului activ.
   * @param {string} key - Cheia tab-ului selectat.
   */
  const handleTabChange = (key) => {
    setTabKey(key);
  };

  /**
   * Funcție asincronă pentru a gestiona ștergerea unui profesor.
   * Șterge înregistrările din colecțiile 'users' și 'profesori' și
   * actualizează materiile pentru a elimina referințele la profesorul șters.
   * Navighează înapoi la lista de profesori după ștergere.
   */
  const handleDeleteProfesor = async () => {
    try {
      // Șterge înregistrarea utilizatorului
      await deleteDataDoc("users", id);

      // Elimină profesorul din lista de profesori a materiilor la care preda
      materiiRedux.forEach(async (m) => {
        await updateDocDatabase("materii", m.id, {
          profesori: (m?.profesori || []).filter((profId) => profId !== id),
        });
      });

      // Șterge înregistrarea profesorului
      await deleteDataDoc("profesori", id);

      // Navighează la pagina cu lista de profesori
      navigate("/profesori");
    } catch (e) {
      openErrorNotification(e.message);
    }
  };

  return (
    <div className="profesor-page-container">
      {/* Buton de revenire vizibil doar pe ecrane mici */}
      {window.innerWidth < 750 && (
        <Button
          style={{ width: "100%", marginBottom: "15px" }}
          icon={<RollbackOutlined />}
          onClick={() => navigate(-1)}
        >
          Înapoi
        </Button>
      )}

      {/* Modalul pentru setările profesorului (vizibil doar pentru administratori) */}
      <ModalSettingsProf
        open={open}
        confirmLoading={confirmLoading}
        setConfirmLoading={setConfirmLoading}
        profesorData={profesorData}
        setOpen={setOpen}
        setProfesorData={setProfesorData}
      />

      {/* Modalul pentru schimbarea parolei (vizibil doar pentru administratori) */}
      <ModalChangePassword
        open={modalSchimbareParola}
        email={profesorData.email || profesorData.adresaEmail}
        setOpen={setModalSchimbaParola}
        id={profesorData.id}
        setId={() => {}} // Funcție goală, probabil pentru a respecta o interfață
      />

      {/* Secțiunea principală cu detaliile profesorului și opțiuni de editare */}
      <div className="mode-view">
        <div className="layout-prof profesor-details-section">
          {/* Imaginea de profil a profesorului */}
          <Image
            src={profesorData?.photoLink || ProfileImageAnonymus}
            height={200}
            style={{ marginTop: "5px", borderRadius: "8px" }}
            alt="Imagine de profil profesor"
          />
          <br />
          <br />
          {/* Opțiune de încărcare imagine de profil (vizibilă în modul editare) */}
          {mode === "edit" && (
            <>
              <input
                type="file"
                id="file-input"
                onChange={async (e) => {
                  try {
                    const files = e.target.files;
                    if (files.length > 0) {
                      let links = await uploadFileDatabse(
                        [files[0]],
                        "usersProfiles"
                      );
                      await updateDocDatabase("profesori", id, {
                        photoLink: links[0],
                      });
                      await updateDocDatabase("users", id, {
                        photoLink: links[0],
                      });
                      setProfesorData({ ...profesorData, photoLink: links[0] });
                      setMode("view"); // Revert back to view mode after upload
                    }
                  } catch (error) {
                    openErrorNotification(error.message);
                  }
                }}
                style={{ display: "none" }} // Ascundem input-ul de tip file
              />
              <label className="blue upload-button" htmlFor="file-input">
                <i className="fa-solid fa-arrow-up-from-bracket"></i>
                &nbsp; Alege fișier pentru încărcare
              </label>
            </>
          )}
        </div>

        <div className="layout-prof2 profesor-info-section">
          {mode === "view" ? (
            <>
              {/* Alertă pentru notițe mai vechi de 3 săptămâni (condițional) */}
              {process.env.REACT_APP_LIMIT_DATE === "enable" &&
                userData?.treiSapt === true && (
                  <Alert
                    message="Profesorul poate pune note mai vechi de 3 săptămâni"
                    type="info"
                    showIcon
                    style={{ marginBottom: "15px" }}
                  />
                )}

              {/* Descrierea detaliilor profesorului */}
              <Descriptions
                bordered
                layout={window.innerWidth < 750 ? "vertical" : "horizontal"}
                title={
                  <>
                    {profesorData?.numeDeFamilie} {profesorData?.prenume}
                  </>
                }
                extra={
                  // Butoane de acțiune vizibile doar pentru administratori
                  user.type === "admin"
                    ? [
                        <Popconfirm
                          key="delete"
                          title="Ești sigur că vrei să ștergi profesorul?"
                          onConfirm={handleDeleteProfesor}
                          okText="Da"
                          cancelText="Nu"
                        >
                          <Button
                            shape="circle"
                            icon={<DeleteOutlined />}
                            danger // Stilizează butonul ca "periculos" (roșu)
                            style={{ marginRight: "10px" }}
                            title="Șterge profesorul"
                          />
                        </Popconfirm>,
                        <Button
                          key="settings"
                          shape="circle"
                          onClick={() => setOpen(true)}
                          icon={<SettingOutlined />}
                          style={{ marginRight: "10px" }}
                          title="Setări profesor"
                        />,
                        <Button
                          key="edit"
                          type="primary"
                          onClick={() => setMode("edit")}
                          title="Editează profilul"
                        >
                          Editează
                        </Button>,
                        <Button
                          key="change-password"
                          onClick={() => setModalSchimbaParola(true)}
                          style={{ margin: "2px 0 0 10px" }}
                          title="Schimbă parola"
                        >
                          Schimbă Parola
                        </Button>,
                      ]
                    : [] // Dacă nu este admin, nu afișăm butoane de acțiune
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
                <Descriptions.Item label="Autentificare cu 2FA (OTP)">
                  {userData?.otp === true ? "DA" : "NU"}
                </Descriptions.Item>
                <Descriptions.Item label="Materii">
                  {/* Afișăm materiile la care predă profesorul, folosind Tag-uri Ant Design */}
                  {profesorData.selectedMaterii?.map((materieId) => {
                    const foundMaterie = materii?.find(
                      (mat) => mat.id === materieId
                    );
                    return (
                      foundMaterie && (
                        <Tag key={materieId} color={getMaterieColor(foundMaterie.numeMaterie)}> {/* Presupunem că getMaterieColor returnează o culoare */}
                          {foundMaterie.numeMaterie} - {foundMaterie.profil}
                        </Tag>
                      )
                    );
                  })}
                </Descriptions.Item>
              </Descriptions>
            </>
          ) : (
            // Afișăm componenta de editare a profesorului în modul 'edit'
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
      <br />
      <Divider style={{ borderBlockStart: "0px" }} />

      {/* Tab-uri pentru navigare între secțiuni (e.g., Orar, Resurse) */}
      <Tabs
        tabBarStyle={{
          width: "100%",
          fontWeight: "bold",
          backgroundColor: "#f5f5f5",
        }}
        size="large"
        onChange={handleTabChange} // Folosim funcția dedicată handleTabChange
        activeKey={tabKey}
        items={[
          {
            label: `Orar`,
            key: "Orar",
            children: <OrarProfesori profesorData={{ ...profesorData }} />,
          },
          // Aici ar putea veni alte tab-uri, ex:
          // {
          //   label: `Resurse`,
          //   key: "Resurse",
          //   children: <div>Secțiunea de resurse pentru profesor</div>,
          // },
        ]}
      />
    </div>
  );
}

// Exportăm componenta ProfesorPage învelită într-un ErrorBoundary
export default withErrorBoundary(ProfesorPage);
