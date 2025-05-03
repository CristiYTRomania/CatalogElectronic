import React, { useState, useEffect, useRef } from "react";
import { Input, Modal } from "antd";
import { collection, query, getDocs } from "firebase/firestore";
import { useSelector } from "react-redux";
import { db } from "../../database/firebase";
import { openErrorNotification } from "../../Components/Notifications/errorNotification";
import { useNavigate } from "react-router-dom";
import { renderClassName } from "../../utils";
import withErrorBoundary from "../../Components/withErrorComponent";

const { Search } = Input;

function normalizeString(str = "") {
  if (!str || typeof str !== "string") return "";
  return str
    .normalize("NFD") // Normalizează string-ul la forma decompusă
    .replace(/[\u0300-\u036f]/g, "") // Elimină diacriticele
    .toLowerCase(); // Transformă în litere mici
}

function calculateMatchScore(searchWords, data) {
  let score = 0;

  searchWords.forEach((word) => {
    if (data.fullName.includes(word)) score += 3; // Prioritate pentru potrivirea completă
    if (data.normalizedNumeFamilie.includes(word)) score += 2;
    if (data.normalizedPrenume.includes(word)) score += 2;
    if (data.normalizedCnp.includes(word)) score += 1;
    if (data.normalizedEmail.includes(word)) score += 1;
    if (data.normalizedId.includes(word)) score += 1;
    if (data.normalizedParinti.find((p) => p.includes(word))) score += 2;
  });

  return score;
}

function ProfileElevi({ open, setOpen }) {
  const [filteredData, setFilteredData] = useState([]);
  const [searchValue, setSearchValue] = useState(""); // Valoarea curentă a câmpului de căutare
  const [activeIndex, setActiveIndex] = useState(0); // Indexul activ pentru navigare
  const user = useSelector((state) => state.user);
  const clase = useSelector((state) => state.clase);
  const navigate = useNavigate();
  const ref = useRef();

  useEffect(() => {
    if (searchValue.trim() !== "") {
      const timeout = setTimeout(() => {
        onSearch(searchValue);
      }, 300); // Debounce de 300ms
      return () => clearTimeout(timeout);
    } else {
      setFilteredData([]);
    }
  }, [searchValue]);

  const onSearch = async (value) => {
    const normalizedSearchString = normalizeString(value);
    if (!normalizedSearchString) {
      setFilteredData([]);
      return;
    }

    const searchWords = normalizedSearchString.split(" ");
    const q = query(collection(db, "elevi"));

    try {
      const array = [];
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        if (!doc.data()) return;

        const normalizedNumeFamilie = normalizeString(
          doc.data().numeDeFamilie || ""
        );
        const normalizedPrenume = normalizeString(doc.data().prenume || "");
        const normalizedCnp = normalizeString(doc.data().cnp || "");
        const normalizedEmail = normalizeString(doc.data().adresaEmail || "");
        const normalizedId = normalizeString(doc.data().id || "");
        const normalizedParinti = (doc.data().parintii || []).map((e) =>
          normalizeString(e || "")
        );

        const fullName = `${normalizedNumeFamilie} ${normalizedPrenume}`;

        const matchScore = calculateMatchScore(searchWords, {
          fullName,
          normalizedNumeFamilie,
          normalizedPrenume,
          normalizedCnp,
          normalizedEmail,
          normalizedId,
          normalizedParinti,
        });

        if (matchScore > 0) {
          array.push({
            id: doc.id,
            numeDeFamilie: doc.data().numeDeFamilie,
            prenume: doc.data().prenume,
            adresaEmail: doc.data().adresaEmail,
            cnp: doc.data().cnp,
            class: doc.data().clasa,
            parintii: doc.data().parintii,
            matchScore,
          });
        }
      });

      // Sortează după scor descrescător
      array.sort((a, b) => b.matchScore - a.matchScore);

      setFilteredData(array);
      setActiveIndex(0); // Resetează indexul activ
    } catch (err) {
      console.log(err);
      openErrorNotification("Nu a mers căutarea");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setActiveIndex((prevIndex) => (prevIndex + 1) % filteredData.length);
    } else if (e.key === "ArrowUp") {
      setActiveIndex((prevIndex) =>
        prevIndex === 0 ? filteredData.length - 1 : prevIndex - 1
      );
    } else if (e.key === "Enter" && filteredData[activeIndex]) {
      navigate("/elev/" + filteredData[activeIndex].id);
      setOpen(false);
    }
  };

  return (
    <div>
      <Modal
        title="Caută elev"
        open={open}
        footer={null}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        <Search
          placeholder="Introdu numele elevului"
          onSearch={onSearch}
          enterButton
          onChange={(e) => setSearchValue(e.target.value)} // Actualizare în timp real
          value={searchValue}
          onKeyDown={handleKeyDown} // Gestionare săgeți și Enter
        />
        <div className="dataResult" tabIndex={0} ref={ref}>
          {filteredData.slice(0, 10).map((value, indexx) => (
            <div
              className="dataItem"
              key={value.id}
              onClick={() => {
                navigate("/elev/" + value.id);
                setOpen(false);
              }}
              onMouseEnter={() => setActiveIndex(indexx)} // Schimbare index activ pe hover
              style={{
                border: "1px solid black",
                cursor: "pointer",
                padding: "8px",
                margin: "4px 0",
                backgroundColor:
                  activeIndex === indexx ? "dodgerblue" : "white",
                color: activeIndex === indexx ? "white" : "black",
              }}
            >
              <h3>
                {value.numeDeFamilie} {value.prenume} -{" "}
                {renderClassName(clase.find((c) => c.id === value.class))}
              </h3>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default withErrorBoundary(ProfileElevi);
