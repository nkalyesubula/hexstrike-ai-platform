"""Universal parser for any security tool output"""
import re
from typing import List, Dict, Any

class UniversalParser:
    """Dynamically parses output from any security tool"""
    
    @staticmethod
    def parse(tool_name: str, target: str, raw_result: dict) -> List[Dict]:
        """Parse any tool output into structured findings"""
        
        findings = []
        stdout = raw_result.get("stdout", "")
        
        if not stdout and isinstance(raw_result, dict):
            stdout = str(raw_result)
        
        if not stdout:
            return findings
        
        # Try to detect and parse based on output patterns
        findings = UniversalParser._detect_and_parse(tool_name, target, stdout)
        
        # If no structured findings found, create a summary
        if not findings:
            findings = UniversalParser._create_summary(tool_name, target, stdout)
        
        return findings
    
    @staticmethod
    def _detect_and_parse(tool_name: str, target: str, output: str) -> List[Dict]:
        """Detect output type and parse accordingly"""
        findings = []
        
        # Pattern 1: Open ports (Nmap, masscan, etc.)
        port_patterns = [
            r'(\d+)/(tcp|udp)\s+open\s+(\S+)',  # Nmap style
            r'Open\s+(\d+)/(tcp|udp)',           # Masscan style
            r'port\s+(\d+)\s+(tcp|udp)\s+open',  # Generic
        ]
        
        for pattern in port_patterns:
            matches = re.findall(pattern, output, re.IGNORECASE)
            for match in matches:
                if len(match) >= 2:
                    port = match[0]
                    protocol = match[1] if len(match) > 1 else "tcp"
                    service = match[2] if len(match) > 2 else "unknown"
                    findings.append({
                        "type": "open_port",
                        "title": f"Open Port: {port}/{protocol}",
                        "description": f"Service '{service}' is running on port {port}/{protocol}",
                        "severity": "info",
                        "port": f"{port}/{protocol}",
                        "service": service,
                        "raw": match
                    })
        
        # Pattern 2: HTTP/Web paths (Gobuster, dirb, dirbuster, ffuf)
        path_patterns = [
            r'(Status: \d+)\s+(\S+)',                    # Gobuster
            r'(http://[^\s]+)\s+\(Status:\s+(\d+)\)',    # Dirb
            r'(\[\d+\]\s+\[Status:\s+\d+\]\s+(\S+))',    # Ffuf
        ]
        
        for pattern in path_patterns:
            matches = re.findall(pattern, output, re.IGNORECASE)
            for match in matches:
                status = match[0] if "Status" in str(match[0]) else ""
                path = match[1] if len(match) > 1 else match[0]
                if path and (path.startswith('/') or path.startswith('http')):
                    findings.append({
                        "type": "discovered_path",
                        "title": f"Discovered: {path}",
                        "description": f"Found {path} - {status}",
                        "severity": "medium" if "200" in status else "info",
                        "path": path,
                        "status": status,
                        "raw": match
                    })
        
        # Pattern 3: Vulnerabilities (Nuclei, Nikto, OpenVAS, Nessus)
        vuln_patterns = [
            r'\[(critical|high|medium|low)\]\s+(.+?)(?:\n|$)',  # Nuclei
            r'(OSVDB|CVE-\d{4}-\d+)',                           # CVE patterns
            r'Vulnerability:\s+(.+?)(?:\n|$)',                  # Generic
            r'Risk:\s+(High|Critical|Medium|Low)\s+(.+?)(?:\n|$)', # Nessus style
        ]
        
        for pattern in vuln_patterns:
            matches = re.findall(pattern, output, re.IGNORECASE)
            for match in matches:
                severity = "info"
                title = str(match)
                if isinstance(match, tuple):
                    if len(match) >= 2:
                        severity = match[0].lower() if match[0] else "info"
                        title = match[1] if len(match) > 1 else match[0]
                    else:
                        title = match[0]
                
                # Map severity
                if "critical" in str(severity).lower():
                    severity = "critical"
                elif "high" in str(severity).lower():
                    severity = "high"
                elif "medium" in str(severity).lower():
                    severity = "medium"
                else:
                    severity = "info"
                
                findings.append({
                    "type": "vulnerability",
                    "title": title[:200],
                    "description": f"Potential vulnerability detected: {title[:150]}",
                    "severity": severity,
                    "raw": str(match)
                })
        
        # Pattern 4: OS Detection
        os_patterns = [
            r'OS details:\s+(.+?)(?:\n|$)',
            r'Operating System:\s+(.+?)(?:\n|$)',
            r'OS guess:\s+(.+?)(?:\n|$)',
        ]
        
        for pattern in os_patterns:
            matches = re.findall(pattern, output, re.IGNORECASE)
            for match in matches:
                findings.append({
                    "type": "os_detection",
                    "title": "Operating System Detected",
                    "description": match.strip(),
                    "severity": "info",
                    "os": match.strip(),
                    "raw": match
                })
        
        # Pattern 5: DNS/Subdomain findings
        dns_patterns = [
            r'Found:\s+(\S+\.\S+)',
            r'(\S+\.\S+)\s+\[.*\]',
        ]
        
        for pattern in dns_patterns:
            matches = re.findall(pattern, output, re.IGNORECASE)
            for match in matches:
                if '.' in match and not match.startswith('http'):
                    findings.append({
                        "type": "subdomain",
                        "title": f"Found: {match}",
                        "description": f"Discovered subdomain: {match}",
                        "severity": "info",
                        "domain": match,
                        "raw": match
                    })
        
        # Pattern 6: Credentials/Passwords found
        cred_patterns = [
            r'(password|pass|pwd)[\s:=]+(\S+)',
            r'(username|user|login)[\s:=]+(\S+)',
        ]
        
        for pattern in cred_patterns:
            matches = re.findall(pattern, output, re.IGNORECASE)
            for match in matches:
                if len(match) >= 2:
                    findings.append({
                        "type": "credential",
                        "title": f"Potential credential found: {match[0]}",
                        "description": f"Found {match[0]}: {match[1][:50]}",
                        "severity": "high",
                        "credential_type": match[0],
                        "value": match[1][:50],
                        "raw": str(match)
                    })
        
        # Pattern 7: Service versions
        version_patterns = [
            r'(\S+)\s+version\s+(\S+)',
            r'(\S+)/(\d+\.\d+)\s+\(.*?\)',
        ]
        
        for pattern in version_patterns:
            matches = re.findall(pattern, output, re.IGNORECASE)
            for match in matches:
                service = match[0] if len(match) > 0 else "unknown"
                version = match[1] if len(match) > 1 else "unknown"
                findings.append({
                    "type": "service_version",
                    "title": f"Service: {service} {version}",
                    "description": f"Detected {service} version {version}",
                    "severity": "info",
                    "service": service,
                    "version": version,
                    "raw": str(match)
                })
        
        return findings
    
    @staticmethod
    def _create_summary(tool_name: str, target: str, output: str) -> List[Dict]:
        """Create a summary finding when no structured data is found"""
        
        # Get first few lines for summary
        lines = output.split('\n')
        preview = '\n'.join(lines[:10])
        
        # Count lines for size indication
        line_count = len(lines)
        output_size = "small" if line_count < 20 else "medium" if line_count < 100 else "large"
        
        return [{
            "type": "scan_summary",
            "title": f"{tool_name.upper()} Scan Results",
            "description": f"Scan completed. Output size: {output_size} ({line_count} lines)",
            "severity": "info",
            "preview": preview[:500] + ("..." if len(preview) > 500 else ""),
            "full_output_length": len(output),
            "tool": tool_name,
            "target": target
        }]

# Create singleton
universal_parser = UniversalParser()
