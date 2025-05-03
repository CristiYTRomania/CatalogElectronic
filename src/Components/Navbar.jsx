import {
  FileOutlined,
  UserOutlined,
  ScheduleOutlined,
  UsergroupAddOutlined,
  CarryOutOutlined,
  OrderedListOutlined,
  LineChartOutlined,
  CoffeeOutlined,
  SettingOutlined,
  MessageOutlined,
  SmileOutlined,
  ContainerOutlined,
  HomeOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  ReadOutlined,
  HeartOutlined,
  BookOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  useWindowSize,
  useWindowWidth,
  useWindowHeight,
} from "@react-hook/window-size";
import { Avatar, Badge, Space } from "antd";
import AddElev from "../Pages/Admin/AddElev";
import { Breadcrumb, Layout, Menu, theme, Image } from "antd";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { useSelector } from "react-redux";
import ProfileElevi from "../Pages/Admin/ProfileElevi";
import { getDocs, collection, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";
import { db } from "../database/firebase";
const { Header, Content, Footer, Sider } = Layout;

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

const Navbar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const user = useSelector((state) => state.user);
  const [width, height] = useWindowSize();
  const [open, setOpen] = useState(false);
  const [addElev, setAddElev] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [inWaiting, setInWating] = useState(false);
  const [inWaitingStergeri, setInWaitingStergeri] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(db, "no-verify-scutiri"));

    let array = [];
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots

      array.push({
        ...doc.data(),
      });
    });
    setInWating(array.filter((s) => s.verified === "waiting").length > 0);

    const querySnapshot1 = await getDocs(collection(db, "no-verify-stergeri"));

    let array1 = [];
    querySnapshot1.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots

      array1.push({
        ...doc.data(),
      });
    });
    setInWaitingStergeri(
      array1.filter((s) => s.delete === "waiting").length > 0
    );
  };

  useEffect(() => {
    fetchData();
    const unsub3 = onSnapshot(collection(db, "no-verify-scutiri"), (doc) => {
      fetchData();
    });
    return unsub3;
  }, []);
  const items = [
    getItem("Orar", "", <ScheduleOutlined />),

    getItem("Profesori", "profesori", <UserOutlined />),

    getItem("Elevi", "profile-elevi", <UsergroupAddOutlined />, [
      {
        label: "Adauga Elev",
        key: "add-elev",
      },
      { label: "Cauta elev", key: "search-elev" },
    ]),
    getItem("Clase", "clase", <ReadOutlined />),
    getItem("Anunțuri", "anunturi", <CarryOutOutlined />),
    getItem(
      "Scutiri și Motivări",
      "scutiri",
      inWaiting === true ? (
        <div style={{ fontSize: "30px", color: "red", fontWeight: "bold" }}>
          !
        </div>
      ) : (
        <HeartOutlined />
      )
    ),
    user.subType === "director" &&
      getItem(
        "Stergeri",
        "stergeri-note",
        inWaitingStergeri === true ? (
          <div style={{ fontSize: "30px", color: "red", fontWeight: "bold" }}>
            !
          </div>
        ) : (
          <DeleteOutlined />
        )
      ),

    getItem("Statistici", "statistici", <LineChartOutlined />, [
      {
        label: "Statistici Clase",
        key: "statistici-clase",
      },
      { label: "Statistici Scoala", key: "statistici-scoala" },
    ]),

    getItem("Jurnal", "changelog", <ContainerOutlined />),
    getItem(user.displayName, `profil`, <SmileOutlined />),

    getItem("Setări", "setari", <SettingOutlined />),
  ];

  return (
    <Sider
      collapsible
      style={
        window.screen.width < 750
          ? { position: "absolute", height: "100vh", zIndex: 10 }
          : {}
      }
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      breakpoint="lg"
      collapsedWidth={width <= 600 ? 0 : 70}
    >
      <AddElev
        open={addElev}
        setConfirmLoading={setConfirmLoading}
        confirmLoading={confirmLoading}
        setOpen={setAddElev}
      />
      <ProfileElevi open={openSearch} setOpen={setOpenSearch} />

      <div
        style={{ width: "200px", display: "flex", justifyContent: "center" }}
      >
        {" "}
      </div>

      <Menu
        onClick={(e) => {
          if (width < 600) setCollapsed(true);

          if (e.key === "search-elev") {
            setOpenSearch(true);
            return;
          }
          if (e.key === "add-elev") {
            setAddElev(true);
            return;
          }
          if (e.key === "mesaje") setOpen(true);
          else {
            navigate("/" + e.key);
          }
        }}
        theme="dark"
        defaultSelectedKeys={["1"]}
        mode="inline"
        items={items}
      />
    </Sider>
  );
};
export default Navbar;
