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
                      <div key={catKey} className="relative flex flex-col rounded-lg overflow-hidden">
                        {hasActiveSub && (
                          <div className="absolute inset-0 radial-glow z-0" />
                        )}
                        <button
                          onClick={() => toggleCategory(catKey)}
                          className={`relative z-10 w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-between border transition-all duration-200 ${
                            hasActiveSub
                              ? "border-white/10 bg-white/5 text-[#F5C518]"
                              : "border-transparent text-zinc-300 hover:bg-white/5"
                          }`}
                        >
                          <span className="category-name">{catKey}</span>
                          <span className="text-zinc-500 font-mono text-[10px]">
                            {isExpanded ? "[-]" : "[+]"}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial="collapsed"
                              animate="open"
                              exit="collapsed"
                              variants={{
                                open: { height: "auto", opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
                                collapsed: { height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
                              }}
                              className="relative z-10 overflow-hidden pl-3 py-1 space-y-0.5 border-l border-white/10 ml-3 mt-1 mb-1"
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN PANEL */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent select-text relative">
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
        </main>
      </div>
    </div>
  );
}
