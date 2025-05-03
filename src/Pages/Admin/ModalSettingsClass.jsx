import React, { useEffect, useState } from "react";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { auth } from "../../database/firebase";
import { useDispatch } from "react-redux";
import { Modal } from "antd";
import dayjs from "dayjs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
import { useSelector } from "react-redux";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
import { deleteDataDoc, getDataDoc, updateDocDatabase } from "../../database";
import { initializeApp } from "firebase/app";
import { testSlice } from "../../redux/store";
import { useNavigate } from "react-router-dom";
import { SortableItem } from "./SortableItemMaterie";
const { actions } = testSlice;
const { GET_CLASE } = actions;
const { TextArea } = Input;
function ModalSettingsClasa({
  setOpen,
  open,
  confirmLoading,
  setConfirmLoading,
  clasa,
  setClassData,
}) {
  const [startHour, setStartHour] = useState(15);
  const [endHour, setEndHour] = useState(20);
  const user = useSelector((state) => state.user);
  const [diriginte, setDiriginte] = useState("");
  const profesori = useSelector((state) => state.profesori);
  const materiiRedux = useSelector((state) => state.materii);
  const [materii, setMaterii] = useState([]);
  const [diriginteAcces, setDiriginteAcces] = useState(false);
  const [dupaTermen, setDupaTermen] = useState(false);
  const [freeze, setFreeze] = useState(false);
  const clase = useSelector((state) => state.clase);
  const [diriginte_step, setDiriginte_step] = useState("N/A");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleOk = async () => {
    try {
      setConfirmLoading(true);

      await updateDocDatabase("claseData", clasa?.id, {
        settings: {
          ...clasa.settings,
          startHour,
          endHour,
        },
        diriginte,
        diriginteAcces,
        dupaTermen,
        freeze,
        diriginte_step: diriginte_step || "N/A",
        materii,
      });
      setConfirmLoading(false);
      setOpen(false);

      let ClasaArray = clase.find((cls) => cls?.id === clasa?.id);

      await updateDocDatabase("clase", "clase", {
        clase: [
          ...clase.filter((cls) => cls?.id !== clasa?.id),
          {
            ...ClasaArray,
            diriginte,
            diriginte_step,
            diriginteAcces,
            freeze,
            dupaTermen,
          },
        ],
      });

      let now = new Date();
      let onejan = new Date(now.getFullYear(), 0, 1);
      let week = Math.ceil(
        ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) /
          7
      );

      await updateDocDatabase("mail", "changeclas" + String(Date.now()), {
        to: ["catalog@dobriceansoftware.com", "dobriceanionut1408@gmail.com"],
        message: {
          subject:
            "A fost schimbata setarea clasei " +
            clasa?.anClasa +
            " " +
            clasa?.identificator,

          text: user?.displayName + " " + user?.id + " " + user?.uid,
        },
      });
    } catch {}
  };

  const handleCancel = () => {
    setOpen(false);
  };

  useEffect(() => {
    setStartHour(clasa?.settings?.startHour || "08");
    setEndHour(clasa?.settings?.endHour || "15");
    setDiriginte(clasa?.diriginte);
    setDiriginte_step(clasa?.diriginte_step || "N/A");
    setDiriginteAcces(clasa?.diriginteAcces || false);
    setDupaTermen(clasa?.dupaTermen || false);
    setFreeze(clasa?.freeze || false);
    setMaterii(clasa?.materii || []);
  }, [clasa]);

  const confirm = async () => {
    try {
      dispatch(GET_CLASE(clase.filter((cls) => cls.id !== clasa.id)));
      await updateDocDatabase("mail", "changeclas" + String(Date.now()), {
        to: ["catalog@dobriceansoftware.com", "dobriceanionut1408@gmail.com"],
        message: {
          subject:
            "A fost stearsa setarea clasei " +
            clasa?.anClasa +
            " " +
            clasa?.identificator,

          text: user?.displayName + " " + user?.id + " " + user?.uid,
        },
      });
      let dataClass = await getDataDoc("claseData", clasa.id);
      for await (let ora of dataClass.ore || []) {
        let profDoc = await getDataDoc("profesori", ora.profId);
        await updateDocDatabase("profesori", ora.profId, {
          ore: (profDoc.ore || []).filter((o) => o.classId !== clasa.id),
        });
      }
      updateDocDatabase("clase", "clase", {
        clase: clase.filter((cls) => cls.id !== clasa.id),
      });
      for await (let elev of clasa.elevi || []) {
        await updateDocDatabase("elevi", elev.id, {
          clasa: "faraclasa",
        });
      }
      let dataOfNone = await getDataDoc("claseData", "faraclasa");
      await updateDocDatabase("claseData", "faraclasa", {
        elevi: [...dataOfNone.elevi, ...clasa.elevi],
      });

      deleteDataDoc("claseData", clasa.id);
      navigate("/clase");
    } catch {}
  };

  const format = "HH";
  function handleDragEnd(event) {
    const { active, over } = event;
    console.log(active, over, active.id !== over?.id);
    if (active && over && active.id !== over?.id) {
      setMaterii((materii) => {
        const oldIndex = materii.map((m, index) => index).indexOf(active.id);
        const newIndex = materii.map((m, index) => index).indexOf(over.id);

        return arrayMove(materii, oldIndex, newIndex);
      });
    }
  }
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  return (
    <Modal
      title="Setări"
      open={open}
      onOk={handleOk}
      width={1000}
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
        <br />
        <br />
        <Switch
          checkedChildren="Diriginte/Administratorii are acces la toate rubriciie"
          unCheckedChildren="Dirigintele nu are acces la toate rubriciie"
          checked={diriginteAcces}
          onChange={(e) => setDiriginteAcces(e)}
        />
        <br />
        <br />
        <Switch
          checkedChildren="Permite trecerea de note dupa 3 saptamani"
          unCheckedChildren="Nu permite trecerea de note dupa 3 saptamani"
          checked={dupaTermen}
          onChange={(e) => setDupaTermen(e)}
        />
        <br />
        <br />
        <Switch
          checkedChildren="Clasa este inchisa"
          unCheckedChildren="Clasa este deschisa"
          checked={freeze}
          onChange={(e) => setFreeze(e)}
        />
        <br />
        <br />
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
              (option?.label.toLowerCase() ?? "").includes(input?.toLowerCase())
            }
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
            options={profesori.map((prof) => {
              return {
                label: prof?.numeDeFamilie + " " + prof?.prenume,
                value: prof?.id,
              };
            })}
          />
          <Select
            showSearch
            style={{ width: 200 }}
            placeholder="Diriginte/Invatator:"
            optionFilterProp="children"
            value={diriginte_step}
            onChange={(value) => {
              setDiriginte_step(value);
            }}
            filterOption={(input, option) =>
              (option?.label.toLowerCase() ?? "").includes(input?.toLowerCase())
            }
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? "")
                .toLowerCase()
                .localeCompare((optionB?.label ?? "").toLowerCase())
            }
            options={[
              { label: "N/A", value: "N/A" },
              ...profesori.map((prof) => {
                return {
                  label: prof?.numeDeFamilie + " " + prof?.prenume,
                  value: prof?.id,
                };
              }),
            ]}
          />
        </Form.Item>
        <Form.Item label="Materii">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={materii.map((m, index) => index)}
              strategy={verticalListSortingStrategy}
            >
              {materii.map((materie, index) => {
                return (
                  <SortableItem
                    key={index}
                    id={index}
                    materie={materie}
                    materii={materii}
                    setMaterii={setMaterii}
                    materiiRedux={materiiRedux}
                    profesori={profesori}
                    index={index}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
          <Button
            onClick={() => {
              setMaterii([...materii, { materie: "" }]);
            }}
          >
            <PlusOutlined />
          </Button>
        </Form.Item>
        <br />
        <br />
        <Popconfirm
          title="Sterge Clasa"
          description="Esti sigur ca vrei sa stergi clasa?"
          onConfirm={confirm}
          okText="Da"
          cancelText="Nu"
        >
          <Button danger>Sterge Clasa</Button>
        </Popconfirm>
      </div>
    </Modal>
  );
}

export default ModalSettingsClasa;
