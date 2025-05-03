import React, { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import {
  Button,
  Cascader,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Divider,
  Switch,
} from "antd";
import { openSuccesNotification } from "../../Components/Notifications/succesNotification";
import { useDispatch, useSelector } from "react-redux";
import { testSlice } from "../../redux/store";
import { db } from "../../database/firebase";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
import Clase from "./Clase";
import { PhotoLinks } from "../../utils";
import { updateDocDatabase } from "../../database";
const { actions } = testSlice;
const { GET_ANI, GET_CLASE } = actions;
function AddClass({
  setOpen,
  open,
  confirmLoading,
  setConfirmLoading,
  materiiDefault = [],
  pregatiriDefault = [],
  liceuDefault = "",
  numeDeFamilieDefault = "",
  prenumeDefault = "",
  anDefault = "",
  ziDefault = "",
  typeFacturaDefault = "fizica",
  lunaDefault = "",
  localitateDefault = "",
  clasaDefault = "",
  meditatiiDefault = [],
  numeFirmaDefault = "",
  cifFirmaDefault = "",
  numarRegComDefault = "",
  numeFacturaDefault = "",
  numarTelefonDefault = "",
  adresaEmailDafault = "",
  serieBuletinFacturaDefault = "",
  orasFacturaDefault = "",
  stradaFacturaDefault = "",
  numarBuletinFacturaDefault = "",
  numarAdresaFacturaDefault = "",
  blocFacturaDefault = "",
  apartamentFacturaDefault = "",
  judetFacturaDefault = "",
  facturiNeplatite = [],
  sedinteNeplatite = [],
  cnpDefault = "",
  numarFacturi = 0,
  contDefault = 0,
  numarMatricolDefault = "",
  id = "",
  comentariiDefault = "",
  parintiDefault = [],
}) {
  const [anClasa, setAnClasa] = useState("");
  const dispatch = useDispatch();
  const profesori = useSelector((state) => state.profesori);
  const [identificator, setIdentificator] = useState("");
  const [newClasa, setNewClasa] = useState("");
  const clase = useSelector((state) => state.clase);
  const [diriginte, setDiriginte] = useState("");
  const ani = useSelector((state) => state.ani);

  const handleOk = async () => {
    setConfirmLoading(true);
    if (anClasa.length === 0 || identificator.length === 0)
      openErrorNotification("Completeaza tot");
    let nr = clase.length + 1;
    let id = "Clasa" + Date.now();
    try {
      await updateDocDatabase(
        "clase",
        "clase",
        {
          clase: [
            ...clase,
            {
              anClasa,
              identificator,
              diriginte,
              poza: nr,
              id,
            },
          ],
        },
        { merge: true }
      );

      await updateDocDatabase("ani", ani, { ani: ani });
      await updateDocDatabase("claseData", id, {
        anClasa,
        identificator,
        diriginte,
        settings: { startHour: "08", endHour: "15" },
        poza: nr,
        id,
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
      title="Adaugă Clasa"
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
        <Form.Item label="An Clasa">
          <Select
            style={{}}
            placeholder="An Clasa"
            value={anClasa}
            onChange={(e) => {
              setAnClasa(e);
            }}
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: "8px 0" }} />
                <Space style={{ padding: "0 8px 4px" }}>
                  <Input
                    placeholder="An"
                    value={newClasa}
                    onChange={(e) => {
                      setNewClasa(e.target.value);
                    }}
                  />
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      dispatch(GET_ANI([newClasa, ...ani]));
                    }}
                  >
                    Adaug an
                  </Button>
                </Space>
              </>
            )}
            options={ani.map((item) => ({
              label: item,
              value: item,
            }))}
          />
        </Form.Item>
        <Form.Item label="Identificator">
          <Input
            value={identificator}
            onChange={(e) => {
              setIdentificator(e.target.value);
            }}
          />
        </Form.Item>
        <Form.Item label="Dir./Inv.">
          <Select
            showSearch
            style={{ width: 200 }}
            placeholder="Diriginte/Invatator:"
            optionFilterProp="children"
            value={diriginte}
            onChange={(value) => {
              setDiriginte(value);
            }}
            filterOption={(input, option) =>
              (option?.label?.toLowerCase() ?? "").includes(
                input?.toLowerCase()
              )
            }
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
            options={profesori.map((prof) => {
              return {
                label: prof.numeDeFamilie + " " + prof.prenume,
                value: prof.id,
              };
            })}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AddClass;
