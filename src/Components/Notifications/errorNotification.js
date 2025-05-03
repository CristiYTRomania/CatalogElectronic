import { notification } from "antd";
export const openErrorNotification = (errorMessage) => {
  if (
    typeof errorMessage === "string" &&
    errorMessage.includes("invalid-credential")
  )
    notification["error"]({
      message: "EROARE",
      description: "Parola sau email gresit",
    });
  else
    notification["error"]({
      message: "EROARE",
      description: errorMessage,
    });
};
