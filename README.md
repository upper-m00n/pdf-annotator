# Insightful PDF - AI-Powered PDF Annotation Tool

Insightful PDF is a full-stack web application designed for managing, viewing, and interacting with PDF documents. It provides a rich set of annotation tools, including text highlighting and freehand drawing, and leverages AI to generate summaries and extract key phrases from your documents.

---

##  Features

* ** PDF Library Management:** Upload, view, rename, and delete your PDF documents from a clean, modern dashboard.
* ** Interactive PDF Viewer:** A fast and responsive viewer for navigating multi-page documents with zoom controls.
* ** Text Highlighting:** Select and highlight important text snippets directly on the PDF page.
* ** Freehand Drawing:** Use a pencil tool to draw, underline, or make freeform annotations on any page.
* ** Annotation Notes:** Attach detailed notes and comments to any text highlight or drawing.
* ** AI-Powered Summarization:** Generate a concise summary and extract key phrases from your entire PDF with a single click.
* ** User Authentication:** Secure user-specific storage for all uploaded documents and annotations.

---

##  Architecture Overview

This application is built using the **MERN stack**, providing a robust and scalable foundation.

* **Frontend:** A dynamic Single Page Application (SPA) built with **React**.
    * **UI Framework:** [React](https://reactjs.org/) (with Hooks)
    * **Styling:** [Tailwind CSS](https://tailwindcss.com/)
    * **Routing:** [React Router](https://reactrouter.com/)
    * **PDF Rendering:** [react-pdf](https://github.com/wojtekmaj/react-pdf)
    * **Annotation Canvas:** [Fabric.js](http://fabricjs.com/)

* **Backend:** A RESTful API built with **Node.js** and **Express**.
    * **Framework:** [Express.js](https://expressjs.com/)
    * **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) for object modeling.
    * **Authentication:** JSON Web Tokens (JWT) for securing API endpoints.
    * **File Handling:** Manages PDF file storage and retrieval.

* **Database:**
    * A **MongoDB** database stores user data, PDF metadata, and all associated annotations (highlights, drawings, and notes).

---

## ⚙️ Local Setup Instructions

Follow these instructions to get the frontend and backend servers running on your local machine for development and testing.

### Prerequisites

* [Node.js](https://nodejs.org/) (v18.x or later recommended)
* [npm](https://www.npmjs.com/) (comes with Node.js)
* [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally, or a connection string from a cloud provider like MongoDB Atlas.

### 1. Backend Setup

The backend server handles all the business logic, API endpoints, and database interactions.

```bash
# 1. Clone the repository
git clone <your-repository-url>
cd <repository-folder>

# 2. Navigate to the backend directory
cd backend

# 3. Install dependencies
npm install

# 4. Create a .env file in the `backend` directory
#    (See the ".env Setup" section below for details)
touch .env

# 5. Start the development server
npm run dev
```

The backend server should now be running, typically on `http://localhost:5000`.

### 2. Frontend Setup

The frontend server runs the React development server.

```bash
# 1. From the root project folder, navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create a .env file in the `frontend` directory
#    (See the ".env Setup" section below for details)
touch .env

# 4. Start the development server
npm start
```

The React application should now be running and accessible in your browser, typically at `http://localhost:3000`.

---

##  Environment Variables (.env Setup)

You need to create `.env` files for both the frontend and backend. It's recommended to copy the `.env.example` files and fill in your own values. **Never commit your `.env` files to version control.**

### Backend (`/backend/.env.example`)

Create a file named `.env` in the `/backend` directory and add the following content:

```env
PORT=5000

MONGO_URI="mongodb://127.0.0.1:27017/insightfulpdf"

JWT_SECRET="YOUR_SECRET_KEY"

NLP_API_KEY="YOUR_EXTERNAL_NLP_SERVICE_API_KEY"

CLIENT_URL="http://localhost:3000"
```

### Frontend (`/frontend/.env.example`)

Create a file named `.env` in the `/frontend` directory and add the following content. If you are using Create React App, the prefix must be `REACT_APP_`. If using Vite, it must be `VITE_`.

```env
# For Create React App:
# The base URL of your backend API server
REACT_APP_API_BASE_URL="http://localhost:5000"

# OR 

# For Vite:
# The base URL of your backend API server
VITE_API_BASE_URL="http://localhost:5000"
```
