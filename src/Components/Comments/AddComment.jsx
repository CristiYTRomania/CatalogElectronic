import { useEffect, useState } from "react";
import { Button, DatePicker, Upload, Space, Mentions } from "antd";
import "./Styles/AddComment.scss";
import { anonymus } from "../../utils";
import { uploadFileDatabse } from "../../database";
import {
  FileOutlined,
  CalendarOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { Form } from "antd";
import { Editing } from "devextreme-react/scheduler";
const { getMentions } = Mentions;
const AddComment = ({
  buttonValue,
  addComments,
  replyingTo,
  superComment,
  classData,
}) => {
  const replyingToUser = replyingTo ? `@${replyingTo}, ` : "";
  const [comment, setComment] = useState("");
  const [date, setDate] = useState(false);
  const [tags, setTags] = useState([]);
  const [dateComment, setDateComment] = useState("");
  const profesori = useSelector((state) => state.profesori);
  const [fileList, setFileList] = useState([]);
  const [profi, setProfi] = useState([]);
  const [upload, setUpload] = useState(false);
  const user = useSelector((state) => state.user);
  const [mentions, setMentions] = useState([]);

  useEffect(() => {
    let profesoriNefiltrati = (classData?.materii || []).reduce(
      (acc, e) => [
        ...acc,
        ...(e?.profesori || []).map((profId) => {
          return {
            label:
              profesori.find((p) => p.id === profId)?.numeDeFamilie +
              " " +
              profesori.find((p) => p.id === profId)?.prenume,
            value: profesori.find((p) => p.id === profId)?.adresaEmail,
          };
        }),
      ],
      []
    );
    const p = [];
    profesoriNefiltrati.forEach((pr) => {
      if (p.find((el) => el.value == pr.value) === undefined) p.push(pr);
    });
    setProfi(p);
  }, [classData]);
  const clickHandler = async () => {
    if (comment === "" || comment === " ") return;
    let fisiere = false;
    let id = parseInt(Date.now()).toString();
    if (fileList.length > 0 && upload) {
      fisiere = true;
      await uploadFileDatabse(
        fileList.map((f) => {
          return f.originFileObj;
        }),
        "chats" + id.toString()
      );
    }
    const newComment = {
      id,
      content: replyingToUser + comment,
      createdAt: new Date().getTime(),
      score: 0,
      username: user.displayName,
      photoLink: user.photoLink || anonymus,
      currentUser: true,
      mentions,
      replies: [],
      idUser: user.uid,
    };

    if (fisiere) newComment.fisiere = true;
    addComments(newComment);

    setComment("");
    setUpload(false);
  };

  return (
    <>
      {" "}
      <div
        className="add-comment"
        style={{
          marginLeft: "auto",
          marginRight: "auto",
          backgroundColor: "#f5f5f5",
          fontSize: "14px",
        }}
      >
        <div style={{ float: "left", paddingLeft: "40px" }}>
          <Button icon={<FileOutlined />} onClick={() => setUpload(!upload)} />
        </div>{" "}
        <br /> <br />
        <div
          style={{
            display: "flex",
            paddingBottom: "10px",
            paddingLeft: "35px",
            gap: "10px",
          }}
        ></div>
        <div style={{ display: "flex" }}>
          <div
            className="profile-pic"
            style={{ backgroundImage: `url(${user.photoLink || anonymus})` }}
          ></div>
          <Form.Item
            className="comment-input"
            placeholder="Add a comment"
            style={{ textAlign: "left", width: "100%", minHeight: "100px" }}
            value={comment}
          >
            <Mentions
              rows={3}
              style={{ width: "100%", padding: 0, margin: 0 }}
              value={comment}
              placeholder="Pentru a genera notificari foloseste @, altfel nu se va genera nicio notificare. Nu uita profesorii, elevii si directorii au acces la chat."
              onChange={(e) => {
                setComment(e);

                setMentions(getMentions(e));
              }}
              options={[
                { label: "elevii", value: "elevii" },
                { label: "profesorii", value: "profesorii" },
                ...profi,
              ]}
            />
          </Form.Item>
        </div>{" "}
        <div className="send-btn-container" style={{ float: "right" }}>
          <button className="add-btn" onClick={clickHandler}>
            {buttonValue}
          </button>
        </div>
        <br /> <br /> <br />
        {upload === true && (
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
      </div>
    </>
  );
};

export default AddComment;
