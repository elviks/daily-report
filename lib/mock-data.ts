// Shared mock data store - in production, this would be your database
export interface User {
     id: string;
     name: string;
     email: string;
     password: string;
     role: string;
     department: string;
     phone: string;
     profileImage?: string;
     createdAt: string;
     lastLogin?: string;
     isActive?: boolean;
}

export interface Report {
     id: string;
     userId: string;
     date: string;
     content: string;
     createdAt: string;
     updatedAt: string;
}

// Mock users database
export const users: User[] = [
     {
          id: "1",
          name: "Rajan Rauniyar",
          email: "rajan@admin.com",
          password: "rajan123",
          role: "superadmin",
          department: "Administration",
          phone: "+1234567892",
          profileImage: "",
          createdAt: "2024-01-01T00:00:00Z",
     },
     {
          id: "2",
          name: "Rahul Rauniyar",
          email: "rahul@admin.com",
          password: "rahul123",
          role: "superadmin",
          department: "Administration",
          phone: "+1234567892",
          profileImage: "",
          createdAt: "2024-01-01T00:00:00Z",
     },

];

// Mock reports database
export const reports: Report[] = [

];

// Helper functions
export function getUserById(id: string): User | undefined {
     return users.find((user) => user.id === id);
}

export function getUserByEmail(email: string): User | undefined {
     return users.find((user) => user.email === email);
}

// Generate unique ID for new users
export function generateUniqueId(): string {
     const existingIds = users.map(user => parseInt(user.id)).sort((a, b) => a - b);
     let newId = 1;

     for (const id of existingIds) {
          if (id === newId) {
               newId++;
          } else {
               break;
          }
     }

     return newId.toString();
}

// Add new user to mock data
export function addUser(user: Omit<User, 'id'>): User {
     const newUser: User = {
          ...user,
          id: generateUniqueId(),
     };
     users.push(newUser);
     return newUser;
}

// Remove user from mock data by ID
export function removeUserById(id: string): boolean {
     const index = users.findIndex(user => user.id === id);
     if (index !== -1) {
          users.splice(index, 1);
          return true;
     }
     return false;
}

// Remove user from mock data by email
export function removeUserByEmail(email: string): boolean {
     const index = users.findIndex(user => user.email === email);
     if (index !== -1) {
          users.splice(index, 1);
          return true;
     }
     return false;
}

export function getReportsByUserId(
     userId: string
): Report[] {
     return reports
          .filter((report) => report.userId === userId)
          .sort(
               (a, b) =>
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime()
          );
}

export function getAllReportsWithUserData() {
     return reports
          .map((report) => {
               const user = getUserById(report.userId);
               return {
                    ...report,
                    userName: user?.name || "Unknown User",
                    userEmail:
                         user?.email || "Unknown Email",
                    department:
                         user?.department ||
                         "Unknown Department",
               };
          })
          .sort(
               (a, b) =>
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime()
          );
}
