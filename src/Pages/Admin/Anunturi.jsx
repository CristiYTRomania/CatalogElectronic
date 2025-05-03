import React, { useState } from "react";
import { Button } from "antd";
import AdaugaAnunt from "./AdaugaAnunt";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import ShowAnunt from "./ModalAnunt";
import "./Anunturi.css";
function Anunturi() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const anunturi = useSelector((state) => state.anunturi);
  const [show, setShow] = useState();
  const [index, setIndex] = useState();
  const [ticket, setTicket] = useState();
  const user = useSelector((state) => state.user);

  return (
    <div>
      <AdaugaAnunt open={isModalOpen} setIsModalOpen={setIsModalOpen} />
      <ShowAnunt open={show} setIsModalOpen={setShow} anunt={ticket} />
      {user.type === "admin" && user.subType === "director" && (
        <Button
          onClick={() => {
            setIsModalOpen(true);
          }}
        >
          Adaugă anunț
        </Button>
      )}

      <ul className="note">
        {[...anunturi]
          ?.sort((a, b) => {
            if (a.date < b.date) return 1;
            else return -1;
          })
          .map((ticket, index) => {
            return (
              <li>
                <a
                  style={{ overflow: "hidden" }}
                  onClick={() => {
                    setShow(true);
                    setIndex(index);
                    setTicket(ticket);
                  }}
                >
                  <h6>{ticket.tiltlu}</h6>

                  <p>{ticket.text}</p>
                </a>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
export default Anunturi;
