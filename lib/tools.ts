// lib/tools.ts

export const tbTools = [
  {
    type: "function" as const,
    function: {
      name: "rag_query",
      description: "Query the TB RAG store for guideline excerpts and tables.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The clinician's TB-related question to send to the RAG backend."
          }
        },
        required: ["question"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "tda",
      description: "Run the WHO pediatric TB treatment decision algorithm.",
      parameters: {
        type: "object",
        properties: {
          patient_json: {
            type: "string",
            description:
              "Structured JSON representation of the pediatric patient, including age, weight, symptoms, test results, and comorbidities."
          }
        },
        required: ["patient_json"]
      }
    }
  }
];

export type ToolDefinition = (typeof tbTools)[number];
