import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Building data with exact NORSU Bayawan—Santa Catalina campus coordinates and rooms matching the original PHP system
const buildings = [
  {
    name: "ACADEMIC BUILDING",
    description: "NORSU Bayawan—Santa Catalina Academic Building",
    coordinates: JSON.stringify([[9.35430,122.83784],[9.35423,122.83802],[9.35392,122.83789],[9.35399,122.83771]]),
    color: "#0078D4",
    rooms: ["Acad Room 1", "Acad Room 2", "Acad Room 3"]
  },
  {
    name: "ADMINISTRATION OFFICE",
    description: "NORSU Bayawan—Santa Catalina Administration Office",
    coordinates: JSON.stringify([[9.352784,122.838310],[9.353017,122.838415],[9.352975,122.838515],[9.352848,122.838459],[9.352808,122.838549],[9.352935,122.838604],[9.352893,122.838703],[9.352660,122.838600]]),
    color: "#F59E0B",
    rooms: ["CAS Ext Room 3", "CAS Ext Room 4", "ADMINISTRATION OFFICE"]
  },
  {
    name: "AVR ROOM",
    description: "NORSU Bayawan—Santa Catalina AVR Room",
    coordinates: JSON.stringify([[9.35359,122.83665],[9.35364,122.83653],[9.35375,122.83657],[9.35370,122.83670]]),
    color: "#10B981",
    rooms: ["AVR 1", "AVR 2", "Control Room"]
  },
  {
    name: "COLLEGE OF AGRICULTURE AND FORESTRY BUILDING",
    description: "NORSU Bayawan—Santa Catalina CAF Building",
    coordinates: JSON.stringify([[9.35296,122.83819],[9.35310,122.83787],[9.35308,122.83786],[9.35312,122.83775],[9.35306,122.83772],[9.35301,122.83783],[9.35299,122.83782],[9.35285,122.83814]]),
    color: "#0078D4",
    rooms: ["CAF Office", "CAF Room 1", "CAF Room 2", "CAF Faculty"]
  },
  {
    name: "COLLEGE OF ARTS AND SCIENCES BUILDING-01",
    description: "NORSU Bayawan—Santa Catalina CAS Building",
    coordinates: JSON.stringify([[9.352822,122.838813],[9.353345,122.839062],[9.353285,122.839192],[9.352760,122.838945]]),
    color: "#0078D4",
    rooms: ["CAS Office", "CAS 11", "CAS 12", "CAS 13", "CAS 14", "CAS 15", "CAS 16", "CAS 17", "CAS 18"]
  },
  {
    name: "COLLEGE OF ARTS AND SCIENCES BUILDING-02",
    description: "NORSU Bayawan—Santa Catalina CAS Building",
    coordinates: JSON.stringify([[9.352885,122.839635],[9.353445,122.839884],[9.353404,122.839982],[9.352842,122.839735]]),
    color: "#0078D4",
    rooms: ["CAS 01", "CAS 02", "CAS 03", "CAS 04", "CAS 05"]
  },
  {
    name: "COLLEGE OF ARTS AND SCIENCES BUILDING-03",
    description: "NORSU Bayawan—Santa Catalina CTED Room",
    coordinates: JSON.stringify([[9.3531200,122.837909],[9.3532270,122.837960],[9.353039,122.838410],[9.352931,122.838362]]),
    color: "#0078D4",
    rooms: ["CAS 06", "CAS 07", "CAS 08"]
  },
  {
    name: "COLLEGE OF BUSINESS ADMINISTRATION BUILDING",
    description: "NORSU Bayawan—Santa Catalina CBA Building",
    coordinates: JSON.stringify([[9.35400,122.83601],[9.35394,122.83616],[9.35385,122.83612],[9.35389,122.83602],[9.35385,122.83600],[9.35387,122.83595]]),
    color: "#0078D4",
    rooms: ["CBA Office", "CBA Room 1", "CBA Room 2", "CBA Room 3"]
  },
  {
    name: "COLLEGE OF BUSINESS ADMINISTRATION ROOM",
    description: "NORSU Bayawan—Santa Catalina CBA Room",
    coordinates: JSON.stringify([[9.3532072,122.83794],[9.353258,122.837828],[9.353175,122.837788],[9.3531219,122.83790]]),
    color: "#0078D4",
    rooms: ["CBA Room 4", "CBA Room 5"]
  },
  {
    name: "COLLEGE OF CRIMINAL JUSTICE EDUCATION BUILDING",
    description: "NORSU Bayawan—Santa Catalina CCJE Building",
    coordinates: JSON.stringify([[9.35366,122.83909],[9.35389,122.83858],[9.35377,122.83852],[9.35354,122.83904]]),
    color: "#0078D4",
    rooms: ["CCJE Office", "CCJE Room 1", "CCJE Room 2", "CCJE Room 3"]
  },
  {
    name: "COLLEGE OF CRIMINAL JUSTICE EDUCATION OFFICE",
    description: "NORSU Bayawan—Santa Catalina CCJE Office",
    coordinates: JSON.stringify([[9.35374,122.83811],[9.35379,122.83801],[9.35368,122.83796],[9.35364,122.83806]]),
    color: "#F59E0B",
    rooms: ["CCJE Faculty Office"]
  },
  {
    name: "COLLEGE OF INDUSTRIAL TECHNOLOGY BUILDING-01",
    description: "NORSU Bayawan—Santa Catalina CIT Building",
    coordinates: JSON.stringify([[9.353084,122.839122],[9.353310,122.839223],[9.353279,122.839303],[9.353175,122.839259],[9.353199,122.839192],[9.353100,122.839444],[9.352980,122.839395]]),
    color: "#0078D4",
    rooms: ["CIT Office", "CIT Room 1", "CIT Room 2", "CIT Room 3"]
  },
  {
    name: "COLLEGE OF INDUSTRIAL TECHNOLOGY BUILDING-02",
    description: "NORSU Bayawan—Santa Catalina CIT New Building",
    coordinates: JSON.stringify([[9.352930,122.839402],[9.353049,122.839452],[9.352970,122.839644],[9.352850,122.839595]]),
    color: "#0078D4",
    rooms: ["CIT Room 4", "CIT Room 5", "CIT Room 6"]
  },
  {
    name: "COLLEGE OF TEACHER EDUCATION BUILDING",
    description: "NORSU Bayawan—Santa Catalina CTED Building",
    coordinates: JSON.stringify([[9.353028,122.837540],[9.353118,122.837334],[9.353182,122.837362],[9.353161,122.837408],[9.353540,122.837574],[9.35356,122.83753],[9.353795,122.837633],[9.353707,122.837837]]),
    color: "#0078D4",
    rooms: ["CTED Office", "CTED Room 1", "CTED Room 2", "CTED Room 3", "CTED Room 4"]
  },
  {
    name: "DEPARTMENT OF AIR SCIENCE TACTICS OFFICE",
    description: "NORSU Bayawan—Santa Catalina DAST Office",
    coordinates: JSON.stringify([[9.352609,122.838730],[9.352727,122.838784],[9.352684,122.838879],[9.352566,122.838826]]),
    color: "#F59E0B",
    rooms: ["DAST Office"]
  },
  {
    name: "ECP OFFICE",
    description: "NORSU Bayawan—Santa Catalina ECP Building",
    coordinates: JSON.stringify([[9.352875,122.836606],[9.352922,122.836513],[9.352975,122.836546],[9.352932,122.836637]]),
    color: "#6B7280",
    rooms: ["ECP Office"]
  },
  {
    name: "GYM",
    description: "NORSU Bayawan—Santa Catalina Gym",
    coordinates: JSON.stringify([[9.353458,122.837340],[9.353483,122.837282],[9.353407,122.837248],[9.353382,122.837306],[9.353293,122.837267],[9.353482,122.836829],[9.353738,122.836942],[9.353549,122.837381]]),
    color: "#10B981",
    rooms: ["Gym Main", "Gym Storage"]
  },
  {
    name: "LIBRARY BUILDING",
    description: "NORSU Bayawan—Santa Catalina Library",
    coordinates: JSON.stringify([[9.35393,122.83624],[9.35381,122.83652],[9.35365,122.83645],[9.35377,122.83617]]),
    color: "#10B981",
    rooms: ["Library Main", "Library Computer Lab", "Library Office"]
  },
  {
    name: "REGISTRAR BUILDING",
    description: "NORSU Bayawan—Santa Catalina Registrar Building",
    coordinates: JSON.stringify([[9.35241,122.83814],[9.35265,122.83753],[9.35254,122.83748],[9.35230,122.83809]]),
    color: "#F59E0B",
    rooms: ["Registrar Office", "Records Office"]
  },
  {
    name: "SAS OFFICE",
    description: "NORSU Bayawan—Santa Catalina SAS Office",
    coordinates: JSON.stringify([[9.353432,122.838168],[9.353472,122.838067],[9.353335,122.83801],[9.353295,122.83811]]),
    color: "#6B7280",
    rooms: ["SAS Office"]
  },
  {
    name: "SECURITY OFFICE",
    description: "NORSU Bayawan—Santa Catalina Security Office",
    coordinates: JSON.stringify([[9.352359,122.838400],[9.352477,122.838454],[9.352434,122.838549],[9.352316,122.838496]]),
    color: "#6B7280",
    rooms: ["Security Office"]
  },
  {
    name: "SUPPLY OFFICE",
    description: "NORSU Bayawan—Santa Catalina Supply Office Building",
    coordinates: JSON.stringify([[9.353475,122.838745],[9.353540,122.838605],[9.353430,122.838553],[9.353364,122.838695]]),
    color: "#6B7280",
    rooms: ["Supply Office"]
  }
];

// Sample faculty records from the original database
const facultyData = [
  { facultyId: "202300399", name: "Jayson Fuentes", email: "jayson.f.bsinfotech@gmail.com" },
  { facultyId: "202300361", name: "Maria Santos", email: "maria.santos@norsu.edu.ph" },
  { facultyId: "202300401", name: "Roberto Cruz", email: "roberto.cruz@norsu.edu.ph" },
  { facultyId: "202300415", name: "Ana Reyes", email: "ana.reyes@norsu.edu.ph" },
];

// Sample staff records
const staffData = [
  { staffId: "202300500", name: "Carlo Mendoza", email: "carlo.mendoza@norsu.edu.ph" },
  { staffId: "202300501", name: "Elena Villanueva", email: "elena.villanueva@norsu.edu.ph" },
];

// Sample student records
const studentData = [
  { studentId: "202300123", name: "Juan Dela Cruz", email: "juan.delacruz@norsu.edu.ph" },
  { studentId: "202300124", name: "Maria Garcia", email: "maria.garcia@norsu.edu.ph" },
  { studentId: "202300125", name: "Pedro Reyes", email: "pedro.reyes@norsu.edu.ph" },
  { studentId: "202300126", name: "Santos Rivera", email: "santos.rivera@norsu.edu.ph" },
  { studentId: "202300127", name: "Carmen Aquino", email: "carmen.aquino@norsu.edu.ph" },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data
  await prisma.roomLogin.deleteMany();
  await prisma.appUser.deleteMany();
  await prisma.room.deleteMany();
  await prisma.building.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.student.deleteMany();

  // Create faculty
  console.log('Creating faculty records...');
  for (const f of facultyData) {
    await prisma.faculty.create({ data: f });
  }

  // Create staff
  console.log('Creating staff records...');
  for (const s of staffData) {
    await prisma.staff.create({ data: s });
  }

  // Create students
  console.log('Creating student records...');
  for (const s of studentData) {
    await prisma.student.create({ data: s });
  }

  // Create buildings with rooms
  console.log('Creating buildings and rooms...');
  for (const b of buildings) {
    const building = await prisma.building.create({
      data: {
        name: b.name,
        description: b.description,
        coordinates: b.coordinates,
        color: b.color,
      },
    });

    for (const roomName of b.rooms) {
      await prisma.room.create({
        data: {
          name: roomName,
          buildingId: building.id,
        },
      });
    }
  }

  // Create test AppUser accounts (with known passwords for testing)
  console.log('Creating test user accounts...');
  const testUsers = [
    { userId: "202300399", name: "Jayson Fuentes", role: "Faculty", password: "password123", isAdmin: false },
    { userId: "202300361", name: "Maria Santos", role: "Faculty", password: "password123", isAdmin: false },
    { userId: "202300401", name: "Roberto Cruz", role: "Faculty", password: "password123", isAdmin: false },
    { userId: "202300415", name: "Ana Reyes", role: "Faculty", password: "password123", isAdmin: false },
    { userId: "202300500", name: "Carlo Mendoza", role: "Staff", password: "password123", isAdmin: false },
    { userId: "202300501", name: "Elena Villanueva", role: "Staff", password: "password123", isAdmin: false },
    { userId: "202300123", name: "Juan Dela Cruz", role: "Student", password: "password123", isAdmin: false },
    { userId: "202300124", name: "Maria Garcia", role: "Student", password: "password123", isAdmin: false },
    // Admin account
    { userId: "202600001", name: "System Administrator", role: "Admin", password: "admin2026", isAdmin: true },
  ];

  for (const u of testUsers) {
    const hashedPassword = await hash(u.password, 10);
    await prisma.appUser.create({
      data: {
        userId: u.userId,
        name: u.name,
        role: u.role,
        password: hashedPassword,
        isAdmin: u.isAdmin,
      },
    });
  }

  // Create some sample room logins to show occupancy
  console.log('Creating sample room logins...');
  const allRooms = await prisma.room.findMany();
  if (allRooms.length > 0) {
    const cas01 = allRooms.find(r => r.name === "CAS 01");
    const casOffice = allRooms.find(r => r.name === "CAS Office");
    const acadRoom1 = allRooms.find(r => r.name === "Acad Room 1");
    const cbaOffice = allRooms.find(r => r.name === "CBA Office");
    const ccjeOffice = allRooms.find(r => r.name === "CCJE Office");
    const ctedOffice = allRooms.find(r => r.name === "CTED Office");
    
    if (cas01) {
      await prisma.roomLogin.create({
        data: { roomId: cas01.id, userId: "202300399", role: "Faculty", loginTime: new Date() }
      });
    }
    if (casOffice) {
      await prisma.roomLogin.create({
        data: { roomId: casOffice.id, userId: "202300361", role: "Faculty", loginTime: new Date() }
      });
    }
    if (acadRoom1) {
      await prisma.roomLogin.create({
        data: { roomId: acadRoom1.id, userId: "202300500", role: "Staff", loginTime: new Date() }
      });
      await prisma.roomLogin.create({
        data: { roomId: acadRoom1.id, userId: "202300123", role: "Student", loginTime: new Date() }
      });
      await prisma.roomLogin.create({
        data: { roomId: acadRoom1.id, userId: "202300124", role: "Student", loginTime: new Date() }
      });
    }
    if (cbaOffice) {
      await prisma.roomLogin.create({
        data: { roomId: cbaOffice.id, userId: "202300401", role: "Faculty", loginTime: new Date() }
      });
    }
    if (ccjeOffice) {
      await prisma.roomLogin.create({
        data: { roomId: ccjeOffice.id, userId: "202300415", role: "Faculty", loginTime: new Date() }
      });
    }
    if (ctedOffice) {
      await prisma.roomLogin.create({
        data: { roomId: ctedOffice.id, userId: "202300501", role: "Staff", loginTime: new Date() }
      });
    }
  }

  // Print summary
  const buildingCount = await prisma.building.count();
  const roomCount = await prisma.room.count();
  const facultyCount = await prisma.faculty.count();
  const staffCount = await prisma.staff.count();
  const studentCount = await prisma.student.count();
  const userCount = await prisma.appUser.count();
  const loginCount = await prisma.roomLogin.count();

  console.log('\n✅ Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`  Buildings: ${buildingCount}`);
  console.log(`  Rooms: ${roomCount}`);
  console.log(`  Faculty: ${facultyCount}`);
  console.log(`  Staff: ${staffCount}`);
  console.log(`  Students: ${studentCount}`);
  console.log(`  App Users: ${userCount}`);
  console.log(`  Room Logins: ${loginCount}`);
  console.log('\n🔑 Test Accounts:');
  console.log('  Faculty: 202300399, 202300361, 202300401, 202300415 - password: password123');
  console.log('  Staff:   202300500, 202300501 - password: password123');
  console.log('  Student: 202300123, 202300124 - password: password123');
  console.log('  Admin:   202600001 (System Administrator) - password: admin2026');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
