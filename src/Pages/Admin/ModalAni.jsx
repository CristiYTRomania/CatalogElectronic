import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import { Button, Descriptions, Modal, Space } from "antd";
import { deleteDataDoc, updateDocDatabase } from "../../database";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
function ShowAnunt({ open, setIsModalOpen }) {
  const ani = useSelector((state) => state.ani);
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <Modal
      title="Sterge Ani"
      open={open}
      onOk={handleCancel}
      onCancel={handleCancel}
    >
      {ani.map((an) => (
        <>
          <Space>
            <Descriptions>
              <Descriptions.Item label={an}>
                <Button
                  danger
                  onClick={async () => {
                    await updateDocDatabase("ani", "ani", {
                      ani: ani.filter((a) => a !== an),
                    });
                  }}
                >
                  Sterge
                </Button>
              </Descriptions.Item>
            </Descriptions>
          </Space>
          <br />
        </>
      ))}
    </Modal>
  );
}
export default ShowAnunt;
