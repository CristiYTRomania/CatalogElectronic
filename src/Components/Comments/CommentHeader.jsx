import CommentBtn from "./CommentBtn";
import { anonymus } from "../../utils";
import { useSelector } from "react-redux";
const CommentHeader = ({
  commentData,
  setReplying,
  setDeleting,
  setDeleteModalState,
  setEditing,
  time,
}) => {
  const user = useSelector((state) => state.user);

  return (
    <div className="comment--header">
      <div
        className={`profile-pic ${commentData.username}`}
        style={{ backgroundImage: `url(${commentData.photoLink || anonymus})` }}
      ></div>
      <div className="username">{commentData.username}</div>
      {commentData.idUser === user.uid ? <div className="you-tag">Tu</div> : ""}
      <div className="comment-posted-time">{`acum ${time}`}</div>
      <CommentBtn
        commentData={commentData}
        setReplying={setReplying}
        setDeleting={setDeleting}
        setDeleteModalState={setDeleteModalState}
        setEditing={setEditing}
      />
    </div>
  );
};

export default CommentHeader;
