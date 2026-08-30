# /me Bank

`/me Bank` is a premium, high-fidelity personal roleplay emote library built with **Next.js**, **Tailwind CSS**, and **Framer Motion**. Designed for speed, tactility, and gorgeous visuals, it provides structured collections of copy-on-click roleplay command text templates.

---

## 🎨 Visual Identity & Aesthetic

The application features a modern **glassmorphism** design system with rich depth and details:
- **Base Theme:** Ultra-dark theme (`#0A0A0C`) with layered frosted glass panels (`bg-white/5` and `bg-white/8`, `backdrop-blur-xl`, `border-white/10`).
- **Tactility:** Subtle SVG fractal noise overlay to create a paper-like grain texture.
- **Selective Accents:** Amber/yellow (`#F5C518`) used sparingly for highlights, copy success states, active categories, and active tabs.
- **Ambient Depth:** Slow, heavily-blurred background radial gradient glows reflecting the accent color.

---

## ⚡ Motion & Transitions

All interaction states are animated using **Framer Motion** for a fluid, tactile desktop application experience:
- **Department & Language Switchers:** Segmented pills slide smoothly between active options using Framer Motion `layoutId` layout animations.
- **Sidebar Expand/Collapse:** Smooth height animations on category lists with staggered fade-in animations on subcategories.
- **Main Section Transitions:** Layout changes trigger a 220ms crossfade and subtle vertical slide to keep interactions responsive.
- **Scene Card Entrances:** Staggered load animation on lists (40ms stagger offset) for clean page presentation.
- **Copy Feedback:** Quick scale-spring bounce animation on copy buttons morphing into a "Copied!" confirmation.
- **Accessibility:** Detects and respects system `prefers-reduced-motion` settings, falling back to simple opacity fades.

---

## 📂 Project Structure

```
├── src
│   ├── app
│   │   ├── favicon.ico
│   │   ├── fonts
│   │   │   ├── GeistMonoVF.woff
│   │   │   └── GeistVF.woff
│   │   ├── globals.css      # Core styles, glassmorphism variables & noise overlay
│   │   ├── layout.js        # Root HTML shell & custom fonts
│   │   └── page.js          # Core App Component (Framer Motion logic & UI)
│   └── data.js              # Nested Roleplay Emote Dataset (EN/FR)
├── tailwind.config.js       # Custom Tailwind CSS configuration
├── package.json
└── README.md
```

---

## 🗃️ Data Schema

Emote structures are completely dynamic and support multi-department categorization. They are defined in `src/data.js` using the following schema:

```javascript
export const RolePlay = {
  EN: {
    departmentName: {
      categoryName: {
        subcategoryName: [
          {
            title: "Scene Title",
            emotes: [
              "/me walks over to the table...",
              "/me picks up the folder..."
            ]
          }
        ]
      }
    }
  },
  FR: {
    // Equivalent localization mapping
  }
};
```

*To introduce additional departments (e.g. `LTD`, `police`), simply define their categories, subcategories, and scenes under the locale key in `src/data.js`.*

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser to inspect the application.

### 3. Build for Production
```bash
npm run build
```
The compiled server-side optimized build will output static pages in the `.next` directory.
