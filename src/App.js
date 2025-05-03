import { Layout, theme, Alert, Spin } from "antd";
import Navbar from "./Components/Navbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProfileElevi from "./Pages/Admin/ProfileElevi";
import Profesori from "./Pages/Admin/Profesori";
import ChangeLog from "./Pages/Admin/ChangeLog";
import { useSelector, useDispatch } from "react-redux";
import ProfesorPage from "./Components/ProfesorPage";
import { updateDoc, arrayUnion } from "firebase/firestore";

import Docs from "./Components/Docs";
import AdministratorStergeriNote from "./Pages/Admin/AdministratorStergeriNote";
import { signOut } from "firebase/auth";
import { updateDocDatabase } from "./database";
import { throttle } from "lodash";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import ScrollMemoryWrapper from "./Components/ScrollMemoryWrapper";
import axios from "axios"; // Im
import LectiiElev from "./Pages/Admin/LectiiElevii";
import Ajutor from "./Pages/Ajutor";

import { useState } from "react";

import Profil from "./Components/Profil";
import { Select } from "antd";
import Anunturi from "./Pages/Admin/Anunturi";

import NavbarProfesor from "./Components/NavbarProfesor";
import AdministratorScutiri from "./Pages/Admin/AdministratorScutiri";

import { Navigate } from "react-router-dom";
import "antd/dist/reset.css";
import { useEffect } from "react";
import { doc, onSnapshot, collection } from "firebase/firestore";

import { useRef } from "react";
import {
  getAni,
  getAnunturi,
  getClase,
  getMaterii,
  getProfesori,
  getSettigs,
} from "./redux/actions";
import Clase from "./Pages/Admin/Clase";
import { getDoc } from "firebase/firestore";
import Settings from "./Pages/Admin/Settings";
import { db } from "./database/firebase";
import Orar from "./Components/Orare/Orar";
import OrarElev from "./Pages/Elevi/Orar";
import Class from "./Pages/Admin/Class";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Login from "./Pages/General/Login";
import { testSlice } from "./redux/store";
import Updates from "./Pages/General/Updates";
import OrarProfesori from "./Pages/Profesori/OrarProfesori";
import ElevPage from "./Components/ElevPage";
import NavbarElev from "./Components/NavbarElev";
import { getDataDoc } from "./database";
import TemeElevi from "./Pages/Elevi/TemeElevi";
import ProfesoriElevi from "./Pages/Elevi/ProfesoriElevi";
import Submisii from "./Pages/Admin/Submisii";
import CatalogElev from "./Pages/Elevi/CatalogElev";
import ComentariiElev from "./Pages/Elevi/ComentariiElev";
import StatisticiClase from "./Pages/Admin/StatisticiClase";
import StatisticiScoala from "./Pages/Admin/StatisticiScoala";
import { Space, Button } from "antd";

import { openSuccesNotification } from "./Components/Notifications/succesNotification";

const { actions } = testSlice;
const { GET_USER, SESSION } = actions;
const { Header, Content, Footer } = Layout;

const ProfesoriProtectedRoute = ({ children }) => {
  let user = useSelector((state) => state.user);
  if (user.type !== "admin" && user.type !== "profesor") {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AdminProtectedRoute = ({ children }) => {
  let user = useSelector((state) => state.user);
  if (user.type !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};
const EleviProtectedRoute = ({ children }) => {
  let user = useSelector((state) => state.user);
  if (user.type !== "elevi") {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const login = false;
  const user = useSelector((state) => state.user);
  const [chosenElev, setElevChosen] = useState(null);
  const [isTokenFound, setTokenFound] = useState(false);
  const [userIp, setUserIp] = useState("");
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const loading = useSelector((state) => state.loading);
  const dispatch = useDispatch();

  const session = useSelector((state) => state.session);
  const sessionRef = useSelector((state) => state.session);
  const [timer, setTimer] = useState(null);
  const profesori = useSelector((state) => state.profesori);
  const ref = useRef(null);
  const auth = getAuth();
  const fpPromise = FingerprintJS.load();

  // Funcția pentru resetarea timerului
  const resetTimer = throttle(() => {
    if (ref.current) {
      clearTimeout(ref.current);
    }

    ref.current = setTimeout(() => {
      handleLogout();
    }, 3 * 60 * 1000); // 3 minute
  }, 10000);
  const getUserIp = async () => {
    let deviceInfo = await fpPromise
      .then((fp) => fp.get())
      .then((result) => {
        // Identificator unic
        setUserIp(result.visitorId);
      });
  };
  // Funcția pentru deconectarea utilizatorului
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("User signed out due to inactivity");
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
      });
  };

  useEffect(() => {
    getUserIp(); // Obține IP-ul când componenta este montată
  }, []);
  useEffect(() => {
    if (
      session.dangerMode === true &&
      (user?.type === "profesor" || user?.type === "admin")
    ) {
      // Ascultă evenimentele pentru activitate pe desktop și mobile
      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("keydown", resetTimer);
      window.addEventListener("touchstart", resetTimer); // Pentru mobile
      window.addEventListener("touchmove", resetTimer); // Pentru mobile

      // Setează primul timer la montarea componentei

      resetTimer();

      return () => {
        // Curăță event listeners și timer-ul la demontarea componentei
        window.removeEventListener("mousemove", resetTimer);
        window.removeEventListener("keydown", resetTimer);
        window.removeEventListener("touchstart", resetTimer);
        window.removeEventListener("touchmove", resetTimer);
        if (timer) clearTimeout(timer);
      };
    }
  }, [session, user]);
  ///this should be changes
  useEffect(() => {
    dispatch(getAni());
    dispatch(getMaterii());
    dispatch(getProfesori());
    dispatch(getSettigs());

    const unsub = onSnapshot(doc(db, "clase", "clase"), (doc) => {
      dispatch(getClase());
    });
    const unsub2 = onSnapshot(collection(db, "materii"), (doc) => {
      dispatch(getMaterii());
    });
    const unsub8 = onSnapshot(collection(db, "anunturi"), (doc) => {
      dispatch(getAnunturi());
    });
    const unsub3 = onSnapshot(collection(db, "profesori"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          dispatch(getProfesori());
        } else if (change.type === "modified") {
          dispatch(getProfesori());
        } else if (change.type === "removed") {
          dispatch(getProfesori());
        }
      });
    });
    const unsub4 = onSnapshot(doc(db, "ani", "ani"), (doc) => {
      dispatch(getAni());
    });
    const unsub5 = onSnapshot(doc(db, "settings", "settings"), (doc) => {
      dispatch(getSettigs());
    });
    return () => {
      unsub();
      unsub4();
      unsub5();
      unsub2();
      unsub8();
      unsub3();
    };
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User

        const document = doc(db, "users", user.uid);

        const snap = await getDoc(document);

        if (snap) {
          let reset = snap.data().reset;

          if (reset === true) {
            return;
          }

          if (reset === true) {
            return;
          } else {
            if (
              !(
                snap.data().type === "admin" ||
                snap.data().type === "elevi" ||
                snap.data().type === "profesor" ||
                snap.data().type === "parinte"
              )
            ) {
              auth.signOut();
            }
            let dataUser = { ...user, ...snap.data() };

            if (snap.data().type === "elevi") {
              let data = await getDataDoc("elevi", user.uid);
              dataUser = { ...dataUser, ...data, id: user.id };
              data = await getDataDoc("claseData", dataUser?.clasa);
              dataUser = { ...dataUser, clasaMea: data };
            }
            if (snap.data().type === "profesor") {
              let data = await getDataDoc("profesori", user.uid);
              let mode = "one-way";

              if (dataUser?.copii?.length > 0) {
                mode = "hybrid";
              }
              dataUser = {
                ...user,
                ...dataUser,
                ...data,
                mode,
                copii: [],

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
              };
            }

            if (snap.data().type === "admin") {
              let data = await getDataDoc("profesori", user.uid);
              dataUser = {
                ...dataUser,
                ...data,
                ore: (data?.ore || []).map((el) => {
                  return {
                    ...el,
                    startDate: new Date(el.startDate),
                    endDate: new Date(el.endDate),
                  };
                }),
              };
            }
            if (snap.data().type === "parinte") {
              if (snap.data()?.copii?.length > 0) {
                let e = snap.data()?.copii[0].idElev;

                setElevChosen(e);
                let dataUser = user;

                let data = await getDataDoc("elevi", e);
                dataUser = { ...dataUser, ...data };
                data = await getDataDoc("claseData", dataUser?.clasa);
                dataUser = {
                  ...dataUser,
                  clasaMea: data,
                  type: "elevi",
                  mainType: "parinte",
                  altiCopii: snap.data()?.copii,
                  uid: e,
                  id: e,
                };
                dispatch(GET_USER({ ...dataUser }));
              } else dispatch(GET_USER({ ...dataUser }));
            } else dispatch(GET_USER({ ...dataUser }));
          }
        }
        // ...
      } else {
        // User is signed out
        dispatch(GET_USER(null));
        // ...
      }
    });
    return () => unsub();
  }, [userIp]);

  useEffect(() => {
    if (user)
      if (user?.type === "elevi" && chosenElev !== user.id)
        setElevChosen(user.id);
  }, [user]);

  const getDeviceInfo = () => {
    return {
      ip: userIp,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
    };
  };

  return (
    <>
      {user === null && <Login />}

      {user && (
        <Router>
          <div className="App">
            <Spin tip="Loading" size="large" spinning={loading}>
              <Layout
                style={{
                  minHeight: "100vh",
                }}
              >
                <Layout className="site-layout">
                  {user.type === "elevi" && <NavbarElev />}
                  {user.type === "admin" && <Navbar />}
                  {user.type === "profesor" && <NavbarProfesor />}

                  <Header
                    style={{
                      padding: 0,
                      background: colorBgContainer,
                    }}
                  />

                  <Content
                    style={{
                      margin: "0 16px",
                    }}
                  >
                    {" "}
                    <div className="layouy-app">
                      {user.mainType === "parinte" && (
                        <div>
                          <Alert
                            type="info"
                            message={
                              <div style={{}}>
                                {" "}
                                <p style={{ fontSize: "20px" }}>
                                  Vizionezi profilul:
                                </p>
                                <Select
                                  style={{
                                    width: "80vw",
                                    marginLeft: "20px",
                                  }}
                                  className="sentry-mask"
                                  value={chosenElev}
                                  onChange={async (e) => {
                                    setElevChosen(e);
                                    let dataUser = user;

                                    let data = await getDataDoc("elevi", e);
                                    dataUser = { ...dataUser, ...data };
                                    data = await getDataDoc(
                                      "claseData",
                                      dataUser?.clasa
                                    );
                                    dataUser = {
                                      ...dataUser,
                                      clasaMea: data,
                                      type: "elevi",
                                      mainType: "parinte",
                                      altiCopii: user?.altiCopii,
                                      uid: e,
                                      id: e,
                                    };
                                    dispatch(GET_USER({ ...dataUser }));
                                  }}
                                  options={user.altiCopii.map((el) => {
                                    return {
                                      label:
                                        el.numeDeFamilie + " " + el.prenume,
                                      value: el.idElev,
                                    };
                                  })}
                                />
                              </div>
                            }
                          />
                          <br />
                          <br />
                        </div>
                      )}

                      <Routes>
                        {user.type === "profesor" || user.type === "admin" ? (
                          <Route
                            path="/"
                            element={
                              <ProfesoriProtectedRoute>
                                <OrarProfesori profesorData={user} />
                              </ProfesoriProtectedRoute>
                            }
                          />
                        ) : (
                          user.type === "elevi" && (
                            <Route path="/" element={<OrarElev />} />
                          )
                        )}
                        <Route
                          path="/profile-elevi"
                          element={
                            <ProfesoriProtectedRoute>
                              <ProfileElevi />
                            </ProfesoriProtectedRoute>
                          }
                        />
                        <Route
                          path="/ajutor"
                          element={
                            <ProfesoriProtectedRoute>
                              <Ajutor />
                            </ProfesoriProtectedRoute>
                          }
                        />

                        <Route
                          path="/scutiri-elev"
                          element={
                            <EleviProtectedRoute>
                              <>
                                <br />

                                <h1>Scutiri</h1>
                                <br />
                                <Docs
                                  elevId={user?.uid}
                                  numeElev={user?.displayName}
                                  classId={user?.clasa}
                                  elevData={user}
                                  modeOf={"view"}
                                />
                              </>
                            </EleviProtectedRoute>
                          }
                        />

                        <Route
                          path="/statistici-clase"
                          element={
                            <ProfesoriProtectedRoute>
                              <StatisticiClase />
                            </ProfesoriProtectedRoute>
                          }
                        />
                        <Route
                          path="/statistici-scoala"
                          element={
                            <ProfesoriProtectedRoute>
                              <StatisticiScoala />
                            </ProfesoriProtectedRoute>
                          }
                        />

                        <Route path="/anunturi" element={<Anunturi />} />
                        <Route
                          path="/profesori"
                          element={
                            <ProfesoriProtectedRoute>
                              <Profesori />
                            </ProfesoriProtectedRoute>
                          }
                        />
                        <Route
                          path="/setari"
                          element={
                            <AdminProtectedRoute>
                              <Settings />
                            </AdminProtectedRoute>
                          }
                        />

                        <Route
                          path="/class/:id"
                          element={
                            <ProfesoriProtectedRoute>
                              <Class />
                            </ProfesoriProtectedRoute>
                          }
                        />
                        <Route path="/login" element={<Login />} />
                        <Route
                          path="/clase"
                          element={
                            <ProfesoriProtectedRoute>
                              <Clase />
                            </ProfesoriProtectedRoute>
                          }
                        />
                        <Route
                          path="/teme"
                          element={
                            <EleviProtectedRoute>
                              <TemeElevi />
                            </EleviProtectedRoute>
                          }
                        />
                        <Route
                          path="/elev-catalog"
                          element={
                            <EleviProtectedRoute>
                              <CatalogElev />
                            </EleviProtectedRoute>
                          }
                        />
                        <Route path="/profil" element={<Profil />} />
                        <Route
                          path="/elev/:id"
                          element={
                            <ProfesoriProtectedRoute>
                              <ElevPage />
                            </ProfesoriProtectedRoute>
                          }
                        />

                        <Route
                          path="/submisi-tema/:id"
                          element={
                            <ProfesoriProtectedRoute>
                              <Submisii />
                            </ProfesoriProtectedRoute>
                          }
                        />
                        <Route
                          path="/comentarii-elev"
                          element={
                            <EleviProtectedRoute>
                              <ComentariiElev />
                            </EleviProtectedRoute>
                          }
                        />

                        <Route
                          path="/scutiri"
                          element={
                            <AdminProtectedRoute>
                              <AdministratorScutiri />
                            </AdminProtectedRoute>
                          }
                        />
                        <Route
                          path="/stergeri-note"
                          element={
                            <AdminProtectedRoute>
                              <AdministratorStergeriNote />
                            </AdminProtectedRoute>
                          }
                        />
                        <Route
                          path="/changelog"
                          element={
                            <AdminProtectedRoute>
                              <ChangeLog />
                            </AdminProtectedRoute>
                          }
                        />
                        <Route
                          path="/lectii-elev"
                          element={
                            <EleviProtectedRoute>
                              <LectiiElev />
                            </EleviProtectedRoute>
                          }
                        />

                        <Route
                          path="/profesor/:id"
                          element={
                            <ProfesoriProtectedRoute>
                              <ProfesorPage />
                            </ProfesoriProtectedRoute>
                          }
                        />
                      </Routes>
                    </div>
                  </Content>
                </Layout>
              </Layout>
            </Spin>
          </div>
        </Router>
      )}
    </>
  );
}

export default App;
