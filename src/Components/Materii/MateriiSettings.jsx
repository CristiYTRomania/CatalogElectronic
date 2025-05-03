import React, { useState, useEffect } from "react";
import { Button, Modal, Select, Input, Space, Collapse, Popover } from "antd";
import { Divider, Form, Checkbox, Tag, Switch } from "antd";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../database/firebase";
import AddMaterie from "./AddMaterie";
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
import { deleteDataDoc } from "../../database";
const { actions } = testSlice;
const { GET_ANI, ADD_MATERIE } = actions;
const OPTIONS = ["Apples", "Nails", "Bananas", "Helicopters"];
const { Panel } = Collapse;
function MateriiSettings({ open, setOpen, confirmLoading, setConfirmLoading }) {
  const materii = useSelector((state) => state.materii);

  const [addMaterieOk, setAddMaterieOk] = useState(false);

  const dispatch = useDispatch();

  const [openEdit, setOpenEdit] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);

  const [materieEdit, setMaterieEdit] = useState(false);

  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "20%",
      }}
    >
      <EditOutlined style={{ fontSize: "30px", color: "brown" }} />
      <DeleteOutlined style={{ fontSize: "30px", color: "red" }} />
    </div>
  );

  const handleCancel = () => {
    setOpen(false);
  };
  const genExtra = (materie) => (
    <div style={{ gap: "10px", display: "flex" }}>
      <EditOutlined
        style={{ color: "brown" }}
        onClick={(event) => {
          // If you don't want click extra trigger collapse, you can prevent this:
          setOpenEdit(true);
          setMaterieEdit(materie);

          event.stopPropagation();
        }}
      />

      <DeleteOutlined
        style={{ color: "red" }}
        onClick={async (event) => {
          await deleteDataDoc("materii", materie.id);

          event.stopPropagation();
        }}
      />
    </div>
  );
  return (
    <Modal
      title="Materii"
      open={open}
      onOk={() => {
        setOpen(false);
      }}
      confirmLoading={confirmLoading}
      onCancel={handleCancel}
    >
      <AddMaterie
        confirmLoading={confirmLoading}
        setConfirmLoading={setConfirmLoading}
        open={addMaterieOk}
        setOpen={setAddMaterieOk}
      />
      <EditMaterie
        setConfirmLoading={setConfirmEdit}
        setOpen={setOpenEdit}
        materie={materieEdit}
        open={openEdit}
        confirm={confirmEdit}
      />{" "}
      <br />
      <Button
        style={{ width: "100%" }}
        type="primary"
        onClick={() => {
          setAddMaterieOk(true);
        }}
      >
        Adaugă Materie
      </Button>
      <br />
      <br />
      <Collapse styled>
        {
          //e obiect
          materii.map((materie, index) => {
            return (
              <>
                <Panel
                  key={index}
                  index={0}
                  header={materie.numeMaterie + " - " + materie.profil}
                  extra={genExtra(materie)}
                >
                  <>
                    {" "}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        width: "100%",
                      }}
                    ></div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        width: "100%",

                        flexWrap: "wrap",
                      }}
                    >
                      {" "}
                    </div>
                    <br />
                  </>{" "}
                  <p>Profil: {materie.profil}</p>
                  <div className="swithcer">
                    {" "}
                    Tip de Notare: &nbsp;
                    <Switch
                      checkedChildren="Note"
                      unCheckedChildren="Calificativ"
                      defaultChecked
                      checked={
                        materie.notare === undefined ? true : materie.notare
                      }
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      width: "100%",

                      flexWrap: "wrap",
                    }}
                  >
                    <br />
                  </div>
                </Panel>
              </>
            );
          })
        }
      </Collapse>
    </Modal>
  );
}

export default MateriiSettings;
