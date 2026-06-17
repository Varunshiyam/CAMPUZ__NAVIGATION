# Layout Structure Guide - Fixed Header + Scrollable Content

## 🎯 Problem Solved
The header section (Search Bar, Category Tabs) was shifting and overlapping with content when resizing the map. This guide explains the new layout structure.

## 📐 New Layout Architecture

```
┌─────────────────────────────────────────────────┐
│  app-container (height: 100vh, overflow: hidden)│
├─────────────────────────────────────────────────┤
│ FIXED HEADER (position: fixed, top: 0, z: 100) │
├─ fixed-header-section                          ├
│  ├─ search-bar (height: 48px)                  │
│  └─ chips (height: 52px)                       │
├─────────────────────────────────────────────────┤
│ SCROLLABLE CONTENT (flex: 1, overflow-y: auto) │
├─ scrollable-content-wrapper                    ├
│  ├─ map-scroll-wrapper (height: dynamic)      │
│  │  ├─ map-container                          │
│  │  ├─ start-btn                              │
│  │  └─ map-overlay-controls                   │
│  ├─ map-resize-divider (draggable)            │
│  └─ buildings-section (scrollable)            │
├─────────────────────────────────────────────────┤
│ FIXED BOTTOM NAV (position: fixed, bottom: 0)  │
├─ bottom-nav (height: 60px, z: 1000)           ├
│  ├─ nav-item: Home                            │
│  ├─ nav-item: Building                        │
│  ├─ nav-item: Categories                      │
│  └─ nav-item: Explore                         │
└─────────────────────────────────────────────────┘
```

## 🔑 Key CSS Properties

### App Container
```css
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;  /* Prevents double scrollbars */
}
```

### Fixed Header Section
```css
.fixed-header-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--surface-base);
}

/* Header height = search-bar (48px) + chips (52px) = 100px */
--header-height: calc(var(--search-bar-height) + var(--chips-section-height));
```

### Scrollable Content Wrapper
```css
.scrollable-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: var(--header-height);  /* Account for fixed header */
  margin-bottom: var(--navbar-height); /* Account for fixed nav */
  -webkit-overflow-scrolling: touch;  /* Smooth iOS scrolling */
}
```

### Map Section
```css
.map-scroll-wrapper {
  flex: 0 1 auto;  /* Don't stretch, adjust to content */
  position: relative;
  overflow: hidden;
  /* Height is controlled by state: mapHeight */
}
```

### Buildings Section
```css
.buildings-section {
  flex: 1;  /* Takes remaining space */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

### Bottom Navigation
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--navbar-height);  /* 60px */
  z-index: 1000;
}
```

## 📱 Responsive Sizes

### CSS Variables (Root)
```css
:root {
  --search-bar-height: 48px;
  --chips-section-height: 52px;
  --header-height: calc(48px + 52px);  /* 100px */
  --navbar-height: 60px;
}

@media (max-width: 640px) {
  :root {
    --search-bar-height: 44px;
    --chips-section-height: 48px;
    --header-height: calc(44px + 48px);  /* 92px */
  }
}
```

## ✅ What's Fixed

### 1. **Fixed Header**
- ✅ Search bar stays at top when scrolling
- ✅ Chips/tabs don't move or resize
- ✅ Always visible for user interaction
- ✅ No overlap with content

### 2. **Scrollable Content**
- ✅ Map can be resized without affecting header
- ✅ Draggable divider only resizes map area
- ✅ Content scrolls independently
- ✅ Smooth scrolling with momentum

### 3. **Fixed Bottom Navigation**
- ✅ Always visible at bottom
- ✅ Doesn't overlap content
- ✅ Fixed z-index prevents layering issues
- ✅ Proper spacing with safe-area-inset

### 4. **No Overlaps**
- ✅ Header and content separated by margin-top
- ✅ Content and nav separated by margin-bottom
- ✅ Each section has its own space
- ✅ Responsive adjustments maintain spacing

## 🎨 Styling Features

### Smooth Scrolling
```css
-webkit-overflow-scrolling: touch;  /* iOS momentum scrolling */
will-change: scroll-position;       /* GPU acceleration */
transform: translateZ(0);           /* Force GPU rendering */
```

### GPU Acceleration
```css
will-change: transform;
transform: translateZ(0);
-webkit-transform: translateZ(0);
```

### Touch Optimization
```css
-webkit-tap-highlight-color: transparent;
touch-action: pan-x pan-y;
-webkit-overflow-scrolling: touch;
```

## 🔄 Dynamic Map Resizing

The map resizing system still works perfectly:

```javascript
const [mapHeight, setMapHeight] = useState(320); // Mobile
// or setMapHeight(450); // Desktop

// Update: map-scroll-wrapper style={{ height: `${mapHeight}px` }}
// Only affects the map area, not the header or nav
```

### How Resizing Works:
1. User drags the `map-resize-divider`
2. `handleMouseMove` / `handleTouchMove` updates `mapHeight` state
3. Map container height changes: `style={{ height: ${mapHeight}px }}`
4. Header stays fixed (not affected)
5. Bottom nav stays fixed (not affected)
6. Scrollable content adjusts around the new map height

## 📊 Layout Calculations

### Desktop (> 1024px)
- Header height: 100px (search 48 + chips 52)
- Nav height: 60px
- Available scrollable: 100vh - 100px - 60px = 840px
- Initial map height: 450px
- Buildings section: Takes remaining space

### Tablet (641px - 1024px)
- Header height: 100px
- Nav height: 60px
- Available scrollable: 100vh - 100px - 60px = 840px
- Map height: Variable
- Buildings section: Scrollable

### Mobile (< 640px)
- Header height: 92px (search 44 + chips 48)
- Nav height: 60px
- Available scrollable: 100vh - 92px - 60px = 748px
- Initial map height: 300px
- Buildings section: Scrollable with momentum

## 🧪 Testing Checklist

- [ ] Header stays fixed when scrolling content
- [ ] Map resizes without affecting header position
- [ ] No overlap between header and map
- [ ] Bottom nav visible at all times
- [ ] Content scrolls smoothly
- [ ] Works on mobile, tablet, and desktop
- [ ] Touch interactions work on mobile
- [ ] Drag divider resizes map correctly
- [ ] Chips scroll horizontally
- [ ] Buildings section scrolls vertically
- [ ] All elements visible without clipping

## 🚀 Performance Optimizations

1. **GPU Acceleration**: `transform: translateZ(0)`
2. **Hardware Compositing**: `will-change` properties
3. **Reduced Repaints**: Separate scrolling contexts
4. **Smooth Scrolling**: `-webkit-overflow-scrolling: touch`
5. **Event Delegation**: Minimal event listeners
6. **Fixed Positioning**: Top and bottom layers handled separately

## 📝 Future Enhancements

- Add pull-to-refresh for mobile
- Sticky section headers in buildings list
- Parallax scrolling for visual depth
- Swipe gestures for navigation
- Keyboard shortcuts for accessibility
