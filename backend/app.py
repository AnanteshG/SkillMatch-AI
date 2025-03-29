import os
import re
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import Flask, request, jsonify
import openai
import PyPDF2
import firebase_admin
import cloudinary
import cloudinary.uploader
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

def send_matching_resumes_email(company_email, company_name, job_role, matching_resumes):
    """
    Send email to company with matched resumes using SMTP
    
    Args:
        company_email (str): Email address of the company
        company_name (str): Name of the company
        job_role (str): Job role being recruited for
        matching_resumes (list): List of matched resumes
    """
    try:
        # SMTP Configuration from environment variables
        smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        sender_email = os.getenv('SENDER_EMAIL', smtp_username)

        # Detailed logging of SMTP configuration
        print(f"SMTP Configuration:")
        print(f"Host: {smtp_host}")
        print(f"Port: {smtp_port}")
        print(f"Username: {smtp_username}")
        print(f"Sender Email: {sender_email}")
        print(f"Company Email: {company_email}")

        # Validate required SMTP settings
        if not all([smtp_host, smtp_port, smtp_username, smtp_password]):
            print("ERROR: SMTP configuration is incomplete")
            return False

        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Resume Matches for {job_role} at {company_name}"
        msg['From'] = sender_email
        msg['To'] = company_email

        # Check if there are matching resumes
        if not matching_resumes:
            print("No matching resumes to send")
            return False

        # Generate HTML email content
        resume_list_html = "".join([
            f"""
            <div style='margin-bottom: 25px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); background-color: #ffffff;'>
                <h3 style='color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;'>
                    {resume.get('personal_info', {}).get('name', 'Unknown')}
                </h3>
                
                <div style='margin: 15px 0;'>
                    <p style='margin: 5px 0; font-weight: bold; color: #555;'>Match Score:</p>
                    <div style='background-color: #f0f0f0; border-radius: 10px; height: 20px; width: 100%; margin-top: 5px;'>
                        <div style='background: linear-gradient(to right, #3498db, #9b59b6); width: {resume["match_score"]}%; height: 100%; border-radius: 10px; text-align: center;'>
                            <span style='color: white; font-size: 12px; line-height: 20px; text-shadow: 1px 1px 1px rgba(0,0,0,0.2);'>{resume["match_score"]}%</span>
                        </div>
                    </div>
                </div>
                
                <div style='margin: 15px 0;'>
                    <p style='margin: 5px 0; font-weight: bold; color: #555;'>Matching Skills:</p>
                    <div style='display: flex; flex-wrap: wrap; gap: 5px;'>
                        {" ".join([f'<span style="background-color: #e8f4fc; color: #3498db; padding: 5px 10px; border-radius: 15px; font-size: 12px;">{skill}</span>' for skill in resume.get('matching_skills', [])])}
                    </div>
                </div>
                
                <div style='margin: 15px 0;'>
                    <p style='margin: 5px 0; font-weight: bold; color: #555;'>Match Explanation:</p>
                    <p style='margin: 5px 0; color: #666; line-height: 1.5;'>{resume.get('match_explanation', 'No explanation')}</p>
                </div>
                
                <div style='text-align: center; margin-top: 20px;'>
                    <a href='{resume.get('resume_url', '#')}' style='display: inline-block; background: linear-gradient(135deg, #3498db, #9b59b6); color: white; text-decoration: none; padding: 10px 25px; border-radius: 25px; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.1); transition: all 0.3s ease;'>View Resume</a>
                </div>
            </div>
            """ for resume in matching_resumes[:10]  # Limit to top 10 matches
        ])
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f9f9f9;
                        margin: 0;
                        padding: 0;
                    }}
                    .container {{
                        max-width: 650px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    }}
                    .header {{
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 1px solid #eaeaea;
                    }}
                    .header h1 {{
                        color: #2c3e50;
                        margin: 0;
                        font-size: 24px;
                    }}
                    .header h2 {{
                        color: #3498db;
                        margin: 10px 0 0;
                        font-size: 20px;
                    }}
                    .content {{
                        padding: 20px 0;
                    }}
                    .summary {{
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        padding: 15px;
                        margin-bottom: 20px;
                        border-radius: 0 5px 5px 0;
                    }}
                    .footer {{
                        text-align: center;
                        padding: 20px 0;
                        color: #7f8c8d;
                        font-size: 14px;
                        border-top: 1px solid #eaeaea;
                    }}
                    .dashboard-link {{
                        display: inline-block;
                        background-color: #3498db;
                        color: white;
                        text-decoration: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        margin-top: 10px;
                        font-weight: bold;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Resume Matching Results</h1>
                        <h2>{company_name} - {job_role}</h2>
                    </div>
                    
                    <div class="content">
                        <div class="summary">
                            <p>We've found <strong>{len(matching_resumes)}</strong> potential candidates that match your job requirements.</p>
                        </div>
                        
                        <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Top Matching Candidates</h3>
                        {resume_list_html}
                    </div>
                    
                    <div class="footer">
                        <p>For full details and more candidates, please visit your dashboard</p>
                        <a href="#" class="dashboard-link">Go to Dashboard</a>
                        <p style="margin-top: 20px; font-size: 12px;">© 2023 SkillMatch. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """

        # Create HTML part
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)

        # Establish SMTP connection
        try:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                # Start TLS for security
                server.starttls()
                
                # Login to the server
                try:
                    server.login(smtp_username, smtp_password)
                except smtplib.SMTPAuthenticationError as auth_error:
                    print(f"SMTP Authentication Error: {auth_error}")
                    return False
                
                # Send email
                try:
                    server.sendmail(sender_email, company_email, msg.as_string())
                    print(f"Email sent successfully to {company_email}")
                    return True
                except Exception as send_error:
                    print(f"Error sending email: {send_error}")
                    return False
        
        except Exception as connection_error:
            print(f"SMTP Connection Error: {connection_error}")
            return False
    
    except Exception as e:
        print(f"Unexpected error in send_matching_resumes_email: {e}")
        return False

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

        # Validate email
        email = parsed_resume.get('personal_info', {}).get('email')
        if not email:
            return jsonify({"error": "No email found in resume"}), 400
        
        # Additional email validation (optional)
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({"error": "Invalid email format"}), 400

        parsed_resume.update({
            "resume_url": pdf_url,
            "uploaded_at": firestore.SERVER_TIMESTAMP
        })

        # Store in Firestore using email as document ID
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
        # Clean up temporary file
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

@app.route("/company", methods=["POST"])
def company_requirements():
    data = request.json
    company_name = data.get("company_name")
    job_description = data.get("job_description")
    hiring_type = data.get("hiring_type") 
    work_mode = data.get("work_mode")  
    job_role = data.get("job_role")
    company_email = data.get("company_email")

    # Validate required fields
    if not all([company_name, job_description, hiring_type, work_mode, job_role, company_email]):
        return jsonify({"error": "Missing required fields"}), 400

    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", company_email):
        return jsonify({"error": "Invalid email format"}), 400

    try:
        resumes = db.collection("resumes").stream()
        matching_resumes = []
        
        for resume_doc in resumes:
            resume_data = resume_doc.to_dict()
            match_result = calculate_resume_match_score(resume_data, job_description)
            
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
        
        matching_resumes.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Prepare company document
        company_doc = {
            "company_name": company_name,
            "job_description": job_description,
            "hiring_type": hiring_type,
            "work_mode": work_mode,
            "job_role": job_role,
            "company_email": company_email,  # Store company email in the document
            "matching_resumes": matching_resumes,
            "created_at": firestore.SERVER_TIMESTAMP
        }
        
        # Store company document
        db.collection("companies").document(company_name).set(company_doc)
        
        # Send email notification
        email_sent = send_matching_resumes_email(
            company_email, 
            company_name, 
            job_role, 
            matching_resumes
        )
        
        return jsonify({
            "message": "Company requirements stored successfully", 
            "total_matches": len(matching_resumes),
            "top_matches": matching_resumes[:5],
            "email_sent": email_sent
        })
    
    except Exception as e:
        return jsonify({"error": f"Failed to process company requirements: {str(e)}"}), 500

@app.route("/search_resumes", methods=["GET"])
def search_resumes():
    query = request.args.get("query")
    if not query:
        return jsonify({"error": "Search query is required"}), 400

    try:
        matching_resumes = []
        resumes = db.collection("resumes").stream()

        for resume_doc in resumes:
            resume_data = resume_doc.to_dict()
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
        resume_doc = db.collection("resumes").document(email).get()
        
        if not resume_doc.exists:
            return jsonify({"error": "Resume not found"}), 404
        
        return jsonify(resume_doc.to_dict())
    
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve resume: {str(e)}"}), 500

# if __name__ == "_main_":
app.run(host="0.0.0.0", port=5000)