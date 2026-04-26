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
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import type { AnalysisResult, HistorySession, Memory } from "@/types/copilot";

const ANALYSES_COLLECTION = "analyses";
const SETTINGS_DOC_ID = "user_settings"; // Single user for now as per current app design

export interface FirestoreAnalysis {
  input: string;
  priority: "High" | "Medium" | "Low";
  actionPlan: any[];
  createdAt: any;
  result: Omit<AnalysisResult, "id" | "timestamp">;
}

export const saveAnalysis = async (input: string, result: AnalysisResult) => {
  try {
    // Determine overall priority from topPriorities
    const priority = result.topPriorities[0]?.impact || "Low";

    const data = {
      input,
      priority,
      actionPlan: result.actionPlan,
      createdAt: serverTimestamp(),
      result: {
        topPriorities: result.topPriorities,
        secondary: result.secondary,
        ignore: result.ignore,
        actionPlan: result.actionPlan
      }
    };

    const docRef = await addDoc(collection(db, ANALYSES_COLLECTION), data);
    return docRef.id;
  } catch (error) {
    console.error("Error saving analysis to Firestore:", error);
    throw error;
  }
};

export const fetchHistory = async (): Promise<HistorySession[]> => {
  try {
    const q = query(collection(db, ANALYSES_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
      
      return {
        id: doc.id,
        inputSummary: data.input.slice(0, 60) + (data.input.length > 60 ? "..." : ""),
        topPriority: data.result?.topPriorities[0]?.task || "No tasks",
        result: {
          id: doc.id,
          timestamp: createdAt,
          ...data.result
        },
        timestamp: createdAt
      };
    });
  } catch (error) {
    console.error("Error fetching history from Firestore:", error);
    return [];
  }
};

export const saveSettings = async (memory: Memory) => {
  try {
    await setDoc(doc(db, "settings", SETTINGS_DOC_ID), {
      userProfile: memory.userProfile,
      // We don't necessarily need to save patterns/pastPriorities if they are derived, 
      // but the user wants "Memory Toggle" and "User Goal".
      // Let's save the whole memory object for consistency.
      ...memory,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving settings to Firestore:", error);
  }
};

export const fetchSettings = async (): Promise<Memory | null> => {
  try {
    const docSnap = await getDoc(doc(db, "settings", SETTINGS_DOC_ID));
    if (docSnap.exists()) {
      return docSnap.data() as Memory;
    }
    return null;
  } catch (error) {
    console.error("Error fetching settings from Firestore:", error);
    return null;
  }
};
