// AppRoutes.js
import React from "react";
import starwarsBg from "./assets/starwars-bg.jpg";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import App from "./App";
import DarthVader from "./DarthVader";

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              className="min-h-screen bg-black bg-cover bg-center"
              style={{ backgroundImage: `url(${starwarsBg})` }}
              initial={{ opacity: 0, scale: 0.9, rotateX: 45 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotateX: -45 }}
              transition={{ duration: 1 }}
            >
              <App />
            </motion.div>
          }
        />
        <Route
          path="/darth-vader"
          element={
            <motion.div
              className="min-h-screen bg-black bg-cover bg-center"
              style={{ backgroundImage: `url(${starwarsBg})` }}
              initial={{ opacity: 0, scale: 0.9, rotateX: 45 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotateX: -45 }}
              transition={{ duration: 1 }}
            >
              <DarthVader />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;