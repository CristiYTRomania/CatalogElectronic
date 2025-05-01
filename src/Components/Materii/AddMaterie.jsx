import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Select,
  Input,
  Space,
  Collapse,
  Popover,
  Switch,
} from "antd";
import { Divider, Form, Checkbox, Tag } from "antd";
import { doc, setDoc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../database/firebase";
import { useSelector, useDispatch } from "react-redux";
import { getMaterii } from "../../redux/actions";
import {
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { testSlice } from "../../redux/store";
import { openErrorNotification } from "../Notifications/errorNotification";
import { PlusOutlined } from "@ant-design/icons";
import EditMaterie from "./EditMaterie";
import { updateDocDatabase } from "../../database";
const { actions } = testSlice;
const { GET_ANI, ADD_MATERIE } = actions;
const OPTIONS = ["Apples", "Nails", "Bananas", "Helicopters"];
const { Panel } = Collapse;
function MateriiSettings({ open, setOpen, confirmLoading, setConfirmLoading }) {
  const profesori = useSelector((state) => state.profesori);
  const [selectedProfesori, setSelectedProfesori] = useState([]);
  const colors = ["red", "teal", "grey", "yellow", "orage", "purple"];
  const materii = useSelector((state) => state.materii);
  const [anClasa, setAnClasa] = useState("");
  const dispatch = useDispatch();
  const [identificator, setIdentificator] = useState("");
  const [numeMaterie, setNumeMaterie] = useState("");
  const [profil, setProfil] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [notare, setNotare] = useState(true);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [materieEdit, setMaterieEdit] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const [teza, setTeza] = useState(false);

  const handleOk = async () => {
    setConfirmLoading(true);
    let id = Date.now();
    try {
      await updateDocDatabase("materii", numeMaterie + "#" + id, {
        numeMaterie: numeMaterie,

        id: numeMaterie + "#" + id,
        teza,
        profil,
        notare,
        color: materii.length + 1,
      });
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
      title="Adaugă Materie"
      open={open}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      onCancel={handleCancel}
    >
      <EditMaterie
        setConfirmLoading={setConfirmEdit}
        setOpen={setOpenEdit}
        materie={materieEdit}
        open={openEdit}
        confirm={confirmEdit}
      />
      <Form
        labelCol={{
          span: 5,
        }}
        wrapperCol={{
          span: 18,
        }}
        onValuesChange={() => {}}
      >
        <Form.Item label="Nume Materie">
          <Input
            placeholder="Nume Materie"
            value={numeMaterie}
            onChange={(e) => {
              setNumeMaterie(e.target.value);
            }}
          />
        </Form.Item>
        <Form.Item label="Notare">
          Tip de Notare: &nbsp;
          <Switch
            checkedChildren="Note"
            unCheckedChildren="Calificativ"
            defaultChecked
            checked={notare === undefined ? true : notare}
            onChange={(e) => {
              setNotare(e);
            }}
          />
        </Form.Item>
        <Form.Item label="Profil">
          <Input
            value={profil}
            onChange={(e) => {
              setProfil(e.target.value);
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default MateriiSettings;
