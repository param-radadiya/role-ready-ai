import { db } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { JobApplication } from "../types";

export const firestoreService = {
  // Get all applications for a specific user
  getApplications: async (userId: string): Promise<JobApplication[]> => {
    try {
      const appsRef = collection(db, "users", userId, "applications");
      // Ordering by createdAt descending
      const q = query(appsRef);
      const querySnapshot = await getDocs(q);
      
      const apps: JobApplication[] = [];
      querySnapshot.forEach((doc) => {
        apps.push(doc.data() as JobApplication);
      });
      
      return apps;
    } catch (error) {
      console.error("Error fetching applications:", error);
      throw error;
    }
  },

  // Create or Update an application
  saveApplication: async (userId: string, app: JobApplication) => {
    try {
      const appRef = doc(db, "users", userId, "applications", app.id);
      await setDoc(appRef, app, { merge: true });
    } catch (error) {
      console.error("Error saving application:", error);
      throw error;
    }
  },

  // Delete an application
  deleteApplication: async (userId: string, appId: string) => {
    try {
      const appRef = doc(db, "users", userId, "applications", appId);
      await deleteDoc(appRef);
    } catch (error) {
      console.error("Error deleting application:", error);
      throw error;
    }
  }
};
