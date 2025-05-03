import React, { useEffect, useState } from "react";

import Comment from "./Comment";
import AddComment from "./AddComment";
import { Alert } from "antd";
import { getDataDoc, updateDocDatabase } from "../../database";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../database/firebase";
import { uploadFileDatabse } from "../../database/index";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useSelector } from "react-redux";
function compare(a, b) {
  if (a.createdAt < b.createdAt) {
    return 1;
  }
  if (a.createdAt > b.createdAt) {
    return -1;
  }
  return 0;
}

const Chat = ({ classId, classData }) => {
  const [comments, updateComments] = useState([]);
  const profesori = useSelector((state) => state.profesori);
  const [deleteModalState, setDeleteModalState] = useState(false);
  const updateDatabaseComments = async (comments) => {
    await updateDocDatabase("commentsClass", classId, {
      comments: comments,
    });
  };
  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };
  const getData = async () => {
    const comments = await getDataDoc("commentsClass", classId);
    updateComments(comments?.comments.sort(compare) || []);
  };

  // add comments
  let addComments = async (newComment) => {
    let updatedComments = [...comments, newComment];
    await updateDocDatabase("commentsClass", classId, {
      comments: updatedComments,
    });

    let to = [];
    if (newComment.mentions.find((m) => m.value === "elevii"))
      to = [
        ...to,
        ...(classData?.elevi || []).reduce(
          (acc, e) => [...acc, e.adresaEmail, ...(e?.parintii || [])],
          []
        ),
      ];

    if (newComment.mentions.find((m) => m.value === "profesorii"))
      to = [
        ...to,
        ...(classData?.materii || []).reduce(
          (acc, e) => [
            ...acc,
            ...(e?.profesori || []).map(
              (profId) => profesori.find((p) => p.id === profId).adresaEmail
            ),
            ...(e?.parintii || []),
          ],
          []
        ),
      ];

    to = [
      ...to,
      ...newComment.mentions
        .filter((m) => validateEmail(m.value))
        .map((e) => e.value),
    ];
    await updateDocDatabase("mail", "chat" + Date.now(), {
      to: to,
      message: {
        subject:
          "Ai fost mentionat in chatul clasei " +
          classData.anClasa +
          classData.identificator,
        text: newComment.content,
      },
    });
  };

  // add replies
  let updateReplies = (replies, id) => {
    let updatedComments = [...comments];
    updatedComments.forEach((data) => {
      if (data.id === id) {
        data.replies = [...replies];
      }
    });
    updateComments(updatedComments);
    updateDatabaseComments(updatedComments);
  };

  // edit comment
  let editComment = async (commentData, id, type) => {
    let updatedComments = [...comments];

    if (type === "comment") {
      updatedComments.forEach(async (data) => {
        if (data.id === id) {
          data.id = parseInt(Date.now()).toString();
          if (commentData.fileList) {
            data.fisiere = true;

            await uploadFileDatabse(
              commentData.fileList.map((f) => {
                return f.originFileObj;
              }),
              "chats" + data.id
            );
          }
          data.content = commentData.content;
          if (commentData.date) data.date = commentData.date;
          else {
            if (data.date) delete data.date;
          }
        }
      });
    } else if (type === "reply") {
      updatedComments.forEach((comment) => {
        comment.replies.forEach((data) => {
          if (data.id === id) {
            data.content = commentData.content;
          }
        });
      });
    }

    updateComments(updatedComments);
    updateDatabaseComments(updatedComments);
  };

  // delete comment
  let commentDelete = (id, type, parentComment) => {
    let updatedComments = [...comments];
    let updatedReplies = [];

    if (type === "comment") {
      updatedComments = updatedComments.filter((data) => data.id !== id);
    } else if (type === "reply") {
      comments.forEach((comment) => {
        if (comment.id === parentComment) {
          updatedReplies = comment.replies.filter((data) => data.id !== id);
          comment.replies = updatedReplies;
        }
      });
    }

    updateComments(updatedComments);
    updateDatabaseComments(updatedComments);
  };

  useEffect(() => {
    getData();
    if (!classId || classId === "N/A") return;
    const unsub = onSnapshot(doc(db, "commentsClass", classId), (doc) => {
      getData();
    });
    return unsub;
  }, [classId]);

  useEffect(() => {
    localStorage.setItem("comments", JSON.stringify(comments));
    deleteModalState
      ? document.body.classList.add("overflow--hidden")
      : document.body.classList.remove("overflow--hidden");
  }, [comments, deleteModalState]);

  return (
    <>
      {/* <Alert
        message="Au acces: profesorii, elevii clasei si directorii"
        type="info"
      /> */}
      <br />
      {(classId !== "N/A" || classId) && (
        <>
          <AddComment
            buttonValue={"trimite"}
            addComments={addComments}
            classData={classData}
          />
          <main>
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                commentData={comment}
                updateReplies={updateReplies}
                editComment={editComment}
                commentDelete={commentDelete}
                setDeleteModalState={setDeleteModalState}
              />
            ))}
          </main>
        </>
      )}
    </>
  );
};
export default Chat;
