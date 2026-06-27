import React from "react";
import { useEffect, useState } from "react";
import "../Styles/Navbar.css";

const Navbar = ({ onAdminClick }) => {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShow(false); // scroll down → hide
      } else {
        setShow(true); // scroll up → show
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={`navbar ${show ? "show" : "hide"}`}>
      <div className="logo" onClick={() => scrollToSection("home")} style={{ cursor: "pointer" }}>
        <img src="/Images/logo.png" alt="GlamAI Logo" />
      </div>

      <div className="navlinks">
        <span onClick={() => scrollToSection("home")}>Home</span>
        <span onClick={() => scrollToSection("features")}>Features</span>
        <span onClick={() => scrollToSection("advantages")}>Advantages</span>
        <span onClick={() => scrollToSection("how-it-works")}>How It Works</span>
      </div>

      <div className="nav-actions">
         
        <button className="download-btn" onClick={() => scrollToSection("download")}>Download</button>
      </div>
    </div>
  );
};

export default Navbar;
