import React, { useEffect, useState } from "react";
import { Card } from "antd";

import { useNavigate } from "react-router-dom";
import AddClass from "./AddClass";
import AddElev from "./AddElev";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSelector } from "react-redux";
import { Col, Row } from "antd";
import { Avatar, Skeleton, Switch, Button, Grid } from "antd";
import { RetriveImageUrl } from "../../utils";
import { createNextState } from "@reduxjs/toolkit";
import { getDataDoc } from "../../database";
import ProfileElevi from "./ProfileElevi";
import withErrorBoundary from "../../Components/withErrorComponent";
const { Meta } = Card;

function Clase() {
  const screens = Grid.useBreakpoint();
  const [cardWith, setCardWith] = useState(300);
  const user = useSelector((state) => state.user);
  const [claseToDisplay, setClaseToDisplay] = useState([]);
  const [open, setOpen] = useState(false);
  const [addElev, setAddElev] = useState(false);
  const profesori = useSelector((state) => state.profesori);
  const clase = useSelector((state) => state.clase);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [space, setSpace] = useState(30);
  const navigate = useNavigate();
  const [dimensions, setDimensions] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const handleResize = () => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };
  React.useEffect(() => {
    window.addEventListener("resize", handleResize, false);
  }, []);

  useEffect(() => {
    const newWidth = window.innerWidth;
    if (screens.xl === true) {
      setCardWith(newWidth / 5.5);
      setSpace(30);
    } else if (screens.lg === true) {
      setSpace(200);
      setCardWith(newWidth / 3);
    } else if (screens.md === true) {
      setCardWith(newWidth / 2.6);
      setSpace(200);
    } else if (screens.sm === true) {
      setCardWith(newWidth / 1.3);
      setSpace(400);
    } else if (screens.xs === true) {
      setCardWith(newWidth / 1.1);

      setSpace(200);
    }
  }, [screens]);

  const fetchData = async () => {
    const clasePromises = clase.map((cls) =>
      getDataDoc("claseData", cls.id).then((clasData) => {
        const esteProf = clasData?.materii?.some((ma) =>
          (ma?.profesori || []).includes(user.uid)
        );
        return esteProf ? cls : null;
      })
    );

    const results = await Promise.all(clasePromises);
    const filteredClase = results.filter((cls) => cls !== null);

    filteredClase.sort((a, b) => {
      const nameA = a?.anClasa + " " + a.identificator;
      const nameB = b?.anClasa + " " + b.identificator;
      return nameA < nameB ? 1 : -1;
    });

    setClaseToDisplay(filteredClase);
  };
  useEffect(() => {
    if (user.type === "admin") setClaseToDisplay(clase);
    else if (user.type === "profesor") {
      fetchData();
    }
  }, [clase, user]);

  return (
    <div>
      <h1>Clase</h1>
      <div style={{ display: "flex", gap: "10px" }}>
        {user.type === "admin" && (
          <>
            {" "}
            <Button
              type="primary"
              size="large"
              onClick={(e) => {
                setOpen(true);
                e.preventDefault();
              }}
            >
              Adaugă Clasa
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={(e) => {
                setAddElev(true);
                e.preventDefault();
              }}
            >
              Adaugă Elev
            </Button>
          </>
        )}
      </div>
      {user.type === "admin" && (
        <>
          <AddClass
            open={open}
            setConfirmLoading={setConfirmLoading}
            confirmLoading={confirmLoading}
            setOpen={setOpen}
          />
          <AddElev
            open={addElev}
            setConfirmLoading={setConfirmLoading}
            confirmLoading={confirmLoading}
            setOpen={setAddElev}
          />
        </>
      )}

      <br />
      <div>
        <Row gutter={[space, 30]}>
          {([...claseToDisplay] || [])
            .sort((a, b) => {
              let clas = a;
              let clas2 = b;

              if (
                (clas?.anClasa === "Pregătitoare"
                  ? clas?.anClasa + " " + clas?.identificator
                  : "a " + clas?.anClasa + "-a" + " " + clas?.identificator) >
                (clas2?.anClasa === "Pregătitoare"
                  ? clas2?.anClasa + " " + clas2?.identificator
                  : "a " + clas2?.anClasa + "-a" + " " + clas2?.identificator)
              )
                return 1;
              else return -1;
            })
            .map((clas, index) => {
              return (
                <Col xs={30} sm={20} md={10} lg={10} xl={6}>
                  <Card
                    onClick={() => navigate(`/class/${clas.id}`)}
                    style={{
                      width: cardWith,
                    }}
                  >
                    <Meta
                      title={
                        clas?.anClasa === "Pregătitoare" ||
                        clas?.anClasa === "I"
                          ? clas?.anClasa + " " + clas?.identificator
                          : "a " +
                            clas?.anClasa +
                            "-a" +
                            " " +
                            clas?.identificator
                      }
                      description={
                        profesori?.find((pf) => pf.id === clas.diriginte)
                          ?.numeDeFamilie +
                        " " +
                        profesori?.find((pf) => pf.id === clas.diriginte)
                          ?.prenume +
                        (profesori?.find((pf) => pf.id === clas.diriginte_step)
                          ? ", " +
                            profesori?.find(
                              (pf) => pf.id === clas.diriginte_step
                            )?.numeDeFamilie +
                            " " +
                            profesori?.find(
                              (pf) => pf.id === clas.diriginte_step
                            ).prenume
                          : "")
                      }
                    />
                  </Card>
                </Col>
              );
            })}
        </Row>
      </div>
    </div>
  );
}

export default withErrorBoundary(Clase);
