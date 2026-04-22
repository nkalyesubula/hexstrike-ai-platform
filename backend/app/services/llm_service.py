import json
import logging
from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    """Service for AI-powered explanations using OpenAI GPT-4o"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
    
    async def explain_tool_result(
        self, 
        tool_name: str, 
        result: dict, 
        target: str, 
        context: dict = None
    ) -> dict:
        """
        Convert raw tool output into human-readable explanations
        
        Called after each tool execution to help beginners understand results
        """
        prompt = f"""
        You are a cybersecurity instructor explaining penetration test results to a beginner student.
        
        Tool used: {tool_name}
        Target scanned: {target}
        Scan results: {json.dumps(result, indent=2)[:3000]}
        
        Provide a response in JSON format with:
        1. "summary": A 2-3 sentence summary in simple English
        2. "key_findings": List of the most important findings (max 5)
        3. "vulnerability_explanation": What vulnerabilities mean in real-world terms
        4. "next_steps": Recommended next tools or manual checks
        5. "learning_points": 2-3 key concepts the student should learn
        
        Make it educational, engaging, and beginner-friendly. Avoid jargon or explain it.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": prompt}],
                temperature=0.5,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"LLM explanation failed: {e}")
            return {
                "summary": f"{tool_name} scan completed on {target}",
                "key_findings": [],
                "vulnerability_explanation": "Check the raw output for details",
                "next_steps": "Review the findings and try other tools",
                "learning_points": ["Review tool documentation for better understanding"]
            }
    
    async def optimize_tool_parameters(
        self,
        tool_name: str,
        target: str,
        user_context: dict
    ) -> dict:
        """
        Suggest optimal parameters based on user skill level
        
        Called when auto_mode is enabled in pentest lab
        """
        skill_level = user_context.get('skill_level', 'beginner')
        
        prompt = f"""
        You are an expert penetration tester. For tool '{tool_name}' targeting {target},
        suggest optimal parameters based on user skill level: {skill_level}
        
        For beginners: use safe, comprehensive scans (e.g., -sV -sC for nmap)
        For advanced: include aggressive options (e.g., -A for nmap)
        
        Return ONLY a JSON object with the parameters.
        Example: {{"scan_type": "-sV -sC", "ports": "1-1000", "timing": "-T4"}}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Parameter optimization failed: {e}")
            return {}
    
    async def create_execution_plan(
        self,
        target: str,
        available_tools: List[str],
        user_id: int
    ) -> dict:
        """
        Create intelligent execution order for multiple tools
        
        Called when running batch pentests
        """
        prompt = f"""
        Create a penetration testing execution plan for target {target}.
        Available tools: {available_tools}
        
        Return JSON with:
        1. "order": List of tools in execution order (reconnaissance first, then exploitation)
        2. "reasoning": Why this order makes sense
        3. "estimated_duration": Estimated time in minutes
        4. "learning_objectives": What the student will learn
        
        Follow standard methodology: Discovery → Enumeration → Vulnerability Detection → Exploitation
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": prompt}],
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Execution plan creation failed: {e}")
            return {
                "order": available_tools[:3],
                "reasoning": "Standard sequential execution",
                "estimated_duration": 10,
                "learning_objectives": ["Learn tool usage", "Understand scan results"]
            }
    
    async def generate_quiz(
        self,
        topic: str,
        difficulty: str,
        previous_scores: List[int] = None
    ) -> dict:
        """
        Generate quiz questions based on module content
        
        Called when user requests a new quiz
        """
        prompt = f"""
        Generate a {difficulty} level quiz about "{topic}" for cybersecurity students.
        Previous student scores: {previous_scores if previous_scores else 'No previous attempts'}
        
        Return JSON with:
        1. "title": Quiz title
        2. "questions": Array of 5 questions, each with:
           - "question": The question text
           - "options": Array of 4 possible answers
           - "correct": The correct answer (must match one option exactly)
           - "explanation": Why this answer is correct
        3. "passing_score": Minimum score to pass (70 recommended)
        4. "time_limit": Time limit in seconds (300 = 5 minutes)
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": prompt}],
                temperature=0.6,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Quiz generation failed: {e}")
            # Return fallback quiz
            return {
                "title": f"{topic} Basics",
                "questions": [
                    {
                        "question": f"What is the primary purpose of {topic}?",
                        "options": ["Security", "Scanning", "Testing", "Monitoring"],
                        "correct": "Security",
                        "explanation": f"{topic} is primarily used for security assessment"
                    }
                ],
                "passing_score": 70,
                "time_limit": 300
            }
    
    async def analyze_student_progress(
        self,
        user_id: int,
        completed_modules: List[str],
        quiz_scores: List[dict]
    ) -> dict:
        """
        Provide personalized learning recommendations
        
        Called from dashboard to show AI-powered insights
        """
        prompt = f"""
        Analyze this student's progress in cybersecurity learning:
        
        Completed modules: {completed_modules}
        Quiz scores: {quiz_scores}
        
        Provide JSON with:
        1. "strengths": Topics they excel at
        2. "weaknesses": Areas needing improvement
        3. "recommendations": Specific next steps
        4. "suggested_modules": Names of modules to study next
        5. "encouragement": Personalized encouragement message
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": prompt}],
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Progress analysis failed: {e}")
            return {
                "strengths": ["Keep up the good work!"],
                "weaknesses": ["Review completed modules"],
                "recommendations": ["Continue with next module"],
                "suggested_modules": completed_modules[:3] if completed_modules else ["Network Reconnaissance"],
                "encouragement": "Every expert was once a beginner. Keep learning!"
            }

# Create singleton instance
llm_service = LLMService()
