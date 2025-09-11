import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
// import bcrypt from 'bcryptjs'

// Admin credentials - In production, store these securely
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@scheduling.com'
// const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewviUK1CXLaWhWH2' // "admin123"

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 Auth attempt:', { email: credentials?.email, hasPassword: !!credentials?.password })
        console.log('🔑 Expected email:', ADMIN_EMAIL)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        // Check if it's the admin
        if (credentials.email === ADMIN_EMAIL) {
          // For development - simple password check
          // In production, use bcrypt comparison
          const isValidPassword = credentials.password === 'admin123'
          console.log('🔍 Password check:', { provided: credentials.password, isValid: isValidPassword })
          
          if (isValidPassword) {
            console.log('✅ Authentication successful')
            return {
              id: '1',
              email: ADMIN_EMAIL,
              name: 'Admin',
              role: 'admin'
            }
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
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
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
