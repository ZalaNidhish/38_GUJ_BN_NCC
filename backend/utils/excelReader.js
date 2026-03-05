/**
 * excelReader.js
 * Reads cadet master data from the Excel file.
 * The Excel sheet is the single source of truth for locked fields:
 *   name, rank, wing, battalion, phone, dateOfBirth, gender, joiningYear
 */

const XLSX = require("xlsx");
const path = require("path");

const EXCEL_PATH = path.join(__dirname, "../ncc_cadets_master.xlsx");

// Cache so we don't re-read on every request
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

function loadSheet() {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) return cache;

  try {
    const wb = XLSX.readFile(EXCEL_PATH);
    const ws = wb.Sheets["Cadets"];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const map = {};
    for (const row of rows) {
      const regNum = (row["Regimental Number"] || "").toString().trim().toUpperCase();
      if (!regNum) continue;

      // Parse date of birth (Excel may store as serial number or string)
      let dob = null;
      const dobRaw = row["Date of Birth"];
      if (dobRaw) {
        if (typeof dobRaw === "number") {
          // Excel date serial
          dob = XLSX.SSF.parse_date_code(dobRaw);
          dob = new Date(dob.y, dob.m - 1, dob.d).toISOString();
        } else {
          dob = new Date(dobRaw).toISOString();
        }
      }

      map[regNum] = {
        regimentalNumber: regNum,
        name:          (row["Name"] || "").toString().trim(),
        rank:          (row["Rank"] || "").toString().trim(),
        wing:          (row["Wing"] || "Army").toString().trim(),
        battalion:     (row["Battalion"] || "").toString().trim(),
        phone:         (row["Phone"] || "").toString().trim(),
        dateOfBirth:   dob,
        gender:        (row["Gender"] || "").toString().trim(),
        joiningYear:   row["Joining Year"] ? parseInt(row["Joining Year"]) : null,
        attendancePct: row["Attendance %"] ? parseFloat(row["Attendance %"]) : 0,
        totalParades:  row["Total Parades"] ? parseInt(row["Total Parades"]) : 0,
        paradesPresent: row["Parades Present"] ? parseInt(row["Parades Present"]) : 0,
      };
    }

    cache = map;
    cacheTime = now;
    return map;
  } catch (err) {
    console.error("Excel read error:", err.message);
    return {};
  }
}

/**
 * Get cadet master data by regimental number.
 * Returns null if not found.
 */
function getCadetByRegNo(regimentalNumber) {
  const map = loadSheet();
  return map[(regimentalNumber || "").toUpperCase()] || null;
}

/**
 * Get all cadets as an array.
 */
function getAllCadets() {
  return Object.values(loadSheet());
}

module.exports = { getCadetByRegNo, getAllCadets };
