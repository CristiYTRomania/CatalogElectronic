import React, { useState, useEffect } from "react";
import { Modal, Button } from "antd";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../database/firebase"; // Importă inițializarea Firebase
import { useSelector, useDispatch } from "react-redux";
import { testSlice } from "../redux/store";
import axios from "axios"; // Importă axios pentru a face cererea HTTP
import FingerprintJS from "@fingerprintjs/fingerprintjs";
const { actions } = testSlice;
const { GET_USER, SESSION } = actions;
const TrustDeviceModal = ({ isModalVisible, setIsModalVisible }) => {
  const user = useSelector((state) => state.user);
  const fpPromise = FingerprintJS.load();
  const dispatch = useDispatch();

  // Funcție pentru a deschide modalul
  const showModal = () => {
    setIsModalVisible(true);
  };

  // Funcție pentru a închide modalul
  const handleCancel = () => {
    dispatch(GET_USER({ ...user, trusted: true }));
    setIsModalVisible(false);
  };

  // Funcție pentru a marca dispozitivul ca fiind de încredere
  const markDeviceAsTrusted = async () => {
    if (user) {
      try {
        let deviceInfo = await fpPromise
          .then((fp) => fp.get())
          .then((result) => {
            // Identificator unic
            const visitorId = result.visitorId;
            return result.visitorId;
          });

        // Actualizează documentul utilizatorului în Firebase
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          // trustedDevices: arrayUnion(deviceInfo),
        });

        dispatch(GET_USER({ ...user, trusted: true }));
        setIsModalVisible(false);
      } catch (error) {
        console.error(
          "Eroare la actualizarea dispozitivului de încredere:",
          error
        );
      }
    }
  };

  // Funcție pentru a obține informațiile despre dispozitiv (browser, platformă etc.)

  return (
    <>
      <Modal
        open={isModalVisible}
        title="Dispozitiv de încredere"
        visible={isModalVisible}
        onOk={markDeviceAsTrusted}
        onCancel={handleCancel}
        okText="Da, este de încredere"
        cancelText="NU!"
      >
        <h3>Dorești să marchezi acest dispozitiv ca fiind de încredere?</h3>
        <p style={{ color: "red" }}>
          Marcand acest device ca fiind de incredere nu se va solicita
          autentificarea pe acest dizpozitiv și nici codul din email
        </p>
      </Modal>
    </>
  );
};

export default TrustDeviceModal;
