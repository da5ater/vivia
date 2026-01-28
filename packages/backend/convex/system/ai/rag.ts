import { google } from "@ai-sdk/google";
import { RAG } from "@convex-dev/rag";
import { components } from "../../_generated/api"; // make sure this path is correct


const embeddingModel = google("embed-gecko-001");


const rag = new RAG(components.rag, {
    textEmbeddingModel: google.embedding("embed-gecko-001"),
    embeddingDimension: 1024});

export default rag;

