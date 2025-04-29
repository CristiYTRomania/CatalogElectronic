import React, { useEffect, useState } from "react";
import { Scheduler, Editing, Resource } from "devextreme-react/scheduler";
import { useSelector } from "react-redux";
import { getDataDoc, updateDocDatabase } from "../database";
import { getMaterieColor } from "../utils/index";
import "./OrarClasa.css";

function OrarClasa({ classData }) {
  const [resourcesProf, setResourcesProf] = useState([]);
  const [materiiRes, setMateriiRes] = useState([]);
  const materii = useSelector((state) => state.materii);
  const profesori = useSelector((state) => state.profesori);
  const [allTeachers, setAllTeachers] = useState([]);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    let res = [];
    for (let materie of classData?.materii || []) {
      res.push({
        id: materie.materie,
        text: materii?.find((mat) => mat.id === materie.materie)?.numeMaterie,
        color: getMaterieColor(
          materii?.find((mat) => mat.id === materie.materie)?.color
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
  }, [classData, materii, profesori]);

  function addMinutes(date, minutes) {
    date.setMinutes(date.getMinutes() + minutes);

    return date;
  }
  const getDate = (now) => {
    const hoursAndMinutes = now.getHours() + ":" + now.getMinutes();
    return hoursAndMinutes;
  };
  const renderAppointment = (model) => {
    return (
      <div
        className="appoitment-box"
        style={{ textOverflow: "ellipsis", whiteSpace: "break-spaces" }}
      >
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

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  const views =
    window.screen.width > 750
      ? [
          {
            type: "day",
            name: "Zi",
            maxAppointmentsPerCell: "auto",
          },
          {
            type: "week",
            name: "Săptămână",
            maxAppointmentsPerCell: "1",
          },
        ]
      : [
          {
            type: "day",
            name: "Zi",
            maxAppointmentsPerCell: "auto",
          },
        ];
  const generateUniqueId = () => {
    return Date.now() + "deleted";
  };
  return (
    <div id="">
      {" "}
      <Scheduler
        id="scheduler"
        startDayHour={classData?.settings?.startHour || "08"}
        defaultCurrentView={window?.screen?.width < 750 ? "day" : "week"}
        endDayHour={classData?.settings?.endHour || "15"}
        cellDuration={60}
        dataSource={classData?.ore || []}
        showAllDayPanel={false}
        views={views}
        recurrenceRuleExpr="rule"
        editing={{
          allowAdding:
            user?.type === "admin" && window.screen.width > 750 ? true : false,
          allowDeleting:
            user?.type === "admin" && window.screen.width > 750 ? true : false,
          allowResizing:
            user?.type === "admin" && window.screen.width > 750 ? true : false,
          allowDragging:
            user?.type === "admin" && window.screen.width > 750 ? true : false,
          allowUpdating:
            user?.type === "admin" && window.screen.width > 750 ? true : false,
        }}
        onAppointmentDeleted={async (e) => {
          let newOre = [
            ...classData?.ore.filter((cls) => cls.id !== e.appointmentData.id),
          ];

          await updateDocDatabase("claseData", classData.id, {
            ore: newOre.map((el) => {
              return {
                ...el,
                startDate: el.startDate.getTime(),
                endDate: el.endDate.getTime(),
              };
            }),
          });
          let profData = await getDataDoc(
            "profesori",
            e.appointmentData?.profId
          );

          let oreProfesor = [
            ...(profData.ore || []).filter(
              (cls) => cls.id !== e.appointmentData.id
            ),
          ];

          await updateDocDatabase("profesori", e.appointmentData.profId, {
            ore: oreProfesor.map((el) => {
              return {
                ...el,
                startDate: el.startDate,
                endDate: el.endDate,
              };
            }),
          });
        }}
        recurrenceExceptionExpr="exception"
        appointmentRender={renderAppointment}
        adaptivityEnabled={true}
        timeCellTemplate={(e) =>
          new Date(e.date).toLocaleString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        }
        onAppointmentFormOpening={function onAppointmentFormOpening(e) {
          const { form } = e;

          if (!e.appointmentData.id) {
            form.updateData(
              "endDate",
              addMinutes(e.appointmentData.startDate, 50)
            );

            form.updateData("repeat", true);
            form.updateData("repeat", true);
            form.updateData("rule", "FREQ=WEEKLY");
          }

          form.itemOption("mainGroup.materieId", "editorOptions", {
            onValueChanged(args) {
              form.updateData(
                "text",
                materii?.find((mat) => mat.id === args.value)?.numeMaterie
              );

              form.itemOption("mainGroup.profId", "editorOptions", {
                fieldExpr: "profId",
                label: "Profesor",

                dataSource: resourcesProf.filter((res) => {
                  let materie = (classData?.materii || []).find(
                    (mat) => mat.materie === args.value
                  );

                  if (materie?.profesori?.includes(res.id)) {
                    return true;
                  } else return false;
                }),
              });
            },
          });
        }}
        onAppointmentAdding={async (e) => {
          const id = Date.now();

          let newOre = [
            ...(classData?.ore || []),
            {
              ...e.appointmentData,
              startDate: e.appointmentData.startDate,
              endDate: e.appointmentData.endDate,
              id,
              color: getMaterieColor(
                materii?.find((mat) => mat.id === e.appointmentData.materieId)
                  ?.color
              ),
            },
          ];

          let profData = await getDataDoc(
            "profesori",
            e.appointmentData.profId
          );
          await updateDocDatabase("profesori", e.appointmentData.profId, {
            ore: [
              ...(profData?.ore || []),
              {
                ...e.appointmentData,
                id,
                classId: classData.id,
                startDate: e.appointmentData.startDate.getTime(),
                endDate: e.appointmentData.endDate.getTime(),
                color: getMaterieColor(getRandomInt(10)),
              },
            ],
          });

          await updateDocDatabase("claseData", classData.id, {
            ore: newOre.map((el) => {
              return {
                ...el,
                startDate: el.startDate.getTime(),
                endDate: el.endDate.getTime(),
              };
            }),
          });
        }}
        onAppointmentUpdating={async (e) => {
          // Calculați data de sfârșit pentru programarea veche (o zi înainte de noul startDate)
          const newEndDate = new Date(e.newData.startDate);
          newEndDate.setDate(newEndDate.getDate() - 5);

          // Formatați newEndDate la formatul 'YYYYMMDDTHHmmssZ' conform specificației iCalendar
          const untilDate =
            newEndDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

          // Generați un nou ID pentru programarea veche
          const oldAppointmentNewId = generateUniqueId();

          // Actualizați programarea veche cu noul ID și noua regulă de recurență
          const updatedOldAppointment = {
            ...e.oldData,
            id: oldAppointmentNewId,
            rule: e.oldData.rule
              ? e.oldData.rule + `;UNTIL=${untilDate}`
              : null,
          };

          // Adăugați programarea veche actualizată și noua programare în lista de ore
          let newOre = classData.ore.map((cls) =>
            cls.id === e.oldData.id ? updatedOldAppointment : cls
          );

          newOre.push({ ...e.newData });

          // Obțineți datele profesorului nou
          let profData = await getDataDoc("profesori", e.newData.profId);

          // Modificați orele profesorului, actualizând programarea veche și adăugând noua programare
          let oreProfesor = (profData?.ore || []).map((cls) =>
            cls.id === e.oldData.id ? updatedOldAppointment : cls
          );

          oreProfesor.push({
            classId: classData.id,
            ...e.newData,
            startDate: e.newData.startDate.getTime(),
            endDate: e.newData.endDate.getTime(),
            color: getMaterieColor(getRandomInt(10)),
          });

          // Grupăm toate actualizările pentru a minimiza accesul la baza de date
          let updates = [];

          // Dacă profesorul s-a schimbat, actualizăm și profesorul vechi
          if (e.oldData.profId !== e.newData.profId) {
            let profDataOld = await getDataDoc("profesori", e.oldData.profId);
            let oreOldProf = profDataOld.ore.map((o) =>
              o.id === e.oldData.id ? updatedOldAppointment : o
            );

            updates.push(
              updateDocDatabase("profesori", e.oldData.profId, {
                ore: oreOldProf,
              })
            );
          }

          updates.push(
            updateDocDatabase("profesori", e.newData.profId, {
              ore: oreProfesor,
            })
          );
          updates.push(
            updateDocDatabase("claseData", classData.id, {
              ore: newOre.map((el) => ({
                ...el,
                startDate: el.startDate.getTime(),
                endDate: el.endDate.getTime(),
                color: getMaterieColor(
                  materii?.find((mat) => mat.id === e.newData?.materieId)?.color
                ),
              })),
            })
          );

          // Executăm toate actualizările simultan pentru performanță
          await Promise.all(updates);
        }}
      >
        {" "}
        <Resource
          dataSource={materiiRes}
          fieldExpr="materieId"
          label="Materie"
          onChange={(e) => {
            e.preventDefault();
          }}
          useColorAsDefault={true}
        />
        <Resource
          dataSource={resourcesProf}
          fieldExpr="profId"
          label="Profesor"
        />
        <Editing allowDragging={false} />
        {/* Configuration goes here */}
      </Scheduler>
    </div>
  );
}

export default OrarClasa;
