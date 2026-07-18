// =====================================================================
// mockData.js
// ---------------------------------------------------------------------
// Temporary, front-end-only data source for the Seva Allocation grid.
//
// WHY THIS FILE EXISTS
// The real endpoints (GetAllocationList / GetKendraList / GetSevaList /
// GetShiftList) aren't wired up yet. Until they are, SevaAllocation.jsx
// reads from here instead, guarded by the `USE_MOCK_DATA` flag at the
// top of that file. Nothing else in the component needs to change when
// the real API is ready — just flip that flag to `false`.
//
// WHAT'S IN HERE
//  - KENDRA_LIST / SEVA_LIST / SHIFT_LIST  -> same shape the dropdown
//    endpoints are expected to return ({ kendraName }, { sevaName },
//    { shiftName }), so the column defs in SevaAllocation.jsx don't
//    need any special-casing for mock vs. real data.
//  - FIXED_MOCK_ROWS -> exactly 10 hand-written sample volunteers, good
//    for everyday UI development.
//  - generateMockAllocationData(count) -> produces `count` synthetic
//    rows by cycling through name/kendra/seva pools. Use this to load
//    test the grid at real scale (~5000 rows) before the API exists.
// =====================================================================

export const KENDRA_LIST = [
  { kendraName: "Andheri" },
  { kendraName: "Borivali" },
  { kendraName: "Dadar" },
  { kendraName: "Ghatkopar" },
  { kendraName: "Thane" },
  { kendraName: "Vashi" },
];

export const SEVA_LIST = [
  { sevaName: "Parking Seva" },
  { sevaName: "Prasad Seva" },
  { sevaName: "Reception Seva" },
  { sevaName: "Security Seva" },
  { sevaName: "Sound & Media Seva" },
  { sevaName: "Cleaning Seva" },
  { sevaName: "Medical Seva" },
];

export const SHIFT_LIST = [
  { shiftName: "I" },
  { shiftName: "II" },
  { shiftName: "G" },
];

const GENDERS = ["Male", "Female"];

const EDUCATION_LEVELS = [
  "10th Pass",
  "12th Pass",
  "Diploma",
  "Graduate",
  "Post Graduate",
];

const OCCUPATIONS = [
  "Student",
  "Engineer",
  "Teacher",
  "Business",
  "Homemaker",
  "Retired",
  "Doctor",
  "Accountant",
];

const FIRST_NAMES = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Sai",
  "Krishna",
  "Ishaan",
  "Rohan",
  "Kabir",
  "Ananya",
  "Diya",
  "Isha",
  "Riya",
  "Saanvi",
  "Meera",
  "Priya",
  "Neha",
  "Pooja",
  "Kavya",
];

const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Patel",
  "Shah",
  "Mehta",
  "Gupta",
  "Iyer",
  "Nair",
  "Reddy",
  "Joshi",
  "Desai",
  "Kulkarni",
  "Rao",
  "Pillai",
  "Chopra",
];

// ---------------------------------------------------------------------
// A small deterministic PRNG-ish picker so mock data stays stable
// across re-renders in dev (avoids values flickering on hot reload).
// ---------------------------------------------------------------------
const pick = (arr, seed) => arr[seed % arr.length];

/**
 * 10 fixed, hand-authored sample rows.
 * Good default for day-to-day UI / feature development.
 */
export const FIXED_MOCK_ROWS = Array.from({ length: 10 }, (_, i) => {
  const idx = i + 1;
  const first = pick(FIRST_NAMES, i);
  const last = pick(LAST_NAMES, i * 3 + 1);
  const volName = `${first} ${last}`;

  return {
    id: idx, // pretend backend id, so getBackendId() treats these as "persisted"
    kendraName: pick(KENDRA_LIST, i).kendraName,
    sevaName: pick(SEVA_LIST, i * 2).sevaName,
    shift: pick(SHIFT_LIST, i).shiftName,
    volName,
    age: 20 + ((i * 7) % 40),
    gender: pick(GENDERS, i),
    emailId: `${first}.${last}`.toLowerCase() + "@example.com",
    mobileNo: `9${(800000000 + idx * 137).toString().slice(0, 9)}`,
    whatsappNo: `9${(700000000 + idx * 211).toString().slice(0, 9)}`,
    comingToBapuSince: `${2005 + (i % 18)}`,
    education: pick(EDUCATION_LEVELS, i),
    occupation: pick(OCCUPATIONS, i),
    comingThursdaySeva: i % 2 === 0,
    badgeNo: `B-${1000 + idx}`,
    thursdayCoordinator: i % 4 === 0,
    utsavCoordinator: i % 5 === 0,
  };
});

/**
 * Generates `count` synthetic allocation rows.
 * Use this in place of FIXED_MOCK_ROWS to test the grid at real scale
 * (e.g. generateMockAllocationData(5000)) before the API is connected.
 *
 * @param {number} count
 * @returns {object[]}
 */
export function generateMockAllocationData(count = 5000) {
  const rows = new Array(count);

  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length];
    const volName =
      `${first} ${last} ${Math.floor(i / FIRST_NAMES.length) || ""}`.trim();

    rows[i] = {
      id: i + 1,
      kendraName: KENDRA_LIST[i % KENDRA_LIST.length].kendraName,
      sevaName: SEVA_LIST[(i * 3) % SEVA_LIST.length].sevaName,
      shift: SHIFT_LIST[i % SHIFT_LIST.length].shiftName,
      volName,
      age: 18 + (i % 55),
      gender: GENDERS[i % GENDERS.length],
      emailId: `${first}.${last}${i}`.toLowerCase() + "@example.com",
      mobileNo: `9${(800000000 + i * 97) % 900000000}`.slice(0, 10),
      whatsappNo: `9${(700000000 + i * 131) % 900000000}`.slice(0, 10),
      comingToBapuSince: `${2000 + (i % 24)}`,
      education: EDUCATION_LEVELS[i % EDUCATION_LEVELS.length],
      occupation: OCCUPATIONS[i % OCCUPATIONS.length],
      comingThursdaySeva: i % 2 === 0,
      badgeNo: `B-${1000 + i}`,
      thursdayCoordinator: i % 11 === 0,
      utsavCoordinator: i % 13 === 0,
    };
  }

  return rows;
}
