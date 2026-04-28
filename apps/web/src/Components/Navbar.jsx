import React from "react";
import { useEffect, useState } from "react";
import "../Styles/Navbar.css";
import logo from "../../public/Images/logo.png";

const Navbar = () => {
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShow(false); // scroll down → hide
      } else {
        setShow(true); // scroll up → show
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className={`navbar ${show ? "show" : "hide"}`}>
      <div className="logo">
        {" "}
        <img src={logo} alt="Logo" />{" "}
      </div>

      <div className="navlinks">
        <h3>Home</h3>
        <h3>How it Works</h3>
        <h3>About Us</h3>
        <h3>Features</h3>
        <h3>Artist</h3>
      </div>

      <div className="user">
        <h3>Download App</h3>
        <div></div>
      </div>
    </div>
  );
};

export default Navbar;
