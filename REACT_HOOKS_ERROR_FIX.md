# React Hooks Error Fix - EnhancedMenuPage

## Error
```
Uncaught Error: Rendered more hooks than during the previous render.
    at EnhancedMenuPage.tsx:668:71
```

## Root Cause
**Critical React Rule Violation**: Called `useState` inside a `.map()` loop function.

### The Problem Code (Line 687)
```typescript
return Object.entries(pricesByCook).map(([cookIdString, cookPrices]) => {
  const cookId = Number(cookIdString);
  // ... other code ...
  
  // ❌ WRONG: Calling useState inside map
  const [expandedCook, setExpandedCook] = React.useState<number | null>(
    isSingleCook ? cookId : null
  );
  const isExpanded = expandedCook === cookId;
  
  return <div>...</div>;
});
```

### Why This Is Wrong
React hooks **MUST** be called:
1. ✅ At the **top level** of a component
2. ✅ In the **same order** every render
3. ❌ **NOT** inside loops, conditions, or nested functions

When called inside `.map()`, the number of hooks changes with array length, violating React's Rules of Hooks.

## Solution

### 1. Moved State to Component Level
```typescript
// ✅ At top level of component (line 49)
const [expandedCookId, setExpandedCookId] = useState<number | null>(null);
```

### 2. Auto-Expand Logic in useEffect
```typescript
useEffect(() => {
  if (showFoodDetail && selectedFood) {
    setSelectedPriceId(null);
    setQuantity(1);
    
    // Auto-expand if only one cook
    const cookIds = new Set(selectedFood.prices.map(p => {
      if (typeof p.cook === 'number') return p.cook;
      if (typeof p.cook === 'object' && p.cook !== null) {
        const cookId = (p.cook as any).id || (p.cook as any).cook_id;
        return typeof cookId === 'number' ? cookId : Number(cookId);
      }
      return Number(p.cook);
    }).filter(id => !isNaN(id) && id > 0));
    
    // Set expanded cook ID if single cook
    if (cookIds.size === 1) {
      setExpandedCookId(Array.from(cookIds)[0]);
    } else {
      setExpandedCookId(null);
    }
  } else if (!showFoodDetail) {
    setExpandedCookId(null);
  }
}, [showFoodDetail, selectedFood]);
```

### 3. Use Component State in Map
```typescript
return Object.entries(pricesByCook).map(([cookIdString, cookPrices]) => {
  const cookId = Number(cookIdString);
  
  // ✅ CORRECT: Use component-level state
  const isExpanded = expandedCookId === cookId;
  
  return (
    <div onClick={() => setExpandedCookId(isExpanded ? null : cookId)}>
      {/* Cook card content */}
    </div>
  );
});
```

## Changes Made

### File: `frontend/src/components/menu/EnhancedMenuPage.tsx`

**Line 49**: Added component-level state
```typescript
const [expandedCookId, setExpandedCookId] = useState<number | null>(null);
```

**Lines 54-78**: Added auto-expand logic in useEffect
- Automatically expands cook card if only one cook is available
- Resets expanded state when modal closes

**Lines 679-686**: Removed local useState, use component state
```typescript
// Before:
const [expandedCook, setExpandedCook] = React.useState<number | null>(isSingleCook ? cookId : null);
const isExpanded = expandedCook === cookId;

// After:
const isExpanded = expandedCookId === cookId;
```

**Line 699**: Updated onClick handler
```typescript
// Before:
onClick={() => setExpandedCook(isExpanded ? null : cookId)}

// After:
onClick={() => setExpandedCookId(isExpanded ? null : cookId)}
```

## Benefits

✅ **Fixed React Hooks Error** - No more "rendered more hooks" error
✅ **Follows React Rules** - All hooks at top level
✅ **Better Performance** - Single state vs multiple states
✅ **Same Functionality** - Auto-expand still works
✅ **Cleaner Code** - Component-level state management

## Testing Checklist

- [x] No console errors
- [x] No linter errors
- [x] Single cook auto-expands
- [x] Multiple cooks don't auto-expand
- [x] Click to expand/collapse works
- [x] State resets when modal closes
- [x] State resets when opening new food

## React Rules of Hooks Reminder

### ✅ DO:
```typescript
function Component() {
  const [state, setState] = useState(initial);  // Top level
  
  return <div>{state}</div>;
}
```

### ❌ DON'T:
```typescript
function Component() {
  return items.map(item => {
    const [state, setState] = useState(initial);  // Inside loop ❌
    return <div>{state}</div>;
  });
}

function Component() {
  if (condition) {
    const [state, setState] = useState(initial);  // Inside condition ❌
  }
}
```

## Reference
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [Error Boundaries](https://reactjs.org/link/error-boundaries)
- [useState Hook](https://react.dev/reference/react/useState)

