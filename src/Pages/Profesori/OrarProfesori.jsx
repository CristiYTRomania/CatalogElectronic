import React, { useEffect, useState } from "react";
import { Scheduler, Editing, Resource } from "devextreme-react/scheduler";
import { useSelector } from "react-redux";
import { getDataDoc, updateDocDatabase } from "../../database";
import { getMaterieColor } from "../../utils/index";
import "../../Components/OrarClasa.css";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";

import withErrorBoundary from "../../Components/withErrorComponent";
function OrarProfesor({ profesorData }) {
  const [resourcesProf, setResourcesProf] = useState([]);
  const [materiiRes, setMateriiRes] = useState([]);
  const materii = useSelector((state) => state.materii);
  const profesori = useSelector((state) => state.profesori);
  const [allTeachers, setAllTeachers] = useState([]);
  const user = useSelector((state) => state.user);
  const [resourcesElevi, setResourceElevi] = useState([]);
  const clase = useSelector((state) => state.clase);
  const [resourcesClase, setResourcesClase] = useState(
    clase.map((c) => ({ text: c.anClasa + c.identificator, id: c.id }))
  );
  useEffect(() => {
    let res = [];
    for (let materie of profesorData?.selectedMaterii || []) {
      res.push({
        id: materie,
        text: materii?.find((mat) => mat.id === materie)?.numeMaterie,
        color: getMaterieColor(
          materii?.find((mat) => mat.id === materie)?.color
        ),
      });
    }
    let resourcesProf2 = [];

    resourcesProf2.push({
      id: profesorData.id,
      text: profesorData.numeDeFamilie + " " + profesorData.prenume,
    });

    if (JSON.stringify(resourcesProf) !== JSON.stringify(resourcesProf2))
      setResourcesProf(resourcesProf2);
    if (JSON.stringify(res) !== JSON.stringify(materiiRes)) setMateriiRes(res);
  }, []);

  function addMinutes(date, minutes) {
    date.setMinutes(date.getMinutes() + minutes);

    return date;
  }
  const getDate = (now) => {
    const hoursAndMinutes = now.getHours() + ":" + now.getMinutes();
    return hoursAndMinutes;
  };
  const RenderAppointment = (model) => {
    const nameOfClasa =
      clase?.find((cls) => cls.id === model.appointmentData.classId)?.anClasa +
      clase?.find((cls) => cls.id === model.appointmentData.classId)
        ?.identificator;

    return (
      <>
        {model.appointmentData.tip === "privat" ? (
          <div
            className="appoitment-box"
            style={{ textOverflow: "ellipsis", whiteSpace: "break-spaces" }}
          >
            {model.appointmentData.text || model.appointmentData.elevName}
          </div>
        ) : (
          <div
            className="appoitment-box"
            style={{ textOverflow: "ellipsis", whiteSpace: "break-spaces" }}
          >
            {nameOfClasa}
            <br />
            {
              materii?.find((c) => c.id === model.appointmentData.materieId)
                ?.numeMaterie
            }
          </div>
        )}
      </>
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

  return (
    <div id="">
      {" "}
      <Scheduler
        id="scheduler"
        startDayHour={profesorData?.settings?.startHour || "08"}
        endDayHour={profesorData?.settings?.endHour || "15"}
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

          form.itemOption("mainGroup.class", "editorOptions", {
            async onValueChanged(args) {
              let classData = await getDataDoc("claseData", args.value);
              // setResourceElevi(
              //   classData.elevi.map((res) => {
              //     return {
              //       text: res.numeDeFamilie + " " + res.prenume,
              //       value: res.id,
              //     };
              //   })
              // );

              form.itemOption("mainGroup.elev", "editorOptions", {
                fieldExpr: "elev",
                label: "Elev",

                dataSource: classData.elevi.map((res) => {
                  return {
                    text: res.numeDeFamilie + " " + res.prenume,
                    id: res.id,
                  };
                }),
              });
            },
          });
        }}
        cellDuration={60}
        dataSource={
          [...(profesorData?.ore || []), ...(profesorData?.orePrivat || [])] ||
          []
        }
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
        recurrenceExceptionExpr="exception"
        appointmentRender={RenderAppointment}
        // appointmentTooltipComponent={tooltip}
        adaptivityEnabled={true}
        timeCellTemplate={(e) =>
          new Date(e.date).toLocaleString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        }
        onAppointmentAdding={async (e) => {
          const id = Date.now();

          let elevName = "";
          if (e.appointmentData.elev) {
            let dataElev = await getDataDoc("elevi", e.appointmentData.elev);
            elevName =
              dataElev.numeDeFamilie +
              " " +
              dataElev.prenume +
              " - " +
              clase.find((c) => c.id === dataElev.clasa).anClasa +
              clase.find((c) => c.id === dataElev.clasa).identificator;
          }
          let newOre = [
            ...(profesorData?.orePrivat || []),
            {
              ...e.appointmentData,
              startDate: e.appointmentData.startDate,
              endDate: e.appointmentData.endDate,
              id,
              color: getMaterieColor(getRandomInt(10)),
              tip: "privat",
              elevName,
            },
          ];

          await updateDocDatabase("profesori", profesorData.id, {
            orePrivat: newOre.map((el) => {
              return {
                ...el,
                startDate: el.startDate.getTime(),
                endDate: el.endDate.getTime(),
              };
            }),
          });
        }}
        onAppointmentUpdating={async (e) => {
          if (e.oldData.tip !== "privat") {
            openErrorNotification("Poți edita doar orele private");
            return;
          }

          let elevName = "";
          if (e.newData.elev) {
            let dataElev = await getDataDoc("elevi", e.newData.elev);
            elevName =
              dataElev.numeDeFamilie +
              " " +
              dataElev.prenume +
              " - " +
              clase.find((c) => c.id === dataElev.clasa).anClasa +
              clase.find((c) => c.id === dataElev.clasa).identificator;
          }
          const generateUniqueId = () => {
            return Date.now() + "deleted";
          };
          // Calculăm data de sfârșit pentru programarea veche (o zi înainte de startDate-ul noii programări)
          const newEndDate = new Date(e.newData.startDate);
          newEndDate.setDate(newEndDate.getDate() - 5); // Scădem o zi întreagă

          // Formatarea în format iCalendar pentru UNTIL
          const untilDate =
            newEndDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

          // Generăm un nou ID pentru programarea veche
          const oldAppointmentNewId = generateUniqueId();

          // Actualizăm programarea veche cu noul ID și noua regulă de recurență
          const updatedOldAppointment = {
            ...e.oldData,
            id: oldAppointmentNewId,
            rule: e.oldData.rule
              ? e.oldData.rule + `;UNTIL=${untilDate}`
              : null,
          };

          // Adăugăm programarea veche actualizată și noua programare în lista de ore private
          let newOre = profesorData.orePrivat.map((cls) =>
            cls.id === e.oldData.id ? updatedOldAppointment : cls
          );

          newOre.push({
            ...e.newData,
            color: getMaterieColor(getRandomInt(10)),
            tip: "privat",
            elevName,
          });

          // Actualizăm baza de date într-un singur apel
          await updateDocDatabase("profesori", profesorData.id, {
            orePrivat: newOre.map((el) => ({
              ...el,
              startDate: el.startDate.getTime(),
              endDate: el.endDate.getTime(),
            })),
          });
        }}
        onAppointmentDeleted={async (e) => {
          if (e.appointmentData.tip !== "privat") {
            let newOre = [
              ...profesorData?.ore.filter(
                (cls) => cls.id !== e.appointmentData.id
              ),
            ];
            await updateDocDatabase("profesori", profesorData.id, {
              ore: newOre.map((el) => {
                return {
                  ...el,
                  startDate: el.startDate.getTime(),
                  endDate: el.endDate.getTime(),
                };
              }),
            });
            return;
          } else {
            let newOre = [
              ...profesorData?.orePrivat.filter(
                (cls) => cls.id !== e.appointmentData.id
              ),
            ];
            await updateDocDatabase("profesori", profesorData.id, {
              orePrivat: newOre.map((el) => {
                return {
                  ...el,
                  startDate: el.startDate.getTime(),
                  endDate: el.endDate.getTime(),
                };
              }),
            });
            return;
          }
        }}
      >
        {" "}
        <Resource dataSource={resourcesClase} fieldExpr="class" label="Clasa" />
        <Resource dataSource={[]} fieldExpr="elev" label="Elev" />
        <Editing allowDragging={false} />
        {/* Configuration goes here */}
      </Scheduler>
    </div>
  );
}

export default withErrorBoundary(OrarProfesor);
