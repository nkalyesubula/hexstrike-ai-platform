"""Service for managing available security tools"""

class ToolsService:
    """Central registry of all available pentesting tools"""
    
    def __init__(self):
        self.tools = self._load_tools()
    
    def _load_tools(self):
        """Load all available tools with their configurations"""
        return {
            # --- NETWORK RECONNAISSANCE & SCANNING ---
            "nmap": {
                "name": "Nmap",
                "category": "Network Discovery",
                "description": "Network discovery and security scanning",
                "icon": "🌐",
                "default_params": {"scan_type": "-sV -sC", "ports": "1-1000", "timing": "-T4"},
                "fields": [
                    {"name": "scan_type", "label": "Scan Type", "type": "select", "options": ["-sV -sC", "-sS", "-sU", "-A", "-sT"]},
                    {"name": "ports", "label": "Port Range", "type": "text", "placeholder": "1-1000"},
                    {"name": "timing", "label": "Timing", "type": "select", "options": ["-T0", "-T1", "-T2", "-T3", "-T4", "-T5"]}
                ]
            },
            "rustscan": {
                "name": "Rustscan",
                "category": "Network Discovery",
                "description": "Ultra-fast port scanner with intelligent rate limiting",
                "icon": "⚡",
                "default_params": {"ports": "1-1000", "batch_size": "500", "timeout": "1500"},
                "fields": [
                    {"name": "ports", "label": "Port Range", "type": "text", "placeholder": "1-1000"},
                    {"name": "batch_size", "label": "Batch Size", "type": "number", "min": 100, "max": 5000},
                    {"name": "timeout", "label": "Timeout (ms)", "type": "number", "min": 500, "max": 5000}
                ]
            },
            "masscan": {
                "name": "Masscan",
                "category": "Network Discovery",
                "description": "High-speed Internet-scale port scanning",
                "icon": "🚀",
                "default_params": {"rate": "1000", "ports": "0-65535"},
                "fields": [
                    {"name": "ports", "label": "Port Range", "type": "text", "placeholder": "0-65535"},
                    {"name": "rate", "label": "Packet Rate", "type": "number", "min": 100, "max": 100000}
                ]
            },
            "arp-scan": {
                "name": "ARP-Scan",
                "category": "Network Discovery",
                "description": "Network discovery using ARP requests",
                "icon": "📡",
                "default_params": {"interface": "eth0"},
                "fields": [
                    {"name": "interface", "label": "Network Interface", "type": "text", "placeholder": "eth0"}
                ]
            },
            "nbtscan": {
                "name": "NBTScan",
                "category": "Network Discovery",
                "description": "NetBIOS name scanning and enumeration",
                "icon": "💻",
                "default_params": {},
                "fields": [
                    {"name": "range", "label": "IP Range", "type": "text", "placeholder": "192.168.1.0/24"}
                ]
            },

            # --- WEB RECONNAISSANCE ---
            "amass": {
                "name": "Amass",
                "category": "Web Reconnaissance",
                "description": "Advanced subdomain enumeration and OSINT",
                "icon": "💎",
                "default_params": {"mode": "enum"},
                "fields": [
                    {"name": "mode", "label": "Mode", "type": "select", "options": ["enum", "intel", "viz", "track"]},
                    {"name": "passive", "label": "Passive Mode", "type": "select", "options": ["yes", "no"]}
                ]
            },
            "subfinder": {
                "name": "Subfinder",
                "category": "Web Reconnaissance",
                "description": "Fast passive subdomain discovery",
                "icon": "🔎",
                "default_params": {},
                "fields": [
                    {"name": "silent", "label": "Silent Mode", "type": "select", "options": ["yes", "no"]}
                ]
            },
            "theharvester": {
                "name": "theHarvester",
                "category": "Web Reconnaissance",
                "description": "Email, domain, and subdomain harvesting",
                "icon": "🦅",
                "default_params": {"source": "google", "limit": 500},
                "fields": [
                    {"name": "source", "label": "Data Source", "type": "select", "options": ["google", "bing", "linkedin", "github", "all"]},
                    {"name": "limit", "label": "Result Limit", "type": "number", "min": 100, "max": 5000}
                ]
            },
            "httpx": {
                "name": "HTTPx",
                "category": "Web Reconnaissance",
                "description": "Fast HTTP probing and technology detection",
                "icon": "📡",
                "fields": []
            },
            "katana": {
                "name": "Katana",
                "category": "Web Reconnaissance",
                "description": "Next-generation crawling and spidering with JS support",
                "icon": "⚔️",
                "fields": []
            },
            "hakrawler": {
                "name": "Hakrawler",
                "category": "Web Reconnaissance",
                "description": "Fast web endpoint discovery and crawling",
                "icon": "🕷️",
                "fields": []
            },
            "gau": {
                "name": "Gau",
                "category": "Web Reconnaissance",
                "description": "Get All URLs from multiple sources (Wayback, etc.)",
                "icon": "📥",
                "fields": []
            },
            "waybackurls": {
                "name": "Waybackurls",
                "category": "Web Reconnaissance",
                "description": "Historical URL discovery from Wayback Machine",
                "icon": "🕰️",
                "fields": []
            },
            "arjun": {
                "name": "Arjun",
                "category": "Web Reconnaissance",
                "description": "HTTP parameter discovery with intelligent fuzzing",
                "icon": "🏹",
                "fields": []
            },
            "paramspider": {
                "name": "ParamSpider",
                "category": "Web Reconnaissance",
                "description": "Parameter mining from web archives",
                "icon": "🕸️",
                "fields": []
            },
            "x8": {
                "name": "X8",
                "category": "Web Reconnaissance",
                "description": "Hidden parameter discovery with advanced techniques",
                "icon": "🎱",
                "fields": []
            },
            "graphql_voyager": {
                "name": "GraphQL-Voyager",
                "category": "Web Reconnaissance",
                "description": "GraphQL schema exploration and introspection",
                "icon": "🛰️",
                "fields": []
            },

            # --- DNS ANALYSIS ---
            "fierce": {
                "name": "Fierce",
                "category": "DNS Analysis",
                "description": "DNS reconnaissance and zone transfer testing",
                "icon": "🔥",
                "default_params": {},
                "fields": [
                    {"name": "wordlist", "label": "Wordlist Path", "type": "text", "placeholder": "/usr/share/wordlists/dns.txt"}
                ]
            },
            "dnsenum": {
                "name": "DNSEnum",
                "category": "DNS Analysis",
                "description": "DNS information gathering and brute forcing",
                "icon": "🧬",
                "default_params": {"threads": 5},
                "fields": [
                    {"name": "threads", "label": "Threads", "type": "number", "min": 1, "max": 20}
                ]
            },

            # --- WEB SCANNING & ENUMERATION ---
            "gobuster": {
                "name": "Gobuster",
                "category": "Web Enumeration",
                "description": "Directory, file, and DNS enumeration",
                "icon": "📁",
                "default_params": {"mode": "dir", "wordlist": "/usr/share/wordlists/dirb/common.txt"},
                "fields": [
                    {"name": "mode", "label": "Mode", "type": "select", "options": ["dir", "dns", "vhost", "s3"]},
                    {"name": "extensions", "label": "File Extensions", "type": "text", "placeholder": "php,html,txt"}
                ]
            },
            "dirsearch": {
                "name": "Dirsearch",
                "category": "Web Enumeration",
                "description": "Advanced directory and file discovery",
                "icon": "📂",
                "fields": []
            },
            "feroxbuster": {
                "name": "Feroxbuster",
                "category": "Web Enumeration",
                "description": "Recursive content discovery with intelligent filtering",
                "icon": "🦊",
                "fields": []
            },
            "ffuf": {
                "name": "FFuf",
                "category": "Web Enumeration",
                "description": "Fast web fuzzer for parameter discovery",
                "icon": "🌪️",
                "fields": []
            },
            "dirb": {
                "name": "Dirb",
                "category": "Web Enumeration",
                "description": "Web content scanner with recursive scanning",
                "icon": "📖",
                "fields": []
            },
            "wfuzz": {
                "name": "Wfuzz",
                "category": "Web Enumeration",
                "description": "Web application fuzzer with payload generation",
                "icon": "🐝",
                "fields": []
            },
            "nikto": {
                "name": "Nikto",
                "category": "Web Scanning",
                "description": "Web server vulnerability scanner",
                "icon": "🔍",
                "fields": [
                    {"name": "ssl", "label": "SSL/TLS", "type": "select", "options": ["disabled", "enabled"]}
                ]
            },
            "nuclei": {
                "name": "Nuclei",
                "category": "Web Scanning",
                "description": "Vulnerability scanner with 4000+ templates",
                "icon": "🎯",
                "fields": []
            },
            "jaeles": {
                "name": "Jaeles",
                "category": "Web Scanning",
                "description": "Advanced scanning with custom signatures",
                "icon": "⚡",
                "fields": []
            },
            "dalfox": {
                "name": "Dalfox",
                "category": "Web Scanning",
                "description": "Advanced XSS scanning with DOM analysis",
                "icon": "🦊",
                "fields": []
            },
            "wafw00f": {
                "name": "Wafw00f",
                "category": "Web Scanning",
                "description": "Web application firewall fingerprinting",
                "icon": "🧱",
                "fields": []
            },
            "testssl": {
                "name": "TestSSL",
                "category": "Web Scanning",
                "description": "SSL/TLS configuration testing",
                "icon": "🔐",
                "fields": []
            },
            "sslscan": {
                "name": "SSLScan",
                "category": "Web Scanning",
                "description": "SSL/TLS cipher suite enumeration",
                "icon": "📟",
                "fields": []
            },
            "sslyze": {
                "name": "SSLyze",
                "category": "Web Scanning",
                "description": "Comprehensive SSL/TLS analyzer",
                "icon": "🛡️",
                "fields": []
            },
            "whatweb": {
                "name": "Whatweb",
                "category": "Web Scanning",
                "description": "Web technology identification",
                "icon": "🏷️",
                "fields": []
            },
            "wpscan": {
                "name": "WPScan",
                "category": "Web Scanning",
                "description": "WordPress security scanner",
                "icon": "📝",
                "fields": []
            },
            "jwt_tool": {
                "name": "JWT-Tool",
                "category": "Web Scanning",
                "description": "JSON Web Token testing and algorithm confusion",
                "icon": "🪙",
                "fields": []
            },

            # --- SMB & RPC ENUMERATION ---
            "rpcclient": {
                "name": "RPCClient",
                "category": "SMB Enumeration",
                "description": "RPC enumeration and null session testing",
                "icon": "🚪",
                "default_params": {"command": "enumdomusers"},
                "fields": [
                    {"name": "command", "label": "RPC Command", "type": "text", "placeholder": "querydispinfo"}
                ]
            },
            "enum4linux": {
                "name": "Enum4linux",
                "category": "SMB Enumeration",
                "description": "SMB enumeration (users, groups, shares)",
                "icon": "🐧",
                "default_params": {"mode": "-a"},
                "fields": [
                    {"name": "mode", "label": "Scan Mode", "type": "select", "options": ["-a (All)", "-U (Users)", "-S (Shares)"]}
                ]
            },
            "enum4linux-ng": {
                "name": "Enum4linux-ng",
                "category": "SMB Enumeration",
                "description": "Advanced SMB enumeration with enhanced logging",
                "icon": "⚙️",
                "default_params": {"format": "yaml"},
                "fields": [
                    {"name": "format", "label": "Output Format", "type": "select", "options": ["yaml", "json", "text"]}
                ]
            },
            "smbmap": {
                "name": "SMBMap",
                "category": "SMB Enumeration",
                "description": "SMB share enumeration and exploitation",
                "icon": "🗺️",
                "default_params": {},
                "fields": [
                    {"name": "username", "label": "Username", "type": "text"},
                    {"name": "password", "label": "Password", "type": "password"}
                ]
            },

            # --- AUTOMATION & EXPLOITATION ---
            "autorecon": {
                "name": "AutoRecon",
                "category": "Automation",
                "description": "Comprehensive automated reconnaissance",
                "icon": "🤖",
                "default_params": {"threads": "10"},
                "fields": [
                    {"name": "threads", "label": "Threads", "type": "number", "min": 1, "max": 50}
                ]
            },
            "anew": {
                "name": "Anew",
                "category": "Automation",
                "description": "Efficient data processing tool",
                "icon": "➕",
                "fields": []
            },
            "qsreplace": {
                "name": "QSReplace",
                "category": "Automation",
                "description": "Query string parameter replacement",
                "icon": "🔄",
                "fields": []
            },
            "uro": {
                "name": "Uro",
                "category": "Automation",
                "description": "URL filtering and deduplication",
                "icon": "🧹",
                "fields": []
            },
            "zap_proxy": {
                "name": "ZAP Proxy",
                "category": "Automation",
                "description": "OWASP ZAP integration",
                "icon": "⚡",
                "fields": []
            },
            "responder": {
                "name": "Responder",
                "category": "Exploitation",
                "description": "LLMNR, NBT-NS and MDNS poisoner",
                "icon": "📻",
                "default_params": {"interface": "eth0"},
                "fields": [
                    {"name": "interface", "label": "Interface", "type": "text"},
                    {"name": "analyze", "label": "Analyze Mode", "type": "select", "options": ["no", "yes"]}
                ]
            },
            "netexec": {
                "name": "NetExec",
                "category": "Exploitation",
                "description": "Network service exploitation framework",
                "icon": "⚔️",
                "default_params": {"protocol": "smb"},
                "fields": [
                    {"name": "protocol", "label": "Protocol", "type": "select", "options": ["smb", "ssh", "ldap", "mssql", "winrm"]}
                ]
            },
            "metasploit": {
                "name": "Metasploit",
                "category": "Exploitation",
                "description": "Penetration testing framework",
                "icon": "💣",
                "default_params": {"payload": "reverse_shell"},
                "fields": [
                    {"name": "payload", "label": "Payload", "type": "select", "options": ["reverse_shell", "meterpreter"]},
                    {"name": "exploit", "label": "Exploit Path", "type": "text"}
                ]
            },
            "sqlmap": {
                "name": "SQLMap",
                "category": "Exploitation",
                "description": "Automatic SQL injection tool",
                "icon": "💉",
                "fields": []
            },
            "nosqlmap": {
                "name": "NoSQLMap",
                "category": "Exploitation",
                "description": "NoSQL injection testing",
                "icon": "📊",
                "fields": []
            },
            "commix": {
                "name": "Commix",
                "category": "Exploitation",
                "description": "Command injection tool",
                "icon": "🐚",
                "fields": []
            },
            "tplmap": {
                "name": "Tplmap",
                "category": "Exploitation",
                "description": "Server-side template injection tool",
                "icon": "📝",
                "fields": []
            },
            "burp_extensions": {
                "name": "Burp Extensions",
                "category": "Exploitation",
                "description": "Custom extensions for Burp Suite",
                "icon": "☕",
                "fields": []
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
