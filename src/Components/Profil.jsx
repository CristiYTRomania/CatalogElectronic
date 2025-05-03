import React, { useEffect } from "react";
import { Button, Upload } from "antd";
import { signOut } from "firebase/auth";
import ProfesorPage from "./ProfesorPage";
import ProfileImageAnonymus from "../assets/profile-elev.webp";
import { auth } from "../database/firebase";
import { useSelector } from "react-redux";
import { Image, Descriptions } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { updateDocDatabase, uploadFileDatabse } from "../database";
import {
  useWindowSize,
  useWindowWidth,
  useWindowHeight,
} from "@react-hook/window-size";
import { Tag } from "antd";
import { openSuccesNotification } from "./Notifications/succesNotification";
function Profil() {
  const user = useSelector((state) => state.user);
  const materii = useSelector((state) => state.materii);
  const clase = useSelector((state) => state.clase);
  const onlyWidth = useWindowWidth();
  useEffect(() => {}, [user]);
  return (
    <div>
      {user.type === "profesor" ? (
        <>
          {" "}
          <div style={{ paddingLeft: "3%" }}>
            <Image
              src={user?.photoLink || ProfileImageAnonymus}
              height={200}
              width={200}
              style={{ marginTop: "5px" }}
            />
            <br />
            <br /> Tip Cont: {user.type}
            <br />
            <br />
            <div
              style={{
                display: "block",
              }}
            >
              <div>
                <Descriptions
                  bordered
                  layout={onlyWidth < 900 ? "vertical" : "horizontal"}
                  title={
                    user?.numeDeFamilie +
                    " " +
                    user?.prenume +
                    " ( " +
                    user.selectedMaterii?.map(
                      (materie) =>
                        materii?.find((mat) => mat.id === materie)
                          ?.numeMaterie +
                        " - " +
                        materii?.find((mat) => mat.id === materie)?.profil +
                        " "
                    ) +
                    " )"
                  }
                >
                  <Descriptions.Item label="Nume">
                    {user?.numeDeFamilie}
                  </Descriptions.Item>

                  <Descriptions.Item label="Prenume">
                    {user?.prenume}
                  </Descriptions.Item>

                  <Descriptions.Item label="Nr. Telefon">
                    {user?.numarTelefon}
                  </Descriptions.Item>

                  <Descriptions.Item label="Email">
                    {user?.adresaEmail}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </div>
          </div>
        </>
      ) : user.type === "admin" ? (
        <>
          <div style={{ paddingLeft: "3%" }}>
            <Image
              src={user?.photoLink || ProfileImageAnonymus}
              height={200}
              width={200}
              style={{ marginTop: "5px" }}
            />
            <br />
            <br /> Tip Cont: {user.type}
            <br />
            <br />
            <div
              style={{
                display: "block",
              }}
            >
              <div>
                <Descriptions
                  layout={onlyWidth < 900 ? "vertical" : "horizontal"}
                  bordered
                  title={
                    user?.numeDeFamilie +
                    " " +
                    user?.prenume +
                    " ( " +
                    user.selectedMaterii?.map(
                      (materie) =>
                        materii?.find((mat) => mat.id === materie)
                          ?.numeMaterie +
                        " - " +
                        materii?.find((mat) => mat.id === materie)?.profil +
                        " "
                    ) +
                    " )"
                  }
                >
                  <Descriptions.Item label="Nume">
                    {user?.numeDeFamilie}
                  </Descriptions.Item>
                  <Descriptions.Item label="Prenume">
                    {user?.prenume}
                  </Descriptions.Item>
                  <br />
                  <Descriptions.Item label="Nr. Telefon">
                    {user?.numarTelefon}
                  </Descriptions.Item>

                  <Descriptions.Item label="Email">
                    {user?.adresaEmail}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {" "}
          <div style={{ paddingLeft: "3%" }}>
            <Image
              src={user?.photoLink || ProfileImageAnonymus}
              height={200}
              width={200}
              style={{ marginTop: "5px" }}
            />
            <br />
            <br /> Tip Cont: {user.type}
            <br />
            <br />
            <div
              style={{
                display: "block",
              }}
            >
              <div>
                <Descriptions
                  bordered
                  layout={onlyWidth < 900 ? "vertical" : "horizontal"}
                  title={
                    user?.numeDeFamilie +
                    " " +
                    user?.initiala +
                    " " +
                    user?.prenume +
                    "( " +
                    ((user.clasa === "N/A"
                      ? "Nu este înscris"
                      : clase.find((cls) => cls.id === user.clasa)?.anClasa +
                        clase.find((cls) => cls.id === user.clasa)
                          ?.identificator) +
                      " )")
                  }
                >
                  <Descriptions.Item label="Nume">
                    {user?.numeDeFamilie}
                  </Descriptions.Item>
                  <Descriptions.Item label="Prenume">
                    {user?.prenume}
                  </Descriptions.Item>
                  <Descriptions.Item label="Initiala">
                    {user?.initiala}
                  </Descriptions.Item>

                  <Descriptions.Item label="Nr. Telefon">
                    {user?.numarTelefon}
                  </Descriptions.Item>

                  <Descriptions.Item label="Email">
                    {user?.adresaEmail}
                  </Descriptions.Item>

                  <Descriptions.Item label="CNP">{user?.cnp}</Descriptions.Item>
                  <Descriptions.Item label="Locul Nasterii">
                    {user?.loculNasterii}
                  </Descriptions.Item>

                  <Descriptions.Item label="Domiciliu">
                    {user?.domiciliu}
                  </Descriptions.Item>

                  <Descriptions.Item label="Bursa">
                    {user?.bursa}
                  </Descriptions.Item>

                  <Descriptions.Item label="Email-uri abonate">
                    {(user?.parintii || []).map((e) => (
                      <Tag>{e}</Tag>
                    ))}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </div>
          </div>
        </>
      )}
      <br />
      <br />
      Incarcă o noua semnătură
      <Upload
        listType="picture-card"
        onChange={async (e) => {
          const [link] = await await uploadFileDatabse(
            [e.fileList[0]].map((f) => {
              return f.originFileObj;
            }),
            "semnaturi" + user.uid + "_"
          );
          updateDocDatabase("users", user.uid, {
            semnatura: link,
          });
          if (user.type == "profesor") {
            updateDocDatabase("profesori", user.uid, {
              semnatura: link,
            });
          }
          openSuccesNotification("semnatura a fost incarcata");
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
      <br />
      <Button
        style={{ backgroundColor: "red", color: "white", fontWeight: "bold" }}
        onClick={() => {
          signOut(auth);
          window.location.reload();
        }}
      >
        Iesi din cont
      </Button>
      <br />
      <a href={process.env.REACT_APP_PRIVACY}>Privacy Policy</a>
    </div>
  );
}

export default Profil;
