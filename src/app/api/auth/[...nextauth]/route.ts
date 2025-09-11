import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { validateCredentials } from '@/lib/credentialsManager'
// import bcrypt from 'bcryptjs'

// Dynamic credentials managed by credentials manager

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  ...(process.env.VERCEL_URL && {
    // Use Vercel URL if available, otherwise fall back to NEXTAUTH_URL
    url: process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}`
  }),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 Auth attempt:', { 
          email: credentials?.email, 
          hasPassword: !!credentials?.password,
          environment: process.env.NODE_ENV
        })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        // Load current credentials dynamically each time
        const isValid = validateCredentials(credentials.email, credentials.password);
        console.log('🔍 Credential validation:', { 
          isValid,
          providedEmail: credentials.email
        });
        
        if (isValid) {
          console.log('✅ Authentication successful')
          return {
            id: '1',
            email: credentials.email, // Use the provided email as the current username
            name: 'Admin',
            role: 'admin'
          }
        }

        console.log('❌ Authentication failed')
        return null
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('🔍 JWT callback:', { user: !!user, token: { sub: token.sub, role: token.role } });
      if (user) {
        token.role = user.role;
        console.log('✅ User added to token:', { role: user.role });
      }
      return token;
    },
    async session({ session, token }) {
      console.log('🔍 Session callback:', { token: { sub: token.sub, role: token.role }, session: !!session });
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        console.log('✅ Session updated:', { userId: session.user.id, role: session.user.role });
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', { code, metadata })
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', { code, metadata })
    }
  }
})

export { handler as GET, handler as POST }
