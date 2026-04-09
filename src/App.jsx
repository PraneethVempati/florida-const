import { useState, useRef, useEffect } from "react";
import { findVersionForDate, CONSTITUTION_VERSIONS } from "./constitutionTexts";

// ─────────────────────────────────────────────────────────────────────────────
// Version metadata — sourced from Constitution Timeline.docx
// Used only for display of effective-date labels; never alters constitutional text.
// ─────────────────────────────────────────────────────────────────────────────
const VERSION_DETAILS = [
  { id: "001", title: "Constitution of the State of Florida (1969 Edition)", startDate: "January 7, 1969",   endDate: "January 4, 1971"   },
  { id: "002", title: "Constitution of the State of Florida (1971 Edition, 1970 Election Changes)", startDate: "January 5, 1971",   endDate: "November 1, 1971"  },
  { id: "003", title: "Constitution of the State of Florida (1971 Edition, 1970 & 1971 Special Election)", startDate: "November 2, 1971",  endDate: "March 13, 1972"    },
  { id: "004", title: "Constitution of the State of Florida (1971 Edition, 1972 Special Election Change)", startDate: "March 14, 1972",   endDate: "January 1, 1973"   },
  { id: "005", title: "Constitution of the State of Florida (1973 Edition)", startDate: "January 2, 1973",   endDate: "January 4, 1975"   },
  { id: "006", title: "Constitution of the State of Florida (1975 Edition, Without July Amendment)", startDate: "January 5, 1975",   endDate: "June 30, 1975"     },
  { id: "007", title: "Constitution of the State of Florida (1975 Edition, All Amendments)", startDate: "July 1, 1975",      endDate: "March 8, 1976"     },
  { id: "008", title: "Constitution of the State of Florida (1977 Edition, Special Election Only)", startDate: "March 9, 1976",    endDate: "January 3, 1977"   },
  { id: "009", title: "Constitution of the State of Florida (1977 Edition, All Amendments)", startDate: "January 4, 1977",   endDate: "April 1, 1980"     },
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const PRIMARY = "#1B3A6B";
const GOLD    = "#C4882A";
const CREAM   = "#F8F6F1";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@300;400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; min-height: 100vh; background: ${CREAM}; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: ${CREAM}; }
  ::-webkit-scrollbar-thumb { background: #C9C0AE; border-radius: 3px; }

  .nav-btn { background: none; border: none; cursor: pointer; font-family: 'Source Sans 3', sans-serif; font-size: .88rem; color: rgba(255,255,255,.8); font-weight: 600; padding: 4px 0; transition: color .15s; }
  .nav-btn:hover { color: ${GOLD}; }
  .nav-btn.active { color: ${GOLD}; border-bottom: 2px solid ${GOLD}; padding-bottom: 2px; }

  .contact-btn { background: ${PRIMARY}; color: white; border: 1px solid rgba(255,255,255,.25); padding: 7px 18px; border-radius: 4px; font-family: 'Source Sans 3', sans-serif; font-weight: 600; font-size: .84rem; cursor: pointer; }

  .tab-btn { padding: 10px 28px; border: none; border-bottom: 3px solid transparent; background: none; cursor: pointer; font-family: 'Source Sans 3', sans-serif; font-size: .93rem; font-weight: 600; color: #6B7280; transition: color .15s, border-color .15s; }
  .tab-btn.active { color: ${PRIMARY}; border-bottom-color: ${PRIMARY}; }
  .tab-btn:hover:not(.active) { color: #374151; }

  .primary-btn { background: ${PRIMARY}; color: white; border: none; padding: 10px 26px; border-radius: 5px; font-family: 'Source Sans 3', sans-serif; font-weight: 700; font-size: .93rem; cursor: pointer; transition: background .15s; white-space: nowrap; }
  .primary-btn:hover { background: #152e55; }

  .field-label { font-family: 'Source Sans 3', sans-serif; font-size: .74rem; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 6px; display: block; }

  .select-input { padding: 9px 12px; border: 1px solid #C9C0AE; border-radius: 5px; font-family: 'Source Sans 3', sans-serif; font-size: .9rem; background: white; outline: none; color: #1a1a2e; width: 100%; }
  .select-input:focus { border-color: ${PRIMARY}; box-shadow: 0 0 0 3px #1B3A6B1A; }

  .text-input { padding: 9px 12px; border: 1px solid #C9C0AE; border-radius: 5px; font-family: 'Source Sans 3', sans-serif; font-size: .9rem; background: white; outline: none; color: #1a1a2e; width: 100%; }
  .text-input:focus { border-color: ${PRIMARY}; box-shadow: 0 0 0 3px #1B3A6B1A; }
  .text-input::placeholder { color: #aaa; }

  .error-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 11px 16px; font-family: 'Source Sans 3', sans-serif; font-size: .86rem; color: #991B1B; margin-top: 12px; }

  /* Constitution text */
  .const-title   { font-family: 'Libre Baskerville', serif; font-size: 1.05rem; font-weight: 700; color: ${PRIMARY}; text-align: center; margin: 28px 0 6px; letter-spacing: .03em; }
  .const-article { font-family: 'Libre Baskerville', serif; font-size: .97rem; font-weight: 700; color: ${PRIMARY}; margin: 28px 0 4px; letter-spacing: .04em; }
  .const-section { font-family: 'Libre Baskerville', serif; font-size: .91rem; font-weight: 700; color: #374151; margin: 16px 0 4px; }
  .const-body    { font-family: 'Libre Baskerville', serif; font-size: .92rem; line-height: 1.95; color: #1a1a2e; margin-bottom: 2px; }
  .const-empty   { height: 6px; }

  mark { background: #FEF08A; color: inherit; border-radius: 2px; padding: 0 1px; }

  .back-link { background: none; border: none; cursor: pointer; font-family: 'Source Sans 3', sans-serif; font-size: .83rem; color: #6B7280; display: inline-flex; align-items: center; gap: 5px; padding: 0; transition: color .12s; }
  .back-link:hover { color: ${PRIMARY}; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────────────────────────────────────
function Header({ onHome }) {
  return (
    <header style={{ background: PRIMARY, borderBottom: `3px solid ${GOLD}`, padding: "0 48px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62 }}>
        <button onClick={onHome} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, padding: 0 }}>
          <svg width="26" height="33" viewBox="0 0 60 78" fill="white" opacity="0.9">
            <path d="M30 2 C13 2 2 17 2 33 C2 51 13 63 21 71 C24 74 27 77 30 79 C33 77 36 74 39 71 C47 63 58 51 58 33 C58 17 47 2 30 2Z"/>
          </svg>
          <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "1.08rem", fontWeight: 700, color: "white" }}>
            Florida Constitution
          </span>
        </button>
        <nav style={{ display: "flex", gap: 30, alignItems: "center" }}>
          {["Home", "The Constitutions", "Research Guides", "About"].map(n => (
            <button key={n} className={`nav-btn${n === "Home" ? " active" : ""}`}>{n}</button>
          ))}
          <button className="contact-btn">Contact</button>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #E5DDD0", padding: "18px 48px", background: "white", marginTop: 60 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: ".75rem", color: "#9CA3AF" }}>© 2024 Organization Name</span>
        <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: ".75rem", color: "#9CA3AF" }}>
          Privacy Policy &nbsp;|&nbsp; Terms of Use &nbsp;|&nbsp; Site Map
        </span>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Date fields — shared between the two tab panels
// ─────────────────────────────────────────────────────────────────────────────
function DateFields({ month, day, year, onMonth, onDay, onYear }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
      <div style={{ flex: 2 }}>
        <label className="field-label">Month</label>
        <select className="select-input" value={month} onChange={e => onMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
      </div>
      <div style={{ flex: 1 }}>
        <label className="field-label">Day</label>
        <select className="select-input" value={day} onChange={e => onDay(Number(e.target.value))}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div style={{ flex: 1.2 }}>
        <label className="field-label">Year</label>
        <input
          type="number"
          className="text-input"
          value={year}
          min={1969} max={1980}
          onChange={e => onYear(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Landing page
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]             = useState("browse"); // "browse" | "search"
  const [month, setMonth]         = useState(1);
  const [day, setDay]             = useState(7);
  const [year, setYear]           = useState(1969);
  const [browseError, setBrowseError] = useState("");

  // Search tab state
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchMonth, setSearchMonth]   = useState(1);
  const [searchDay, setSearchDay]       = useState(7);
  const [searchYear, setSearchYear]     = useState(1969);
  const [useSearchDate, setUseSearchDate] = useState(false);
  const [searchError, setSearchError]   = useState("");

  // View state
  const [viewVersion, setViewVersion]   = useState(null);
  const [viewSearch, setViewSearch]     = useState("");

  function openByDate(m, d, y) {
    const v = findVersionForDate(y, m, d);
    if (v) return v;
    return null;
  }

  function handleBrowse() {
    const v = openByDate(month, day, year);
    if (v) { setViewVersion(v); setViewSearch(""); setBrowseError(""); }
    else setBrowseError(`No constitution was in force on ${MONTHS[month - 1]} ${day}, ${year}. Data covers January 7, 1969 – April 1, 1980.`);
  }

  function handleSearch() {
    if (!searchQuery.trim()) { setSearchError("Please enter a search term."); return; }
    let v;
    if (useSearchDate) {
      v = openByDate(searchMonth, searchDay, searchYear);
      if (!v) { setSearchError(`No constitution was in force on ${MONTHS[searchMonth - 1]} ${searchDay}, ${searchYear}. Data covers January 7, 1969 – April 1, 1980.`); return; }
    } else {
      // Default: most recent version (009)
      v = CONSTITUTION_VERSIONS.find(c => c.id === "009");
    }
    setViewVersion(v);
    setViewSearch(searchQuery.trim());
    setSearchError("");
  }

  if (viewVersion) {
    return (
      <ConstitutionView
        version={viewVersion}
        initialSearch={viewSearch}
        onBack={() => { setViewVersion(null); setViewSearch(""); }}
      />
    );
  }

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: CREAM, minHeight: "100vh" }}>
      <style>{GLOBAL_CSS}</style>
      <Header onHome={() => {}} />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 40px 40px" }}>

        {/* Page heading */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "1.75rem", fontWeight: 700, color: PRIMARY, marginBottom: 12, lineHeight: 1.3 }}>
            Explore the Florida Constitution Through History
          </h1>
          <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: ".97rem", color: "#4B5563", lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
            View the full text of Florida&apos;s Constitution as it was legally in force on any specific date
            from January 7, 1969 through April 1, 1980.
          </p>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "2px solid #E5DDD0", marginBottom: 0 }}>
          <button className={`tab-btn${tab === "browse" ? " active" : ""}`} onClick={() => setTab("browse")}>
            View Constitution by Date
          </button>
          <button className={`tab-btn${tab === "search" ? " active" : ""}`} onClick={() => setTab("search")}>
            Search the Constitution
          </button>
        </div>

        {/* ── TAB: BROWSE BY DATE ── */}
        {tab === "browse" && (
          <div style={{ background: "white", border: "1px solid #E5DDD0", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "32px 36px" }}>
            <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: ".9rem", color: "#374151", marginBottom: 22, lineHeight: 1.6 }}>
              Enter any date to retrieve the full constitutional text that was legally operative on that day.
            </p>
            <DateFields month={month} day={day} year={year} onMonth={setMonth} onDay={setDay} onYear={setYear} />
            <div style={{ marginTop: 20 }}>
              <button className="primary-btn" onClick={handleBrowse} style={{ width: "100%" }}>
                View Constitution
              </button>
            </div>
            {browseError && <div className="error-box">{browseError}</div>}
          </div>
        )}

        {/* ── TAB: SEARCH ── */}
        {tab === "search" && (
          <div style={{ background: "white", border: "1px solid #E5DDD0", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "32px 36px" }}>
            <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: ".9rem", color: "#374151", marginBottom: 22, lineHeight: 1.6 }}>
              Search the text of the constitution. By default the search runs against the most recent version in our
              database (January 4, 1977 – April 1, 1980). You can narrow it to a specific date below.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Search Term</label>
              <input
                className="text-input"
                placeholder='e.g. "due process" or "legislature"'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>

            {/* Optional date scope */}
            <div style={{ border: "1px solid #E5DDD0", borderRadius: 6, padding: "16px 18px", marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none", fontFamily: "'Source Sans 3', sans-serif", fontSize: ".88rem", color: "#374151", fontWeight: 600, marginBottom: useSearchDate ? 16 : 0 }}>
                <input
                  type="checkbox"
                  checked={useSearchDate}
                  onChange={e => setUseSearchDate(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: PRIMARY, cursor: "pointer" }}
                />
                Search a specific date instead
              </label>
              {useSearchDate && (
                <DateFields month={searchMonth} day={searchDay} year={searchYear} onMonth={setSearchMonth} onDay={setSearchDay} onYear={setSearchYear} />
              )}
            </div>

            <button className="primary-btn" onClick={handleSearch} style={{ width: "100%" }}>
              Search Constitution
            </button>
            {searchError && <div className="error-box">{searchError}</div>}
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Constitution full-text view
// ─────────────────────────────────────────────────────────────────────────────
function ConstitutionView({ version, initialSearch, onBack }) {
  const [search, setSearch] = useState(initialSearch || "");
  const [inputValue, setInputValue] = useState(initialSearch || "");
  const firstMatchRef = useRef(null);

  const meta = VERSION_DETAILS.find(v => v.id === version.id);
  const lines = version.text.split("\n");

  useEffect(() => {
    if (search && firstMatchRef.current) {
      firstMatchRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [search]);

  function applySearch() {
    setSearch(inputValue.trim());
  }

  function clearSearch() {
    setSearch("");
    setInputValue("");
  }

  // Highlight matching text inside a line
  function highlight(text, term) {
    if (!term) return text;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark>{text.slice(idx, idx + term.length)}</mark>
        {text.slice(idx + term.length)}
      </>
    );
  }

  // Classify each line for styling
  function lineClass(trimmed) {
    if (!trimmed) return "empty";
    const up = trimmed.toUpperCase();
    if (trimmed === up && /[A-Z]/.test(trimmed)) {
      if (trimmed === "CONSTITUTION OF THE STATE OF FLORIDA" || trimmed === "PREAMBLE") return "title";
      if (trimmed.startsWith("ARTICLE")) return "article";
      if (trimmed.startsWith("SECTION")) return "section";
      if (trimmed.startsWith("SCHEDULE")) return "article";
    }
    return "body";
  }

  const searchTerm = search.toLowerCase();
  const firstMatchIndex = search
    ? lines.findIndex(l => l.toLowerCase().includes(searchTerm))
    : -1;

  const rendered = lines.map((line, i) => {
    const trimmed = line.trim();
    const cls = lineClass(trimmed);

    if (cls === "empty") return <div key={i} className="const-empty" />;

    const matches = search && trimmed.toLowerCase().includes(searchTerm);
    const isFirst = i === firstMatchIndex;

    const content = matches ? highlight(trimmed, search) : trimmed;

    const ref = isFirst ? firstMatchRef : null;

    const cssClass =
      cls === "title"   ? "const-title"   :
      cls === "article" ? "const-article" :
      cls === "section" ? "const-section" :
      "const-body";

    return (
      <p key={i} ref={ref} className={cssClass}
        style={matches ? { background: "#FEFCE8", borderRadius: 3, padding: "1px 3px" } : undefined}
      >
        {content}
      </p>
    );
  });

  // Count total matches for display
  const totalMatches = search
    ? lines.filter(l => l.toLowerCase().includes(searchTerm)).length
    : 0;

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: CREAM, minHeight: "100vh" }}>
      <style>{GLOBAL_CSS}</style>
      <Header onHome={onBack} />

      {/* ── TOP BAR ── */}
      <div style={{ background: "white", borderBottom: "1px solid #E5DDD0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 48px" }}>
          <button className="back-link" onClick={onBack}>← Back to search</button>

          {/* Version identity */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "1.18rem", fontWeight: 700, color: PRIMARY }}>
              {meta?.title}
            </h1>
          </div>

          {/* Effective date — displayed clearly */}
          <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 8, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 5, padding: "6px 14px" }}>
            <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: ".7rem", fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: ".08em" }}>
              In force
            </span>
            <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: ".93rem", fontWeight: 700, color: PRIMARY }}>
              {meta?.startDate} — {meta?.endDate}
            </span>
          </div>
        </div>

        {/* ── SEARCH BAR (inline in top bar) ── */}
        <div style={{ borderTop: "1px solid #F0EBE1", background: "#FAFAFA" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 48px", display: "flex", alignItems: "center", gap: 10 }}>
            <input
              className="text-input"
              style={{ maxWidth: 400 }}
              placeholder="Search this constitution…"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applySearch()}
            />
            <button className="primary-btn" style={{ padding: "9px 20px", fontSize: ".86rem" }} onClick={applySearch}>
              Search
            </button>
            {search && (
              <button
                onClick={clearSearch}
                style={{ background: "none", border: "1px solid #C9C0AE", borderRadius: 5, padding: "8px 14px", cursor: "pointer", fontFamily: "'Source Sans 3', sans-serif", fontSize: ".84rem", color: "#6B7280" }}
              >
                Clear
              </button>
            )}
            {search && (
              <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: ".82rem", color: "#6B7280" }}>
                {totalMatches === 0
                  ? `No results for "${search}"`
                  : `${totalMatches} match${totalMatches !== 1 ? "es" : ""} for "${search}"`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── CONSTITUTION TEXT ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 48px 60px" }}>
        <div style={{ background: "white", border: "1px solid #E5DDD0", borderRadius: 8, padding: "52px 64px" }}>
          {rendered}
        </div>
      </div>

      <Footer />
    </div>
  );
}
