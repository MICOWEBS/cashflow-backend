# 🌟 Cashflow Backend

Welcome to the **Cashflow Management System** backend application built with Node.js! 🚀

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) 🟢
- **MySQL** database 🗄️
- **npm** or **yarn** package manager 📦

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3001
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
FRONTEND_URL=your_frontend_url
EMAIL_FROM=your_email_from
RESEND_API_KEY=your_resend_api_key
```

## 📥 Installation

Follow these steps to get your application up and running:

1. **Clone the repository**:
   ```bash
   git clone your_repository_url
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build the project**:
   ```bash
   npm run build
   ```
4. **Start the server**:
   ```bash
   npm start
   ```

## 🛠️ Development

To run the development server, use the following command:
```bash
npm run dev
```

## 🚀 Deployment on Render

To deploy your application on Render, follow these steps:

1. **Push your code** to a Git repository (GitHub, GitLab, or Bitbucket) 🌐
2. **Create a new Web Service** on Render 🖥️
3. **Connect your repository** to Render 🔗
4. **Configure the following environment variables** in Render:
   - All variables from your `.env` file
   - Set `NODE_ENV=production`
5. **Deploy!** 🎉

## 📚 API Documentation

Once the server is running, you can access the API documentation at:
```
http://your-domain:3001/api-docs
```

## 📝 License

This project is licensed under the **ISC License**. 📜

---

Feel free to reach out if you have any questions or need assistance! Happy coding! 💻✨
