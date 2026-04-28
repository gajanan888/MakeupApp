import React from "react";
import logo from "../assets/Images/logo-removebg-preview.png";
import "../Styles/Navbar.css";

const Navbar = () => {
  return (
    <>
      <div className="navbar">
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>
        
        <div className="navlinks">
          <h3>Home</h3>
          <h3>How it Works</h3>
          <h3>About Us</h3>
          <h3>Features</h3>
          <h3>Artist</h3>
          <h3>Download App</h3>
        </div>
        
      </div>
    </>
  );
};

export default Navbar;
