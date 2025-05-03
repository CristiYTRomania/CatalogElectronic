import {
  FileOutlined,
  UserOutlined,
  ScheduleOutlined,
  UsergroupAddOutlined,
  CarryOutOutlined,
  OrderedListOutlined,
  SettingOutlined,
  MessageOutlined,
  FileSearchOutlined,
  SmileOutlined,
  HeartOutlined,
  BookOutlined,
  PushpinOutlined,
  HomeOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  useWindowSize,
  useWindowWidth,
  useWindowHeight,
} from "@react-hook/window-size";
import { Avatar, Badge, Space } from "antd";
import { Breadcrumb, Layout, Menu, theme, Image } from "antd";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Docs from "./Docs";
import { useSelector } from "react-redux";
import { getDataDoc } from "../database";
import { testSlice } from "../redux/store";
import Chats from "../Pages/Chats/View";
import { useDispatch } from "react-redux";
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
  const [width, height] = useWindowSize();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const items = [
    user.mode === "hybrid" && getItem("Mod profesor", "profesor"),
    getItem("Orar", "", <ScheduleOutlined />),
    getItem("Note", "elev-catalog", <CarryOutOutlined />),
    getItem("Anunțuri", "anunturi", <CarryOutOutlined />),

    getItem("Teme", "teme", <FileOutlined />),
    getItem("Comentarii", "comentarii-elev", <PushpinOutlined />),
    getItem("Scutiri", "scutiri-elev", <HeartOutlined />),

    getItem("Lecții", "lectii-elev", <BookOutlined />),

    getItem("Profil", "profil", <SmileOutlined />),
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      breakpoint="lg"
      style={
        window.screen.width < 750
          ? { position: "absolute", height: "100vh", zIndex: 10 }
          : {}
      }
      collapsedWidth={width <= 800 ? 0 : 70}
    >
      <Chats open={open} setOpen={setOpen} />
      <div
        style={{ width: "200px", display: "flex", justifyContent: "center" }}
      >
        {" "}
      </div>

      <Menu
        onClick={async (e) => {
          if (e.key === "profesor") {
            let u = await getDataDoc("users", user.id || user.uid);
            dispatch(
              GET_USER({
                ...user,
                ...u,
                type: "profesor",
                mainType: "profesor",
                copii: [],
                id: user.oldUid,
                uid: user.oldUid,
              })
            );
            navigate("/");
            return;
          }
          if (width < 600) setCollapsed(true);
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
