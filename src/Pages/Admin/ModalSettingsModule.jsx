import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Select,
  Input,
  Space,
  Collapse,
  Popover,
  Popconfirm,
  Switch,
} from "antd";
import { Divider, Form, Checkbox, Tag } from "antd";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../database/firebase";

import { useSelector, useDispatch } from "react-redux";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { updateDocDatabase } from "../../database";

function ModalSettingsModule({
  open,
  setOpen,
  confirmLoading,
  setConfirmLoading,
}) {
  const handleCancel = () => {
    setOpen(false);
  };
  const [adauga, setAdauga] = useState(false);
  const settings = useSelector((state) => state.settings);
  return (
    <Modal
      title="Module"
      open={open}
      onOk={() => {
        setOpen(false);
      }}
      confirmLoading={confirmLoading}
      onCancel={handleCancel}
    >
      <Popconfirm
        title="Adaugi Modul?"
        onConfirm={() => {
          updateDocDatabase("settings", "settings", {
            module: [
              ...(settings.module || []).map((el) => {
                return {
                  ...el,
                  open: false,
                };
              }),
              { modul: settings.module.length + 1, open: true },
            ],
          });
        }}
        onCancel={() => {}}
      >
        <Button>Adaugă Modul</Button>
      </Popconfirm>
      <br />
      <br />
      {[...settings.module]
        ?.sort((a, b) => {
          if (a.modul < b.modul) {
            return -1;
          }
          if (a.modul > b.modul) {
            return 1;
          }
          return 0;
        })
        .map((modul) => {
          return (
            <>
              {" "}
              <Space>
                <h5>Modul {modul.modul}</h5>
                <Switch
                  checkedChildren="Modul Activ"
                  unCheckedChildren="Modul Incheiat"
                  checked={modul.open}
                  onChange={async (e) => {
                    await updateDocDatabase("settings", "settings", {
                      module: [
                        ...settings.module.filter(
                          (mod) => mod.modul !== modul.modul
                        ),
                        {
                          ...modul,
                          open: e,
                        },
                      ],
                    });
                  }}
                />
              </Space>
              <br />
              <br />
            </>
          );
        })}
    </Modal>
  );
}

export default ModalSettingsModule;
