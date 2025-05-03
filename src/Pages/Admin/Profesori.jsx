import React, { useEffect, useState } from "react";
import { InfoCircleOutlined, UserOutlined } from "@ant-design/icons";
import { Input, Tooltip, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AddProfesor from "./AddProfesor";
import "../../App.css";
import withErrorBoundary from "../../Components/withErrorComponent";
function ProfileElevi() {
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const profesori = useSelector((state) => state.profesori);
  const user = useSelector((state) => state.user);
  const [profesoriDisplay, setProfesoriDisplay] = useState([]);
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  let inputHandler = (e) => {
    //convert input text to lower case
    var lowerCase = e.target?.value.toLowerCase();
    setInputValue(lowerCase);
  };
  useEffect(() => {
    setProfesoriDisplay([]);
    let array = profesori;
    setProfesoriDisplay(
      array
        .filter((el) => {
          if (inputValue === "") {
            return el;
          } else {
            let materiiName = "";
            materii.forEach((materie) => {
              if (el.selectedMaterii.includes(materie.id)) {
                materiiName += materie.numeMaterie + " " + materie.profil + " ";
              }
            });

            const searchString = (
              el.prenume +
              " " +
              el.numeDeFamilie +
              " " +
              el.cnp +
              " " +
              materiiName
            )
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // Elimină diacriticele
              .toLowerCase();

            return searchString.includes(
              inputValue
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Elimină diacriticele
                .toLowerCase()
            );
          }
        })
        .sort((a, b) => {
          const nameA = (a.numeDeFamilie + a.prenume)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const nameB = (b.numeDeFamilie + b.prenume)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

          return nameA < nameB ? -1 : 1;
        })
    );
  }, [profesori, inputValue]);

  const materii = useSelector((state) => state.materii);
  return (
    <div>
      <h1 style={{ fontSize: "30px" }}>Profesorii</h1>
      <AddProfesor
        open={open}
        setConfirmLoading={setConfirmLoading}
        confirmLoading={confirmLoading}
        setOpen={setOpen}
      />
      <div className="add-teacher">
        <Input
          placeholder="Introdu nume sau materie"
          onChange={inputHandler}
          prefix={<UserOutlined className="site-form-item-icon" />}
        />
        {user.type === "admin" && (
          <Button
            type="primary"
            onClick={() => setOpen(true)}
            className="add-button"
          >
            Adaugă profesor nou
          </Button>
        )}
      </div>
      <br />
      <br />

      {profesoriDisplay.map((prof) => {
        return (
          <>
            <div
              style={{
                backgroundColor: "#edf4f5",
                width: "100%",
                border: "1px solid #002140",
              }}
              onClick={() => navigate(`/profesor/${prof.id}`)}
            >
              <br />
              <h1>{prof.numeDeFamilie + " " + prof.prenume} </h1>
              <br />
              <div className="cards-profiles">
                {prof.selectedMaterii.map((m, index) => {
                  return (
                    <div
                      piled
                      className="card-profile"
                      style={{ whiteSpace: "break-spaces" }}
                    >
                      {materii?.find((ma) => ma.id === m).numeMaterie +
                        " " +
                        materii?.find((ma) => ma.id === m).profil}
                    </div>
                  );
                })}
              </div>

              <br />
            </div>
            <br />
          </>
        );
      })}
    </div>
  );
}

export default withErrorBoundary(ProfileElevi);
