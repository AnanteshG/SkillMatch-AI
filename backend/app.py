from flask import Flask, request, jsonify
import os, re, json, openai, PyPDF2, firebase_admin, cloudinary, cloudinary.uploader
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv()

# Firebase initialization
cred = credentials.Certificate('skillmatch.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

# OpenAI client
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
    try:
        prompt = f"""
        You are an expert resume parser. Extract the following fields from the resume text and output JSON:
        - personal_info: {{name, email, phone}}
        - education: string
        - work_experience: string
        - skills: list of skills
        - certifications: string
        - extracurricular_activities: string
        - achievements: string
        - projects: string
        - languages: list of languages
        If any field is missing, set its value to null. Here is the resume text:
        {text}
        Output only the JSON.
        """
        response = openai_client.chat.completions.create(
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

def calculate_resume_match_score(resume_data, job_description):
    try:
        prompt = f"""
        Job Description: {job_description}
        Resume Skills: {json.dumps(resume_data.get('skills', []))}
        Resume Work Experience: {resume_data.get('work_experience', '')}

        Provide a detailed match analysis:
        1. Calculate a numerical match score (0-100)
        2. List matching skills
        3. Provide a brief explanation of the match
        
        Output strictly in JSON format:
        {{
            "match_score": number,
            "matching_skills": list,
            "match_explanation": string
        }}
        """
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert in resume matching and job description analysis."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=300,
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        print(f"Error calculating match score: {e}")
        return {
            "match_score": 0,
            "matching_skills": [],
            "match_explanation": "Unable to calculate match score"
        }

@app.route("/upload", methods=["POST"])
def upload_resume():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)
    pdf_path = os.path.join(temp_dir, file.filename)
    file.save(pdf_path)

    try:
        raw_text = extract_text_from_pdf(pdf_path)
        if not raw_text:
            return jsonify({"error": "Failed to extract text from PDF"}), 500

        cleaned_text = clean_text(raw_text)
        parsed_resume = parse_resume_with_openai(cleaned_text)
        if not parsed_resume:
            return jsonify({"error": "Failed to parse resume"}), 500

        pdf_url = upload_pdf_to_cloudinary(pdf_path)
        if not pdf_url:
            return jsonify({"error": "Failed to upload PDF to Cloudinary"}), 500

        # Generate a unique document ID based on email
        email = parsed_resume.get('personal_info', {}).get('email')
        if not email:
            return jsonify({"error": "No email found in resume"}), 400

        parsed_resume.update({
            "resume_url": pdf_url,
            "uploaded_at": firestore.SERVER_TIMESTAMP
        })

        # Store in Firestore
        doc_ref = db.collection("resumes").document(email)
        doc_ref.set(parsed_resume)

        return jsonify({
            "message": "Resume uploaded successfully",
            "document_id": email,
            "pdf_url": pdf_url
        })
    
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500
    
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

@app.route("/company", methods=["POST"])
def company_requirements():
    data = request.json
    company_idea = data.get("company_idea")
    job_description = data.get("job_description")
    hiring_type = data.get("hiring_type") 
    work_mode = data.get("work_mode")  
    job_role = data.get("job_role")

    if not all([company_idea, job_description, hiring_type, work_mode, job_role]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # Fetch all resumes
        resumes = db.collection("resumes").stream()
        
        matching_resumes = []
        
        # Process each resume
        for resume_doc in resumes:
            resume_data = resume_doc.to_dict()
            
            # Calculate match score using OpenAI
            match_result = calculate_resume_match_score(resume_data, job_description)
            
            # Only include resumes with match score above 60
            if match_result['match_score'] >= 60:
                resume_match_entry = {
                    "document_id": resume_doc.id,
                    "match_score": match_result['match_score'],
                    "matching_skills": match_result['matching_skills'],
                    "match_explanation": match_result['match_explanation'],
                    "personal_info": resume_data.get('personal_info', {}),
                    "resume_url": resume_data.get('resume_url')
                }
                matching_resumes.append(resume_match_entry)
        
        # Sort matching resumes by match score in descending order
        matching_resumes.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Store company requirements and matched resumes
        company_doc = {
            "company_idea": company_idea,
            "job_description": job_description,
            "hiring_type": hiring_type,
            "work_mode": work_mode,
            "job_role": job_role,
            "matching_resumes": matching_resumes,
            "created_at": firestore.SERVER_TIMESTAMP
        }
        
        # Store in Firestore
        db.collection("companies").document(company_idea).set(company_doc)
        
        return jsonify({
            "message": "Company requirements stored successfully", 
            "total_matches": len(matching_resumes),
            "top_matches": matching_resumes[:5]  # Return top 5 matches
        })
    
    except Exception as e:
        return jsonify({"error": f"Failed to process company requirements: {str(e)}"}), 500

@app.route("/search_resumes", methods=["GET"])
def search_resumes():
    query = request.args.get("query")
    if not query:
        return jsonify({"error": "Search query is required"}), 400

    try:
        # Perform a flexible search across resumes
        matching_resumes = []
        resumes = db.collection("resumes").stream()

        for resume_doc in resumes:
            resume_data = resume_doc.to_dict()
            
            # Check if query matches skills, experience, or other fields
            search_text = json.dumps(resume_data).lower()
            if query.lower() in search_text:
                matching_resumes.append({
                    "document_id": resume_doc.id,
                    "personal_info": resume_data.get('personal_info', {}),
                    "skills": resume_data.get('skills', []),
                    "resume_url": resume_data.get('resume_url')
                })

        return jsonify({
            "total_matches": len(matching_resumes),
            "matching_resumes": matching_resumes
        })
    
    except Exception as e:
        return jsonify({"error": f"Search failed: {str(e)}"}), 500

@app.route("/get_resume/<email>", methods=["GET"])
def get_resume(email):
    try:
        # Retrieve specific resume by email
        resume_doc = db.collection("resumes").document(email).get()
        
        if not resume_doc.exists:
            return jsonify({"error": "Resume not found"}), 404
        
        return jsonify(resume_doc.to_dict())
    
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve resume: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
