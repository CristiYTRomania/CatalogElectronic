import {
  UserOutlined,
  ScheduleOutlined,
  CarryOutOutlined,
  SmileOutlined,
  InfoCircleOutlined,
  BookOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
  ReadOutlined,
  ContainerOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { useWindowSize } from "@react-hook/window-size";
import { useDispatch } from "react-redux";
import ProfileElevi from "../Pages/Admin/ProfileElevi";
import { Breadcrumb, Layout, Menu, theme, Image } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { getDataDoc } from "../database";
import { testSlice } from "../redux/store";
const { actions } = testSlice;
const { GET_USER, SESSION } = actions;
const { Header, Content, Footer, Sider } = Layout;
function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

const NavbarElev = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const user = useSelector((state) => state.user);
  const [width, height] = useWindowSize();
  const [open, setOpen] = useState(false);
  const [addElev, setAddElev] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = [
    user.mode === "hybrid" && getItem("Mod părinte", "parent"),
    getItem("Orar", "", <ScheduleOutlined />),
    getItem("Profesori", "profesori", <UserOutlined />),
    getItem("Clase", "clase", <ReadOutlined />),
    getItem("Elevi", "profile-elevi", <UsergroupAddOutlined />, [
      { label: "Cauta elev", key: "search-elev" },
    ]),
    getItem("Condica", "condica", <BookOutlined />),
    getItem("Feedback", "feedback", <TrophyOutlined />),
    getItem("Statistici", "statistici-clase", <LineChartOutlined />),
    getItem("Ajutor", "ajutor", <InfoCircleOutlined />),
    getItem("Profil", "profil", <SmileOutlined />),
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      breakpoint="lg"
      collapsedWidth={width <= 600 ? 0 : 70}
      style={
        window.screen.width < 750
          ? { position: "absolute", height: "100vh", zIndex: 10 }
          : {}
      }
    >
      <ProfileElevi open={openSearch} setOpen={setOpenSearch} />
      <div
        style={{ width: "200px", display: "flex", justifyContent: "center" }}
      >
        {" "}
      </div>

      <Menu
        onClick={async (e) => {
          if (e.key === "parent") {
            let u = await getDataDoc("users", user.id || user.uid);
            let e = u?.copii[0].idElev;

            let data = await getDataDoc("elevi", e);
            if (!data) return;

            let dataUser = { ...user, ...data };

            data = await getDataDoc("claseData", dataUser?.clasa);
            dispatch(
              GET_USER({
                ...dataUser,
                clasaMea: data,
                type: "elevi",
                mainType: "parinte",
                altiCopii: u?.copii,
                uid: e,
                id: e,
                oldUid: user.id || user.uid,
              })
            );
            navigate("/");
            return;
          }
          if (width < 600) setCollapsed(true);
          if (e.key === "search-elev") {
            setOpenSearch(true);
            return;
          }
          if (e.key === "mesaje") setOpen(true);
          else navigate("/" + e.key);
        }}
        theme="dark"
        defaultSelectedKeys={["1"]}
        mode="inline"
        items={items}
      />
    </Sider>
  );
};
export default NavbarElev;
