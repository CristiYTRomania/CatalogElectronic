import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import { Button, Modal } from "antd";
import { deleteDataDoc, updateDocDatabase } from "../../database";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { Input, DatePicker, Upload, Form } from "antd";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
import { uploadFileDatabse } from "../../database";
import { testSlice } from "../../redux/store";
import { useDispatch } from "react-redux";
import { getDocs, collection } from "firebase/firestore";
import { storage } from "../../database/firebase";
import { blobToFile } from "../../utils";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  getMetadata,
  listAll,
} from "firebase/storage";
import { db } from "../../database/firebase";
import { Spin } from "antd";
const { actions } = testSlice;
const { GET_LOADING } = actions;
function AdaugaAnunt({ open, setIsModalOpen, mode = "null", anunt }) {
  const anunturi = [];
  const { TextArea } = Input;
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const [Titlu, setTiltu] = useState("");
  const [text, setText] = useState("");
  const [fileList, setFileList] = useState([]);
  const user = useSelector((state) => state.user);
  const [date, setDate] = useState(dayjs(new Date()));
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const dateFormat = "DD/MM/YYYY";
  const handleOk = async () => {
    try {
      setConfirmLoading(true);
      if (loading === true) return;
      let id;
      if (mode === "edit") {
        await deleteDataDoc("anunturi", anunt.id);
      }
      id = parseInt(Date.now()).toString();
      setLoading(true);
      const querySnapshot1 = await getDocs(collection(db, "profesori"));
      let to = [];
      querySnapshot1.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        to.push(doc.data().adresaEmail);
      });

      const querySnapshot = await getDocs(collection(db, "elevi"));

      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        to.push(doc.data().adresaEmail);
        to = [...to, ...(doc.data().parintii || [])];
      });
      console.log(to.filter((t) => t).filter((a) => !a.includes("eminescu")));
      await updateDocDatabase("mail", "anunturi" + Date.now(), {
        bcc: to.filter((t) => t).filter((a) => !a.includes("eminescu")),
        message: {
          subject: Titlu,
          text: text, // Text fallback
          html: `
            <div style="max-width: 972px; margin: auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333;min-height:2000px">
             <img src="${process.env.REACT_APP_LOGO}" alt="Logo Școala"
                     style="position: fixed; top: 50%; left: 20px; transform: translateY(-50%); width: 100px; height: auto;" />

            <header style="position: relative; margin-bottom: 20px; text-align: center;">
                               <h1 style="color: #007bff; font-size: 24px; margin: 0;">${Titlu}</h1>
              </header>
              <main style="line-height: 1.6; font-size: 16px; text-align: justify;">
                ${text
                  .split("\n")
                  .map((line) => `<p style="margin: 0 0 10px;">${line}</p>`)
                  .join("")}
              </main>
            </div>
          `,
        },
      });

      await await uploadFileDatabse(
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
          date: new Date().getTime(),
          user: user.uid,
          tiltlu: Titlu,
          download: fileList.length > 0,
          text: text,
        },
      });
      setLoading(false);
      if (mode === "edit") window.location.reload();
      setIsModalOpen(false);
    } catch (err) {
      openErrorNotification(err.message);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const fetchEditImags = async () => {
    const array = [];
    setLoading(true);
    const folderRef = ref(storage, "anunturi" + anunt?.id.toString());
    const folder = await listAll(folderRef);

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
  React.useEffect(() => {
    if (mode === "edit") {
      setTiltu(anunt.tiltlu);
      setText(anunt.text);
      fetchEditImags();
    }
  }, [mode, anunt]);

  return (
    <Modal
      title="Adaugă Anunt"
      open={open}
      onOk={handleOk}
      confirmLoading={loading}
      onCancel={handleCancel}
      width="80vw"
    >
      <div>
        <Spin tip="Loading" size="large" spinning={loading} />
        {loading === false && (
          <Form
            labelCol={{
              span: 5,
            }}
            wrapperCol={{
              span: 18,
            }}
            layout="horizontal"
            onValuesChange={() => {}}
          >
            <Form.Item label="Titlu">
              <Input
                value={Titlu}
                onChange={(e) => {
                  setTiltu(e.target.value);
                }}
              />
            </Form.Item>

            <Form.Item label="Text">
              <TextArea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                }}
              />
            </Form.Item>
            <Form.Item
              label="Upload"
              valuePropName="fileList"
              getValueFromEvent={normFile}
            >
              <Upload
                listType="picture-card"
                fileList={fileList}
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
            </Form.Item>
          </Form>
        )}
      </div>
    </Modal>
  );
}
export default AdaugaAnunt;
