# TalentMatch-AI

TalentMatch-AI is a centralized platform that uses an AI-powered agent to match student resumes with job opportunities posted by companies. It automates the process of sorting and ranking resumes based on relevance to company job descriptions, allowing businesses to find the best candidates efficiently.

---

## 🚀 Features

- Upload resumes (students) and job postings (companies).
- AI-powered matching system ranks resumes based on relevance.
- Automatic email notifications to companies with matched resumes.
- Secure authentication using Firebase.
- Intuitive frontend built with Next.js.
- Backend powered by Flask for handling resume parsing and AI integration.
- Firebase for resume storage and database management.
- OpenAI for resume and job description comparison.

---

## 🛠 Tech Stack

### Frontend:

- **Next.js** - React framework for server-side rendering.
- **Tailwind CSS** - Styling framework.

### Backend:

- **Flask** - Python web framework.
- **OpenAI API** - AI-based resume-job matching.
- **Firebase Storage** - Stores resumes securely.
- **SMTP** - Automated email notifications.

---

## 🚀 Getting Started

### Prerequisites

- Node.js & npm
- Python 3
- Firebase project setup

### Installation

#### 1️⃣ Clone the repository

```sh
git clone https://github.com/yourusername/TalentMatch-AI.git
cd TalentMatch-AI
```

#### 2️⃣ Backend Setup

```sh
cd backend
pip install -r requirements.txt
python app.py
```

#### 3️⃣ Frontend Setup

```sh
cd frontend
npm install
npm run dev
```


#### 4️⃣ Create a .env file in the backend directory and add the following:
```sh
OPENAI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=username@gmail.com
SMTP_PASSWORD=
SENDER_EMAIL=sender-email@gmail.com
```

#### 5️⃣ Create a .env file in the frontend directory and add the following:
```sh
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

---

## 🔗 API Endpoints

### 📌 Authentication

| Method | Endpoint    | Description         |
| ------ | ----------- | ------------------- |
| POST   | `/register` | Register a new user |
| POST   | `/login`    | User login          |

### 📌 Resume Management

| Method | Endpoint   | Description          |
| ------ | ---------- | -------------------- |
| POST   | `/upload`  | Upload a resume      |
| GET    | `/resumes` | Retrieve all resumes |

### 📌 Company Job Listings

| Method | Endpoint   | Description            |
| ------ | ---------- | ---------------------- |
| POST   | `/company` | Post a job description |
| GET    | `/search_resumes` | Search resumes with a Query|

---

## 🔥 Contributors

- [**Anantesh G**](https://github.com/AnanteshG)
- [**Chetan R**](https://github.com/chetanr25)
- [**K Geethika**](https://github.com/Geethika-Kancharla)
- [**Harshitha Harinath**](https://github.com/Harshithadh)
