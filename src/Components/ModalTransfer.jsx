import React, { useState, useRef, useEffect } from "react";
import { Modal } from "antd";
import Draggable from "react-draggable";
import { DatePicker, Space } from "antd";

import { InboxOutlined, UploadOutlined, PlusOutlined } from "@ant-design/icons";
import { DeleteOutlined } from "@ant-design/icons";
import {
  getDataDoc,
  updateDocDatabase,
  uploadFileDatabse,
} from "../database/index";
import { uploadBytes, ref } from "firebase/storage";
import dayjs from "dayjs";
import { storage } from "../database/firebase";
import { blobToFile, renderClassName } from "../utils";
import { Spin } from "antd";
import { getDownloadURL, getMetadata, listAll } from "firebase/storage";
import { openErrorNotification } from "./Notifications/errorNotification";
import { testSlice } from "../redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Checkbox,
  Col,
  Form,
  InputNumber,
  Radio,
  Input,
  Rate,
  Row,
  Select,
  Slider,
  Switch,
  Upload,
} from "antd";
const { Option } = Select;
const { RangePicker } = DatePicker;
const { actions } = testSlice;
const { GET_LOADING } = actions;
const { TextArea } = Input;
const formatDate = (today) => {
  const romaniaTime = new Date(
    today.toLocaleString("en-US", { timeZone: "Europe/Bucharest" })
  );

  const yyyy = romaniaTime.getFullYear();
  let mm = romaniaTime.getMonth() + 1; // Months start at 0!
  let dd = romaniaTime.getDate();
  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  return dd + "/" + mm;
};

function ModalTransfer({
  open,
  setOpen,
  elevId,
  docsElev,
  setDocsElev,
  mode = "view",
  setMode = () => {},
  clasaVeche = undefined,
  classId,
  numeElev,
  elevData,
  clasa,
  promiss,
  setClasa = () => {},
  id,
  idTransfer = undefined,
}) {
  const draggleRef = useRef(null);
  const [form] = Form.useForm();
  const user = useSelector((state) => state.user);
  const [fileList, setFileList] = useState([]);
  const [disabled, setDisabled] = useState(true);
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ranges, setRanges] = useState([[]]);
  const [selectedDate, setSelectedDate] = useState();
  const dispatch = useDispatch();
  const clase = useSelector((state) => state.clase);
  const formatDate = (today) => {
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;

    return dd + "/" + mm;
  };

  const onFinish = async (values) => {
    try {
      //lucram cu values.

      const transferTimeStamp = values.dataTransfer.toDate().getTime();

      let data = await getDataDoc("elevi", id);
      if (idTransfer)
        await updateDocDatabase("elevi", id, {
          transferuri: [
            ...(data.transferuri || [])
              .filter((a) => a.id !== idTransfer)
              .sort((a, b) => a.dataTransfer - b.dataTransfer),
            {
              clasaVeche: clasaVeche || elevData.clasa,
              clasaNoua: promiss,
              dataTransfer: transferTimeStamp,
              details: values.details,
              id: Date.now() + "id",
            },
          ],
        });
      else
        await updateDocDatabase("elevi", id, {
          transferuri: [
            ...(data.transferuri || [])
              .filter((a) => a.id !== idTransfer)
              .sort((a, b) => a.dataTransfer - b.dataTransfer),
            {
              clasaVeche: clasaVeche || elevData.clasa,
              clasaNoua: promiss,
              dataTransfer: transferTimeStamp,
              details: values.details,
              id: Date.now() + "id",
            },
          ],

          deleted: false,
          retras: false,
        });

      setClasa(promiss);
      setOpen(false);
    } catch (e) {
      openErrorNotification(e);
    }
  };

  const handleOk = async (e) => {
    setOpen(false);
  };
  const handleCancel = (e) => {
    form.resetFields();
    setOpen(false);
  };
  console.log(clasaVeche);
  useEffect(() => {
    if (selectedDate) {
      const formattedDate = dayjs(selectedDate).format("DD/MM/YYYY");
      form.setFieldsValue({
        details: `Din data de ${formattedDate}, elevul a fost transferat din clasa ${renderClassName(
          clase.find((c) => c.id === (clasaVeche || elevData.clasa))
        )} la clasa ${renderClassName(
          clase.find((c) => c.id === promiss)
        )}, conform cererii....`,
      });
    }
  }, [selectedDate]);
  return (
    <Modal
      title={
        <div
          style={{
            cursor: "move",
          }}
          onMouseOver={() => {
            if (disabled) {
              setDisabled(false);
            }
          }}
          onMouseOut={() => {
            setDisabled(true);
          }}
          // fix eslintjsx-a11y/mouse-events-have-key-events
          // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
          onFocus={() => {}}
          onBlur={() => {}}

          // end
        >
          Salvează transfer
        </div>
      }
      footer={null}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div>
        <Spin tip="Loading" size="large" spinning={loading} />
        {loading === false && (
          <Form
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 14 }}
            layout="horizontal"
            form={form}
            style={{ maxWidth: 600 }}
            onFinish={onFinish}
          >
            <Form.Item
              label="Data"
              rules={[{ required: true }]}
              name="dataTransfer"
            >
              <DatePicker
                format={"DD/MM/YYYY"}
                onChange={(date) => setSelectedDate(date)}
              />
            </Form.Item>

            <Form.Item
              label="Detalii"
              name="details"
              rules={[{ required: true }]}
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item wrapperCol={{ span: 20, offset: 15 }}>
              <Space>
                <Button
                  style={{ backgroundColor: "red", color: "white" }}
                  onClick={() => {
                    setOpen(false);
                    setMode(null);
                  }}
                >
                  Anuleaza
                </Button>

                <Button
                  htmlType="submit"
                  style={{ backgroundColor: "#1677FE", color: "white" }}
                >
                  Adaugă
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </div>
    </Modal>
  );
}

export default ModalTransfer;
