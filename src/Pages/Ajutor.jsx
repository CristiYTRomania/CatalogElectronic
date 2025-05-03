import React from "react";

function Ajutor() {
  return (
    <div>
      <h3>Ajutor</h3>
      <a
        href={process.env.REACT_APP_MANUAL}
        style={{ fontSize: "20px" }}
        target="_blank"
      >
        Vezi Manual
      </a>
      <br />
      <a
        href={"mailto:dobriceanionut@dobriceansoftware.com"}
        style={{ fontSize: "20px" }}
        target="_blank"
      >
        dobriceanionut@dobriceansoftware.com
      </a>
      <br />
      <br />
      <p>PFA DOBRICEAN IOAN DORIAN</p>
      <p>DobriceanSoftware</p>
    </div>
  );
}

export default Ajutor;
