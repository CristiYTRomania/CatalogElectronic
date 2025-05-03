import { ReactComponent as IconReply } from "../../assets/Assets/images/icon-reply.svg";
import { ReactComponent as IconDelete } from "../../assets/Assets/images/icon-delete.svg";
import { ReactComponent as IconEdit } from "../../assets/Assets/images/icon-edit.svg";
import { useSelector } from "react-redux";
const CommentBtn = ({
  commentData,
  setReplying,
  setDeleting,
  setDeleteModalState,
  setEditing,
}) => {
  let counter = false;
  const user = useSelector((state) => state.user);
  // delete comment
  const showDeleteModal = () => {
    setDeleting(true);
    setDeleteModalState(true);
  };

  // edit comment
  const showEditComment = () => {
    setEditing(true);
  };

  return (
    <>
      {commentData.idUser === user.uid && (
        <div className="comment--btn">
          <button className="delete-btn " onClick={showDeleteModal}>
            <IconDelete /> Sterge
          </button>
        </div>
      )}
    </>
  );
};

export default CommentBtn;
