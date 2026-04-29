
const genai = require('@google/genai');
console.log("Exports:", Object.keys(genai));
if (genai.Type) {
  console.log("Type:", genai.Type);
} else {
  console.log("Type is undefined");
}
