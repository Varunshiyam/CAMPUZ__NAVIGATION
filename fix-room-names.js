// Script to fix all improper room names in indoorLocationData.js
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, 'src', 'indoorLocationData.js');
let content = fs.readFileSync(filePath, 'utf8');

// Define all the replacements
const replacements = [
    // A-Block Classrooms - fix "....", ", ," patterns
    { from: '"name": "...."', to: '"name": "Classroom A101"' },
    { from: '"name": ".... A102"', to: '"name": "Classroom A102"' },
    { from: '"name": ".... A112"', to: '"name": "Classroom A112"' },
    { from: '"name": ".... A116"', to: '"name": "Classroom A116"' },
    { from: '"name": ".... A117"', to: '"name": "Classroom A117"' },

    // A-Block Classrooms - floor 1
    { from: '"A208":\n    "id": "A208",\n    "name": ", ,"', to: '"A208":\n    "id": "A208",\n    "name": "Classroom A208"' },
    { from: '"name": ", , A209"', to: '"name": "Classroom A209"' },
    { from: '"name": ", , A214"', to: '"name": "Classroom A214"' },

    // A-Block Classrooms - floor 2
    { from: '"A302":\n    "id": "A302",\n    "name": ", ,"', to: '"A302":\n    "id": "A302",\n    "name": "Classroom A302"' },
    { from: '"name": ", , A304"', to: '"name": "Classroom A304"' },
    { from: '"name": ", , A311"', to: '"name": "Classroom A311"' },

    // A-Block Classrooms - floor 3
    { from: '"name": ", , , , , , ,"', to: '"name": "Classroom A401"' },
    { from: '"name": ", , , , , , , A402"', to: '"name": "Classroom A402"' },
    { from: '"name": ", , , , , , , A404"', to: '"name": "Classroom A404"' },
    { from: '"name": ", , , , , , , A405"', to: '"name": "Classroom A405"' },
    { from: '"name": ", , , , , , , A407"', to: '"name": "Classroom A407"' },
    { from: '"name": ", , , , , , , A408"', to: '"name": "Classroom A408"' },
    { from: '"name": ", , , , , , , A412"', to: '"name": "Classroom A412"' },
    { from: '"name": ", , , , , , , A413"', to: '"name": "Classroom A413"' },

    // A-Block Labs - fix MATLAB labs
    { from: '"name": ", ,  (Donald Knuth La[DR]}, Mat Lab"', to: '"name": "MATLAB Lab A307"' },
    { from: '"name": ", ,  (Donald Knuth La[DR]}, Mat Lab A308"', to: '"name": "MATLAB Lab A308"' },
    { from: '"name": ", ,  (Donald Knuth La[DR]}, Mat Lab A310"', to: '"name": "MATLAB Lab A310"' },

    // A-Block Faculty Rooms
    { from: '"name": "English [,"', to: '"name": "English Faculty Room"' },
    { from: '"name": "English [, A406"', to: '"name": "English Faculty Room A406"' },
    { from: '"A105":\n    "id": "A105",\n    "name": "Room"', to: '"A105":\n    "id": "A105",\n    "name": "Faculty Room A105"' },

    // A-Block Offices
    { from: '"name": "Office["', to: '"name": "Office"' },
    { from: '"name": "Cashier Section["', to: '"name": "Cashier Section"' },
    { from: '"name": "0th-floor:Maintenance Dept:"', to: '"name": "Maintenance Department"' },
    { from: '"name": "Drawing Hall -"', to: '"name": "Drawing Hall"' },
    { from: '"name": "IQAC -"', to: '"name": "IQAC"' },
    { from: '"name": "Placement Cell:ablock:"', to: '"name": "Placement Cell"' },

    // D-Block Classrooms
    { from: '"D302":\n    "id": "D302",\n    "name": ", ,"', to: '"D302":\n    "id": "D302",\n    "name": "Classroom D302"' },
    { from: '"name": ", , D303"', to: '"name": "Classroom D303"' },
    { from: '"name": ", , D304"', to: '"name": "Classroom D304"' },
    { from: '"D402":\n    "id": "D402",\n    "name": ", , ,"', to: '"D402":\n    "id": "D402",\n    "name": "Classroom D402"' },
    { from: '"name": ", , , D404"', to: '"name": "Classroom D404"' },
    { from: '"name": ", , , D407"', to: '"name": "Classroom D407"' },
    { from: '"name": ", , , D408"', to: '"name": "Classroom D408"' },

    // D-Block Offices
    { from: '"name": "COE Office:"', to: '"name": "COE Office"' },
    { from: '"name": "COE Valuation Room[, "', to: '"name": "COE Valuation Room"' },
    { from: '"name": "COE Valuation Room[,  D208"', to: '"name": "COE Valuation Room D208"' },
    { from: '"name": "COE Record Rooms[, "', to: '"name": "COE Record Room"' },
    { from: '"name": "COE Record Rooms[,  D308"', to: '"name": "COE Record Room D308"' },
    { from: '"name": "Exam Cell: Dblock:"', to: '"name": "Exam Cell"' },

    // E-Block Faculty Rooms
    { from: '"name": ", ,  (CYBER HoD Cabin"', to: '"name": "Cyber Security Faculty Room"' },
    { from: '"name": ", ,  (CYBER HoD Cabin E108"', to: '"name": "Cyber Security Faculty Room E108"' },
    { from: '"name": ", ,  (CYBER HoD Cabin E109"', to: '"name": "Cyber Security Faculty Room E109"' },
    { from: '"name": ", ,  (ECE PROFESSOR),"', to: '"name": "ECE Faculty Room"' },
    { from: '"name": ", ,  (ECE PROFESSOR), E307-B"', to: '"name": "ECE Faculty Room E307-B"' },
    { from: '"name": ", ,  (ECE PROFESSOR), E307-C"', to: '"name": "ECE Faculty Room E307-C"' },
    { from: '"name": ", ,  (ECE PROFESSOR), E311-B"', to: '"name": "ECE Faculty Room E311-B"' },
    { from: '"E417":\n    "id": "E417",\n    "name": "Room"', to: '"E417":\n    "id": "E417",\n    "name": "Faculty Room E417"' },
    { from: '"E405":\n    "id": "E405",\n    "name": ", , , , ,"', to: '"E405":\n    "id": "E405",\n    "name": "Faculty Room E405"' },
    { from: '"name": ", , , , , E410"', to: '"name": "Faculty Room E410"' },
    { from: '"name": ", , , , , E411"', to: '"name": "Faculty Room E411"' },
    { from: '"name": ", , , , , E412"', to: '"name": "Faculty Room E412"' },
    { from: '"name": ", , , , , E413"', to: '"name": "Faculty Room E413"' },
    { from: '"name": ", , , , , E416"', to: '"name": "Faculty Room E416"' },
    { from: '"name": "ETE PROFESSOR),,"', to: '"name": "ETE Faculty Room"' },
    { from: '"name": "ETE PROFESSOR),, E510"', to: '"name": "ETE Faculty Room E510"' },
    { from: '"name": "ETE PROFESSOR),, E511"', to: '"name": "ETE Faculty Room E511"' },

    // E-Block Offices
    { from: '"name": "Store Room:(A"', to: '"name": "Store Room"' },
    { from: '"name": "Power Room:(A"', to: '"name": "Power Room"' },
    { from: '"name": "Store Room["', to: '"name": "Store Room"' },
    { from: '"name": "UPS Room[ (A)"', to: '"name": "UPS Room"' },
    { from: '"name": "Department Library (EEE)["', to: '"name": "Department Library (EEE)"' },
    { from: '"name": "ECE Store Room["', to: '"name": "ECE Store Room"' },
    { from: '"name": "ECE Meeting and Counseling Room["', to: '"name": "ECE Meeting and Counseling Room"' },
    { from: '"name": "ECE Department Library["', to: '"name": "ECE Department Library"' },
    { from: '"name": "ECE Store Room II["', to: '"name": "ECE Store Room II"' },
    { from: '"name": "ECE Seminar Hall -"', to: '"name": "ECE Seminar Hall"' },

    // E-Block Classrooms
    { from: '"E101":\n    "id": "E101",\n    "name": ", ,"', to: '"E101":\n    "id": "E101",\n    "name": "Classroom E101"' },
    { from: '"name": ", , E102"', to: '"name": "Classroom E102"' },
    { from: '"name": ", , E103"', to: '"name": "Classroom E103"' },
    { from: '"E201":\n    "id": "E201",\n    "name": ", ,"', to: '"E201":\n    "id": "E201",\n    "name": "Classroom E201"' },
    { from: '"name": ", , E202"', to: '"name": "Classroom E202"' },
    { from: '"name": ", , E203"', to: '"name": "Classroom E203"' },
    { from: '"E301":\n    "id": "E301",\n    "name": ", ,"', to: '"E301":\n    "id": "E301",\n    "name": "Classroom E301"' },
    { from: '"name": ", , E302"', to: '"name": "Classroom E302"' },
    { from: '"name": ", , E303"', to: '"name": "Classroom E303"' },
    { from: '"E401":\n    "id": "E401",\n    "name": ", , , ,"', to: '"E401":\n    "id": "E401",\n    "name": "Classroom E401"' },
    { from: '"name": ", , , , E402"', to: '"name": "Classroom E402"' },
    { from: '"name": ", , , , E403"', to: '"name": "Classroom E403"' },
    { from: '"name": ", , , , E415"', to: '"name": "Classroom E415"' },
    { from: '"name": ", , , , E418"', to: '"name": "Classroom E418"' },
    { from: '"E501":\n    "id": "E501",\n    "name": ", , , , , ,"', to: '"E501":\n    "id": "E501",\n    "name": "Classroom E501"' },
    { from: '"name": ", , , , , , E502"', to: '"name": "Classroom E502"' },
    { from: '"name": ", , , , , , E503"', to: '"name": "Classroom E503"' },
    { from: '"E415":\n    "id": "E415",\n    "name": ", , , , , , E415"', to: '"E415":\n    "id": "E415",\n    "name": "Classroom E415"' },
    { from: '"name": ", , , , , , E507"', to: '"name": "Classroom E507"' },
    { from: '"name": ", , , , , , E508"', to: '"name": "Classroom E508"' },
    { from: '"name": ", , , , , , E509"', to: '"name": "Classroom E509"' },

    // E-Block Cell
    { from: '"name": "Karpagam Innovation Centre:"', to: '"name": "Karpagam Innovation Centre"' },

    // Fix floor assignments
    { from: '"A105":\n    "id": "A105",\n    "name": "Faculty Room A105",\n    "parentBuilding": "ABlock",\n    "floor": 3,', to: '"A105":\n    "id": "A105",\n    "name": "Faculty Room A105",\n    "parentBuilding": "ABlock",\n    "floor": 0,' },
    { from: '"A108":\n    "id": "A108",\n    "name": "Maintenance Department",\n    "parentBuilding": "ABlock",\n    "floor": 3,', to: '"A108":\n    "id": "A108",\n    "name": "Maintenance Department",\n    "parentBuilding": "ABlock",\n    "floor": 0,' },
    { from: '"A205":\n    "id": "A205",\n    "name": "IQAC",\n    "parentBuilding": "ABlock",\n    "floor": 3,', to: '"A205":\n    "id": "A205",\n    "name": "IQAC",\n    "parentBuilding": "ABlock",\n    "floor": 1,' },
    { from: '"A106":\n    "id": "A106",\n    "name": "Placement Cell",\n    "parentBuilding": "ABlock",\n    "floor": 3,', to: '"A106":\n    "id": "A106",\n    "name": "Placement Cell",\n    "parentBuilding": "ABlock",\n    "floor": 0,' },
    { from: '"D101":\n    "id": "D101",\n    "name": "Exam Cell",\n    "parentBuilding": "DBlock",\n    "floor": 3,', to: '"D101":\n    "id": "D101",\n    "name": "Exam Cell",\n    "parentBuilding": "DBlock",\n    "floor": 0,' },
    { from: '"E105":\n    "id": "E105",\n    "name": "Cyber Security Faculty Room",\n    "parentBuilding": "E-Block",\n    "floor": 4,', to: '"E105":\n    "id": "E105",\n    "name": "Cyber Security Faculty Room",\n    "parentBuilding": "E-Block",\n    "floor": 0,' },
    { from: '"E108":\n    "id": "E108",\n    "name": "Cyber Security Faculty Room E108",\n    "parentBuilding": "E-Block",\n    "floor": 4,', to: '"E108":\n    "id": "E108",\n    "name": "Cyber Security Faculty Room E108",\n    "parentBuilding": "E-Block",\n    "floor": 0,' },
    { from: '"E109":\n    "id": "E109",\n    "name": "Cyber Security Faculty Room E109",\n    "parentBuilding": "E-Block",\n    "floor": 4,', to: '"E109":\n    "id": "E109",\n    "name": "Cyber Security Faculty Room E109",\n    "parentBuilding": "E-Block",\n    "floor": 0,' },
    { from: '"E106":\n    "id": "E106",\n    "name": "Store Room",\n    "parentBuilding": "E-Block",\n    "floor": 4,', to: '"E106":\n    "id": "E106",\n    "name": "Store Room",\n    "parentBuilding": "E-Block",\n    "floor": 0,' },
    { from: '"E107":\n    "id": "E107",\n    "name": "Power Room",\n    "parentBuilding": "E-Block",\n    "floor": 4,', to: '"E107":\n    "id": "E107",\n    "name": "Power Room",\n    "parentBuilding": "E-Block",\n    "floor": 0,' },
    { from: '"E311":\n    "id": "E311",\n    "name": "Karpagam Innovation Centre",\n    "parentBuilding": "E-Block",\n    "floor": 5,', to: '"E311":\n    "id": "E311",\n    "name": "Karpagam Innovation Centre",\n    "parentBuilding": "E-Block",\n    "floor": 2,' },
];

// Apply all replacements
for (const { from, to } of replacements) {
    content = content.replace(from, to);
}

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Fixed all room names in indoorLocationData.js');
