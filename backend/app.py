from flask import Flask, request, jsonify
import os, re, json, openai, PyPDF2, firebase_admin, base64, cloudinary, cloudinary.uploader
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()
cred = credentials.Certificate("backend/skillmatch.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

app = Flask(__name__)
CORS(app)

def extract_text_from_pdf(pdf_path):
    try:
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            full_text = "".join([page.extract_text() for page in reader.pages if page.extract_text()])
        return full_text.strip()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None

def clean_text(text):
    return re.sub(r'\s+', ' ', text).strip()

def parse_resume_with_openai(text):
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        print("OpenAI API key not found.")
        return None
    client = openai.OpenAI(api_key=openai_api_key)
    prompt = f"""
    You are an expert resume parser. Extract the following fields from the resume text and output JSON:
    - personal_info: {{name, email, phone}}
    - education: string
    - work_experience: string
    - skills: string
    - certifications: string
    - extracurricular_activities: string
    - achievements: string
    - projects: string
    - languages: string
    If any field is missing, set its value to null. Here is the resume text:
    {text}
    Output only the JSON.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts structured resume information."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            max_tokens=1200,
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return None

def upload_pdf_to_cloudinary(pdf_path):
    try:
        response = cloudinary.uploader.upload(pdf_path, resource_type="raw")
        return response.get("secure_url")
    except Exception as e:
        print(f"Error uploading PDF to Cloudinary: {e}")
        return None

def store_resume_in_firebase(parsed_resume, pdf_url):
    try:
        parsed_resume["resume_url"] = pdf_url
        doc_ref = db.collection("resumes").add(parsed_resume)
        return doc_ref[1].id
    except Exception as e:
        print(f"Error storing parsed resume in Firebase: {e}")
        return None

@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    user_id = request.form.get("userId")
    user_email = request.form.get("userEmail")

    if file.filename == "" or not user_id:
        return jsonify({"error": "No file selected or user not authenticated"}), 400

    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)
    pdf_path = os.path.join(temp_dir, file.filename)
    file.save(pdf_path)

    # Extract and process the PDF
    raw_text = extract_text_from_pdf(pdf_path)
    if not raw_text:
        os.remove(pdf_path)
        return jsonify({"error": "Failed to extract text from PDF"}), 500

    cleaned_text = clean_text(raw_text)
    parsed_resume = parse_resume_with_openai(cleaned_text)
    if not parsed_resume:
        os.remove(pdf_path)
        return jsonify({"error": "Failed to parse resume"}), 500

    # Upload to Cloudinary
    pdf_url = upload_pdf_to_cloudinary(pdf_path)
    if not pdf_url:
        os.remove(pdf_path)
        return jsonify({"error": "Failed to upload PDF to Cloudinary"}), 500

    # Add user information to parsed resume
    parsed_resume.update({
        "user_id": user_id,
        "user_email": user_email,
        "resume_url": pdf_url,
        "uploaded_at": firestore.SERVER_TIMESTAMP
    })

    # Store in Firestore
    try:
        doc_ref = db.collection("resumes").document(user_id)
        doc_ref.set(parsed_resume)
        doc_id = doc_ref.id
    except Exception as e:
        os.remove(pdf_path)
        return jsonify({"error": f"Failed to store resume in Firebase: {str(e)}"}), 500

    # Cleanup
    os.remove(pdf_path)

    return jsonify({
        "message": "Resume uploaded successfully",
        "document_id": doc_id,
        "pdf_url": pdf_url
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
