
import os
import time
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None


def generate_health_remarks(patient):

    if client is None:
        return "AI remarks unavailable: Gemini API key is not configured."

    prompt = f"""
    You are an assistant providing general health information.

    Review these patient blood test values:
    Glucose: {patient.glucose}
    Haemoglobin: {patient.haemoglobin}
    Cholesterol: {patient.cholesterol}

    Write a short, cautious health screening observation.

    Requirements:
    - Mention possible areas that may need medical review.
    - Do not diagnose any disease.
    - Do not prescribe medicines or treatments.
    - Do not assume measurement units or reference ranges.
    - Explain that results need interpretation by a qualified doctor.
    - Keep the response within 60 words.
    """

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            if response.text:
                return response.text

            return "AI did not return remarks. Please consult a doctor."

        except Exception as error:
            print(f"Gemini API attempt {attempt + 1} failed: {error}")

            if attempt < 2:
                time.sleep(2 * (attempt + 1))

    return "AI remarks temporarily unavailable. Please try again later and consult a qualified healthcare professional."
