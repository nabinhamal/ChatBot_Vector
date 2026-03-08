import { indexTheDocuments } from "./prepare";

const filePath = "./NovaTech_Internal_Knowledge_Base.pdf";
await indexTheDocuments({ filePath });
console.log("Indexing complete!");
