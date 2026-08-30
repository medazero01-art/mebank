"use client";

import { useState, useRef } from "react";
import { RolePlay } from "@/data";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function Home() {
  const [lang, setLang] = useState("EN");
  const [activeDepartment, setActiveDepartment] = useState("mechanics");
  const [activeCategory, setActiveCategory] = useState("repairs");
  const [activeSubcategory, setActiveSubcategory] = useState("glass");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  
  // Hook to detect prefers-reduced-motion
  const shouldReduceMotion = useReducedMotion();

  // Track active timeout to clear it if another button is clicked
  const timeoutRef = useRef(null);

  // Keep track of which categories are expanded in the sidebar
  const [expandedCategories, setExpandedCategories] = useState({
    repairs: true,
  });

  const toggleCategory = (catKey) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const selectSubcategory = (catKey, subcatKey) => {
    setActiveCategory(catKey);
    setActiveSubcategory(subcatKey);
    setMobileMenuOpen(false);
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setCopiedKey(key);
      timeoutRef.current = setTimeout(() => {
        setCopiedKey(null);
        timeoutRef.current = null;
      }, 1500);
    });
  };

  const handleDepartmentChange = (deptKey) => {
    setActiveDepartment(deptKey);
    const deptCategories = RolePlay[lang][deptKey] || {};
    const firstCat = Object.keys(deptCategories)[0];
    if (firstCat) {
      setActiveCategory(firstCat);
      const firstSub = Object.keys(deptCategories[firstCat])[0];
      if (firstSub) {
        setActiveSubcategory(firstSub);
      }
      // Expand the first category
      setExpandedCategories({
        [firstCat]: true
      });
    } else {
      setActiveCategory("");
      setActiveSubcategory("");
      setExpandedCategories({});
    }
  };

  const handleLangChange = (newLang) => {
    setLang(newLang);
    const depts = Object.keys(RolePlay[newLang]);
    // Try to keep the active department if it exists in the new language, otherwise pick first
    const targetDept = depts.includes(activeDepartment) ? activeDepartment : depts[0];
    if (targetDept) {
      setActiveDepartment(targetDept);
      const deptCategories = RolePlay[newLang][targetDept] || {};
      const firstCat = Object.keys(deptCategories)[0];
      if (firstCat) {
        setActiveCategory(firstCat);
        const firstSub = Object.keys(deptCategories[firstCat])[0];
        if (firstSub) {
          setActiveSubcategory(firstSub);
        }
        // Expand the first category
        setExpandedCategories({
          [firstCat]: true
        });
      }
    }
  };

  const departments = Object.keys(RolePlay[lang] || {});
  const currentDeptData = RolePlay[lang][activeDepartment] || {};
  const activeCategoryData = currentDeptData[activeCategory] || {};
  const activeSubcategoryScenes = activeCategoryData[activeSubcategory] || [];

  return (
    <div className="relative flex h-screen w-screen bg-[#0A0A0C] text-zinc-100 font-sans overflow-hidden">
      {/* Noise overlay for tactile premium feel */}
      <div className="noise-overlay" />

      {/* Decorative gradient background glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[150px] pointer-events-none z-0" />

      {/* SIDEBAR FOR DESKTOP */}
      <aside className="relative z-10 hidden md:flex flex-col w-64 glass-sidebar h-full flex-shrink-0 select-none">
        {/* LOGO AREA */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight">
            <span className="text-[#F5C518] font-mono">/me</span> <span className="font-semibold text-white">Bank</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-zinc-400 font-mono">
            v1.1.0
          </span>
        </div>

        {/* LANGUAGE TOGGLE */}
        <div className="p-3 border-b border-white/10">
          <div className="relative flex bg-black/40 p-1 border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => handleLangChange("EN")}
              className={`relative z-10 flex-1 text-center py-1.5 text-xs font-semibold rounded-md uppercase transition-colors duration-200 ${
                lang === "EN"
                  ? "text-black font-extrabold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="relative z-20">English</span>
              {lang === "EN" && (
                <motion.div
                  layoutId="activeLang"
                  className="absolute inset-0 bg-[#F5C518] rounded-md z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => handleLangChange("FR")}
              className={`relative z-10 flex-1 text-center py-1.5 text-xs font-semibold rounded-md uppercase transition-colors duration-200 ${
                lang === "FR"
                  ? "text-black font-extrabold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="relative z-20">Français</span>
              {lang === "FR" && (
                <motion.div
                  layoutId="activeLang"
                  className="absolute inset-0 bg-[#F5C518] rounded-md z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* DEPARTMENT SELECTOR */}
        <div className="p-3 border-b border-white/10">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 section-header">
            Departments
          </div>
          <div className="relative flex bg-black/40 p-1 border border-white/10 rounded-lg overflow-hidden">
            {departments.map((dept) => {
              const isDeptActive = activeDepartment === dept;
              return (
                <button
                  key={dept}
                  onClick={() => handleDepartmentChange(dept)}
                  className={`relative z-10 flex-1 text-center py-1.5 text-xs font-semibold rounded-md uppercase transition-colors duration-200 ${
                    isDeptActive
                      ? "text-black font-extrabold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span className="relative z-20 capitalize">{dept}</span>
                  {isDeptActive && (
                    <motion.div
                      layoutId="activeDept"
                      className="absolute inset-0 bg-[#F5C518] rounded-md z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CATEGORIES & SUBCATEGORIES LIST */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {Object.keys(currentDeptData).map((catKey) => {
            const isExpanded = expandedCategories[catKey];
            const hasActiveSub = activeCategory === catKey;
            const subcategories = Object.keys(currentDeptData[catKey]);

            return (
              <div key={catKey} className="relative flex flex-col rounded-lg overflow-hidden">
                {/* Radial active glow behind the category */}
                {hasActiveSub && (
                  <div className="absolute inset-0 radial-glow z-0" />
                )}

                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(catKey)}
                  className={`relative z-10 w-full text-left px-3 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-between border transition-all duration-200 ${
                    hasActiveSub
                      ? "border-white/10 bg-white/5 text-[#F5C518]"
                      : "border-transparent text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="category-name font-sans text-[11px] tracking-[0.12em] font-extrabold">{catKey}</span>
                  <span className="text-zinc-500 font-mono text-[10px]">
                    {isExpanded ? "[-]" : "[+]"}
                  </span>
                </button>

                {/* Subcategory List */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                        open: { 
                          height: "auto", 
                          opacity: 1, 
                          transition: { 
                            height: { duration: 0.25, ease: "easeOut" },
                            opacity: { duration: 0.2 },
                            staggerChildren: 0.03,
                            delayChildren: 0.02
                          } 
                        },
                        collapsed: { 
                          height: 0, 
                          opacity: 0, 
                          transition: { 
                            height: { duration: 0.2, ease: "easeIn" },
                            opacity: { duration: 0.15 }
                          } 
                        }
                      }}
                      className="relative z-10 overflow-hidden pl-3 py-1 space-y-0.5 border-l border-white/10 ml-3 mt-1 mb-1"
                    >
                      {subcategories.map((subcatKey) => {
                        const isActive =
                          activeCategory === catKey && activeSubcategory === subcatKey;

                        return (
                          <motion.button
                            key={subcatKey}
                            variants={{
                              open: { opacity: 1, y: 0 },
                              collapsed: { opacity: 0, y: -4 }
                            }}
                            onClick={() => selectSubcategory(catKey, subcatKey)}
                            className={`relative w-full text-left px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors duration-200 ${
                              isActive
                                ? "text-black font-extrabold"
                                : "text-zinc-400 hover:text-zinc-100"
                            }`}
                          >
                            <span className="relative z-20">{subcatKey}</span>
                            {isActive && (
                              <motion.div
                                layoutId="activeSubcategory"
                                className="absolute inset-0 bg-[#F5C518] rounded-md z-10"
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                              />
                            )}
                          </motion.button>
                        );
                      })}
                      {subcategories.length === 0 && (
                        <span className="text-[10px] text-zinc-600 italic px-3 py-1 block">
                          No subcategories
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="p-3 border-t border-white/10 text-[10px] text-zinc-500 font-mono bg-black/20 select-none">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-zinc-400">MrMeda</span>
            <span>All rights reserved</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-zinc-400">
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="font-mono text-zinc-300">mr.meda01</span>
            </div>
            <button
              onClick={() => handleCopy("mr.meda01", "sidebar-discord")}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-[#F5C518] hover:text-black border border-white/10 transition-colors"
            >
              {copiedKey === "sidebar-discord" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER */}
      <div className="relative z-10 flex flex-col w-full h-full overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between glass-sidebar border-b border-white/10 px-4 py-3 select-none">
          <div className="text-lg font-bold">
            <span className="text-[#F5C518] font-mono">/me</span> <span className="font-semibold text-white">Bank</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language chips for mobile header */}
            <div className="relative flex border border-white/10 rounded-lg bg-black/40 p-0.5 text-[10px]">
              <button
                onClick={() => handleLangChange("EN")}
                className={`relative z-10 px-2.5 py-1 font-bold rounded-md transition-colors duration-150 ${
                  lang === "EN" ? "text-black" : "text-zinc-400"
                }`}
              >
                <span className="relative z-20">EN</span>
                {lang === "EN" && (
                  <motion.div
                    layoutId="activeLangMobile"
                    className="absolute inset-0 bg-[#F5C518] rounded-md z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => handleLangChange("FR")}
                className={`relative z-10 px-2.5 py-1 font-bold rounded-md transition-colors duration-150 ${
                  lang === "FR" ? "text-black" : "text-zinc-400"
                }`}
              >
                <span className="relative z-20">FR</span>
                {lang === "FR" && (
                  <motion.div
                    layoutId="activeLangMobile"
                    className="absolute inset-0 bg-[#F5C518] rounded-md z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>

            {/* Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="bg-white/5 hover:bg-[#F5C518] hover:text-black border border-white/10 px-3 py-1.5 text-xs font-bold rounded-md flex items-center transition-all duration-150"
            >
              <span>{mobileMenuOpen ? "CLOSE" : "MENU"}</span>
            </button>
          </div>
        </header>

        {/* Mobile Drawer Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden overflow-hidden glass-sidebar border-b border-white/10 flex flex-col max-h-[70vh] p-4 space-y-4 select-none"
            >
              {/* Mobile Department Selector */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1 section-header">
                  Department
                </div>
                <div className="relative flex bg-black/40 p-1 border border-white/10 rounded-lg overflow-hidden">
                  {departments.map((dept) => {
                    const isDeptActive = activeDepartment === dept;
                    return (
                      <button
                        key={dept}
                        onClick={() => handleDepartmentChange(dept)}
                        className={`relative z-10 flex-1 text-center py-1.5 text-xs font-semibold rounded-md uppercase transition-colors duration-200 ${
                          isDeptActive
                            ? "text-black font-extrabold"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <span className="relative z-20 capitalize">{dept}</span>
                        {isDeptActive && (
                          <motion.div
                            layoutId="activeDeptMobile"
                            className="absolute inset-0 bg-[#F5C518] rounded-md z-10"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1 section-header">
                  Categories
                </div>
                <div className="space-y-1">
                  {Object.keys(currentDeptData).map((catKey) => {
                    const isExpanded = expandedCategories[catKey];
                    const hasActiveSub = activeCategory === catKey;
                    const subcategories = Object.keys(currentDeptData[catKey]);

                    return (
                      <div key={catKey} className="flex flex-col rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleCategory(catKey)}
                          className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-between border transition-all duration-150 ${
                            hasActiveSub
                              ? "border-white/10 bg-white/5 text-[#F5C518]"
                              : "border-transparent text-zinc-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="font-sans text-[11px] font-bold tracking-wider">{catKey}</span>
                          <span className="text-zinc-500 font-mono text-[10px]">
                            {isExpanded ? "[-]" : "[+]"}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden pl-3 py-1 space-y-0.5 border-l border-white/10 ml-3 mt-1"
                            >
                              {subcategories.map((subcatKey) => {
                                const isActive =
                                  activeCategory === catKey && activeSubcategory === subcatKey;

                                return (
                                  <button
                                    key={subcatKey}
                                    onClick={() => selectSubcategory(catKey, subcatKey)}
                                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors duration-150 ${
                                      isActive
                                        ? "bg-[#F5C518] text-black font-bold"
                                        : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                                    }`}
                                  >
                                    {subcatKey}
                                  </button>
                                );
                              })}
                              {subcategories.length === 0 && (
                                <span className="text-[10px] text-zinc-600 italic px-3 py-1 block">
                                  No subcategories
                                </span>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Drawer Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>MrMeda • All rights reserved</span>
                <div className="flex items-center gap-1 text-[#5865F2]">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  <span className="text-zinc-300">mr.meda01</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN PANEL */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent select-text relative flex flex-col justify-between">
          <div className="flex-1">
            {/* BREADCRUMB */}
            <div className="mb-6 border-b border-white/10 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono tracking-wider text-zinc-500 uppercase">
                <span className="text-zinc-400 capitalize">{activeDepartment}</span>
                <span>/</span>
                <span className="text-zinc-400">{activeCategory}</span>
                <span>/</span>
                <span className="text-[#F5C518] font-bold">{activeSubcategory}</span>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono uppercase hidden sm:inline">
                {activeSubcategoryScenes.length} Scene(s)
              </span>
            </div>

            {/* SCENE LIST */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeDepartment}-${activeCategory}-${activeSubcategory}`}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.04,
                      delayChildren: 0.02
                    }
                  }
                }}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-6"
              >
                {activeSubcategoryScenes.map((scene, sceneIndex) => (
                  <motion.div
                    key={sceneIndex}
                    variants={{
                      hidden: { 
                        opacity: 0, 
                        y: shouldReduceMotion ? 0 : 12 
                      },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          type: shouldReduceMotion ? "tween" : "spring",
                          stiffness: 300,
                          damping: 26,
                          duration: shouldReduceMotion ? 0.2 : undefined
                        }
                      }
                    }}
                    className="glass-card glass-sheen rounded-xl overflow-hidden"
                  >
                    {/* Scene Header */}
                    <div className="px-4 py-3 bg-white/[0.02] border-b border-white/10 flex items-center justify-between relative z-10">
                      <h2 className="text-sm font-semibold text-zinc-200 tracking-tight">
                        {scene.title}
                      </h2>
                      <span className="text-[10px] font-mono bg-black/40 text-zinc-500 px-2 py-0.5 rounded border border-white/10">
                        {scene.emotes.length} emotes
                      </span>
                    </div>

                    {/* Emote Entries */}
                    <div className="divide-y divide-white/5 relative z-10">
                      {scene.emotes.map((emote, emoteIndex) => {
                        const uniqueKey = `${sceneIndex}-${emoteIndex}`;
                        const isCopied = copiedKey === uniqueKey;

                        return (
                          <div
                            key={emoteIndex}
                            className="px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] group transition-colors duration-150"
                          >
                            {/* Emote Monospace Text */}
                            <div className="font-mono text-xs text-zinc-300 select-all break-words leading-relaxed flex-1">
                              {emote}
                            </div>

                            {/* Copy Button */}
                            <button
                              onClick={() => handleCopy(emote, uniqueKey)}
                              className={`relative overflow-hidden flex-shrink-0 px-3.5 py-1.5 text-[10px] font-mono uppercase font-bold rounded-md border transition-all duration-150 ${
                                isCopied
                                  ? "bg-[#F5C518] text-black border-[#F5C518]"
                                  : "bg-white/5 text-zinc-400 border-white/10 hover:bg-[#F5C518] hover:text-black hover:border-[#F5C518]"
                              }`}
                            >
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={isCopied ? "copied" : "copy"}
                                  initial={{ 
                                    scale: shouldReduceMotion ? 1 : 0.8, 
                                    opacity: 0 
                                  }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ 
                                    scale: shouldReduceMotion ? 1 : 0.8, 
                                    opacity: 0 
                                  }}
                                  transition={{ 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 18 
                                  }}
                                  className="block"
                                >
                                  {isCopied ? "Copied!" : "Copy"}
                                </motion.span>
                              </AnimatePresence>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}

                {activeSubcategoryScenes.length === 0 && (
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 }
                    }}
                    className="border border-dashed border-white/10 rounded-xl p-12 text-center bg-white/[0.01]"
                  >
                    <span className="text-xs text-zinc-500 font-mono block">
                      [!] This subcategory is currently empty
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono block mt-1">
                      Add scenes to src/data.js to populate it
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* MAIN FOOTER */}
          <footer className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono select-none">
            <div className="flex items-center gap-2">
              <span className="text-zinc-300 font-bold tracking-tight">MrMeda</span>
              <span className="text-zinc-600">•</span>
              <span>All rights reserved</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500">© {new Date().getFullYear()}</span>
            </div>

            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-lg px-3.5 py-1.5 hover:border-[#F5C518]/40 transition-colors">
              <svg className="w-4 h-4 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="text-zinc-400">Discord:</span>
              <span className="text-zinc-200 font-bold select-all">mr.meda01</span>
              <button
                onClick={() => handleCopy("mr.meda01", "footer-discord")}
                className="ml-2 text-[10px] px-2.5 py-1 rounded bg-white/5 hover:bg-[#F5C518] hover:text-black border border-white/10 transition-colors font-semibold"
                title="Copy Discord Tag"
              >
                {copiedKey === "footer-discord" ? "Copied!" : "Copy"}
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
