/**
 * seed.js — One-time script to populate MongoDB from ncc_cadets_master.xlsx
 *
 * What it does:
 *  1. Reads every cadet row from the Excel file
 *  2. Creates a User account (regimental number as username & default password)
 *  3. Creates a CadetProfile with ALL fields from the Excel row stored in DB
 *  4. Creates the admin account AND admin CadetProfile (FIX: was missing before)
 *
 * After running this, the Excel file is no longer needed by the app.
 *
 * Usage:
 *   node seed.js
 *
 * Re-running is safe — existing records are skipped.
 */

const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");
const User = require("./models/User");
const CadetProfile = require("./models/CadetProfile");
require("dotenv").config();

// ─── Excel Reader ─────────────────────────────────────────────────────────────

function readCadetsFromExcel() {
  const filePath = path.join(__dirname, "ncc_cadets_master.xlsx");
  const wb = XLSX.readFile(filePath);

  const sheetName = wb.SheetNames.includes("Cadets") ? "Cadets" : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  const cadets = [];
  for (const row of rows) {
    const regNum = (row["Regimental Number"] || "").toString().trim().toUpperCase();
    if (!regNum) continue;

    let dateOfBirth = null;
    const dobRaw = row["Date of Birth"];
    if (dobRaw) {
      if (typeof dobRaw === "number") {
        const parsed = XLSX.SSF.parse_date_code(dobRaw);
        dateOfBirth = new Date(parsed.y, parsed.m - 1, parsed.d);
      } else if (dobRaw instanceof Date) {
        dateOfBirth = dobRaw;
      } else {
        const d = new Date(dobRaw);
        if (!isNaN(d)) dateOfBirth = d;
      }
    }

    cadets.push({
      regimentalNumber: regNum,
      name:          (row["Name"]          || "").toString().trim(),
      rank:          (row["Rank"]          || "").toString().trim(),
      wing:          (row["Wing"]          || "").toString().trim(),
      battalion:     (row["Battalion"]     || "").toString().trim(),
      phone:         (row["Phone"]         || "").toString().trim(),
      dateOfBirth,
      gender:        (row["Gender"]        || "").toString().trim(),
      joiningYear:   row["Joining Year"]   ? parseInt(row["Joining Year"])   : null,
      address:       (row["Address"]       || "").toString().trim(),
      attendancePct: row["Attendance %"]   ? parseFloat(row["Attendance %"]) : 0,
      totalParades:  row["Total Parades"]  ? parseInt(row["Total Parades"])  : 0,
      paradesPresent:row["Parades Present"]? parseInt(row["Parades Present"]): 0,
    });
  }

  return cadets;
}

// ─── Seed Logic ──────────────────────────────────────────────────────────────

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  Connected to MongoDB\n");

    // ── 1. Admin account ──────────────────────────────────────────────────────
    const ADMIN_REG = "GJADMIN2025001";
    let adminUser = await User.findOne({ regimentalNumber: ADMIN_REG });

    if (adminUser) {
      console.log(`⏩  Admin user already exists: ${ADMIN_REG}`);
    } else {
      adminUser = await User.create({
        regimentalNumber: ADMIN_REG,
        password: ADMIN_REG,
        role: "admin",
        isDefaultPassword: true,
      });
      console.log(`✅  Admin user created: ${ADMIN_REG}`);
    }

    // FIX: Also create CadetProfile for admin — was missing which caused admin profile 404
    const adminProfileExists = await CadetProfile.findOne({ user: adminUser._id });
    if (adminProfileExists) {
      console.log(`⏩  Admin profile already exists`);
    } else {
      await CadetProfile.create({
        user:            adminUser._id,
        regimentalNumber: ADMIN_REG,
        name:            "Administrator",
        rank:            "ANO",
        wing:            "Army",
        battalion:       "NCC Battalion",
        phone:           "",
        gender:          "",
        joiningYear:     null,
        address:         "",
        attendancePct:   0,
        totalParades:    0,
        paradesPresent:  0,
      });
      console.log(`✅  Admin profile created`);
    }

    // ── 2. Cadets from Excel ──────────────────────────────────────────────────
    console.log("\n📄  Reading Excel file...");
    const cadets = readCadetsFromExcel();
    console.log(`📊  Found ${cadets.length} cadet(s) in Excel\n`);

    if (cadets.length === 0) {
      console.error("❌  No cadet rows found in Excel. Check sheet name (must be 'Cadets') and column headers.");
      process.exit(1);
    }

    let created = 0;
    let skipped = 0;
    let errors  = 0;

    for (const cadet of cadets) {
      try {
        let userDoc = await User.findOne({ regimentalNumber: cadet.regimentalNumber });

        if (!userDoc) {
          userDoc = await User.create({
            regimentalNumber: cadet.regimentalNumber,
            password: cadet.regimentalNumber,
            role: "cadet",
            isDefaultPassword: true,
          });
        }

        const profileExists = await CadetProfile.findOne({ user: userDoc._id });

        if (profileExists) {
          console.log(`⏩  Profile already exists, skipping: ${cadet.regimentalNumber} (${cadet.name})`);
          skipped++;
        } else {
          await CadetProfile.create({
            user:            userDoc._id,
            regimentalNumber: cadet.regimentalNumber,
            name:            cadet.name,
            rank:            cadet.rank,
            wing:            cadet.wing,
            battalion:       cadet.battalion,
            phone:           cadet.phone,
            dateOfBirth:     cadet.dateOfBirth,
            gender:          cadet.gender,
            joiningYear:     cadet.joiningYear,
            address:         cadet.address,
            attendancePct:   cadet.attendancePct,
            totalParades:    cadet.totalParades,
            paradesPresent:  cadet.paradesPresent,
          });
          console.log(`✅  Created: ${cadet.regimentalNumber} — ${cadet.rank} ${cadet.name}`);
          created++;
        }
      } catch (err) {
        console.error(`❌  Error for ${cadet.regimentalNumber}: ${err.message}`);
        errors++;
      }
    }

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Seed Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  Created : ${created}
  ⏩  Skipped : ${skipped}
  ❌  Errors  : ${errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Cadets can now login with their
  Regimental Number as both username
  and default password.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    process.exit(0);
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
