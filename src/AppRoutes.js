// AppRoutes.js
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import App from "./App";
import SaathiHome from "./pages/SaathiHome";

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              className="min-h-screen bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SaathiHome />
            </motion.div>
          }
        />
        <Route
          path="/tool"
          element={
            <motion.div
              className="min-h-screen bg-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <App />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;