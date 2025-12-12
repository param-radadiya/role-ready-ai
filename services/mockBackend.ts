import { JobApplication } from '../types';

export interface User {
  uid: string;
  email: string;
  displayName: string;
}

const DB_KEY = 'jobiq_db_v1';
const SESSION_KEY = 'jobiq_session_uid';

const INITIAL_DB = {
  users: [
    {
      uid: 'user_param_123',
      email: 'paramradadiya3@gmail.com',
      password: '123456',
      displayName: 'Param',
      applications: [] as JobApplication[]
    }
  ]
};

const getDb = () => {
  try {
    const data = localStorage.getItem(DB_KEY);
    // If we have data, we parse it. However, we want to ensure our hardcoded user exists
    // for this specific demo requirement if the DB was already created differently or if it's fresh.
    // For simplicity, if no data, we use INITIAL_DB.
    if (!data) {
        localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_DB));
        return INITIAL_DB;
    }
    const db = JSON.parse(data);
    
    // Ensure the hardcoded user always exists for the demo
    if (!db.users.find((u: any) => u.email === 'paramradadiya3@gmail.com')) {
        db.users.push(INITIAL_DB.users[0]);
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
    
    return db;
  } catch {
    return INITIAL_DB;
  }
};

const saveDb = (data: any) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

export const mockAuth = {
  getSession: () => {
    const uid = localStorage.getItem(SESSION_KEY);
    if (!uid) return null;
    const db = getDb();
    const user = db.users.find((u: any) => u.uid === uid);
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    const { password, applications, ...safeUser } = user;
    return safeUser as User;
  },

  login: async (email: string, pass: string) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate latency
    const db = getDb();
    const user = db.users.find((u: any) => u.email === email && u.password === pass);
    if (!user) throw new Error("Invalid email or password");
    
    localStorage.setItem(SESSION_KEY, user.uid);
    const { password, applications, ...safeUser } = user;
    return safeUser as User;
  },

  signup: async (name: string, email: string, pass: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const db = getDb();
    if (db.users.find((u: any) => u.email === email)) {
      throw new Error("Email already exists");
    }

    const newUser = {
      uid: 'user_' + Date.now(),
      email,
      password: pass,
      displayName: name,
      applications: []
    };

    db.users.push(newUser);
    saveDb(db);
    localStorage.setItem(SESSION_KEY, newUser.uid);

    const { password, applications, ...safeUser } = newUser;
    return safeUser as User;
  },

  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const mockData = {
  getApplications: async (userId: string): Promise<JobApplication[]> => {
    const db = getDb();
    const user = db.users.find((u: any) => u.uid === userId);
    return user ? user.applications || [] : [];
  },

  saveApplication: async (userId: string, app: JobApplication) => {
    const db = getDb();
    const userIdx = db.users.findIndex((u: any) => u.uid === userId);
    if (userIdx === -1) throw new Error("User not found");

    const apps = db.users[userIdx].applications || [];
    const appIdx = apps.findIndex((a: any) => a.id === app.id);
    
    if (appIdx >= 0) {
      apps[appIdx] = app;
    } else {
      apps.push(app);
    }
    
    db.users[userIdx].applications = apps;
    saveDb(db);
  },

  deleteApplication: async (userId: string, appId: string) => {
    const db = getDb();
    const userIdx = db.users.findIndex((u: any) => u.uid === userId);
    if (userIdx === -1) return;

    db.users[userIdx].applications = db.users[userIdx].applications.filter((a: any) => a.id !== appId);
    saveDb(db);
  }
};