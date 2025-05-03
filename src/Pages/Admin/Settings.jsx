import React, { useEffect, useState } from "react";

import { Button, Switch } from "antd";
import { Collapse } from "antd";
import GitInfo from "react-git-info/macro";
import MateriiSettings from "../../Components/Materii/MateriiSettings";
import ModalAni from "./ModalAni";
import { useSelector } from "react-redux";
import { signOut } from "firebase/auth";
import { auth } from "../../database/firebase";
import { useRef } from "react";
import ModalSettingsModule from "./ModalSettingsModule";
import { useReactToPrint } from "react-to-print";
import { updateDocDatabase } from "../../database";
const { Panel } = Collapse;

function Settings() {
  const [show, setShow] = useState(false);
  const dates = [
    new Date("2023-09-01"),
    new Date("2023-10-01"),
    new Date("2023-11-01"),
    new Date("2023-12-01"),
    new Date("2024-01-01"),
    new Date("2024-02-01"),
    new Date("2024-03-01"),
    new Date("2024-04-01"),
    new Date("2024-05-01"),
    new Date("2024-06-01"),
    new Date("2024-07-01"),
    new Date("2024-08-01"),
    new Date("2024-09-01"),
  ];
  const [showModule, setShowModule] = useState(false);
  const [open, setOpen] = useState(false);
  const profesori = useSelector((state) => state.profesori);
  const gitInfo = GitInfo();
  const [date, setDate] = useState(dates[0]);
  const [activeIndex, setActiveIndex] = useState();
  const [showPurtare, setShowPurtare] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const componentRef = useRef();
  const settings = useSelector((state) => state.settings);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <div
      style={{
        display: "block",
        alignItems: "center",
        alignContent: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {/* <div style={{ display: "none" }}>
        <Print />
      </div> */}
      <MateriiSettings
        setOpen={setShow}
        open={show}
        confirmLoading={confirmLoading}
        setConfirmLoading={setConfirmLoading}
      />
      <ModalAni setIsModalOpen={setOpen} open={open} />

      <h2> Setări Platforma</h2>
      <br />
      <br />
      <Collapse
        styled
        style={{
          width: "80%",
          marginLeft: "10%",
          marginRight: "10px",
          paddingRight: "10px",
        }}
        onChange={(key) => {
          setActiveIndex(key);
        }}
      >
        <Panel key="1" header="Resurse">
          {" "}
          <div
            style={{
              display: "flex",
              flexDirection: "grow",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <br />
            <Button
              style={{
                backgroundColor: "yellow",
                color: "black",
              }}
              onClick={() => {
                setShow(true);
              }}
            >
              Setări Materii
            </Button>
            <Button
              style={{
                backgroundColor: "yellow",
                color: "black",
              }}
              onClick={() => {
                setOpen(true);
              }}
            >
              Setări Ani
            </Button>

            <br />
            <br />
            <Switch
              checkedChildren="Profesorii au acces la purtare"
              unCheckedChildren="Profesorii nu au acces la purtare"
              checked={settings?.showPurtare || false}
              onChange={async (e) => {
                await updateDocDatabase("settings", "settings", {
                  showPurtare: e,
                });
              }}
            />
            <br />
            <br />

            <br />
            <br />
            <Switch
              checkedChildren="Restrictia de 3 saptamani dezactivata"
              unCheckedChildren="Restrictia de 3 saptamani activata"
              checked={settings?.treiSapt || false}
              onChange={async (e) => {
                await updateDocDatabase("settings", "settings", {
                  treiSapt: e,
                });
              }}
            />

            {/* <Button
              style={{
                backgroundColor: "yellow",
                color: "black",
                width: "11.5vw",
              }}
              onClick={() => {
                setShowModule(true);
              }}
            >
              Setari Module
            </Button> */}
            <br />
          </div>
        </Panel>
      </Collapse>

      <Collapse
        styled
        style={{
          width: "80%",
          marginLeft: "10%",
          marginRight: "10px",
          paddingRight: "10px",
        }}
      ></Collapse>
      <Collapse
        styled
        style={{
          width: "80%",
          marginLeft: "10%",
          marginRight: "10px",
          paddingRight: "10px",
        }}
      >
        <Panel key="2" header="Despre">
          <div style={{ fontWeight: "bold" }}>
            Versiune : 2.0
            <br />
            Ultima actualizare platforma:{" "}
            {new Date(gitInfo?.commit?.date).toLocaleDateString("ro-RO")}
            <br />
            Mesaj de actualizare: {gitInfo.commit.message}
            <br />
            <br />
            PFA Dobricean Ioan Dorian
            <br />
            0747934436 <br />
            dobriceanionut@dobriceansoftware.com
            <br />
            dobriceanionut1408@gmail.com
          </div>
        </Panel>
      </Collapse>

      <Collapse
        styled
        style={{
          width: "80%",
          marginLeft: "10%",
          marginRight: "10px",
          paddingRight: "10px",
        }}
      ></Collapse>
      <br />
      <br />
      <Button
        style={{ backgroundColor: "red", color: "white", fontWeight: "bold" }}
        onClick={() => {
          signOut(auth);
        }}
      >
        Iesi din cont
      </Button>
      <br />
    </div>
  );
}

export default Settings;
