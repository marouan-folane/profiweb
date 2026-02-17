import Credentials from "next-auth/providers/credentials";
import { LoginFunction } from "@/config/functions/auth";

export const authOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("credentials: ", credentials);

        if (!credentials?.emailOrUsername || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const res = await LoginFunction({
          emailOrUsername: credentials.emailOrUsername,
          password: credentials.password,
        });

        if (res?.success) {
          return {
            id: res.user._id,
            username: res.user.username,
            email: res.user.email,
            firstName: res.user.firstName,
            lastName: res.user.lastName,
            token: res.token,
            role: res.user.role,           
            department: res.user.department 
          };
        }

        throw new Error("Invalid credentials");
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Store everything in the user object
        return {
          ...token,
          apiToken: user.token, // Keep token separate if needed
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department
            // Add any other fields here
          }
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Only assign user object and apiToken to session
        session.apiToken = token.apiToken;
        session.user = token.user; // Everything is inside user object now
        // Remove these lines to keep role/department only in user object
        // session.role = token.role;
        // session.department = token.department;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV !== "production",
};