import readline from "node:readline/promises";
import { Groq } from "groq-sdk";
import { vectorStore } from "./prepare.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function chat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const question = await rl.question("You: ");
    if (question === "/bye") {
      break;
    }
    //retrivel
    const releventChnunks = await vectorStore.similaritySearch(question, 3);

    const context = releventChnunks.map((chunk) =>
      chunk.pageContent.join("\n\n"),
    );

    const SYSTEM_PROMPT = `You are an assistant for question-answerign task.Use the following relevant pieces of retrieved context to answer the question.If you dont know the answer say I don't know. `;
    const userQuery = `Question: ${question}
      Relevant context: ${context}
      Answer:`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userQuery,
        },
      ],
    });
    console.log(completion.choices[0].message.content);
  }
  rl.close();
}
chat();
