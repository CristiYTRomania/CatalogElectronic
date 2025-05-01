import React, { useEffect, useState } from "react";
import { Button, Modal, Select, Input, Space, Collapse, Popover } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../database/firebase";
import { openErrorNotification } from "../Notifications/errorNotification";
import { testSlice } from "../../redux/store";
import { Divider, Form, Checkbox, Tag, Switch } from "antd";
import { updateDocDatabase } from "../../database";
const { actions } = testSlice;
const { GET_ANI, ADD_MATERIE } = actions;
const OPTIONS = ["Apples", "Nails", "Bananas", "Helicopters"];

function EditMaterie({
  materie,
  open,
  setOpen,
  confirmLoading,
  setConfirmLoading,
}) {
  const profesori = useSelector((state) => state.profesori);
  const [selectedProfesori, setSelectedProfesori] = useState([]);
  const colors = ["red", "teal", "grey", "yellow", "orage", "purple"];
  const materii = useSelector((state) => state.materii);
  const [anClasa, setAnClasa] = useState("");
  const dispatch = useDispatch();
  const [identificator, setIdentificator] = useState("");
  const [numeMaterie, setNumeMaterie] = useState(materie?.numeMaterie || "");
  const [profil, setProfil] = useState(materie?.profil || "");
  const [id, setIdMaterie] = useState(materie?.id || "");
  const [selectedItems, setSelectedItems] = useState([]);
  const filteredOptions = OPTIONS.filter((o) => !selectedItems.includes(o));

  const [teza, setTeza] = useState(materie?.teza || false);
  const clase = useSelector((state) => state.clase);
  const [diriginte, setDiriginte] = useState("");
  const [notare, setNotare] = useState(true);
  const ani = useSelector((state) => state.ani);
  const handleCancel = () => {
    setOpen(false);
  };

  useEffect(() => {
    setNumeMaterie(materie?.numeMaterie || "");
    setProfil(materie?.profil || "");
    setIdMaterie(materie?.id || "");
    setTeza(materie?.teza || "");
    setNotare(materie?.notare === undefined ? true : materie?.notare);
  }, [materie]);
  const handleOk = async () => {
    setConfirmLoading(true);

    try {
      await updateDocDatabase("materii", id, {
        numeMaterie: numeMaterie,
        teza,
        profil,
        notare,
        id,
      });
    } catch (e) {
      openErrorNotification(e.toString());
    }
    setConfirmLoading(false);
    setOpen(false);
  };
  return (
    <Modal
      title="Editeaza Materie"
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

export default EditMaterie;
