import React, { useEffect, useState } from "react";
import { Scheduler, Editing, Resource } from "devextreme-react/scheduler";
import { useSelector } from "react-redux";
import { updateDocDatabase } from "../database";
import { getMaterieColor } from "../utils/index";
import "./OrarClasa.css";

function OrarElev({ classData }) {
  const [resourcesProf, setResourcesProf] = useState([]);
  const [materiiRes, setMateriiRes] = useState([]);
  const materii = useSelector((state) => state.materii);
  const profesori = useSelector((state) => state.profesori);
  const [allTeachers, setAllTeachers] = useState([]);

  let res = [];
  for (let materie of classData?.materii || []) {
    res.push({
      id: materie.materie,
      text: materii?.find((mat) => mat.id === materie.materie).numeMaterie,
      color: getMaterieColor(
        materii?.find((mat) => mat.id === materie.materie).color
      ),
    });
  }
  let resourcesProf2 = [];
  for (let materie of classData?.materii || []) {
    for (let prof of materie?.profesori || []) {
      if (!resourcesProf2.find((p) => p.id === prof))
        resourcesProf2.push({
          id: prof,
          text:
            profesori.find((mat) => mat.id === prof)?.numeDeFamilie +
            " " +
            profesori.find((mat) => mat.id === prof)?.prenume,
        });
    }
  }
  if (JSON.stringify(resourcesProf) !== JSON.stringify(resourcesProf2))
    setResourcesProf(resourcesProf2);
  if (JSON.stringify(res) !== JSON.stringify(materiiRes)) setMateriiRes(res);

  const getDate = (now) => {
    const hoursAndMinutes = now.getHours() + ":" + now.getMinutes();
    return hoursAndMinutes;
  };
  const renderAppointment = (model) => {
    return (
      <div className="appoitment-box" style={{ whiteSpace: "break-spaces" }}>
        {
          materii?.find((c) => c.id === model.appointmentData.materieId)
            .numeMaterie
        }

        <br />
        {profesori.find((prof) => prof.id === model.appointmentData.profId)
          ?.numeDeFamilie +
          " " +
          profesori.find((prof) => prof.id === model.appointmentData.profId)
            ?.prenume}
      </div>
    );
  };
  // const views =
  //   window.screen.width > 750
  //     ? [
  //         {
  //           type: "day",
  //           name: "Zi",
  //           maxAppointmentsPerCell: "auto",
  //         },
  //         {
  //           type: "week",
  //           name: "Săptămână",
  //           maxAppointmentsPerCell: "1",
  //         },
  //       ]
  //     : [
  //         {
  //           type: "day",
  //           name: "Zi",
  //           maxAppointmentsPerCell: "auto",
  //         },
  //       ];
  const views = [
    {
      type: "day",
      name: "Zi",
      maxAppointmentsPerCell: "auto",
    },
    {
      type: "workWeek",
      name: "Săptămână",
      maxAppointmentsPerCell: "1",
    },
  ]
  return (
    <div id="">
      {" "}
      <Scheduler
        id="scheduler"
        startDayHour={classData?.settings?.startHour || "08"}
        endDayHour={classData?.settings?.endHour || "15"}
        cellDuration={60}
        dataSource={classData.ore || []}
        showAllDayPanel={false}
        recurrenceRuleExpr="rule"
        recurrenceExceptionExpr="exception"
        appointmentRender={renderAppointment}
        views={views}
        editing={{
          allowAdding: false,
          allowDeleting: false,
          allowResizing: false,
          allowDragging: false,
          allowUpdating: false,
        }}
        adaptivityEnabled={true}
        timeCellTemplate={(e) =>
          new Date(e.date).toLocaleString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        }
      >
        {" "}
        <Resource
          dataSource={materiiRes || []}
          fieldExpr="materieId"
          label="Materie"
          onChange={(e) => {
            e.preventDefault();
          }}
          useColorAsDefault={true}
        />
        <Resource
          dataSource={resourcesProf || []}
          fieldExpr="profId"
          label="Profesor"
        />
      </Scheduler>
    </div>
  );
}

export default OrarElev;
