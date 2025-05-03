import React, { useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { auth } from "../../database/firebase";
import { useDispatch } from "react-redux";
import { Modal } from "antd";
import dayjs from "dayjs";
import {
  Button,
  Cascader,
  TimePicker,
  Form,
  Popconfirm,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Divider,
  Switch,
} from "antd";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
import { updateDocDatabase } from "../../database";

function ModalSettingsProf({
  setOpen,
  open,
  confirmLoading,
  setConfirmLoading,
  profesorData,
  setProfesorData,
}) {
  const [startHour, setStartHour] = useState(15);
  const [endHour, setEndHour] = useState(20);

  const handleOk = async () => {
    try {
      setConfirmLoading(true);

      await updateDocDatabase("profesori", profesorData.id, {
        settings: {
          ...(profesorData.settings || {}),
          startHour,
          endHour,
        },
      });
      setConfirmLoading(false);
      setOpen(false);
      setProfesorData({
        ...profesorData,
        settings: {
          ...(profesorData.settings || {}),
          startHour,
          endHour,
        },
      });
    } catch (e) {
      openErrorNotification(e.message);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  useEffect(() => {
    setStartHour(profesorData?.settings?.startHour || "08");
    setEndHour(profesorData?.settings?.endHour || "15");
  }, [profesorData]);

  const format = "HH";

  return (
    <Modal
      title="Setari"
      open={open}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      onCancel={handleCancel}
    >
      <div style={{ display: "block", alignItems: "center", margin: "0" }}>
        Ora Start:{"   "}
        <TimePicker
          value={dayjs(startHour || "15", format)}
          onChange={(e, value) => {
            setStartHour(value);
          }}
          placeholder="Orar Start"
          format="HH"
        />
        <br />
        <br />
        Ora Final:{" "}
        <TimePicker
          value={dayjs(endHour || "20", format)}
          onChange={(e, value) => {
            setEndHour(value);
          }}
          placeholder="Orar Sfarsit"
          picker="hour"
          style={{ textAlign: "center" }}
          format="HH"
        />
      </div>
    </Modal>
  );
}

export default ModalSettingsProf;
