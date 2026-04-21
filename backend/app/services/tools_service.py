"""Service for managing available security tools"""

class ToolsService:
    """Central registry of all available pentesting tools"""
    
    def __init__(self):
        self.tools = self._load_tools()
    
    def _load_tools(self):
        """Load all available tools with their configurations"""
        return {
            # Network Scanning & Discovery
            "nmap": {
                "name": "Nmap",
                "category": "Network Discovery",
                "description": "Network discovery and security scanning",
                "icon": "🌐",
                "default_params": {"scan_type": "-sV -sC", "ports": "1-1000", "timing": "-T4"},
                "fields": [
                    {"name": "scan_type", "label": "Scan Type", "type": "select", 
                     "options": ["-sV -sC", "-sS", "-sU", "-A", "-sT"]},
                    {"name": "ports", "label": "Port Range", "type": "text", "placeholder": "1-1000"},
                    {"name": "timing", "label": "Timing", "type": "select", 
                     "options": ["-T0", "-T1", "-T2", "-T3", "-T4", "-T5"]}
                ]
            },
            
            # Web Application Scanning
            "gobuster": {
                "name": "Gobuster",
                "category": "Web Enumeration",
                "description": "Directory and file brute-forcing",
                "icon": "📁",
                "default_params": {"mode": "dir", "wordlist": "/usr/share/wordlists/dirb/common.txt"},
                "fields": [
                    {"name": "mode", "label": "Mode", "type": "select", 
                     "options": ["dir", "dns", "vhost", "s3"]},
                    {"name": "extensions", "label": "File Extensions", "type": "text", 
                     "placeholder": "php,html,txt,js"}
                ]
            },
            
            "nikto": {
                "name": "Nikto",
                "category": "Web Scanning",
                "description": "Web server vulnerability scanner",
                "icon": "🔍",
                "default_params": {},
                "fields": [
                    {"name": "ssl", "label": "SSL/TLS", "type": "select", 
                     "options": ["disabled", "enabled"]},
                    {"name": "format", "label": "Output Format", "type": "select", 
                     "options": ["html", "csv", "txt"]}
                ]
            },
            
            "wpscan": {
                "name": "WPScan",
                "category": "CMS Scanning",
                "description": "WordPress vulnerability scanner",
                "icon": "📝",
                "default_params": {},
                "fields": [
                    {"name": "enumerate", "label": "Enumerate", "type": "select", 
                     "options": ["all", "plugins", "themes", "users", "none"]},
                    {"name": "api_token", "label": "API Token", "type": "text", 
                     "placeholder": "Optional WPScan API token"}
                ]
            },
            
            # Vulnerability Scanning
            "nuclei": {
                "name": "Nuclei",
                "category": "Vulnerability Scanning",
                "description": "Fast and customizable vulnerability scanner",
                "icon": "🎯",
                "default_params": {"severity": "critical,high,medium"},
                "fields": [
                    {"name": "severity", "label": "Severity", "type": "select", 
                     "options": ["critical", "high,medium", "low", "all"]},
                    {"name": "tags", "label": "Tags", "type": "text", 
                     "placeholder": "cve, os, network, etc"}
                ]
            },
            
            "nessus": {
                "name": "Nessus",
                "category": "Vulnerability Scanning",
                "description": "Professional vulnerability scanner",
                "icon": "🛡️",
                "default_params": {"policy": "basic"},
                "fields": [
                    {"name": "policy", "label": "Scan Policy", "type": "select", 
                     "options": ["basic", "web_app", "credentialed", "discovery"]},
                    {"name": "template", "label": "Template", "type": "select", 
                     "options": ["advanced", "discovery", "web", "malware"]}
                ]
            },
            
            # Password Attacks
            "hydra": {
                "name": "Hydra",
                "category": "Password Attacks",
                "description": "Network login cracker",
                "icon": "🔑",
                "default_params": {"service": "ssh", "user_list": "/usr/share/wordlists/users.txt", 
                                 "pass_list": "/usr/share/wordlists/passwords.txt"},
                "fields": [
                    {"name": "service", "label": "Service", "type": "select", 
                     "options": ["ssh", "ftp", "http-post-form", "mysql", "rdp", "smb"]},
                    {"name": "username", "label": "Single Username", "type": "text", 
                     "placeholder": "admin, root, etc"}
                ]
            },
            
            "john": {
                "name": "John the Ripper",
                "category": "Password Attacks",
                "description": "Password hash cracking tool",
                "icon": "⚡",
                "default_params": {"format": "auto"},
                "fields": [
                    {"name": "format", "label": "Hash Format", "type": "select", 
                     "options": ["auto", "md5", "sha256", "bcrypt", "nt"]},
                    {"name": "wordlist", "label": "Wordlist", "type": "text", 
                     "placeholder": "/usr/share/wordlists/rockyou.txt"}
                ]
            },
            
            # SQL Injection
            "sqlmap": {
                "name": "SQLMap",
                "category": "SQL Injection",
                "description": "Automatic SQL injection and database takeover",
                "icon": "💉",
                "default_params": {"level": 1, "risk": 1},
                "fields": [
                    {"name": "level", "label": "Level (1-5)", "type": "number", "min": 1, "max": 5},
                    {"name": "risk", "label": "Risk (1-3)", "type": "number", "min": 1, "max": 3},
                    {"name": "dbms", "label": "Database Type", "type": "select", 
                     "options": ["auto", "mysql", "postgresql", "mssql", "oracle"]}
                ]
            },
            
            # Wireless Attacks
            "aircrack": {
                "name": "Aircrack-ng",
                "category": "Wireless",
                "description": "WiFi network security assessment",
                "icon": "📡",
                "default_params": {},
                "fields": [
                    {"name": "attack", "label": "Attack Type", "type": "select", 
                     "options": ["wep", "wpa", "deauth", "handshake"]},
                    {"name": "interface", "label": "Interface", "type": "text", 
                     "placeholder": "wlan0mon"}
                ]
            },
            
            # Exploitation Frameworks
            "metasploit": {
                "name": "Metasploit",
                "category": "Exploitation",
                "description": "Penetration testing framework",
                "icon": "💣",
                "default_params": {"payload": "reverse_shell"},
                "fields": [
                    {"name": "payload", "label": "Payload Type", "type": "select", 
                     "options": ["reverse_shell", "bind_shell", "meterpreter"]},
                    {"name": "exploit", "label": "Exploit", "type": "text", 
                     "placeholder": "exploit/multi/handler"}
                ]
            },
            
            # Social Engineering
            "setoolkit": {
                "name": "Social-Engineer Toolkit",
                "category": "Social Engineering",
                "description": "Social engineering attacks framework",
                "icon": "🎭",
                "default_params": {"vector": "spear_phishing"},
                "fields": [
                    {"name": "vector", "label": "Attack Vector", "type": "select", 
                     "options": ["spear_phishing", "website_attack", "infectious_media"]},
                    {"name": "template", "label": "Email Template", "type": "select", 
                     "options": ["default", "custom"]}
                ]
            },
            
            # Information Gathering
            "theharvester": {
                "name": "theHarvester",
                "category": "OSINT",
                "description": "Email, domain, and subdomain harvesting",
                "icon": "🔎",
                "default_params": {"source": "google"},
                "fields": [
                    {"name": "source", "label": "Data Source", "type": "select", 
                     "options": ["google", "bing", "linkedin", "github", "all"]},
                    {"name": "limit", "label": "Result Limit", "type": "number", "min": 100, "max": 5000}
                ]
            },
            
            "recon": {
                "name": "Recon-ng",
                "category": "OSINT",
                "description": "Web reconnaissance framework",
                "icon": "🕵️",
                "default_params": {"module": "domains"},
                "fields": [
                    {"name": "module", "label": "Module", "type": "select", 
                     "options": ["domains", "contacts", "profiles", "reports"]}
                ]
            },
            
            # Forensic Tools
            "autopsy": {
                "name": "Autopsy",
                "category": "Forensics",
                "description": "Digital forensics platform",
                "icon": "🔬",
                "default_params": {},
                "fields": [
                    {"name": "analysis", "label": "Analysis Type", "type": "select", 
                     "options": ["timeline", "keyword", "hash", "file_type"]}
                ]
            },
            
            "volatility": {
                "name": "Volatility",
                "category": "Forensics",
                "description": "Memory forensics framework",
                "icon": "💾",
                "default_params": {"profile": "Win7SP1x64"},
                "fields": [
                    {"name": "profile", "label": "OS Profile", "type": "select", 
                     "options": ["Win7SP1x64", "Win10x64", "Linux", "Mac"]},
                    {"name": "command", "label": "Command", "type": "select", 
                     "options": ["pslist", "netscan", "cmdscan", "hivelist"]}
                ]
            }
        }
    
    def get_all_tools(self):
        """Get all available tools"""
        return self.tools
    
    def get_tools_by_category(self, category):
        """Get tools filtered by category"""
        return {name: tool for name, tool in self.tools.items() 
                if tool["category"] == category}
    
    def get_categories(self):
        """Get all unique categories"""
        return list(set(tool["category"] for tool in self.tools.values()))
    
    def get_tool(self, tool_name):
        """Get specific tool configuration"""
        return self.tools.get(tool_name)

# Create singleton instance
tools_service = ToolsService()
