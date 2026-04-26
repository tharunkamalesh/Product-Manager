import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { AnalysisResult, HistorySession, Memory } from "@/types/copilot";

const ANALYSES_COLLECTION = "analyses";
const SETTINGS_DOC_ID = "user_settings";

export interface FirestoreAnalysis {
  input: string;
  priority: "High" | "Medium" | "Low";
  actionPlan: any[];
  createdAt: any;
  result: Omit<AnalysisResult, "id" | "timestamp">;
}

export const saveAnalysis = async (input: string, result: AnalysisResult) => {
  try {
    const data = {
      input,
      priority: result.topPriorities[0]?.impact || "Low",
      actionPlan: result.actionPlan,
      createdAt: serverTimestamp(),
      result: {
        topPriorities: result.topPriorities,
        secondary: result.secondary,
        ignore: result.ignore,
        actionPlan: result.actionPlan,
      },
    };
    const docRef = await addDoc(collection(db, ANALYSES_COLLECTION), data);
    return docRef.id;
  } catch (error) {
    console.error("Error saving analysis:", error);
    throw error;
  }
};

export const fetchHistory = async (): Promise<HistorySession[]> => {
  try {
    const q = query(collection(db, ANALYSES_COLLECTION), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const createdAt =
        (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
      return {
        id: d.id,
        inputSummary: data.input.slice(0, 60) + (data.input.length > 60 ? "..." : ""),
        topPriority: data.result?.topPriorities[0]?.task || "No tasks",
        result: { id: d.id, timestamp: createdAt, ...data.result },
        timestamp: createdAt,
      };
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};

export const saveSettings = async (memory: Memory) => {
  try {
    await setDoc(doc(db, "settings", SETTINGS_DOC_ID), {
      ...memory,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};

export const fetchSettings = async (): Promise<Memory | null> => {
  try {
    const snap = await getDoc(doc(db, "settings", SETTINGS_DOC_ID));
    return snap.exists() ? (snap.data() as Memory) : null;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null;
  }
};
