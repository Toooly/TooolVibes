const fs = require('fs');
const path = 'components/directory/mobile-catalog-view.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = '      </div>\n\n      {/* Content */}\n      <AnimatePresence mode="wait">\n        {view === "categories" ? (';
const insert = `      </div>\n\n      {/* Level chips */}\n      {view === "tools" && (\n        <div className="mobile-catalog-view__chips">\n          {levelChips.map((chip) => (\n            <button\n              key={chip.key}\n              type="button"\n              onClick={() => setActiveLevel(chip.key)}\n              className={\`mobile-catalog-view__chip\${activeLevel === chip.key ? " is-active" : ""}\`}\n            >\n              {chip.label}\n            </button>\n          ))}\n        </div>\n      )}\n\n      {/* Content */}\n      <AnimatePresence mode="wait">\n        {view === "categories" ? (`;

if (!content.includes(target)) {
  console.error('TARGET NOT FOUND');
  process.exit(1);
}

content = content.replace(target, insert);
fs.writeFileSync(path, content);
console.log('OK');
