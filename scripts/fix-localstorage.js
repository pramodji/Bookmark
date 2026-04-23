const fs = require('fs');

function processFile(path) {
  let c = fs.readFileSync(path, 'utf-8');

  // Remove localStorage.setItem calls - they're always on a single line
  // Pattern: optional whitespace + localStorage.setItem( ... ); where ... has no newline
  const lines = c.split('\n');
  const out = lines.map(line => {
    // Remove localStorage.setItem(...); from the line
    return line.replace(/\s*localStorage\.setItem\([^)]*(?:\([^)]*\))*[^)]*\);/g, '');
  });
  c = out.join('\n');

  // Replace multi-line useState initializers that use localStorage.getItem
  // collapsedSubgroups
  c = c.replace(
    /const \[collapsedSubgroups, setCollapsedSubgroups\] = useState<Record<string, boolean>>\(\(\) => \{\s*const saved = typeof window !== 'undefined' && localStorage\.getItem\('collapsedSubgroups'\);\s*return saved \? JSON\.parse\(saved\) : \{\};\s*\}\);/,
    'const [collapsedSubgroups, setCollapsedSubgroups] = useState<Record<string, boolean>>({});'
  );
  // groupSorts
  c = c.replace(
    /const \[groupSorts, setGroupSorts\] = useState<Record<string, 'none' \| 'asc' \| 'desc'>>\(\(\) => \{\s*const saved = typeof window !== 'undefined' && localStorage\.getItem\('groupSorts'\);\s*return saved \? JSON\.parse\(saved\) : \{\};\s*\}\);/,
    "const [groupSorts, setGroupSorts] = useState<Record<string, 'none' | 'asc' | 'desc'>>({});"
  );
  // groupColors
  c = c.replace(
    /const \[groupColors, setGroupColors\] = useState<Record<string, string>>\(\(\) => \{\s*const saved = typeof window !== 'undefined' && localStorage\.getItem\('groupColors'\);\s*return saved \? JSON\.parse\(saved\) : \{\};\s*\}\);/,
    'const [groupColors, setGroupColors] = useState<Record<string, string>>({});'
  );
  // groupColumns
  c = c.replace(
    /const \[groupColumns, setGroupColumns\] = useState<Record<string, number>>\(\(\) => \{\s*const saved = typeof window !== 'undefined' && localStorage\.getItem\('groupColumns'\);\s*return saved \? JSON\.parse\(saved\) : \{\};\s*\}\);/,
    'const [groupColumns, setGroupColumns] = useState<Record<string, number>>({});'
  );
  // columns
  c = c.replace(
    /const \[columns, setColumns\] = useState\(\(\) => typeof window !== 'undefined' \? Number\(localStorage\.getItem\('bmColumns'\) \|\| 4\) : 4\);/,
    'const [columns, setColumns] = useState(4);'
  );
  // rows
  c = c.replace(
    /const \[rows, setRows\] = useState\(\(\) => typeof window !== 'undefined' \? Number\(localStorage\.getItem\('bmRows'\) \|\| 20\) : 20\);/,
    'const [rows, setRows] = useState(20);'
  );
  // fontSize
  c = c.replace(
    /const \[fontSize, setFontSize\] = useState\(\(\) => typeof window !== 'undefined' \? Number\(localStorage\.getItem\('fontSize'\) \|\| 14\) : 14\);/,
    'const [fontSize, setFontSize] = useState(14);'
  );
  // fontFamily
  c = c.replace(
    /const \[fontFamily, setFontFamily\] = useState\(\(\) => typeof window !== 'undefined' \? \(localStorage\.getItem\('fontFamily'\) \|\| 'system-ui'\) : 'system-ui'\);/,
    "const [fontFamily, setFontFamily] = useState('system-ui');"
  );
  // accentColor useEffect
  c = c.replace(
    /\s*useEffect\(\(\) => \{ const saved = localStorage\.getItem\('accentColor'\) \|\| 'blue'; applyAccentColor\(saved\); \}, \[\]\);/,
    ''
  );

  // Calendar-specific
  // tab
  c = c.replace(
    /const \[tab, setTab\] = useState<"notes" \| "tasks">\(\(\) => \(typeof window !== "undefined" && localStorage\.getItem\("diaryTab"\) as any\) \|\| "notes"\);/,
    'const [tab, setTab] = useState<"notes" | "tasks">("notes");'
  );
  // fontSize (calendar - readonly)
  c = c.replace(
    /const \[fontSize\] = useState\(\(\) => typeof window !== 'undefined' \? Number\(localStorage\.getItem\('fontSize'\) \|\| 14\) : 14\);/,
    'const [fontSize] = useState(14);'
  );
  // fontFamily (calendar - readonly)
  c = c.replace(
    /const \[fontFamily\] = useState\(\(\) => typeof window !== 'undefined' \? \(localStorage\.getItem\('fontFamily'\) \|\| 'system-ui'\) : 'system-ui'\);/,
    "const [fontFamily] = useState('system-ui');"
  );
  // dayColors
  c = c.replace(
    /const \[dayColors, setDayColors\] = useState<Record<string, string>>\(\(\) => \{\s*const saved = typeof window !== 'undefined' && localStorage\.getItem\('dayColors'\);\s*return saved \? JSON\.parse\(saved\) : \{\};\s*\}\);/,
    'const [dayColors, setDayColors] = useState<Record<string, string>>({});'
  );
  // noteCategories
  c = c.replace(
    /const \[categories, setCategories\] = useState<Record<string, string>>\(\(\) => \{\s*const saved = typeof window !== 'undefined' && localStorage\.getItem\('noteCategories'\);\s*return saved \? JSON\.parse\(saved\) : \{[\s\S]*?\};\s*\}\);/,
    "const [categories, setCategories] = useState<Record<string, string>>({ default: '#64748b', 'Out of Office': '#ef4444', 'Audit': '#f59e0b', 'Busy': '#3b82f6', 'Meeting': '#10b981', 'Personal': '#8b5cf6' });"
  );
  // dayLabels
  c = c.replace(
    /const \[dayLabels, setDayLabels\] = useState<Record<string, string>>\(\(\) => \{\s*const saved = typeof window !== 'undefined' && localStorage\.getItem\('dayLabels'\);\s*return saved \? JSON\.parse\(saved\) : \{[\s\S]*?\};\s*\}\);/,
    "const [dayLabels, setDayLabels] = useState<Record<string, string>>({ '#3b82f6': 'PTO', '#10b981': 'Available', '#f59e0b': 'Busy', '#ef4444': 'Out of Office', '#8b5cf6': 'Meeting', '#ec4899': 'Personal', '#06b6d4': 'Training' });"
  );
  // splitView
  c = c.replace(
    /const \[splitView, setSplitView\] = useState\(\(\) => typeof window !== 'undefined' \? localStorage\.getItem\('diarySplitView'\) === 'true' : false\);/,
    'const [splitView, setSplitView] = useState(false);'
  );
  // hideWeekends
  c = c.replace(
    /const \[hideWeekends, setHideWeekends\] = useState\(\(\) => typeof window !== 'undefined' \? localStorage\.getItem\('hideWeekends'\) === 'true' : false\);/,
    'const [hideWeekends, setHideWeekends] = useState(false);'
  );
  // accentColor useEffect in calendar
  c = c.replace(
    /\s*useEffect\(\(\) => \{ const saved = localStorage\.getItem\('accentColor'\) \|\| 'blue'; applyAccentColor\(saved\); \}, \[\]\);/,
    ''
  );
  // diaryPanelWidth
  c = c.replace(
    /const \[panelWidth, setPanelWidth\] = useState\(\(\) => \{\s*if \(typeof window !== "undefined"\) \{\s*const saved = localStorage\.getItem\("diaryPanelWidth"\);\s*if \(saved\) return Number\(saved\);\s*\}\s*return 320;\s*\}\);/,
    'const [panelWidth, setPanelWidth] = useState(320);'
  );
  // noteSizeIdx in NoteModal
  c = c.replace(
    /const \[sizeIdx, setSizeIdx\] = useState\(\(\) => \{\s*const s = typeof window !== 'undefined' \? Number\(localStorage\.getItem\('noteSizeIdx'\) \|\| 1\) : 1;\s*return Math\.min\(s, sizes\.length - 1\);\s*\}\);/,
    'const [sizeIdx, setSizeIdx] = useState(1);'
  );
  // noteSizeIdx changeSize
  c = c.replace(/\s*localStorage\.setItem\('noteSizeIdx', String\(next\)\);/, '');

  fs.writeFileSync(path, c);
  const remaining = (c.match(/localStorage/g) || []).length;
  fs.appendFileSync('scripts/fix-localstorage-result.txt', path + ': ' + remaining + ' remaining\n');
}

processFile('app/bookmarks/page.tsx');
processFile('app/calendar/page.tsx');
fs.appendFileSync('scripts/fix-localstorage-result.txt', 'done\n');
