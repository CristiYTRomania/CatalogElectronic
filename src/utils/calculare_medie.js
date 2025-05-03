import { motiveazaAbsente } from "./absente";

const AbsentePurtare = 20;
export const calculare_medii = (note = [], materii, scutiri) => {
  const obj = {};

  note.forEach((n) => {
    if (obj[n.materieId] === undefined) {
      obj[n.materieId] = [];
    }

    obj[n.materieId].push(n);
  });
  let noteFinale = [];
  for (let key of Object.keys(obj)) {
    const { medie } = calculeaza_medie_materie(
      obj[key],
      materii?.find((m) => m.id === key),
      scutiri
    );
    if (medie > 0) noteFinale.push(medie);
  }

  return parseFloat(
    noteFinale.reduce((acc, curent) => {
      return acc + parseFloat(curent);
    }, 0) / (noteFinale.length || 1)
  ).toFixed(2);
};

export const calculare_medii_incheire_cursuri = (
  note = [],
  materii,
  scutiri
) => {
  const obj = {};

  note
    .filter((n) => new Date(n.date) < new Date("2025-06-21"))
    .forEach((n) => {
      if (obj[n.materieId] === undefined) {
        obj[n.materieId] = [];
      }

      obj[n.materieId].push(n);
    });
  let noteFinale = [];
  for (let key of Object.keys(obj)) {
    const { medie } = calculeaza_medie_materie(
      obj[key],
      materii?.find((m) => m.id === key),
      scutiri
    );
    if (medie > 0) noteFinale.push(medie);
  }

  return parseFloat(
    noteFinale.reduce((acc, curent) => {
      return acc + parseFloat(curent);
    }, 0) / (noteFinale.length || 1)
  ).toFixed(2);
};
//am redus oricum numarul de cataloage, exista doua locuri unde se face media
//e prea complicat sa emulam

export function calculeaza_medie_materie(
  note = [],
  materie = {},
  scutiri = []
) {
  let materieId = materie.id;
  let inchis = (note || [])?.find(
    (n) => n.materieId === materieId && n.tip === "inchidere_medie"
  );
  let corigenta = (note || []).find(
    (n) => n.materieId === materieId && n.tip === "corigenta"
  );

  ///medie inchisă și corigenta

  //medie deschisa dar corigenta
  //

  const calificative = {
    FB: 1,
    B: 2,
    S: 3,
    I: 4,
  };
  let freq = {};
  let notaFinala = 0,
    frv = 0;
  if (materie?.notare === false) {
    for (const num of note?.filter(
      (n) => n.materieId === materieId && n.tip === "nota"
    )) {
      freq[calificative[num.nota]] = freq[calificative[num.nota]]
        ? freq[calificative[num.nota]] + 1
        : 1;
    }

    if (frv < freq[1]) {
      frv = freq[1];
      notaFinala = "FB";
    }
    if (frv < freq[2]) {
      frv = freq[2];
      notaFinala = "B";
    }
    if (frv < freq[3]) {
      frv = freq[3];
      notaFinala = "S";
    }
    if (frv < freq[4]) {
      frv = freq[4];
      notaFinala = "I";
    }
  }
  let medie = {};

  let medieFinala = 0;

  let sum = note
    .filter((n) => n.materieId === materieId && n.tip === "nota")
    .reduce((acc, curent) => {
      return acc + parseInt(curent.nota);
    }, 0);

  if (
    (note || []).find(
      (n) => n.materieId === materieId && n.tip === "examen_final"
    ) === undefined
  ) {
    medieFinala = Math.round(
      sum /
        ((note || []).filter(
          (n) => n.materieId === materieId && n.tip === "nota"
        )?.length || 1)
    );
  } else if (
    (note || []).find(
      (n) => n.materieId === materieId && n.tip === "examen_final"
    )
  ) {
    let ef = (note || []).find(
      (n) => n.materieId === materieId && n.tip === "examen_final"
    ).examen_final;

    medieFinala = Math.round(
      sum /
        ((note || []).filter(
          (n) => n.materieId === materieId && n.tip === "nota"
        )?.length || 1)
    );
    let rawNumber = (parseFloat(medieFinala) + parseFloat(ef)) / 2;
    let roundedNumber = Math.round(rawNumber * 1000) / 1000; // Pas intermediar pentru a influența rotunjirea

    roundedNumber = Math.round(Math.round(roundedNumber * 1000) / 10) / 100; // Rotunjire la două zecimale cu influența zecimalei a treia

    medieFinala = roundedNumber;
  }

  if (inchis && corigenta) {
    medie = {
      medie: inchis.inchidere_medie,
      inchis: inchis,
      corigenta: corigenta,
      inchis: inchis,
      medieInitiala: medieFinala,
      noteInsuficiente:
        (note || []).filter(
          (n) => n.materieId === materieId && n.tip === "nota"
        )?.length < 4,
    };
  }
  //medie inchisa fara corigenta
  else if (inchis && !corigenta) {
    medie = {
      medie: inchis.inchidere_medie,
      corigenta: undefined,
      inchis: inchis,
    };
  } else if (corigenta) {
    medie = {
      medie: corigenta.corigenta,
      medieInitiala: medieFinala,

      corigenta: corigenta,
      inchis: false,
      noteInsuficiente:
        (note || []).filter(
          (n) => n.materieId === materieId && n.tip === "nota"
        )?.length < 4,
    };
  } else {
    //nu este inchis, este calculata
    medie = {
      medie: materie.notare === false ? notaFinala : medieFinala,
      inchis: false,
      corigenta: false,
    };
    if (materie.numeMaterie?.includes("Purtare")) {
      medieFinala = Math.max(
        medieFinala -
          parseInt(
            motiveazaAbsente(note, scutiri).absente_nemotivate.length /
              AbsentePurtare
          ),
        0
      );
      medie = {
        medie: materie.notare === false ? notaFinala : medieFinala,
        inchis: false,
        corigenta: false,
      };
    }
  }

  return {
    ...medie,
    render: () => {
      if (medie.inchis) {
        return (
          <div>
            {" "}
            {medie.corigenta && (
              <p
                style={{
                  borderBottom: "1px solid purple",
                  width: "auto",
                  fontSize: "16px",
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                Media intiala: {medie.medieInitiala}
              </p>
            )}
            {medie.corigenta && (
              <p
                style={{
                  borderBottom: "1px solid purple",
                  width: "auto",

                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {medie.noteInsuficiente
                  ? "Medie neîncheiat"
                  : "Media corigență"}
                : {medie.medie}
              </p>
            )}
            <p
              style={{
                border: "1px solid purple",
                width: "auto",
                fontSize: "25px",
                textAlign: "center",
                display: "flex",

                justifyContent: "center",
                pageBreakInside: "avoid",
                pageBreakAfter: "auto",
              }}
            >
              {medie.medie}
            </p>
          </div>
        );
      }
      if (medie.medie === "-") return <p>-</p>;
      return (
        <div style={{}}>
          {medie.corigenta && (
            <p
              style={{
                borderBottom: "1px solid purple",
                width: "auto",
                fontSize: "16px",
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              Media intiala: {medie.medieInitiala}
            </p>
          )}
          {medie.corigenta && (
            <p
              style={{
                borderBottom: "1px solid purple",
                width: "auto",

                textAlign: "center",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {medie.noteInsuficiente
                ? "Medie neîncheiat: "
                : "Media corigență: "}
              {medie.medie}
            </p>
          )}
          <p
            style={{
              broder: "1px solid purple",
              width: "auto",
              fontSize: "16px",

              textAlign: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {medie.corigenta
              ? "Media finala:" + " " + medie.medie
              : medie.medie}
          </p>
        </div>
      );
    },
  };
}
