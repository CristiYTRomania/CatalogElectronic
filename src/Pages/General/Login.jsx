import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { Spin } from "antd";
import { httpsCallable } from "firebase/functions";
import { EyeOutlined } from "@ant-design/icons";
import "react-phone-number-input/style.css";
import { getAuth } from "firebase/auth";
import PhoneInput from "react-phone-number-input";
import { testSlice } from "../../redux/store";
import "./Login.css";
import axios from "axios"; // Im
import { Switch, Button } from "antd";
import { auth, db, functions } from "../../database/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
import { openSuccesNotification } from "../../Components/Notifications/succesNotification";
import {
  startEnrollMultiFactor,
  finishMfaSignIn,
  getMfaResolver,
  startMfaSignin,
  finishEnrollMultiFactor,
  updateDocDatabase,
} from "../../database";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
const { actions } = testSlice;
const { SESSION } = actions;

const Login = () => {
  const dispatch = useDispatch();
  const session = useSelector((state) => state.session);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepet, setPasswordRepet] = useState("");
  const [changePassword, setChangePassword] = useState("");
  const [userObject, setUser] = useState(null);
  const [mfaCode, setMfaCode] = useState("");
  const [ramanLogat, setRamanLogat] = useState(true);
  const [forgotPassword, setForgotPassword] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [sended, setSended] = useState(false);
  const [res, setRes] = useState(false);
  const [otp, setOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hideButton, setHideButton] = useState(false);
  const [introduCode, setIntroduCode] = useState(false);
  const [userIp, setUserIp] = useState("");
  const getUserIp = async () => {
    try {
      const response = await axios.get("https://api.ipify.org?format=json"); // Folosește un API pentru a obține IP-ul public
      setUserIp(response.data.ip);
    } catch (error) {
      console.error("Eroare la obținerea IP-ului:", error);
    }
  };
  useEffect(() => {
    getUserIp(); // Obține IP-ul când componenta este montată
  }, []);
  const handleLoginCode = async (e) => {
    e.preventDefault();

    try {
      const validateCodeFunction = httpsCallable(functions, "validateCode");
      const response = await validateCodeFunction({
        code: mfaCode,
        email: email,
      });
      console.log({ response });

      if (response.data.success === true) await onSubmit();
    } catch (err) {
      setMfaCode("");
    }
  };

  const onSubmit = async (_, again = false) => {
    if (!ramanLogat) {
      dispatch(SESSION({ ...session, dangerMode: true }));
      await setPersistence(auth, browserSessionPersistence).then(async () => {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );

          const user = userCredential.user;
          const document = doc(db, "users", user.uid);
          const snap = await getDoc(document);

          setUser(user);
          if (snap.exists()) {
            const data = snap.data();
            if (data.reset === true) {
              setRes(true);
              localStorage.setItem("sendEmail", "done");
              setIntroduCode(false);
            }
          }
        } catch (error) {
          console.log("Wtd");
          console.log(error);
          if (error.code === "auth/internal-error") {
            console.log(error);
            setIntroduCode(true);
          } else {
            openErrorNotification(error.message);
          }
        }
      });
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        const user = userCredential.user;
        const document = doc(db, "users", user.uid);
        const snap = await getDoc(document);

        setUser(user);
        if (snap.exists()) {
          const data = snap.data();
          if (data.reset === true) {
            setRes(true);
            localStorage.setItem("sendEmail", "done");
            setIntroduCode(false);
          }
        }
      } catch (error) {
        console.log("Wtd");
        console.log(error.code);
        if (error.code === "auth/internal-error") {
          setIntroduCode(true);
        } else {
          openErrorNotification(error.message);
        }
      }
    }
  };

  const changePasswordFunc = async (e) => {
    e.preventDefault();
    if (passwordRepet !== changePassword) {
      openErrorNotification("Passwords do not match");
      return;
    }
    try {
      await updatePassword(userObject, changePassword);
      setRes(false);
      const document = doc(db, "users", userObject.uid);
      await updateDocDatabase("users", userObject.uid, { reset: false });
      signOut(auth);
      window.location.reload();
    } catch (error) {
      openErrorNotification(error.message);
    }
  };

  const setChangePasswordLink = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setSended(true);
    } catch (error) {
      openErrorNotification(error.message);
    }
  };

  return (
    <>
      <div className="limiter">
        <div
          className="container-login100"
          style={{
            backgroundImage: `url('/photo.jpg')`,
          }}
        >
          <div className="wrap-login100">
            <div
              className="login100-pic js-tilt"
              data-tilt
              style={{ paddingTop: "5%" }}
            >
              <img src={"/logo.png"} alt="IMG" width="200px" height="200px" />
            </div>

            {forgotPassword ? (
              <form className="login100-form validate-form">
                <span className="login100-form-title">Resetează Parola</span>
                {!sended ? (
                  <>
                    <div
                      className="wrap-input100 validate-input"
                      data-validate="Valid email is required: ex@abc.xyz"
                    >
                      <input
                        className="input100"
                        type="text"
                        name="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <span className="focus-input100"></span>
                      <span className="symbol-input100">
                        <i className="fa fa-envelope" aria-hidden="true"></i>
                      </span>
                    </div>
                    <div className="container-login100-form-btn">
                      <button
                        className="login100-form-btn"
                        onClick={setChangePasswordLink}
                      >
                        Schimbă parola
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    className="wrap-input100 validate-input"
                    data-validate="Valid email is required: ex@abc.xyz"
                  >
                    Ti-am trimis un email, continua de acolo
                    <span className="focus-input100"></span>
                    <span className="symbol-input100">
                      <i className="fa fa-envelope" aria-hidden="true"></i>
                    </span>
                  </div>
                )}
                <div
                  className="text-center p-t-12"
                  style={{ textAlign: "center" }}
                >
                  <span
                    className="txt1"
                    onClick={() => setForgotPassword(false)}
                  >
                    Ai uitat parola?
                  </span>
                </div>
              </form>
            ) : (
              <>
                {introduCode && (
                  <form className="login100-form validate-form">
                    <span className="login100-form-title">
                      Introdu codul primit in email
                    </span>
                    <div
                      className="wrap-input100 validate-input"
                      style={{
                        justifyContent: "center",
                        margin: "auto",
                        display: "flex",
                        textAlign: "center",
                      }}
                    >
                      <input
                        type="text"
                        name="mfaCode"
                        className="input100"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        placeholder="Cod Email"
                        pattern="^[0-9]*$"
                        required
                      />
                    </div>
                    <div className="container-login100-form-btn">
                      {loading === false && (
                        <button
                          id="login-btn"
                          className="login100-form-btn"
                          onClick={async (e) => {
                            setLoading(true);
                            await handleLoginCode(e);
                            setLoading(false);
                          }}
                        >
                          Verifica cod
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {!res && !introduCode && (
                  <div className="login100-form validate-form">
                    <span className="login100-form-title">
                      Intră în catalog
                    </span>
                    {hideButton === false && (
                      <div>
                        <div
                          className="wrap-input100 validate-input"
                          data-validate="Valid email is required: ex@abc.xyz"
                        >
                          <input
                            className="input100"
                            type="text"
                            name="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                          <span className="focus-input100"></span>
                          <span className="symbol-input100">
                            <i
                              className="fa fa-envelope"
                              aria-hidden="true"
                            ></i>
                          </span>
                        </div>
                        <div
                          className="wrap-input100 validate-input"
                          data-validate="Password is required"
                        >
                          <input
                            className="input100"
                            type={showPassword ? "text" : "password"}
                            name="pass"
                            placeholder="Parola"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />

                          <Button
                            style={{
                              position: "absolute",
                              top: "5px",
                              right: "20px",
                            }}
                            onClick={() => setShowPassword(!showPassword)}
                            icon={<EyeOutlined />}
                          />
                          <span className="focus-input100"></span>
                          <span className="symbol-input100">
                            <i className="fa fa-lock" aria-hidden="true"></i>
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            margin: "auto",
                            justifyContent: "center",
                          }}
                        >
                          <Switch
                            checkedChildren="Retine contul"
                            unCheckedChildren="Nu retine contul"
                            checked={ramanLogat}
                            onChange={(e) => setRamanLogat(e)}
                          />
                        </div>
                        {ramanLogat === false && (
                          <p style={{ paddingTop: "3px", color: "red" }}>
                            Atenție! Veți fi deconectat la 3 min. de neactiviate
                          </p>
                        )}
                      </div>
                    )}
                    <div className="container-login100-form-btn">
                      {loading === false && (
                        <button
                          className="login100-form-btn"
                          id="login-btn"
                          onClick={async (e) => {
                            setLoading(true);
                            await onSubmit(e);
                            setLoading(false);
                          }}
                        >
                          Intra in cont
                        </button>
                      )}

                      <div
                        id="2fa-captcha"
                        style={{ display: "flex", justifyContent: "center" }}
                      ></div>
                    </div>

                    <div
                      id="recaptcha"
                      style={{ display: auth.currentUser ? "none" : "block" }}
                    />

                    <div
                      className="text-center p-t-12"
                      style={{ textAlign: "center" }}
                    >
                      <span
                        className="txt1"
                        onClick={() => setForgotPassword(true)}
                      >
                        Ai uitat parola?
                      </span>
                    </div>
                  </div>
                )}
                {res && !introduCode && (
                  <form className="login100-form validate-form">
                    <span className="login100-form-title">
                      Alege noua parolă
                    </span>
                    <div
                      className="wrap-input100 validate-input"
                      data-validate="Valid email is required: ex@abc.xyz"
                    >
                      <input
                        className="input100"
                        type="password"
                        name="password"
                        placeholder="Parola"
                        value={changePassword}
                        onChange={(e) => setChangePassword(e.target.value)}
                      />
                      <span className="focus-input100"></span>
                      <span className="symbol-input100">
                        <i className="fa fa-envelope" aria-hidden="true"></i>
                      </span>
                    </div>
                    <div
                      className="wrap-input100 validate-input"
                      data-validate="Password is required"
                    >
                      <input
                        className="input100"
                        type="password"
                        name="pass"
                        placeholder="Repeta parola"
                        value={passwordRepet}
                        onChange={(e) => setPasswordRepet(e.target.value)}
                      />
                      <span className="focus-input100"></span>
                      <span className="symbol-input100">
                        <i className="fa fa-lock" aria-hidden="true"></i>
                      </span>
                    </div>
                    <div className="container-login100-form-btn">
                      <button
                        className="login100-form-btn"
                        onClick={changePasswordFunc}
                      >
                        Schimbă parola
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
