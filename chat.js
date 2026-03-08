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
    const question = (await rl.question("You: ")).trim();

    if (question.toLowerCase() === "/bye") {
      break;
    }

    // --- AI Safeguards ---
    // 1. Basic Input Validation
    if (!question || question.length < 3) {
      console.log("Assistant: Please provide a more descriptive question.");
      continue;
    }

    if (question.length > 500) {
      console.log("Assistant: Your question is too long. Please shorten it.");
      continue;
    }

    // 2. Basic Prompt Injection Detection
    const injectionPatterns = [
      "ignore all previous instructions",
      "system prompt",
      "you are now",
      "new rules",
    ];
    if (
      injectionPatterns.some((pattern) =>
        question.toLowerCase().includes(pattern),
      )
    ) {
      console.log(
        "Assistant: I noticed an unusual request. Let's stay focused on the context of your data.",
      );
      continue;
    }

    // --- Retrieval ---
    const relevantChunks = await vectorStore.similaritySearch(question, 3);

    if (!relevantChunks || relevantChunks.length === 0) {
      console.log(
        "Assistant: I couldn't find any relevant information in your documents to answer that.",
      );
      continue;
    }

    const context = relevantChunks
      .map((chunk) => chunk.pageContent)
      .join("\n\n");

    const SYSTEM_PROMPT = `You are a professional assistant specialized in answering questions based ONLY on the provided context.
Strict Rules:
1. If the answer is not contained within the context, respond exactly with: "I'm sorry, I don't have enough information in my knowledge base to answer that."
2. Do not use outside knowledge.
3. Keep the answer concise and relevant.
4. If the user asks something inappropriate or off-topic relative to the documents, politely redirect them.`;

    const userQuery = `Context:
${context}

Question: ${question}
Answer:`;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userQuery },
        ],
        temperature: 0.1, // Lower temperature for more grounded responses
      });
      console.log(`Assistant: ${completion.choices[0].message.content}`);
    } catch (error) {
      console.error(
        "Assistant: Sorry, I encountered an error processing your request.",
      );
    }
  }
  rl.close();
}
chat();
