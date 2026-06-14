from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(tags=["hints"])

class Message(BaseModel):
    role: str
    content: str

class HintRequest(BaseModel):
    messages: List[Message]
    module_name: Optional[str] = None
    lab_exercise: Optional[str] = None
    hint_level: int = 1

class HintResponse(BaseModel):
    hint: str
    hint_level: int
    can_go_deeper: bool

# Rule-based hint database
HINTS_DB = {
    "Network Reconnaissance": {
        "Scan Metasploitable with Nmap": [
            "Think about what tool is commonly used to discover open ports and running services on a target machine.",
            "Try using Nmap with a flag that detects service versions. Look up the -sV flag.",
            "Run: nmap -sV 192.168.56.101"
        ]
    },
    "Vulnerability Scanning": {
        "default": [
            "Consider what type of scanner can automatically detect known vulnerabilities on a web server.",
            "Tools like Nikto or Nuclei are designed for this. Check their basic usage syntax.",
            "Try: nikto -h http://192.168.56.101"
        ]
    },
    "Web Application Security": {
        "default": [
            "Think about how attackers discover hidden directories and files on a website.",
            "Directory brute-forcing tools like Gobuster can help here.",
            "Try: gobuster dir -u http://192.168.56.101 -w /usr/share/wordlists/dirb/common.txt"
        ]
    },
    "Password Attacks & Cracking": {
        "default": [
            "Think about what happens when a service uses weak or default credentials.",
            "Tools like Hydra can attempt many username/password combinations automatically.",
            "Try: hydra -l msfadmin -P /usr/share/wordlists/rockyou.txt 192.168.56.101 ssh"
        ]
    }
}

# Generic fallback hints if nothing matches
GENERIC_HINTS = [
    "Break the problem down — what is the first step in any penetration test? (Hint: reconnaissance)",
    "Review the module overview again — it usually mentions which tool to use for this type of task.",
    "Check the 'Tools' section in the Pentest Lab — the tool you need is likely listed there with a description."
]

@router.post("/", response_model=HintResponse)
async def get_hint(request: HintRequest):
    hint_level = max(1, min(request.hint_level, 3))  # clamp between 1-3

    module_hints = HINTS_DB.get(request.module_name, {})

    # Case-insensitive lab exercise matching
    hints_list = None
    if request.lab_exercise:
        for key, val in module_hints.items():
            if key.lower() == request.lab_exercise.lower():
                hints_list = val
                break

    if not hints_list:
        hints_list = module_hints.get("default") or GENERIC_HINTS

    hint = hints_list[hint_level - 1]

    return HintResponse(
        hint=hint,
        hint_level=hint_level,
        can_go_deeper=hint_level < len(hints_list)
    )
