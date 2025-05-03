import { useEffect, useState } from "react";

import "./Styles/Comment.scss";
import { Button, DatePicker, Upload, Space } from "antd";
import AddComment from "./AddComment";
import ReplyContainer from "./ReplyContainer";
import DeleteModal from "./DeleteModal";
import CommentVotes from "./CommentVotes";
import {
  FileOutlined,
  CalendarOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { downloadFolderAsZip } from "../../database";
import { blobToFile } from "../../utils";
import CommentHeader from "./CommentHeader";
import CommentFooter from "./CommentFooter";
import dayjs from "dayjs";
import { commentPostedTime } from "../../utils";
import { storage } from "../../database/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  getMetadata,
  listAll,
} from "firebase/storage";
const Comment = ({
  commentData,

  updateReplies,
  editComment,
  commentDelete,
  setDeleteModalState,
}) => {
  const [replying, setReplying] = useState(false);
  const [time, setTime] = useState("");
  const [vote, setVoted] = useState(false);
  const [score, setScore] = useState(commentData.score);
  const [upload, setUpload] = useState(commentData.fisiere ? true : false);
  const [date, setDate] = useState(commentData.date ? true : false);
  const [fileList, setFileList] = useState([]);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(commentData.content);
  const [deleting, setDeleting] = useState(false);
  const [dateComment, setDateComment] = useState(commentData.date);

  // get time from comment posted
  const createdAt = new Date(commentData.createdAt);
  const today = new Date();
  const differenceInTime = today.getTime() - createdAt.getTime();
  const fetchEditImags = async (id) => {
    const array = [];
    const folderRef = ref(storage, "chats" + id.toString());
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
          uid: parseInt(Date.now())?.toString(),
          originFileObj: blobToFile(fileBlob, file.name),
        });
      })

      .reduce((acc, curr) => acc.then(() => curr), Promise.resolve());
    setFileList(array);
  };
  useEffect(() => {
    setTime(commentPostedTime(differenceInTime));
  }, [differenceInTime, vote]);
  useEffect(() => {
    if (editing === true && commentData.fisiere) {
      fetchEditImags(commentData.id);
    }
  }, [editing]);
  const onChange = (date, dateString) => {
    setDateComment(dateString);
  };

  const addReply = (newReply) => {
    const replies = [...commentData.replies, newReply];
    updateReplies(replies, commentData.id);
    setReplying(false);
  };

  const updateComment = () => {
    let contentData = {
      content,
    };
    if (upload) contentData.fileList = fileList;

    if (date) contentData.date = dateComment;

    editComment(contentData, commentData.id, "comment");
    setEditing(false);
  };

  const deleteComment = (id, type) => {
    const finalType = type !== undefined ? type : "comment";
    const finalId = id !== undefined ? id : commentData.id;
    commentDelete(finalId, finalType, commentData.id);
    setDeleting(false);
  };

  return (
    <div
      className={`comment-container ${
        commentData.replies[0] !== undefined ? "reply-container-gap" : ""
      }`}
      style={{
        fontSize: "16px",
        fontColor: "black",
        marginLeft: "auto",
        marginRight: "auto",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div className="comment">
        <div className="comment--body">
          <CommentHeader
            commentData={commentData}
            setReplying={setReplying}
            setDeleting={setDeleting}
            setDeleteModalState={setDeleteModalState}
            setEditing={setEditing}
            time={time}
          />
          {!editing ? (
            <div className="comment-content">
              {commentData.content}
              <br />

              {commentData.fisiere && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <br />
                  <Button
                    type="primary"
                    onClick={() => {
                      downloadFolderAsZip(
                        "chats" + commentData.id,
                        "chats_" + commentData.id
                      );
                    }}
                  >
                    Descarca Documentele
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Space>
                <Button
                  icon={<FileOutlined />}
                  onClick={() => setUpload(!upload)}
                />
              </Space>
              <textarea
                className="content-edit-box"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                }}
              />
              <br /> <br />
              {upload === true && (
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
              )}
            </>
          )}
          {editing && (
            <button className="update-btn" onClick={updateComment}>
              update
            </button>
          )}
        </div>
        <CommentFooter
          vote={vote}
          setVoted={setVoted}
          score={score}
          setScore={setScore}
          commentData={commentData}
          setReplying={setReplying}
          setDeleting={setDeleting}
          setDeleteModalState={setDeleteModalState}
          setEditing={setEditing}
        />{" "}
      </div>

      {replying && (
        <AddComment
          buttonValue={"reply"}
          addComments={addReply}
          replyingTo={commentData.username}
        />
      )}

      {deleting && (
        <DeleteModal
          setDeleting={setDeleting}
          deleteComment={deleteComment}
          setDeleteModalState={setDeleteModalState}
        />
      )}
    </div>
  );
};

export default Comment;
