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

export interface FirestoreAnalysis {
  input: string;
  priority: "High" | "Medium" | "Low";
  actionPlan: any[];
  createdAt: any;
  result: Omit<AnalysisResult, "id" | "timestamp">;
}

/**
 * Saves an analysis result under the company's scope.
 * Path: companies/{companyId}/analyses/{docId}
 */
export const saveAnalysis = async (companyId: string, input: string, result: AnalysisResult) => {
  if (!companyId) return null;
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
    const colRef = collection(db, "companies", companyId, "analyses");
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  } catch (error) {
    console.error("[db] Error saving analysis:", error);
    throw error;
  }
};

/**
 * Fetches analysis history for a company.
 */
export const fetchHistory = async (companyId: string): Promise<HistorySession[]> => {
  if (!companyId) return [];
  try {
    const colRef = collection(db, "companies", companyId, "analyses");
    const q = query(colRef, orderBy("createdAt", "desc"));
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
    console.error("[db] Error fetching history:", error);
    return [];
  }
};

/**
 * Saves app memory/settings under the company's scope.
 * Path: companies/{companyId}/settings/memory
 */
export const saveSettings = async (companyId: string, memory: Memory) => {
  if (!companyId) return;
  try {
    const docRef = doc(db, "companies", companyId, "settings", "memory");
    await setDoc(docRef, {
      ...memory,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[db] Error saving settings:", error);
  }
};

/**
 * Fetches app memory/settings for a company.
 */
export const fetchSettings = async (companyId: string): Promise<Memory | null> => {
  if (!companyId) return null;
  try {
    const docRef = doc(db, "companies", companyId, "settings", "memory");
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Memory) : null;
  } catch (error) {
    console.error("[db] Error fetching settings:", error);
    return null;
  }
};

/**
 * Saves AI verdicts under the company's scope.
 */
export const saveVerdicts = async (companyId: string, verdicts: Verdict[]) => {
  if (!companyId) return;
  try {
    const docRef = doc(db, "companies", companyId, "settings", "verdicts");
    await setDoc(docRef, {
      verdicts,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[db] Error saving verdicts:", error);
  }
};

/**
 * Fetches AI verdicts for a company.
 */
export const fetchVerdicts = async (companyId: string): Promise<Verdict[]> => {
  if (!companyId) return [];
  try {
    const docRef = doc(db, "companies", companyId, "settings", "verdicts");
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data().verdicts as Verdict[]) : [];
  } catch (error) {
    console.error("[db] Error fetching verdicts:", error);
    return [];
  }
};

/**
 * Fetches company-wide inbox items.
 */
export const fetchInbox = async (companyId: string): Promise<InboxItem[]> => {
  if (!companyId) return [];
  try {
    const colRef = collection(db, "companies", companyId, "inbox");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
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
  } catch (error) {
    console.error("[db] Error fetching inbox:", error);
    return [];
  }
};

/**
 * Adds an item to the company-wide inbox.
 */
export const addInboxItem = async (companyId: string, text: string): Promise<string> => {
  if (!companyId) throw new Error("companyId is required to add inbox item");
  const colRef = collection(db, "companies", companyId, "inbox");
  const ref = await addDoc(colRef, {
    text,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateInboxItemText = async (companyId: string, id: string, text: string) => {
  const docRef = doc(db, "companies", companyId, "inbox", id);
  await updateDoc(docRef, { text });
};

export const setInboxItemStatus = async (
  companyId: string,
  id: string,
  status: InboxItem["status"]
) => {
  const docRef = doc(db, "companies", companyId, "inbox", id);
  await updateDoc(docRef, {
    status,
    ...(status === "processed" ? { processedAt: serverTimestamp() } : {}),
  });
};

export const deleteInboxItem = async (companyId: string, id: string) => {
  const docRef = doc(db, "companies", companyId, "inbox", id);
  await deleteDoc(docRef);
};

// Integration & Team Mapping (Already Company Scoped)

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

export const saveTeamMembers = async (companyId: string, members: any[]) => {
  try {
    await setDoc(doc(db, "companies", companyId, "settings", "team_members"), {
      members,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving team members:", error);
    throw error;
  }
};

export const fetchTeamMembers = async (companyId: string) => {
  try {
    const snap = await getDoc(doc(db, "companies", companyId, "settings", "team_members"));
    return snap.exists() ? snap.data().members : [];
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
};

