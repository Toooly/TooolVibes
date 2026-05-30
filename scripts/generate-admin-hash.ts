import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npx tsx scripts/generate-admin-hash.ts <password>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("Password hash (set as TOOOLVIBES_ADMIN_PASSWORD_HASH):");
console.log(hash);
console.log("Escaped .env value for Next.js local env files:");
console.log(hash.replace(/\$/g, "\\$"));
