/**
 * Retrieval debugger. Prints the top scored entries for a set of queries so a
 * ranking failure can be diagnosed without guessing.
 *
 * Run:  npx tsx scripts/retrieval-debug.ts
 */

import { retrieve, knowledge } from "../src/lib/knowledge";

const QUERIES = [
  "are you a Canadian company?",
  "who are you?",
  "what does observability cost?",
  "do you have a price list?",
  "can you set up CI/CD?",
  "do you handle openshift?",
  "do you handle compliance?",
  "we could just do this ourselves in-house",
  "how big is your company?",
  "do you take interns?",
  "how do I book a call?",
  "what is your phone number?",
];

console.log(`knowledge entries: ${knowledge.length}\n`);

for (const q of QUERIES) {
  const hits = retrieve(q, 4);
  console.log(`"${q}"`);
  if (hits.length === 0) {
    console.log("    (no matches at all)");
  } else {
    for (const h of hits) {
      console.log(`    ${h.score.toFixed(3)}  ${h.entry.key.padEnd(22)} ${h.entry.title.slice(0, 44)}`);
    }
  }
  console.log("");
}
