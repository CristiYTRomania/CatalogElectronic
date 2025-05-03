import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Select, Button } from "antd";
import { DeleteOutlined, MenuOutlined } from "@ant-design/icons";

export function SortableItem({
  materie = {},
  materii,
  setMaterii,
  materiiRedux = [],
  profesori,
  index,
  id,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: id,
      disabled: false,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div style={{ ...style, paddingTop: "20px" }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        {/* Drag handle - doar pe acest element se activează dragul */}
        <MenuOutlined
          style={{ cursor: "grab" }}
          {...listeners}
          ref={setNodeRef}
          {...attributes}
        />
        <Select
          showSearch
          placeholder="Materie"
          optionFilterProp="children"
          value={materie.materie}
          onChange={(value) => {
            let subjects = JSON.parse(JSON.stringify(materii));
            subjects[index].materie = value;
            setMaterii(subjects);
          }}
          options={materiiRedux.map((mat) => ({
            label: mat.numeMaterie + "-" + mat.profil,
            value: mat.id,
          }))}
        />
        <Select
          mode="multiple"
          showSearch
          placeholder="Profesor"
          value={materie.profesori}
          onChange={(value) => {
            let subjects = JSON.parse(JSON.stringify(materii));
            subjects[index].profesori = value;
            setMaterii(subjects);
          }}
          options={(
            materiiRedux.find((mat) => mat.id === materie?.materie)
              ?.profesori || []
          ).map((profID) => {
            let prof = profesori.find((pf) => pf.id === profID);
            return {
              label: prof?.numeDeFamilie + "-" + prof?.prenume,
              value: prof?.id,
            };
          })}
        />
        <Button
          icon={<DeleteOutlined />}
          danger
          onClick={() => {
            setMaterii(materii.filter((_, i) => i !== index));
          }}
        />
      </div>
    </div>
  );
}
