import { notification } from "antd";
export const openSuccesNotification = (succesMessage) => {
  notification["success"]({
    message: "SUCCESS",
    description: succesMessage,
  });
};
