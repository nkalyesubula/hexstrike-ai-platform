"""Service for managing learning modules and content"""

class LearningService:
    """Central registry of all learning modules"""
    
    def __init__(self):
        self.modules = self._load_modules()
    
    def _load_modules(self):
        """Load all learning modules with comprehensive content"""
        return [
            # Level 1: Beginner Modules (100-150 XP)
            {
                "id": 1,
                "name": "Network Reconnaissance",
                "description": "Learn to discover hosts, ports, and services on a network",
                "long_description": """
                    Network reconnaissance is the first phase of penetration testing. 
                    You'll learn to use tools like Nmap to discover live hosts, open ports, 
                    and running services. This skill is essential for understanding the 
                    attack surface of any target.
                    
                    Key topics covered:
                    - TCP/IP fundamentals
                    - ICMP discovery techniques
                    - Port scanning methodologies
                    - Service fingerprinting
                    - Network mapping and topology
                """,
                "learning_objectives": [
                    "Understand TCP/IP networking basics",
                    "Perform host discovery using ICMP",
                    "Scan for open ports with Nmap",
                    "Identify running services and versions",
                    "Create network maps of discovered hosts",
                    "Differentiate between TCP and UDP scanning"
                ],
                "practical_exercise": {
                    "title": "Hands-on Lab: Scan a Target Network",
                    "target": "192.168.56.101",
                    "steps": [
                        "Run a ping sweep to discover live hosts: nmap -sn 192.168.56.0/24",
                        "Perform a port scan on discovered hosts: nmap -sV 192.168.56.101",
                        "Identify running services and versions",
                        "Try different scan types: -sS (SYN), -sT (TCP), -sU (UDP)",
                        "Document your findings in a report"
                    ],
                    "tools": ["nmap", "ping", "traceroute"]
                },
                "quiz_questions": [
                    {"question": "What does Nmap stand for?", "options": ["Network Mapper", "Network Scanner", "Node Mapper", "Net Map"], "correct": "Network Mapper", "explanation": "Nmap stands for Network Mapper."},
                    {"question": "Which Nmap flag is used for service version detection?", "options": ["-sV", "-sS", "-O", "-A"], "correct": "-sV", "explanation": "-sV enables service version detection."},
                    {"question": "What is the default port range for a basic Nmap scan?", "options": ["1-1000", "1-100", "1-65535", "1-500"], "correct": "1-1000", "explanation": "Nmap scans the 1000 most common ports by default."},
                    {"question": "What protocol does ICMP use for host discovery?", "options": ["ICMP Echo Request", "TCP SYN", "UDP", "ARP"], "correct": "ICMP Echo Request", "explanation": "ICMP Echo Request (ping) is used for basic host discovery."},
                    {"question": "Which scan type is considered stealthier?", "options": ["SYN scan (-sS)", "TCP connect (-sT)", "UDP scan (-sU)", "ACK scan (-sA)"], "correct": "SYN scan (-sS)", "explanation": "SYN scan doesn't complete the handshake, making it stealthier."}
                ],
                "flashcards": [
                    {"front": "What is network reconnaissance?", "back": "The process of discovering hosts, ports, services, and network structure before deeper security testing."},
                    {"front": "What does Nmap stand for?", "back": "Network Mapper."},
                    {"front": "Which Nmap flag enables service version detection?", "back": "-sV"},
                    {"front": "What is a ping sweep used for?", "back": "Finding live hosts across a network range."},
                    {"front": "What is the TCP three-way handshake?", "back": "SYN, SYN-ACK, ACK."},
                    {"front": "Why is SYN scanning considered stealthier?", "back": "It does not complete the full TCP connection handshake."}
                ],
                "xp": 100,
                "duration": "2 hours",
                "difficulty": "Beginner",
                "category": "Reconnaissance",
                "icon": "🔍",
                "prerequisites": []
            },
            {
                "id": 2,
                "name": "Vulnerability Scanning",
                "description": "Identify security weaknesses using automated tools",
                "long_description": """
                    Vulnerability scanning helps identify known security issues in systems and applications.
                    You'll learn to use tools like Nuclei and Nikto to detect CVEs, misconfigurations, 
                    and common vulnerabilities. This is crucial for prioritizing remediation efforts.
                    
                    Topics include:
                    - Understanding CVSS scoring
                    - Using vulnerability databases
                    - Automated vs manual scanning
                    - False positive identification
                    - Risk prioritization
                """,
                "learning_objectives": [
                    "Understand vulnerability databases and CVSS scores",
                    "Use Nuclei templates for CVE detection",
                    "Scan web applications with Nikto",
                    "Interpret vulnerability scan results",
                    "Prioritize findings by severity",
                    "Validate and verify findings"
                ],
                "practical_exercise": {
                    "title": "Hands-on Lab: Vulnerability Assessment",
                    "target": "192.168.56.101",
                    "steps": [
                        "Run a vulnerability scan with Nuclei: nuclei -u http://192.168.56.101",
                        "Review and categorize findings by severity",
                        "Verify critical vulnerabilities manually",
                        "Create a remediation plan with priorities",
                        "Generate a vulnerability assessment report"
                    ],
                    "tools": ["nuclei", "nikto", "nmap"]
                },
                "quiz_questions": [
                    {"question": "What does CVE stand for?", "options": ["Common Vulnerabilities and Exposures", "Computer Vulnerability Exploit", "Common Vulnerability Enumeration", "Critical Vulnerability Event"], "correct": "Common Vulnerabilities and Exposures", "explanation": "CVE is a dictionary of known cybersecurity vulnerabilities."},
                    {"question": "What is a CVSS score?", "options": ["Vulnerability severity rating", "Scan speed metric", "Tool performance score", "Network latency measure"], "correct": "Vulnerability severity rating", "explanation": "CVSS rates vulnerability severity from 0-10."},
                    {"question": "Which CVSS score indicates a critical vulnerability?", "options": ["9.0-10.0", "7.0-8.9", "4.0-6.9", "0-3.9"], "correct": "9.0-10.0", "explanation": "Critical vulnerabilities have CVSS scores 9.0-10.0."}
                ],
                "flashcards": [
                    {"front": "What is vulnerability scanning?", "back": "Automated or guided testing to identify known weaknesses, misconfigurations, and exposed risks."},
                    {"front": "What does CVE stand for?", "back": "Common Vulnerabilities and Exposures."},
                    {"front": "What does CVSS measure?", "back": "The severity of a vulnerability, usually on a 0-10 scale."},
                    {"front": "What CVSS range is critical?", "back": "9.0 to 10.0."},
                    {"front": "What is a false positive?", "back": "A reported vulnerability that is not actually exploitable or present."},
                    {"front": "Why verify scan findings manually?", "back": "To reduce false positives and understand real-world impact."}
                ],
                "xp": 150,
                "duration": "3 hours",
                "difficulty": "Beginner",
                "category": "Vulnerability Assessment",
                "icon": "🛡️",
                "prerequisites": [1]
            },
            
            # Level 2: Intermediate Modules (175-225 XP)
            {
                "id": 3,
                "name": "Web Application Security",
                "description": "Understand common web vulnerabilities and how to find them",
                "long_description": """
                    Web applications are prime targets for attackers. This module covers OWASP Top 10 
                    vulnerabilities including SQL Injection, XSS, and CSRF. You'll learn to identify 
                    and exploit these vulnerabilities in a safe environment.
                    
                    Topics covered:
                    - OWASP Top 10 deep dive
                    - SQL injection techniques
                    - Cross-site scripting (XSS) vectors
                    - CSRF and SSRF attacks
                    - Security misconfigurations
                """,
                "learning_objectives": [
                    "Understand OWASP Top 10 vulnerabilities",
                    "Identify SQL injection points",
                    "Test for Cross-Site Scripting (XSS)",
                    "Detect insecure authentication",
                    "Perform security header analysis",
                    "Use web proxies like Burp Suite"
                ],
                "practical_exercise": {
                    "title": "Hands-on Lab: Web App Security Testing",
                    "target": "http://192.168.56.101/dvwa",
                    "steps": [
                        "Test for SQL injection vulnerabilities using SQLMap",
                        "Identify XSS vulnerabilities with manual testing",
                        "Check for insecure file uploads",
                        "Review security headers with curl -I",
                        "Generate a web security assessment report"
                    ],
                    "tools": ["sqlmap", "gobuster", "curl", "nikto"]
                },
                "quiz_questions": [
                    {"question": "What is SQL Injection?", "options": ["Database query manipulation", "Server overload attack", "Password cracking", "Session hijacking"], "correct": "Database query manipulation", "explanation": "SQL Injection manipulates database queries to access unauthorized data."},
                    {"question": "What does XSS stand for?", "options": ["Cross-Site Scripting", "XML Site Security", "Extended Site Security", "Cross-Site Security"], "correct": "Cross-Site Scripting", "explanation": "XSS injects malicious scripts into web pages."},
                    {"question": "Which header helps prevent clickjacking?", "options": ["X-Frame-Options", "CSP", "HSTS", "CORS"], "correct": "X-Frame-Options", "explanation": "X-Frame-Options prevents your site from being embedded in frames."}
                ],
                "flashcards": [
                    {"front": "What is SQL injection?", "back": "A vulnerability where user input changes the intended database query."},
                    {"front": "What does XSS stand for?", "back": "Cross-Site Scripting."},
                    {"front": "What can XSS allow an attacker to do?", "back": "Run malicious scripts in another user's browser."},
                    {"front": "Which header helps prevent clickjacking?", "back": "X-Frame-Options."},
                    {"front": "What is CSRF?", "back": "Cross-Site Request Forgery, where a victim's browser is tricked into making an unwanted request."},
                    {"front": "What is the OWASP Top 10?", "back": "A widely used list of critical web application security risks."}
                ],
                "xp": 200,
                "duration": "4 hours",
                "difficulty": "Intermediate",
                "category": "Web Security",
                "icon": "🌐",
                "prerequisites": [1, 2]
            },
            {
                "id": 4,
                "name": "Password Attacks & Cracking",
                "description": "Learn password security assessment techniques",
                "long_description": """
                    Password security is critical for system protection. This module covers password 
                    attacks including brute force, dictionary attacks, and hash cracking. You'll learn 
                    to assess password strength and implement secure authentication.
                    
                    Topics:
                    - Password hashing algorithms
                    - Dictionary and brute force attacks
                    - Rainbow tables and hash cracking
                    - Online vs offline attacks
                    - Password policy enforcement
                """,
                "learning_objectives": [
                    "Understand password hashing (MD5, SHA, bcrypt)",
                    "Use Hydra for online password attacks",
                    "Crack password hashes with John the Ripper",
                    "Create effective wordlists",
                    "Implement password security best practices"
                ],
                "practical_exercise": {
                    "title": "Hands-on Lab: Password Security Assessment",
                    "target": "192.168.56.101",
                    "steps": [
                        "Use Hydra to test SSH password strength",
                        "Extract password hashes from /etc/shadow",
                        "Crack hashes using John the Ripper",
                        "Create custom wordlists with cewl",
                        "Document weak password findings"
                    ],
                    "tools": ["hydra", "john", "hashcat", "cewl"]
                },
                "quiz_questions": [
                    {"question": "Which hashing algorithm is considered most secure for passwords?", "options": ["MD5", "SHA-1", "bcrypt", "CRC32"], "correct": "bcrypt", "explanation": "bcrypt is designed for password hashing with salt and cost factor."},
                    {"question": "What is a dictionary attack?", "options": ["Using wordlist of common passwords", "Trying all possible combinations", "Using rainbow tables", "Sniffing network traffic"], "correct": "Using wordlist of common passwords", "explanation": "Dictionary attacks use pre-compiled lists of common passwords."}
                ],
                "flashcards": [
                    {"front": "What is a password hash?", "back": "A one-way representation of a password used for safer storage."},
                    {"front": "Why are salts used with password hashes?", "back": "They make identical passwords produce different hashes and reduce precomputed attack effectiveness."},
                    {"front": "Which password hashing algorithm is preferred over MD5 and SHA-1?", "back": "bcrypt."},
                    {"front": "What is a dictionary attack?", "back": "Trying passwords from a prepared wordlist."},
                    {"front": "What is an offline password attack?", "back": "Cracking captured hashes without interacting with the live authentication service."},
                    {"front": "What tool is commonly used for online login brute forcing?", "back": "Hydra."}
                ],
                "xp": 175,
                "duration": "3 hours",
                "difficulty": "Intermediate",
                "category": "Authentication",
                "icon": "🔑",
                "prerequisites": [1]
            },
            {
                "id": 5,
                "name": "Wireless Network Security",
                "description": "Assess and secure WiFi networks",
                "long_description": """
                    Wireless networks have unique security challenges. This module covers WiFi 
                    security assessments including WEP/WPA/WPA2 attacks, rogue access points, 
                    and enterprise security.
                    
                    Topics:
                    - 802.11 protocol basics
                    - WEP, WPA, WPA2, WPA3 differences
                    - Deauthentication attacks
                    - Handshake capture and cracking
                    - Enterprise WiFi security
                """,
                "learning_objectives": [
                    "Understand wireless encryption protocols",
                    "Capture WPA handshakes",
                    "Crack WiFi passwords",
                    "Detect rogue access points",
                    "Implement WiFi security best practices"
                ],
                "practical_exercise": {
                    "title": "Hands-on Lab: WiFi Security Assessment",
                    "target": "Wireless Network",
                    "steps": [
                        "Put wireless card in monitor mode",
                        "Discover nearby networks with airodump-ng",
                        "Capture WPA handshake",
                        "Crack password using aircrack-ng",
                        "Generate security recommendations"
                    ],
                    "tools": ["aircrack-ng", "airodump-ng", "aireplay-ng"]
                },
                "quiz_questions": [
                    {"question": "Which WiFi protocol is most secure?", "options": ["WEP", "WPA", "WPA2", "WPA3"], "correct": "WPA3", "explanation": "WPA3 is the latest and most secure WiFi protocol."}
                ],
                "flashcards": [
                    {"front": "Which WiFi protocol is currently the strongest option?", "back": "WPA3."},
                    {"front": "Why is WEP considered insecure?", "back": "Its weak encryption can be cracked quickly with captured traffic."},
                    {"front": "What is monitor mode?", "back": "A wireless card mode that captures nearby 802.11 traffic."},
                    {"front": "What is a WPA handshake used for in testing?", "back": "It can be captured and used to test whether the WiFi password is crackable."},
                    {"front": "What is a rogue access point?", "back": "An unauthorized wireless access point that can expose or intercept network traffic."},
                    {"front": "What does deauthentication do?", "back": "Forces clients to disconnect, often to trigger reconnection and handshake capture."}
                ],
                "xp": 200,
                "duration": "4 hours",
                "difficulty": "Intermediate",
                "category": "Wireless",
                "icon": "📡",
                "prerequisites": [1]
            },
            
            # Level 3: Advanced Modules (250-350 XP)
            {
                "id": 6,
                "name": "Privilege Escalation",
                "description": "Learn to elevate privileges after initial access",
                "long_description": """
                    Privilege escalation is critical for gaining full control of compromised systems.
                    This module covers both Linux and Windows privilege escalation techniques including 
                    sudo misconfigurations, SUID binaries, kernel exploits, and service vulnerabilities.
                    
                    Topics:
                    - Linux privilege escalation vectors
                    - Windows privilege escalation techniques
                    - Kernel exploitation
                    - Service misconfigurations
                    - Scheduled tasks abuse
                """,
                "learning_objectives": [
                    "Understand privilege escalation concepts",
                    "Identify sudo misconfigurations",
                    "Find exploitable SUID binaries",
                    "Enumerate system information",
                    "Use automated enumeration tools",
                    "Exploit kernel vulnerabilities"
                ],
                "practical_exercise": {
                    "title": "Hands-on Lab: Privilege Escalation",
                    "target": "192.168.56.101",
                    "steps": [
                        "Enumerate system users and groups",
                        "Check sudo permissions: sudo -l",
                        "Find SUID binaries: find / -perm -4000 2>/dev/null",
                        "Check cron jobs for privilege escalation",
                        "Exploit misconfigurations for root access"
                    ],
                    "tools": ["linpeas", "pspy", "sudo", "find"]
                },
                "quiz_questions": [
                    {"question": "What does SUID stand for?", "options": ["Set User ID", "System User ID", "Secure User ID", "Super User ID"], "correct": "Set User ID", "explanation": "SUID allows programs to run with owner privileges."},
                    {"question": "Which command checks sudo permissions?", "options": ["sudo -l", "sudo -k", "sudo -v", "sudo -s"], "correct": "sudo -l", "explanation": "sudo -l lists the current user's sudo privileges."}
                ],
                "flashcards": [
                    {"front": "What is privilege escalation?", "back": "Increasing access from a lower-privileged account to a higher-privileged one."},
                    {"front": "What does SUID stand for?", "back": "Set User ID."},
                    {"front": "Which command lists sudo permissions?", "back": "sudo -l."},
                    {"front": "Why can SUID binaries be risky?", "back": "They run with the file owner's privileges and may be abused if misconfigured."},
                    {"front": "What is kernel exploitation?", "back": "Abusing a vulnerability in the operating system kernel to gain higher privileges."},
                    {"front": "What is enumeration in privilege escalation?", "back": "Collecting system details, permissions, services, users, and misconfigurations."}
                ],
                "xp": 250,
                "duration": "5 hours",
                "difficulty": "Advanced",
                "category": "Post-Exploitation",
                "icon": "⚡",
                "prerequisites": [1, 2, 3]
            },
            {
                "id": 7,
                "name": "Active Directory Security",
                "description": "Assess and secure Active Directory environments",
                "long_description": """
                    Active Directory is the backbone of many corporate networks. This module covers 
                    AD security assessment including enumeration, Kerberoasting, pass-the-hash, 
                    and privilege escalation in domain environments.
                    
                    Topics:
                    - AD architecture and components
                    - LDAP enumeration techniques
                    - Kerberos attacks (Kerberoasting, AS-REP Roasting)
                    - Pass-the-hash and pass-the-ticket
                    - Domain privilege escalation
                """,
                "learning_objectives": [
                    "Understand Active Directory structure",
                    "Enumerate AD users and groups",
                    "Perform Kerberoasting attacks",
                    "Execute pass-the-hash attacks",
                    "Identify domain privilege escalation paths",
                    "Implement AD security best practices"
                ],
                "practical_exercise": {
                    "title": "Hands-on Lab: AD Security Assessment",
                    "target": "192.168.56.101 (Domain Controller)",
                    "steps": [
                        "Enumerate AD using BloodHound",
                        "Find Kerberoastable accounts",
                        "Crack Kerberos tickets",
                        "Perform pass-the-hash attack",
                        "Generate AD security report"
                    ],
                    "tools": ["bloodhound", "impacket", "kerberoast", "mimikatz"]
                },
                "quiz_questions": [
                    {"question": "What protocol does Active Directory primarily use?", "options": ["LDAP", "HTTP", "FTP", "SNMP"], "correct": "LDAP", "explanation": "Active Directory uses LDAP (Lightweight Directory Access Protocol)."}
                ],
                "flashcards": [
                    {"front": "What protocol does Active Directory primarily use for directory queries?", "back": "LDAP."},
                    {"front": "What is Kerberoasting?", "back": "Requesting service tickets for service accounts and attempting to crack them offline."},
                    {"front": "What is pass-the-hash?", "back": "Authenticating with a captured password hash instead of the plaintext password."},
                    {"front": "What is BloodHound used for?", "back": "Mapping Active Directory relationships and attack paths."},
                    {"front": "What is a domain controller?", "back": "A server that authenticates users and manages Active Directory domain services."},
                    {"front": "Why are service accounts high-value targets?", "back": "They often have elevated permissions and long-lived passwords."}
                ],
                "xp": 300,
                "duration": "6 hours",
                "difficulty": "Advanced",
                "category": "Active Directory",
                "icon": "🏢",
                "prerequisites": [1, 2, 6]
            },
            {
                "id": 8,
                "name": "Social Engineering",
                "description": "Understand human-based attack vectors",
                "long_description": """
                    Social engineering targets the human element of security. This module covers 
                    phishing, pretexting, baiting, and other manipulation techniques used to 
                    compromise organizations.
                    
                    Topics:
                    - Psychological principles of influence
                    - Phishing email crafting
                    - Spear phishing vs whaling
                    - Vishing and SMiShing
                    - Physical security bypasses
                """,
                "learning_objectives": [
                    "Understand social engineering principles",
                    "Craft convincing phishing emails",
                    "Create fake login pages",
                    "Identify social engineering red flags",
                    "Implement security awareness training"
                ],
                "practical_exercise": {
                    "title": "Hands-on Lab: Social Engineering Simulation",
                    "target": "Training Environment",
                    "steps": [
                        "Create a phishing email template",
                        "Set up a credential harvesting page",
                        "Conduct simulated phishing campaign",
                        "Analyze click rates and reporting",
                        "Develop security awareness recommendations"
                    ],
                    "tools": ["setoolkit", "gophish", "evilginx"]
                },
                "quiz_questions": [
                    {"question": "What is spear phishing?", "options": ["Targeted phishing attack", "Mass email attack", "SMS phishing", "Voice phishing"], "correct": "Targeted phishing attack", "explanation": "Spear phishing targets specific individuals or organizations."}
                ],
                "flashcards": [
                    {"front": "What is social engineering?", "back": "Manipulating people into revealing information or performing unsafe actions."},
                    {"front": "What is spear phishing?", "back": "A targeted phishing attack against a specific person or organization."},
                    {"front": "What is whaling?", "back": "Phishing aimed at executives or other high-value individuals."},
                    {"front": "What is vishing?", "back": "Voice-based phishing, usually over phone calls."},
                    {"front": "What is pretexting?", "back": "Creating a believable scenario to persuade a target to trust the attacker."},
                    {"front": "What is a common defense against phishing?", "back": "Security awareness training, reporting workflows, and multi-factor authentication."}
                ],
                "xp": 225,
                "duration": "4 hours",
                "difficulty": "Intermediate",
                "category": "Social Engineering",
                "icon": "🎭",
                "prerequisites": [1]
            },
            {
                "id": 9,
                "name": "Cloud Security",
                "description": "Secure cloud infrastructure and services",
                "long_description": """
                    Cloud security requires understanding shared responsibility models and cloud-specific 
                    threats. This module covers AWS, Azure, and GCP security assessment including 
                    misconfigurations, IAM issues, and data exposure.
                    
                    Topics:
                    - Cloud shared responsibility model
                    - IAM policy analysis
                    - S3 bucket enumeration
                    - Cloud privilege escalation
                    - Compliance and governance
                """,
                "learning_objectives": [
                    "Understand cloud security models",
                    "Analyze IAM policies for weaknesses",
                    "Identify publicly exposed storage",
                    "Detect cloud misconfigurations",
                    "Implement cloud security best practices"
                ],
                "practical_exercise": {
                    "title": "Hands-on Lab: Cloud Security Assessment",
                    "target": "AWS/Azure Lab Environment",
                    "steps": [
                        "Enumerate S3 buckets using AWS CLI",
                        "Analyze IAM policies for privilege escalation",
                        "Check for public storage exposure",
                        "Review security group configurations",
                        "Generate cloud security report"
                    ],
                    "tools": ["aws-cli", "scoutsuite", "prowler"]
                },
                "quiz_questions": [
                    {"question": "What is the shared responsibility model?", "options": ["Cloud provider vs customer security responsibilities", "Shared passwords", "Multi-factor authentication", "Joint compliance"], "correct": "Cloud provider vs customer security responsibilities", "explanation": "The shared responsibility model defines which security aspects are handled by the cloud provider vs customer."}
                ],
                "flashcards": [
                    {"front": "What is the cloud shared responsibility model?", "back": "A model defining which security duties belong to the cloud provider and which belong to the customer."},
                    {"front": "What does IAM stand for?", "back": "Identity and Access Management."},
                    {"front": "Why are public storage buckets risky?", "back": "They can expose sensitive files directly to the internet."},
                    {"front": "What is least privilege?", "back": "Granting only the minimum access needed to perform a task."},
                    {"front": "What can security groups control?", "back": "Network traffic allowed to and from cloud resources."},
                    {"front": "What is cloud misconfiguration?", "back": "An unsafe or unintended cloud setting that can expose systems or data."}
                ],
                "xp": 275,
                "duration": "5 hours",
                "difficulty": "Advanced",
                "category": "Cloud Security",
                "icon": "☁️",
                "prerequisites": [1, 2]
            },
            {
                "id": 10,
                "name": "Incident Response & Forensics",
                "description": "Respond to security incidents and conduct forensic analysis",
                "long_description": """
                    Security incidents require structured response procedures. This module covers 
                    incident response lifecycle, evidence collection, forensic analysis, and 
                    recovery procedures.
                    
                    Topics:
                    - Incident response lifecycle (NIST)
                    - Evidence collection and chain of custody
                    - Memory forensics analysis
                    - Disk forensics and file carving
                    - Malware analysis basics
                """,
                "learning_objectives": [
                    "Understand incident response phases",
                    "Collect forensic evidence properly",
                    "Analyze memory dumps for artifacts",
                    "Perform disk forensics",
                    "Create incident reports",
                    "Implement recovery procedures"
                ],
                "practical_exercise": {
                    "title": "Hands-on Lab: Incident Response Simulation",
                    "target": "Compromised System",
                    "steps": [
                        "Identify signs of compromise",
                        "Collect memory and disk images",
                        "Analyze logs for attack patterns",
                        "Contain and eradicate the threat",
                        "Create incident response report"
                    ],
                    "tools": ["volatility", "autopsy", "wireshark", "sleuthkit"]
                },
                "quiz_questions": [
                    {"question": "What are the phases of incident response?", "options": ["Preparation, Detection, Containment, Eradication, Recovery, Lessons Learned", "Scan, Exploit, Report", "Identify, Protect, Detect, Respond, Recover", "Plan, Do, Check, Act"], "correct": "Preparation, Detection, Containment, Eradication, Recovery, Lessons Learned", "explanation": "NIST defines these six phases of incident response."}
                ],
                "flashcards": [
                    {"front": "What are common incident response phases?", "back": "Preparation, detection, containment, eradication, recovery, and lessons learned."},
                    {"front": "What is containment?", "back": "Limiting the spread or impact of an active security incident."},
                    {"front": "What is chain of custody?", "back": "Documented control and handling of evidence from collection through analysis."},
                    {"front": "What is memory forensics?", "back": "Analyzing captured RAM for processes, connections, malware artifacts, and other volatile evidence."},
                    {"front": "What is eradication?", "back": "Removing the root cause of the incident, such as malware or compromised access."},
                    {"front": "Why hold lessons learned?", "back": "To improve defenses, processes, and response quality after an incident."}
                ],
                "xp": 350,
                "duration": "6 hours",
                "difficulty": "Advanced",
                "category": "Incident Response",
                "icon": "🚨",
                "prerequisites": [1, 2, 3]
            }
        ]
    
    def get_all_modules(self):
        return self.modules
    
    def get_module(self, module_id: int):
        module = next((m for m in self.modules if m["id"] == module_id), None)
        if not module:
            raise ValueError(f"Module {module_id} not found")
        return module
    
    def get_modules_by_difficulty(self, difficulty: str):
        return [m for m in self.modules if m["difficulty"] == difficulty]
    
    def get_modules_by_category(self, category: str):
        return [m for m in self.modules if m["category"] == category]
    
    def get_module_content(self, module_id: int):
        module = self.get_module(module_id)
        return {
            "id": module["id"],
            "name": module["name"],
            "long_description": module["long_description"],
            "learning_objectives": module["learning_objectives"],
            "practical_exercise": module["practical_exercise"],
            "quiz_questions": module["quiz_questions"],
            "flashcards": module.get("flashcards", [])
        }

    def get_flashcards(self, topic: str, count: int = 20):
        normalized_topic = topic.strip().lower()
        module = next(
            (
                m for m in self.modules
                if m["name"].lower() == normalized_topic
                or m["category"].lower() == normalized_topic
            ),
            None
        )

        if not module:
            raise ValueError(f"Flashcards for topic {topic} not found")

        cards = []
        for index, card in enumerate(module.get("flashcards", [])[:count]):
            cards.append({
                "id": module["id"] * 1000 + index,
                "module_id": module["id"],
                "topic": module["name"],
                "front": card["front"],
                "back": card["back"]
            })

        return {
            "topic": module["name"],
            "count": len(cards),
            "cards": cards
        }
    
    def get_prerequisites_status(self, module_id: int, completed_module_ids: list):
        """Check if user has completed prerequisites for a module"""
        module = self.get_module(module_id)
        prerequisites = module.get("prerequisites", [])
        missing = [p for p in prerequisites if p not in completed_module_ids]
        return {
            "completed": len(missing) == 0,
            "missing": missing,
            "message": f"Complete modules {missing} first" if missing else "Prerequisites met"
        }

learning_service = LearningService()
