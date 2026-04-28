import {
  collection,
  addDoc,
  query,
  orderBy,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { AnalysisResult, HistorySession, InboxItem, Memory, Verdict } from "@/types/copilot";

const ANALYSES_COLLECTION = "analyses";
const INBOX_COLLECTION = "inbox";
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

export const fetchInbox = async (userId: string): Promise<InboxItem[]> => {
  try {
    const q = query(collection(db, INBOX_COLLECTION), where("userId", "==", userId));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => {
      const data = d.data();
      const ts =
        (data.createdAt as Timestamp)?.toDate().toISOString() ||
        data.timestamp ||
        new Date().toISOString();
      const processedAt = (data.processedAt as Timestamp)?.toDate().toISOString();
      return {
        id: d.id,
        text: data.text,
        timestamp: ts,
        status: (data.status as InboxItem["status"]) || "pending",
        ...(processedAt && { processedAt }),
      };
    });
    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (error) {
    console.error("Error fetching inbox:", error);
    return [];
  }
};

export const addInboxItem = async (userId: string, text: string): Promise<string> => {
  const ref = await addDoc(collection(db, INBOX_COLLECTION), {
    userId,
    text,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateInboxItemText = async (id: string, text: string) => {
  await updateDoc(doc(db, INBOX_COLLECTION, id), { text });
};

export const setInboxItemStatus = async (
  id: string,
  status: InboxItem["status"]
) => {
  await updateDoc(doc(db, INBOX_COLLECTION, id), {
    status,
    ...(status === "processed" ? { processedAt: serverTimestamp() } : {}),
  });
};

export const deleteInboxItem = async (id: string) => {
  await deleteDoc(doc(db, INBOX_COLLECTION, id));
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

// Company Specific Settings
export const saveCompanySettings = async (companyId: string, settings: any) => {
  try {
    await setDoc(doc(db, "companies", companyId, "settings", "integrations"), {
      ...settings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving company settings:", error);
    throw error;
  }
};

export const fetchCompanySettings = async (companyId: string) => {
  try {
    const snap = await getDoc(doc(db, "companies", companyId, "settings", "integrations"));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return null;
  }
};

export const saveTeamMapping = async (companyId: string, mapping: any) => {
  try {
    await setDoc(doc(db, "companies", companyId, "settings", "team_mapping"), {
      mapping,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving team mapping:", error);
    throw error;
  }
};

export const fetchTeamMapping = async (companyId: string) => {
  try {
    const snap = await getDoc(doc(db, "companies", companyId, "settings", "team_mapping"));
    return snap.exists() ? snap.data().mapping : {};
  } catch (error) {
    console.error("Error fetching team mapping:", error);
    return {};
  }
};

export const saveVerdicts = async (verdicts: Verdict[]) => {
  try {
    await setDoc(doc(db, "settings", "verdicts"), {
      verdicts,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving verdicts:", error);
  }
};

export const fetchVerdicts = async (): Promise<Verdict[]> => {
  try {
    const snap = await getDoc(doc(db, "settings", "verdicts"));
    return snap.exists() ? (snap.data().verdicts as Verdict[]) : [];
  } catch (error) {
    console.error("Error fetching verdicts:", error);
    return [];
  }
};
