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
import { blobToFile } from "../utils";
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

function ModalAddDocument({
  open,
  setOpen,
  elevId,
  docsElev,
  setDocsElev,
  mode = "view",
  setMode,
  classId,
  numeElev,
}) {
  const draggleRef = useRef(null);
  const [form] = Form.useForm();
  const user = useSelector((state) => state.user);
  const [fileList, setFileList] = useState([]);
  const [disabled, setDisabled] = useState(true);
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ranges, setRanges] = useState([[]]);
  const dispatch = useDispatch();
  const formatDate = (today) => {
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;

    return dd + "/" + mm;
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };
  const onFinish = async (values) => {
    try {
      if (
        ranges?.length > 0 &&
        ranges?.find((range) => {
          if (range.length === 0) return false;
          let d = range.start;
          d.valueOf();
          let newDate = d.toDate();
          newDate.setHours(0, 0, 0, 0);
          let b = range.end;
          b.valueOf();
          let newDate2 = b.toDate();
          newDate2.setHours(23, 59, 59, 59);
          if (
            newDate < new Date("2024/09/01") ||
            newDate2 < new Date("2024/09/01")
          ) {
            return true;
          }
          return false;
        })
      ) {
        openErrorNotification("Verifica din nou intervalele");
        return;
      }

      if (
        !(fileList.length > 0) &&
        (values.tip === "scutire" ||
          values.tip === "bilet" ||
          values.tip === "profesor" ||
          values.tip === "alte_motivari")
      ) {
        openErrorNotification("Adauga o poza pentru document");
        return;
      }
      let status = "accepted";
      if (
        values.tip === "bilet" &&
        process.env.REACT_APP_AUTO_SCUTIRI !== "enable"
      )
        status = "waiting";
      if (
        values.tip === "profesor" &&
        process.env.REACT_APP_AUTO_SCUTIRI !== "enable"
      )
        status = "waiting";

      if (
        values.tip === "alte_motivari" &&
        process.env.REACT_APP_AUTO_SCUTIRI !== "enable"
      )
        status = "waiting";

      let id = parseInt(new Date().getTime());
      if (mode?.type === "edit") id = mode.values.lastId;
      let uploaded = parseInt(new Date().getTime());
      if (loading === true) return;
      setLoading(true);
      if (fileList.length > 0)
        await uploadFileDatabse(
          fileList.map((f) => {
            return f.originFileObj;
          }),
          "documente" + id.toString() + "_" + uploaded
        );

      if (mode?.type === "edit") {
        id = mode.values.lastId;
        let objData = {
          nume: values.nume,
          details: values.details || "",

          tip: values.tip || "altceva",
          uploaded,
          id: id.toString(),
        };

        if (
          values.tip === "scutire" ||
          values.tip === "bilet" ||
          values.tip === "profesor" ||
          values.tip === "alte_motivari"
        )
          objData["ranges"] = ranges.map((range) => {
            let d = range.start;
            d.valueOf();
            let newDate = d.toDate();
            newDate.setHours(0, 0, 0, 0);
            let b = range.end;
            b.valueOf();
            let newDate2 = b.toDate();
            newDate2.setHours(23, 59, 59, 59);

            return { start: newDate.getTime(), end: newDate2.getTime() };
          });
        let id_scutire = objData.id;

        if (!(objData.tip === "altceva" || objData.tip === "other"))
          await updateDocDatabase("no-verify-scutiri", id_scutire, {
            ...{
              ...objData,
              id_scutire,
              elevId: elevId,
              tip_scutire: values.tip,
              tip:
                values.tip === "profesor" || values.tip === "alte_motivari"
                  ? "scutire"
                  : values.tip,
              subType: values.tip,
              uploaded,
              verified: status,
              numeElev,
              classId,
            },
            download: fileList.length > 0,
          });

        await updateDocDatabase("eleviDocumente", elevId, {
          docsElev: [
            {
              verified:
                objData.tip === "altceva" || objData.tip === "other"
                  ? "accepted"
                  : status,
              ...{
                ...objData,
                tip_scutire: values.tip,
                tip:
                  values.tip === "profesor" || values.tip === "alte_motivari"
                    ? "scutire"
                    : values.tip,
                subType: values.tip,
                uploaded,
              },
              download: fileList.length > 0,
            },
            ...(docsElev.filter((d) => d.id !== mode.values.lastId) || []),
          ],
        });
        let now = new Date();
        let onejan = new Date(now.getFullYear(), 0, 1);
        let week = Math.ceil(
          ((now.getTime() - onejan.getTime()) / 86400000 +
            onejan.getDay() +
            1) /
            7
        );

        let changelogGet = await getDataDoc(
          "changelog",
          classId + "week" + week
        );
        let previous = [];
        if (changelogGet) previous = changelogGet;
        await updateDocDatabase("changelog", classId + "week" + week, {
          changelog: [
            ...(previous.changelog || []),
            {
              author: user.displayName,
              time: Date.now(),
              classId,
              elevId,
              scutire: {
                ...{
                  ...objData,

                  tip_scutire: values.tip,
                  tip:
                    values.tip === "profesor" || values.tip === "alte_motivari"
                      ? "scutire"
                      : values.tip,
                  subType: values.tip,
                },
                download: fileList.length > 0,
              },
            },
          ],
        });

        let dataElev = await getDataDoc("elevi", elevId);
        if (values.tip === "scutire" || values.tip === "bilet") {
          if (status === "accepted")
            await updateDocDatabase("mail", "docs" + Date.now(), {
              to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
              message: {
                subject:
                  "Elevului " +
                  dataElev.numeDeFamilie +
                  " " +
                  dataElev.prenume +
                  " i-a fost adaugată o nouă  scutire ",
                text: `
             Scutirea acopera datele:
             ${objData.ranges?.map(
               (range) =>
                 formatDate(new Date(range.start)) +
                 " - " +
                 formatDate(new Date(range.end)) +
                 "; "
             )}.`,
              },
            });
        }
        form.resetFields();
        setOpen(false);
        setLoading(false);
        setMode(null);
      } else {
        setLoading(true);
        let objData = {
          nume: values.nume,
          details: values.details || "",
          tip: values.tip || "altceva",
          subType: values.tip,
          uploaded,
          id: id.toString(),
        };
        if (
          values.tip === "scutire" ||
          values.tip === "bilet" ||
          values.tip === "profesor" ||
          values.tip === "alte_motivari"
        )
          objData["ranges"] = ranges.map((range) => {
            let d = range.start;

            let newDate = d.toDate();
            newDate.setHours(0, 0, 0, 0);
            let b = range.end;

            let newDate2 = b.toDate();
            newDate2.setHours(23, 59, 59, 59);

            return { start: newDate.getTime(), end: newDate2.getTime() };
          });

        let id_scutire = objData.id;

        console.log({
          ...{
            ...objData,
            id_scutire,
            elevId: elevId,
            verified: status,
            numeElev: numeElev,
            tip_scutire: values.tip,
            tip:
              values.tip === "profesor" || values.tip === "alte_motivari"
                ? "scutire"
                : values.tip,
            subType: values.tip,
            uploaded,
            classId,
          },
          download: fileList.length > 0,
        });
        if (!(objData.tip === "altceva" || objData.tip === "other"))
          await updateDocDatabase("no-verify-scutiri", id_scutire, {
            ...{
              ...objData,
              id_scutire,
              elevId: elevId,
              verified: status,
              numeElev: numeElev,
              tip_scutire: values.tip,
              tip:
                values.tip === "profesor" || values.tip === "alte_motivari"
                  ? "scutire"
                  : values.tip,
              subType: values.tip,
              uploaded,
              classId,
            },
            download: fileList.length > 0,
          });

        console.log({
          docsElev: [
            {
              verified:
                objData.tip === "altceva" || objData.tip === "other"
                  ? "accepted"
                  : status,
              id_scutire,
              ...{
                ...objData,
                tip_scutire: values.tip,
                tip:
                  values.tip === "profesor" || values.tip === "alte_motivari"
                    ? "scutire"
                    : values.tip,
                subType: values.tip,
                uploaded,
              },
              download: fileList.length > 0,
            },
            ...(docsElev || []),
          ],
        });
        await updateDocDatabase("eleviDocumente", elevId, {
          docsElev: [
            {
              verified:
                objData.tip === "altceva" || objData.tip === "other"
                  ? "accepted"
                  : status,
              id_scutire,
              ...{
                ...objData,
                tip_scutire: values.tip,
                tip:
                  values.tip === "profesor" || values.tip === "alte_motivari"
                    ? "scutire"
                    : values.tip,
                subType: values.tip,
                uploaded,
              },
              download: fileList.length > 0,
            },
            ...(docsElev || []),
          ],
        });

        let now = new Date();
        let onejan = new Date(now.getFullYear(), 0, 1);
        let week = Math.ceil(
          ((now.getTime() - onejan.getTime()) / 86400000 +
            onejan.getDay() +
            1) /
            7
        );
        let changelogGet = await getDataDoc(
          "changelog",
          classId + "week" + week
        );
        let previous = [];
        if (changelogGet) previous = changelogGet;
        await updateDocDatabase("changelog", classId + "week" + week, {
          changelog: [
            ...(previous.changelog || []),
            {
              author: user.displayName || "n/a",
              time: Date.now(),
              classId,
              elevId,
              scutire: {
                ...{
                  ...objData,
                  tip_scutire: values.tip,
                  tip:
                    values.tip === "profesor" || values.tip === "alte_motivari"
                      ? "scutire"
                      : values.tip,
                  subType: values.tip,
                },
                download: fileList.length > 0,
              },
            },
          ],
        });

        let dataElev = await getDataDoc("elevi", elevId);
        if (values.tip === "scutire" || values.tip === "bilet") {
          if (status === "accepted")
            await updateDocDatabase("mail", "docs" + Date.now(), {
              to: [dataElev.adresaEmail, ...(dataElev.parintii || [])],
              message: {
                subject:
                  "Elevului " +
                  dataElev.numeDeFamilie +
                  " " +
                  dataElev.prenume +
                  " i-a fost adaugată o nouă  scutire ",
                text: `
             Scutirea acopera datele:
             ${objData.ranges?.map(
               (range) =>
                 formatDate(new Date(range.start)) +
                 " - " +
                 formatDate(new Date(range.end)) +
                 "; "
             )}.`,
              },
            });
        }
        form.resetFields();
        setLoading(false);
        setOpen(false);
        setMode(null);
      }
    } catch (e) {
      openErrorNotification(e);
    }
  };
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const showModal = () => {
    setOpen(true);
  };

  const handleOk = async (e) => {
    setOpen(false);
  };
  const handleCancel = (e) => {
    form.resetFields();
    setOpen(false);
  };
  const onStart = (_event, uiData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  const fetchEditImags = async (tema) => {
    const array = [];
    const folderRef = ref(
      storage,
      "documente" + mode.values.lastId + "_" + mode.values.uploaded
    );
    const folder = await listAll(folderRef);
    setLoading(true);
    const promises = await folder.items
      .map(async (item) => {
        const file = await getMetadata(item);
        const fileRef = ref(storage, item.fullPath);

        const fileBlob = await getDownloadURL(fileRef).then((url) => {
          return fetch(url).then((response) => response?.blob());
        });
        array.push({
          ...file,
          uid: parseInt(Date.now()).toString(),
          originFileObj: blobToFile(fileBlob, file.name),
        });
      })

      .reduce((acc, curr) => acc.then(() => curr), Promise.resolve());
    setFileList(array);
    setLoading(false);
  };

  useEffect(() => {
    if (mode?.type === "edit") {
      fetchEditImags();

      form.setFieldsValue({
        nume: mode.values.nume,
        details: mode.values.details,

        tip: mode.values.tip_scutire || mode.values.tip,
      });
      setType(mode.values.tip);

      setRanges(
        mode.values.ranges.map((range) => {
          return { start: dayjs(range.start), end: dayjs(range.end) };
        })
      );
    }
  }, [mode]);

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
          Adaugă document
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
            <Form.Item label="Nume" rules={[{ required: true }]} name="nume">
              <Input />
            </Form.Item>
            <Form.Item label="Tip" rules={[{ required: true }]} name="tip">
              <Select
                onChange={(e) => {
                  setType(e);
                }}
              >
                <Select.Option value="scutire">Scutire medicală</Select.Option>
                <Select.Option value="bilet">
                  Motivare părinte (scade numarul de absente motivabile)
                </Select.Option>
                <Select.Option value="profesor">Motivare concurs</Select.Option>
                <Select.Option value="alte_motivari">
                  Alte motivari
                </Select.Option>
                <Select.Option value="other">Document elev</Select.Option>
              </Select>
            </Form.Item>
            {(type === "scutire" ||
              type === "bilet" ||
              type === "profesor" ||
              type === "alte_motivari") && (
              <Form.Item label="Interval">
                {ranges.map((range, index) => {
                  return (
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        paddingTop: "10px",
                      }}
                      key={index}
                    >
                      <RangePicker
                        pickerValue={[range.start, range.end]}
                        defaultValue={[range.start, range.end]}
                        onChange={(dates) => {
                          setRanges((prevRanges) => {
                            // Creează un nou array cu valorile actualizate
                            const newRanges = [...prevRanges];
                            // Înlocuiește range-ul corespunzător cu noul range
                            newRanges[index] = {
                              start: dates[0],
                              end: dates[1],
                            };
                            return newRanges;
                          });
                        }}
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          setRanges((prevRanges) => {
                            // Filtrează range-ul curent pe baza indexului
                            return prevRanges.filter((_, i) => i !== index);
                          });
                        }}
                      />
                    </div>
                  );
                })}

                <Button
                  style={{ marginTop: "10px" }}
                  onClick={() => {
                    setRanges([...ranges, []]);
                  }}
                >
                  Adaugă încă un interval
                </Button>
              </Form.Item>
            )}

            <Form.Item label="Detalii" name="details">
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              label="Upload"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              name="files"
            >
              {mode?.type === "edit" ? (
                <>
                  {" "}
                  <Upload
                    fileList={fileList}
                    listType="picture-card"
                    onChange={(e) => {
                      //setFileList([e.file]);

                      setFileList(e.fileList);
                    }}
                    beforeUpload={(file) => {
                      return false;
                    }}
                    customRequest={({ onError, onSuccess, file }) => {}}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                </>
              ) : (
                <Upload
                  listType="picture-card"
                  onChange={(e) => {
                    //setFileList([e.file]);

                    setFileList(e.fileList);
                  }}
                  beforeUpload={(file) => {
                    return false;
                  }}
                  customRequest={({ onError, onSuccess, file }) => {}}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              )}
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

export default ModalAddDocument;
