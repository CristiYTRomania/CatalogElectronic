const Limit = 40;

export const motiveaza_absenta = (absenta, scutire) => {
  return (scutire.ranges || []).find(
    (range) => absenta.date >= range.start && absenta.date <= range.end
  );
};

export const motiveazaAbsente = (catalog = [], scutiriRaw = []) => {
  //va returna absentele inapoi, dar va returna motivat:true, daca este motivata
  //va retuna si scutire, care va da obiectul scutirii care o motiveaza

  let scutiri = scutiriRaw.filter(
    (scutire) =>
      scutire.verified === "accepted" &&
      (scutire.tip === "bilet" || scutire.tip === "scutire")
  );

  let absente = catalog.filter((nota) => nota.tip === "absenta");

  let absenteMotivateBilet = [];

  const absente_dupa_motivari = absente.map((absenta) => {
    if (
      scutiri
        .filter((scutire) => scutire.tip !== "bilet")
        ?.find((scut) => motiveaza_absenta(absenta, scut))
    ) {
      return {
        ...absenta,
        motivat: true,
        scutire: scutiri
          .filter((scutire) => scutire.tip !== "bilet")
          ?.find((scut) => motiveaza_absenta(absenta, scut)),
      };
    }

    if (
      scutiri?.find((scut) => motiveaza_absenta(absenta, scut)) &&
      scutiri
        .filter((scutire) => scutire.tip !== "bilet")
        ?.find((scut) => motiveaza_absenta(absenta, scut)) === undefined &&
      absenteMotivateBilet.length < Limit
    ) {
      absenteMotivateBilet.push({
        ...absenta,
        motivat: true,
        scutire: scutiri?.find((scut) => motiveaza_absenta(absenta, scut)),
      }); //se motiveaza doar prin bilet
      return {
        ...absenta,
        motivat: true,
        scutire: scutiri?.find((scut) => motiveaza_absenta(absenta, scut)),
      };
    }
    let obj = {};
    if (absenta.intarziat === true) {
      obj = { scutire: { tip: "intarziat" } };
    }
    return {
      ...absenta,
      motivat: absenta.intarziat === true ? true : false,
      ...obj,
    };
  });

  return {
    absente_dupa_motivari: absente_dupa_motivari,
    absente_motivate_bilet: absenteMotivateBilet,
    critic:
      absente_dupa_motivari.filter((absenta) => absenta.motivat === false)
        .length > 19,
    absente_motivate: absente_dupa_motivari.filter(
      (absenta) => absenta.motivat === true
    ),
    absente_nemotivate: absente_dupa_motivari.filter(
      (absenta) => absenta.motivat === false
    ),
    absenteBiletRamase: Limit - absenteMotivateBilet.length,
  };
};
