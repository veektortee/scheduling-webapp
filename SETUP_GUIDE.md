# Medical Staff Scheduling System

A modern web-based scheduling system for medical staff with AI-powered optimization.

## 🏗️ Architecture

### **Hybrid Deployment (Recommended)**
- **Frontend**: Web application (deployable to Vercel)
- **Backend**: Local Python solver service (runs on admin's machine)
- **Authentication**: Single admin user with secure login

### **Benefits**
- ✅ Web accessible from anywhere
- ✅ Powerful local processing for optimization
- ✅ Secure admin-only access
- ✅ Professional Excel export functionality

## 🚀 Quick Start

### **1. Web Application Setup**

```bash
# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

The web application will be available at `http://localhost:3000`

### **2. Python Solver Setup**

```bash
# Install Python requirements
pip install -r requirements.txt

# Start the local solver service
python solver_service.py
```

The solver service will be available at `http://localhost:8000`

### **3. Login Credentials**

- **Email**: `admin@scheduling.com`
- **Password**: `admin123`

## 📱 Features

### **Five Main Tabs**
1. **Run** - Execute optimization solver, track progress, view logs
2. **Calendar** - Generate calendar days, configure weekends
3. **Shifts** - Create and manage shift templates and assignments
4. **Providers** - Manage medical staff, preferences, and constraints
5. **Config** - Adjust solver parameters and optimization settings

### **Key Capabilities**
- 🔐 **Secure Authentication** (admin-only access)
- 🏥 **Medical Staff Management** (doctors, nurses, specialists)
- ⏰ **Flexible Shift Scheduling** (day, night, swing shifts)
- 🤖 **AI Optimization** (Google OR-Tools integration)
- 📊 **Excel Export** (configuration and results)
- 📱 **Responsive Design** (desktop and mobile)

## 🔧 Deployment Options

### **Option A: Hybrid (Recommended)**
1. **Deploy web app to Vercel**:
   ```bash
   npm run build
   vercel --prod
   ```

2. **Run Python solver locally**:
   ```bash
   python solver_service.py
   ```

### **Option B: Full Local**
1. **Run both locally**:
   ```bash
   npm run dev          # Terminal 1
   python solver_service.py  # Terminal 2
   ```

## 📊 Excel Export Features

### **Configuration Export**
- Shifts configuration with times and types
- Provider details and constraints
- Calendar setup and weekend configuration
- Solver parameters and optimization settings

### **Results Export**
- Complete schedule assignments
- Provider workload distribution
- Shift coverage statistics
- Optimization performance metrics

## 🔒 Security Features

- **Single Admin Authentication** using NextAuth.js
- **Session Management** with 24-hour timeout
- **Local Processing** keeps sensitive data on your machine
- **Secure API Communication** between web app and solver

## 🛠️ Technical Stack

### **Frontend**
- Next.js 15 (React framework)
- TypeScript (type safety)
- Tailwind CSS (modern styling)
- NextAuth.js (authentication)

### **Backend**
- Python Flask (solver API service)
- Google OR-Tools (optimization engine)
- Excel export (openpyxl)

## 📋 Production Checklist

### **Before Deploying**
- [ ] Update admin credentials in environment variables
- [ ] Configure CORS for production domains
- [ ] Set up SSL certificates if needed
- [ ] Test solver performance with real data
- [ ] Backup existing scheduling data

### **Environment Variables**
```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD_HASH=bcrypt-hashed-password
```

## 🆘 Troubleshooting

### **Common Issues**

1. **"Cannot connect to solver"**
   - Ensure Python solver service is running: `python solver_service.py`
   - Check if port 8000 is available
   - Verify firewall settings

2. **"Authentication failed"**
   - Use correct credentials: `admin@scheduling.com` / `admin123`
   - Clear browser cookies if needed

3. **"Export not working"**
   - Check browser's download settings
   - Ensure sufficient disk space

### **Getting Help**
- Check browser console for errors
- Review server logs for API issues
- Verify Python dependencies are installed

## 📈 Future Enhancements

- **Database Integration** (PostgreSQL/MongoDB)
- **Multi-tenant Support** (multiple hospitals)
- **Advanced Reporting** (analytics dashboard)
- **Mobile App** (React Native)
- **Real-time Collaboration** (multiple users)

---

**Ready to revolutionize your medical staff scheduling!** 🏥✨
