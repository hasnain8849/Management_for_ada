# Hijab Umar - Employee Attendance & Salary Management System

A comprehensive full-stack web application for managing employee attendance, salaries, and reports with PKR currency support.

## 🚀 Features

### Frontend (React + TailwindCSS)
- **Dashboard**: Overview of employees, attendance, and salary expenses
- **Employee Management**: Add, edit, delete employee records with salary rates
- **Attendance Tracking**: Date-based attendance with check-in/check-out times
- **Salary Calculation**: Automatic PKR conversion (1 USD = 280 PKR)
- **Reports**: Daily, monthly, yearly reports with export functionality
- **Authentication**: Secure login system with role-based access

### Backend Ready Features
- RESTful API structure prepared
- CRUD operations for all entities
- JWT-based authentication system
- Input validation and error handling
- Salary auto-calculation based on attendance

### Database Schema
- **Employees**: id, name, position, contact, salary_rate
- **Attendance**: id, employee_id, date, check_in, check_out, status
- **Salary**: id, employee_id, month, total_days_worked, total_salary_PKR

## 🛠️ Tech Stack

- **Frontend**: React.js, TailwindCSS, TypeScript
- **State Management**: React Context API
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Currency**: PKR (Pakistani Rupees) with proper formatting

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hijab-umar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
npm run preview
```

## 🔐 Demo Credentials

- **Admin**: `admin` / `admin123`
- **HR**: `hr` / `hr123`
- **Manager**: `manager` / `manager123`

## 📊 Key Features

### Employee Management
- Add new employees with detailed information
- Edit existing employee records
- Delete employees with confirmation
- Search and filter employees by type (Employee/Laborer)
- Hourly rate management in PKR

### Attendance System
- Daily attendance tracking
- Quick clock-in/clock-out functionality
- Manual attendance entry
- Prevent duplicate entries for same date
- Status tracking (Present/Partial/Absent)
- Hours calculation based on check-in/check-out times

### Salary Management
- Automatic salary calculation based on attendance
- Weekly and monthly wage generation
- PKR currency formatting (Rs. 1,234.56)
- Deductions and net pay calculation
- Bulk salary generation for all employees

### Reports & Analytics
- Comprehensive dashboard with key metrics
- Attendance rate calculations
- Monthly payroll summaries
- Export functionality (CSV format)
- Employee performance tracking

## 🌐 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Deploy to Netlify**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

### Backend Integration (Future)

The system is prepared for backend integration with:
- RESTful API endpoints
- JWT authentication
- MySQL/MongoDB database
- Express.js server

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Accessible design patterns

## 🔮 Future Enhancements

- [ ] Biometric/fingerprint API integration
- [ ] Employee leave management system
- [ ] Multiple admin roles with permissions
- [ ] Advanced report filtering with date ranges
- [ ] Real-time notifications
- [ ] Employee self-service portal
- [ ] Payroll integration
- [ ] Backup and restore functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team.

---

**Hijab Umar** - Simplifying workforce management with modern technology.