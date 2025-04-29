import React, { useState } from "react";
import { Modal, Form, Input, Button, Space, Spin, Checkbox } from "antd";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../database/firebase";
import {
  changeUserPasswordDatabase,
  updateDocDatabase,
} from "../database/index";
import { openErrorNotification } from "./Notifications/errorNotification";

function ModalChangePassword({ open, setOpen, email, id, setId }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [updateUserDoc, setUpdateUserDoc] = useState(false); // Bifa pentru a actualiza și Firestore

  // Funcție pentru a găsi UID-ul utilizatorului pe baza adresei de email

  const handleCancel = () => {
    form.resetFields();
    setOpen(false);
    setId("");
  };

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
  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 1️⃣ Căutăm `targetUserId` în Firestore pe baza `adresaEmail`
      const targetUserId = await getUserIdByEmail(email);
      const a = id || targetUserId;

      // 2️⃣ Apelăm funcția pentru schimbarea parolei
      if (values?.newPassword?.length >= 5)
        await changeUserPasswordDatabase(a, values.newPassword);

      // 3️⃣ Dacă bifa este activată, actualizăm documentul utilizatorului
      if (updateUserDoc) {
        await updateDocDatabase("users", a, { reset: true });
      } else {
        const userDocRef = doc(db, "users", a);
        await updateDocDatabase("users", a, { reset: false });
      }

      setOpen(false);
      setId("");
    } catch (error) {
      openErrorNotification(error.message || "Eroare la schimbarea parolei.");
    }
    setLoading(false);
  };

  return (
    <Modal
      title="Schimbare Parolă"
      open={open}
      onCancel={handleCancel}
      footer={null}
    >
      <Spin spinning={loading} tip="Se schimbă parola...">
        <h5 style={{ textAlign: "center" }}>{email}</h5>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ maxWidth: 400, margin: "0 auto" }}
        >
          <Form.Item
            label="Noua Parolă (min 5 caractere)"
            name="newPassword"
            rules={[]}
          >
            <Input.Password placeholder="Introduceți noua parolă" />
          </Form.Item>

          <Form.Item>
            <Checkbox
              checked={updateUserDoc}
              onChange={(e) => setUpdateUserDoc(e.target.checked)}
            >
              Solicită schimbarea parolei
            </Checkbox>
          </Form.Item>

          <Form.Item wrapperCol={{ span: 24 }}>
            <Space>
              <Button
                onClick={handleCancel}
                style={{ backgroundColor: "red", color: "white" }}
              >
                Anulează
              </Button>

              <Button
                htmlType="submit"
                style={{ backgroundColor: "#1677FE", color: "white" }}
              >
                Schimbă Parola
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}

export default ModalChangePassword;
