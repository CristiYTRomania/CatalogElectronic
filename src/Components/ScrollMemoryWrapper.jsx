import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const ScrollMemoryWrapper = ({ children }) => {
  const location = useLocation();
  const scrollPositions = useRef({}); // Obiect pentru stocarea pozițiilor scroll-ului

  // Salvează poziția scroll-ului când se schimbă locația
  useEffect(() => {
    const saveScrollPosition = () => {
      scrollPositions.current[location.key || location.pathname] =
        window.scrollY;
    };

    window.addEventListener("beforeunload", saveScrollPosition);

    return () => {
      saveScrollPosition(); // Salvează poziția înainte de schimbarea locației
      window.removeEventListener("beforeunload", saveScrollPosition);
    };
  }, [location]);

  // Restaurează poziția scroll-ului când locația se schimbă
  useEffect(() => {
    const savedScrollPosition =
      scrollPositions.current[location.key || location.pathname] || 0;
    window.scrollTo(0, savedScrollPosition); // Restaurează poziția salvată
  }, [location]);

  return <>{children}</>;
};

export default ScrollMemoryWrapper;
