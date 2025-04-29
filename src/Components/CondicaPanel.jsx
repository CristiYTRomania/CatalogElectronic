import React, { useState } from "react";
import { useReactToPrint } from "react-to-print";
import { DatePicker, Button } from "antd";
import { useSelector } from "react-redux";
import CondicaExport from "./CondicaExport";
import dayjs from "dayjs";
import moment from "moment";
import { Switch } from "antd";
const { RangePicker } = DatePicker;

function CondicaPanel() {
  const componentRef = React.useRef();
  const [loading, setLoading] = useState(false);
  const [finish, setFinish] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [valeaSpinului, setValeaSpinului] = useState(false);
  const [endDate, setEndDate] = useState(null);
  const settings = useSelector((state) => state.settings);
  const [perCadru, setPerCadru] = useState(true);
  const [vacante, setVacante] = useState(false);
  const [startDateFormat, setStartDateFormat] = useState();
  const [endDateFormat, setEndDateFormat] = useState();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
    @page {
        size: auto;
        margin: 11mm 17mm 17mm 17mm;

        @bottom-right{
            content: "Page " counter(page);
          }
}`,
  });
  const [dateRange, setDateRange] = React.useState(null);

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const handleExport = () => {
    if (dateRange) {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");
      const startDateFormat = dateRange[0].format("DD.MM.YYYY");
      const endDateFormat = dateRange[1].format("DD.MM.YYYY");
      setStartDateFormat(startDateFormat);
      setEndDateFormat(endDateFormat);
      setStartDate(startDate);
      setEndDate(endDate);
      setLoading(true);
      setLoading(false);
      setFinish(true);
      //   setTimeout(() => {
      //     setLoading(false);
      //     setFinish(true);
      //   }, [4 * 60000]);
      // Aici poți adăuga logica pentru exportul efectiv al condicii
    } else {
    }
  };

  const [profesori, setProfesori] = useState(true);
  return (
    <div>
      <h2>Selectează intervalul pentru exportul condicii</h2>
      <Switch
        checkedChildren="Profesori"
        unCheckedChildren="Administrativ"
        checked={profesori}
        onChange={(e) => setProfesori(e)}
      />
      <Switch
        checkedChildren="Per cadru"
        unCheckedChildren="Per zi"
        checked={perCadru}
        onChange={(e) => setPerCadru(e)}
      />
      <Switch
        checkedChildren="Include vacantele"
        unCheckedChildren="Nu include vacantele"
        checked={vacante}
        onChange={(e) => setVacante(e)}
      />
      <RangePicker
        onChange={handleDateChange}
        style={{ marginBottom: 20 }}
        format="YYYY-MM-DD"
      />
      {process.env.REACT_APP_NAME ===
        `Școala Gimnazială "Mihai Eminescu" Năsăud` && (
        <Switch
          checkedChildren="Valea Spinului"
          unCheckedChildren="Centru"
          checked={valeaSpinului}
          onChange={(e) => setValeaSpinului(e)}
        />
      )}
      {loading === false && (
        <Button type="primary" onClick={handleExport}>
          Exportă Condica
        </Button>
      )}
      {loading === true && <p>Se incarca, dureaza aproximativ 4 minute</p>}

      <div
      //   style={{ display: "none" }}
      >
        <div ref={componentRef}>
          <br />
          <br />
          <div
            style={{
              marginTop: "50%",
              textAlign: "center",
              pageBreakAfter: "always",
            }}
          >
            <h1>{settings?.numeInstitutie}</h1>

            <h3>Condică de prezență</h3>
            <h4>
              {startDateFormat} - {endDateFormat}
            </h4>
          </div>
          <br />
          {startDate && endDate && (
            <CondicaExport
              vacante={vacante}
              perCadru={perCadru}
              startDate={startDate}
              endDate={endDate}
              condicaProfi={profesori}
              valeaSpinului={valeaSpinului}
            />
          )}
        </div>
        {finish === true && (
          <Button
            type="primary"
            onClick={() => {
              handlePrint();
            }}
          >
            Descarca
          </Button>
        )}
      </div>
    </div>
  );
}

export default CondicaPanel;
