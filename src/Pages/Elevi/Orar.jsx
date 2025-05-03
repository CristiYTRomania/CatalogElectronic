import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import OrarElev from "../../Components/OrarElev";
import { getDataDoc } from "../../database";
import withErrorBoundary from "../../Components/withErrorComponent";
function Orar() {
  const user = useSelector((state) => state.user);
  const [classData, setClassData] = useState(null);

  const fetch = async () => {
    let clas = await getDataDoc("claseData", user.clasa);

    setClassData({
      ...clas,
      ore: clas?.ore?.map((el) => {
        return {
          ...el,
          startDate: new Date(el.startDate),
          endDate: new Date(el.endDate),
        };
      }),
    });
  };
  useEffect(() => {
    fetch();
  }, [user]);
  return classData && <OrarElev classData={classData} />;
}

export default withErrorBoundary(Orar);
