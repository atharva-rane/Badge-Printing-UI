import "../../styles/common/SearchBar.css";

/**
 * SearchBar
 * -----------------------------------------------------------------------
 * One shared search input used across every page (Masters, Volunteer
 * Activities, etc.) instead of every page defining its own search box
 * markup + CSS.
 *
 * Usage:
 *   <SearchBar
 *     label="Search Seva Name"
 *     placeholder="Search Seva Name..."
 *     value={searchText}
 *     onChange={setSearchText}
 *   />
 */
const SearchBar = ({
  label,
  placeholder = "Search...",
  value,
  onChange,
  onKeyDown,
  id,
  className = "",
}) => {
  return (
    <div className={`app-search-box ${className}`.trim()}>
      {label && (
        <label className="app-search-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        className="app-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
    </div>
  );
};

export default SearchBar;
