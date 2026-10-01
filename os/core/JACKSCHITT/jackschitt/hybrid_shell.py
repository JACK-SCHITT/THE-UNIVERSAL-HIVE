"""
JACKSCHITT AI Core — Hybrid Shell Integration (Part 1 of 10)
Understands both commands and natural language.
World Changer base model — Windows AI (not HIVE Server OS).
"""

from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .paths import discover_drives, print_paths
from .system_controller import SystemController


@dataclass
class HybridRequest:
    type: str  # hybrid_chat | hybrid_execution | suggestion | command_executed | paths
    message: str
    context: Dict[str, Any] = field(default_factory=dict)
    execute: bool = False


class HybridProcessor:
    """Processes hybrid shell requests — intent + optional PowerShell."""

    def __init__(self, system_controller: SystemController):
        self.system = system_controller
        self.command_history: list[Any] = []
        self.drives = discover_drives()

        self.intent_patterns = {
            "list_processes": r"(show|list|display|what).*(process|running|task|app)",
            "find_files": r"(find|search|locate|where).*(file|files)",
            "disk_usage": r"(disk|space|storage|size|large|big).*(usage|used|free|file)?|(drive|volume).*(space|free|size)",
            "network_status": r"(network|internet|connection|ping|ip|address)",
            "system_info": r"(system|computer|spec|hardware|cpu|memory|ram)",
            "kill_process": r"(kill|stop|end|terminate).*(process|task|app|program)",
            "copy_move": r"(copy|move|backup).*(file|folder|directory)",
            "hive_paths": r"(path|drive|where).*(hive|jackschitt|war.?room)|show.*(paths|drives)|c:.*d:.*e:.*f:",
            "gentoo": r"\b(gentoo|linux|livegui|stage3)\b",
        }

    def process(self, request: HybridRequest) -> Dict[str, Any]:
        if request.type == "hybrid_chat":
            return self._handle_hybrid_chat(request)
        if request.type == "hybrid_execution":
            return self._handle_hybrid_execution(request)
        if request.type == "suggestion":
            return self._handle_suggestion(request)
        if request.type == "command_executed":
            return self._log_command(request)
        if request.type == "paths":
            self.drives = discover_drives()
            return {"message": print_paths(self.drives), "commands": [], "drives": self.drives.to_dict()}
        return {"error": "Unknown request type", "message": "Unknown request type"}

    def _handle_hybrid_chat(self, request: HybridRequest) -> Dict[str, Any]:
        message = (request.message or "").lower()
        intent = self._detect_intent(message)

        if intent == "hive_paths" or intent == "gentoo":
            self.drives = discover_drives()
            return {
                "message": self._paths_narrative(intent),
                "commands": self._generate_commands("disk_usage", request.context),
                "intent": intent,
                "drives": self.drives.to_dict(),
            }

        if intent:
            return {
                "message": self._generate_explanation(intent, message),
                "commands": self._generate_commands(intent, request.context),
                "intent": intent,
            }

        return {
            "message": self._conversational_response(message),
            "commands": [],
        }

    def _handle_hybrid_execution(self, request: HybridRequest) -> Dict[str, Any]:
        if not request.execute:
            # Suggest only — never silent exec
            chat = self._handle_hybrid_chat(
                HybridRequest(
                    type="hybrid_chat",
                    message=request.message,
                    context=request.context,
                    execute=False,
                )
            )
            chat["note"] = "execute=false — commands suggested only. Pass execute=true to run."
            return chat

        operations = self._parse_operations(request.message)
        results: List[Dict[str, Any]] = []
        for op in operations:
            if op["type"] == "command":
                # Block obvious destroyers in part 1
                if self._is_dangerous(op["command"]):
                    results.append(
                        {
                            "type": "blocked",
                            "command": op["command"],
                            "output": "[BLOCKED] Destructive pattern — confirm with Architect / ZORG first.",
                        }
                    )
                    continue
                result = self._safe_execute(op["command"])
                results.append(
                    {
                        "type": "command_result",
                        "command": op["command"],
                        "output": result,
                    }
                )
            elif op["type"] == "explanation":
                results.append({"type": "explanation", "content": op["content"]})

        return {"results": results, "complete": True}

    def _is_dangerous(self, command: str) -> bool:
        c = command.lower()
        bad = (
            "format ",
            "remove-item -recurse -force c:\\",
            "rm -rf /",
            "diskpart",
            "clear-disk",
            "stop-computer",
            "restart-computer",
            "remove-partition",
        )
        return any(b in c for b in bad)

    def _detect_intent(self, message: str) -> Optional[str]:
        for intent, pattern in self.intent_patterns.items():
            if re.search(pattern, message, re.IGNORECASE):
                return intent
        return None

    def _generate_explanation(self, intent: str, message: str) -> str:
        explanations = {
            "list_processes": "I'll show running processes with resource usage.",
            "find_files": "I'll search for files matching your criteria.",
            "disk_usage": "I'll check disk space across volumes.",
            "network_status": "I'll check network connectivity and addresses.",
            "system_info": "I'll gather system information.",
            "kill_process": "I'll help terminate that process — name must be explicit.",
            "copy_move": "I'll prepare file copy/move commands (fill SOURCE/DEST).",
            "hive_paths": "I'll map C–F war rooms and JACKSCHITT homes.",
            "gentoo": "D: is the Gentoo/large forge volume when mounted — HIVE Server OS is a separate track.",
        }
        return explanations.get(intent, "I understand what you're looking for.")

    def _generate_commands(self, intent: str, context: Dict[str, Any]) -> List[str]:
        commands = {
            "list_processes": [
                "Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name,Id,CPU,WorkingSet",
                "Get-Process | Where-Object {$_.WorkingSet -gt 100MB} | Select-Object -First 15 Name,Id,@{N='MB';E={[math]::Round($_.WorkingSet/1MB,1)}}",
            ],
            "find_files": [
                "Get-ChildItem -Path $env:USERPROFILE -Recurse -ErrorAction SilentlyContinue | Where-Object {$_.Length -gt 100MB} | Select-Object -First 20 FullName,Length",
                "Get-ChildItem -File | Sort-Object Length -Descending | Select-Object -First 20 Name,Length",
            ],
            "disk_usage": [
                "Get-Volume | Where-Object {$_.DriveLetter} | Select-Object DriveLetter,FileSystemLabel,@{N='FreeGB';E={[math]::Round($_.SizeRemaining/1GB,2)}},@{N='SizeGB';E={[math]::Round($_.Size/1GB,2)}}",
                "Get-PSDrive -PSProvider FileSystem | Select-Object Name,Used,Free",
            ],
            "network_status": [
                'Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4"} | Select-Object InterfaceAlias,IPAddress',
                "Test-Connection -ComputerName 8.8.8.8 -Count 2",
            ],
            "system_info": [
                "Get-ComputerInfo | Select-Object WindowsProductName,WindowsVersion,TotalPhysicalMemory,CsProcessors",
                'systeminfo | findstr /B /C:"OS" /C:"Processor" /C:"Total Physical Memory"',
            ],
            "kill_process": [
                "Stop-Process -Name PROCESSNAME -Force",
                "taskkill /F /IM PROCESSNAME.exe",
            ],
            "copy_move": [
                "Copy-Item -Path SOURCE -Destination DEST -Recurse",
                "Move-Item -Path SOURCE -Destination DEST",
            ],
            "hive_paths": [
                "Get-Volume | Where-Object DriveLetter | Format-Table DriveLetter,FileSystemLabel,FileSystem",
                r"@('C:\Users\ARCHITECT\THE_HIVE','C:\HIVE','F:\THE_HIVE','E:\HIVE','D:\') | ForEach-Object { if (Test-Path $_) { $_ } }",
            ],
            "gentoo": [
                r"Get-ChildItem D:\ -ErrorAction SilentlyContinue | Select-Object Name",
                r"if (Test-Path D:\README.txt) { Get-Content D:\README.txt -TotalCount 20 }",
            ],
        }
        return commands.get(intent, [])

    def _paths_narrative(self, intent: str) -> str:
        d = self.drives
        bits = [
            "I'm JACK (JACKSCHITT) — Windows hybrid shell AI.",
            "Drive map (live discovery):",
            f"  C war room: {d.c_war_room or '—'}",
            f"  C:\\HIVE: {d.c_hive or '—'}",
            f"  D (Gentoo/large): {d.d_root or 'not mounted'} live_markers={d.d_gentoo_live}",
            f"  E USB/HIVE: {d.e_hive or d.e_root or 'not mounted'}",
            f"  F war room: {d.f_war_room or 'not mounted'}",
            f"  F local AI: {d.f_local_ai or '—'}",
            f"  JACKSCHITT home: {d.jackschitt_home}",
            f"  Preferred HIVE_ROOT: {d.hive_root}",
        ]
        if intent == "gentoo":
            bits.append(
                "Gentoo full Server OS forge is a separate project — when D is mounted we stage from war room NEURAL/."
            )
        return "\n".join(bits)

    def _conversational_response(self, message: str) -> str:
        if re.search(r"\b(hi|hello|hey)\b", message):
            return (
                "Hey — I'm JACK (JACKSCHITT), your Windows hybrid shell AI "
                "(World Changer base). I understand chat and PowerShell. "
                "Ask me to show processes, disk space, or HIVE paths on C–F."
            )
        if re.search(r"\b(thanks|thank you)\b", message):
            return "No problem. Need commands, paths, or just a check-in?"
        if re.search(r"\b(how are you|how's it going|hows it going)\b", message):
            n = len(self.system.get_running_processes())
            return f"Running clean. Sampling ~{n} processes. {self.system.brief()}"
        if re.search(r"\b(jackschitt|who are you|what are you)\b", message):
            return (
                "JACKSCHITT AI — Windows AI built from the World Changer base. "
                "Hybrid shell: natural language + commands. "
                "HIVE Server OS on Gentoo is a different track; I own the Windows side."
            )
        if re.search(r"\b(bye|goodbye|exit|quit)\b", message):
            return "Later. I'll be here when you fire the shell again."
        if "?" in message:
            return "Good question. Want me to show the PowerShell, or just explain?"
        return (
            "Got it. Want that translated into PowerShell suggestions, "
            "or are we just talking? (Say 'show paths' for C–F map.)"
        )

    def _parse_operations(self, message: str) -> List[Dict[str, Any]]:
        operations: List[Dict[str, Any]] = []
        parts = re.split(
            r"\s+(?:and then|and also|then|after that|next)\s+",
            message,
            flags=re.IGNORECASE,
        )
        for part in parts:
            part = part.strip()
            intent = self._detect_intent(part)
            if intent:
                cmds = self._generate_commands(intent, {})
                for cmd in cmds[:1]:
                    operations.append(
                        {
                            "type": "command",
                            "command": cmd,
                            "explanation": self._generate_explanation(intent, part),
                        }
                    )
            else:
                operations.append({"type": "explanation", "content": f"Looking into: {part}"})
        return operations

    def _safe_execute(self, command: str) -> str:
        try:
            result = subprocess.run(
                ["powershell", "-NoProfile", "-Command", command],
                capture_output=True,
                text=True,
                timeout=30,
            )
            output = result.stdout or ""
            if result.stderr:
                output += f"\n[Errors]: {result.stderr}"
            return output[:2000]
        except subprocess.TimeoutExpired:
            return "[Command timed out after 30 seconds]"
        except Exception as e:
            return f"[Execution error: {e}]"

    def _handle_suggestion(self, request: HybridRequest) -> Dict[str, Any]:
        partial = (request.message or "").lower()
        suggestions = {
            "get": "Get-Process",
            "set": "Set-Location",
            "show": "Show-Command",
            "list": "Get-ChildItem",
            "find": "Get-ChildItem -Recurse -Filter",
            "kill": "Stop-Process",
            "copy": "Copy-Item",
            "move": "Move-Item",
            "delete": "Remove-Item",
            "search": "Select-String",
            "path": "Get-Volume",
        }
        for key, value in suggestions.items():
            if partial.startswith(key):
                return {"suggestion": value[len(partial) :]}
        return {"suggestion": ""}

    def _log_command(self, request: HybridRequest) -> Dict[str, Any]:
        self.command_history.append(request.context)
        return {"status": "logged"}


class HybridShellIntegration:
    """Integrates hybrid shell with JACKSCHITT AI OS host."""

    def __init__(self, system: SystemController | None = None):
        self.system = system or SystemController()
        self.processor = HybridProcessor(self.system)

    def handle_pipe_message(self, message: str) -> str:
        try:
            data = json.loads(message)
            request = HybridRequest(
                type=str(data.get("type") or "hybrid_chat"),
                message=str(data.get("message") or ""),
                context=dict(data.get("context") or {}),
                execute=bool(data.get("execute") or False),
            )
            result = self.processor.process(request)
            return json.dumps(result, default=str)
        except Exception as e:
            return json.dumps(
                {
                    "error": str(e),
                    "message": "I had trouble understanding that. Try rephrasing?",
                }
            )

    def chat(self, message: str, execute: bool = False) -> Dict[str, Any]:
        req = HybridRequest(
            type="hybrid_execution" if execute else "hybrid_chat",
            message=message,
            context={},
            execute=execute,
        )
        return self.processor.process(req)
