import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import { Button, Modal } from "antd";
import { deleteDataDoc, updateDocDatabase } from "../../database";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import {
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Input, DatePicker, Upload, Form } from "antd";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
import { uploadFileDatabse } from "../../database";
import { downloadFolderAsZip } from "../../database";
import AdaugaAnunt from "./AdaugaAnunt";
function ShowAnunt({ open, setIsModalOpen, anunt }) {
  const anunturi = [];
  const { TextArea } = Input;
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  const formatDate = (today) => {
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;

    return dd + "/" + mm;
  };
  const [Titlu, setTiltu] = useState("");
  const [text, setText] = useState("");
  const user = useSelector((state) => state.user);
  const [openModal, setOpenModal] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [date, setDate] = useState(dayjs(new Date()));
  const [updated, setIsUpdated] = useState(false);
  const dateFormat = "DD/MM/YYYY";
  const handleOk = async () => {
    let id = parseInt(Date.now()).toString();
    await uploadFileDatabse(
      fileList.map((f) => {
        return f.originFileObj;
      }),
      "anunturi" + id.toString()
    );
    if (!Titlu?.length > 0) {
      openErrorNotification("Titlul este obligatoriu");
      return;
    }
    if (!Titlu?.length > 0) {
      openErrorNotification("Titlul este obligatoriu");
      return;
    }
    await updateDocDatabase("anunturi", id, {
      anunt: {
        id: id,
        date: date.valueOf(),
        tiltlu: Titlu,
        text: text,
      },
    });
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <Modal
      title={formatDate(new Date(anunt?.date))}
      open={open}
      onOk={handleCancel}
      onCancel={handleCancel}
      footer={[
        user.subType === "director" &&
          user.type === "admin" && [
            <Button
              icon={<DeleteOutlined />}
              onClick={async () => {
                await deleteDataDoc("anunturi", anunt.id);
                setIsModalOpen(false);
              }}
            />,
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setOpenModal(true);
              }}
            />,
          ],
      ]}
    >
      <AdaugaAnunt
        open={openModal}
        setIsModalOpen={setOpenModal}
        mode="edit"
        anunt={anunt}
      />
      <div style={{ textAlign: "center" }}>
        <h1>{anunt?.tiltlu}</h1>
        <br />
        <Input.TextArea
          style={{
            backgroundColor: "#F5F5F5",
            width: "90%",
            height: "300px",
            fontSize: "15px",
          }}
          height="200px"
          value={anunt?.text}
          rows="10"
        ></Input.TextArea>
        <br />
        <br />
        {anunt?.download && (
          <Button
            onClick={() => {
              downloadFolderAsZip(
                "anunturi" + anunt.id,
                "anunt_" + anunt.tiltlu
              );
            }}
          >
            Descarca
          </Button>
        )}
      </div>
    </Modal>
  );
}
export default ShowAnunt;
