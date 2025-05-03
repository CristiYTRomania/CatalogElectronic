import "./Styles/DeleteModal.scss";

const DeleteModal = ({ setDeleting, deleteComment, setDeleteModalState }) => {
  const cancelDelete = () => {
    setDeleting(false);
    setDeleteModalState(false);
  };

  const deleteBtnClick = () => {
    deleteComment();
    setDeleteModalState(false);
  };

  return (
    <div className="delete-confirmation-wrapper">
      <div className="delete-container">
        <div className="title">Sterge Comentariu</div>
        <div className="confirmation-message">
          Esti sigur? Nu se poate readauga comentariul dupa.
        </div>
        <div className="btn-container">
          <button className="cancel-btn" onClick={cancelDelete}>
            Nu
          </button>
          <button className="delete-btn" onClick={deleteBtnClick}>
            Da, sterge
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
